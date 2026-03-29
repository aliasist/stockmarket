import type { Express, Request, Response, NextFunction } from "express"
import { storage } from "./storage.js"
import { runScrub } from "./scrubEngine.js"
import {
  generateEli5,
  generatePredictiveReasoning,
} from "./geminiService.js"
import { insertWatchlistSchema } from "../shared/schema.js"
import nodeCron from "node-cron"
import { getChart, getQuotes } from "./marketData.js"

// ── JWT verification (mirrors Workers auth.ts, using Web Crypto via Node 20) ──

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

async function verifyJwt(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, sigB64] = parts
    const signingInput = `${headerB64}.${payloadB64}`
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    )
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlDecode(sigB64),
      new TextEncoder().encode(signingInput)
    )
    if (!valid) return null
    const payload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(payloadB64))
    )
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

/** Express middleware — validates JWT when JWT_SECRET is configured. */
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const jwtSecret = process.env.JWT_SECRET
  // If no JWT_SECRET is set, auth is disabled (backward-compatible for Railway)
  if (!jwtSecret) return next()

  const auth = req.headers.authorization
  const token = auth?.replace("Bearer ", "")
  if (!token) {
    return res.status(401).json({ error: "Unauthorized — no token provided" })
  }
  const payload = await verifyJwt(token, jwtSecret)
  if (!payload) {
    return res.status(401).json({ error: "Unauthorized — invalid or expired token" })
  }
  ;(req as any).user = { userId: payload.sub, email: payload.email }
  next()
}

// ── Auth helpers for Express (Node 20 Web Crypto) ────────────────────────────

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

async function signJwtNode(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds: number
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const claims = { ...payload, iat: now, exp: now + expiresInSeconds }
  const headerB64 = base64url(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = base64url(new TextEncoder().encode(JSON.stringify(claims)))
  const signingInput = `${headerB64}.${payloadB64}`
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput))
  return `${signingInput}.${base64url(sig)}`
}

async function hashPasswordNode(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256
  )
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("")
  const hashHex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("")
  return `pbkdf2:${saltHex}:${hashHex}`
}

async function verifyPasswordNode(password: string, stored: string): Promise<boolean> {
  const [, saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)))
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256
  )
  const candidate = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("")
  return candidate === hashHex
}

function generateRefreshTokenNode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function issueTokenPairNode(
  userId: number,
  email: string,
  jwtSecret: string,
  store: typeof import("./storage.js").storage
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await signJwtNode({ sub: userId, email }, jwtSecret, 24 * 60 * 60)
  const refreshToken = generateRefreshTokenNode()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  store.createSession({ userId, token: refreshToken, expiresAt, createdAt: new Date().toISOString() })
  return { accessToken, refreshToken }
}

const PREDICTION_CACHE_TTL_MS = 5 * 60 * 1000

type PredictionCacheEntry = {
  expiresAt: number
  value: unknown
}

const predictionCache = new Map<string, PredictionCacheEntry>()

function getCachedPrediction(ticker: string): unknown | null {
  const cached = predictionCache.get(ticker)
  if (!cached) {
    return null
  }

  if (cached.expiresAt <= Date.now()) {
    predictionCache.delete(ticker)
    return null
  }

  return cached.value
}

function setCachedPrediction(ticker: string, value: unknown): void {
  predictionCache.set(ticker, {
    value,
    expiresAt: Date.now() + PREDICTION_CACHE_TTL_MS,
  })
}

function clearPredictionCache(): void {
  predictionCache.clear()
}

export async function registerRoutes(app: Express): Promise<void> {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      cloudflareConfigured: Boolean(process.env.CLOUDFLARE_API_TOKEN),
      authEnabled: Boolean(process.env.JWT_SECRET),
      timestamp: new Date().toISOString(),
    })
  })

  // ── Auth routes (Express — mirrors Workers auth.ts) ─────────────────────

  app.post("/api/auth/register", async (req, res) => {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return res.status(503).json({ error: "Authentication not configured on this server" })
    }

    // Check for existing user
    const existing = storage.getUserByEmail(email.toLowerCase())
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" })
    }

    const passwordHash = await hashPasswordNode(password)
    const now = new Date().toISOString()
    const user = storage.createUser({ email: email.toLowerCase(), passwordHash, createdAt: now, updatedAt: now })

    const tokens = await issueTokenPairNode(user.id, user.email, jwtSecret, storage)
    return res.status(201).json({ user: { id: user.id, email: user.email }, ...tokens })
  })

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return res.status(503).json({ error: "Authentication not configured on this server" })
    }

    const user = storage.getUserByEmail(email.toLowerCase())
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const valid = await verifyPasswordNode(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const tokens = await issueTokenPairNode(user.id, user.email, jwtSecret, storage)
    return res.json({ user: { id: user.id, email: user.email }, ...tokens })
  })

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = (req as any).user
    if (!user) return res.status(401).json({ error: "Unauthorized" })
    const dbUser = storage.getUserById(user.userId)
    if (!dbUser) return res.status(404).json({ error: "User not found" })
    return res.json({ id: dbUser.id, email: dbUser.email, createdAt: dbUser.createdAt })
  })

  app.post("/api/auth/logout", async (req, res) => {
    const auth = req.headers.authorization
    const token = auth?.replace("Bearer ", "")
    if (token) storage.deleteSession(token)
    return res.json({ message: "Logged out" })
  })

  app.post("/api/auth/refresh", async (req, res) => {
    const { refreshToken } = req.body || {}
    if (!refreshToken) return res.status(400).json({ error: "refreshToken is required" })

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) return res.status(503).json({ error: "Authentication not configured" })

    const session = storage.getSession(refreshToken)
    if (!session) return res.status(401).json({ error: "Invalid refresh token" })
    if (new Date(session.expiresAt) < new Date()) {
      storage.deleteSession(refreshToken)
      return res.status(401).json({ error: "Refresh token expired" })
    }

    const user = storage.getUserById(session.userId)
    if (!user) return res.status(404).json({ error: "User not found" })

    storage.deleteSession(refreshToken)
    const tokens = await issueTokenPairNode(user.id, user.email, jwtSecret, storage)
    return res.json({ user: { id: user.id, email: user.email }, ...tokens })
  })

  app.get("/api/quotes", requireAuth, async (_req, res) => {
    try {
      const list = await storage.getWatchlist()
      const quotes = await getQuotes(list.map((item) => item.ticker))
      res.json(quotes)
    } catch (error) {
      console.error("Failed to load quotes:", error)
      res.status(500).json({ message: "Failed to load quotes" })
    }
  })

  app.get("/api/chart/:ticker", requireAuth, async (req, res) => {
    try {
      const range =
        typeof req.query.range === "string" ? req.query.range : "5d"
      const interval =
        typeof req.query.interval === "string" ? req.query.interval : "15m"
      const candles = await getChart(
        req.params.ticker.toUpperCase(),
        range,
        interval
      )
      res.json(candles)
    } catch (error) {
      console.error("Failed to load chart:", error)
      res.status(500).json({ message: "Failed to load chart data" })
    }
  })

  app.get("/api/vectors", requireAuth, async (_req, res) => {
    const vectors = await storage.getLatestVectors(30)
    res.json(vectors)
  })

  app.get("/api/vectors/:ticker", requireAuth, async (req, res) => {
    const vectors = await storage.getVectorsByTicker(
      req.params.ticker.toUpperCase()
    )
    res.json(vectors)
  })

  app.get("/api/news", requireAuth, async (_req, res) => {
    const news = await storage.getLatestNews(50)
    res.json(news)
  })

  app.get("/api/predict/:ticker", requireAuth, async (req, res) => {
    const ticker = req.params.ticker.toUpperCase()

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message: "Predictive reasoning requires a valid Gemini API key.",
        prediction: "neutral",
        confidence: 0.5,
        reasoning: "Predictive reasoning requires a valid Gemini API key.",
        timeframe: "24h",
      })
    }

    try {
      const cachedPrediction = getCachedPrediction(ticker)
      if (cachedPrediction) {
        return res.json(cachedPrediction)
      }

      const recentVectors = storage
        .getLatestVectors(30)
        .filter((vector) => !vector.ticker || vector.ticker === ticker)

      const recentNews = storage
        .getLatestNews(50)
        .filter((article) => !article.ticker || article.ticker === ticker)

      const prediction = await generatePredictiveReasoning(
        ticker,
        recentVectors,
        recentNews,
        process.env.GEMINI_API_KEY
      )

      setCachedPrediction(ticker, prediction)
      res.json(prediction)
    } catch (error) {
      console.error(`Failed to generate prediction for ${ticker}:`, error)
      res.status(500).json({
        message: `Prediction failed for ${ticker}`,
        prediction: "neutral",
        confidence: 0.5,
        reasoning: "Prediction failed unexpectedly.",
        timeframe: "24h",
      })
    }
  })

  // ── ELI5 (Explain Like I'm 5) ──────────────────────────────────────────

  app.get("/api/eli5/:term", requireAuth, async (req, res) => {
    const term = req.params.term
    const cached = await storage.getEli5(term)

    if (cached) {
      return res.json(cached)
    }

    try {
      const explanation = await generateEli5(term, process.env.GEMINI_API_KEY || "")

      const saved = await storage.saveEli5({
        term: term.toLowerCase(),
        explanation,
        createdAt: new Date().toISOString(),
      })

      res.json(saved)
    } catch (_error) {
      res.status(500).json({ message: "Failed to generate explanation" })
    }
  })

  // ── Watchlist Management ────────────────────────────────────────────────

  app.get("/api/watchlist", requireAuth, async (_req, res) => {
    const list = await storage.getWatchlist()
    res.json(list)
  })

  app.post("/api/watchlist", requireAuth, async (req, res) => {
    const parsed = insertWatchlistSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error })
    }

    const added = await storage.addToWatchlist({
      ticker: parsed.data.ticker,
      name: parsed.data.name,
      type: parsed.data.type,
      addedAt: new Date().toISOString(),
    })

    res.json(added)
  })

  app.delete("/api/watchlist/:ticker", requireAuth, async (req, res) => {
    try {
      storage.removeFromWatchlist(req.params.ticker.toUpperCase())
      res.status(204).end()
    } catch (error) {
      console.error("Failed to remove watchlist item:", error)
      res.status(500).json({ message: "Failed to remove watchlist item" })
    }
  })

  // ── Scrub Automation ────────────────────────────────────────────────────

  app.get("/api/scrub/latest", async (_req, res) => {
    const latest = storage.getLatestScrubRun()
    if (!latest) {
      return res.json(null)
    }
    res.json(latest)
  })

  app.get("/api/scrub/runs", async (_req, res) => {
    const runs = storage.getScrubRuns(50)
    res.json(runs)
  })

  app.post("/api/scrub/trigger", async (_req, res) => {
    clearPredictionCache()
    void runScrub(process.env.GEMINI_API_KEY).catch(console.error)
    res.json({ message: "Scrub triggered" })
  })

  nodeCron.schedule("*/15 * * * *", () => {
    console.log("Running scheduled market scrub...")
    clearPredictionCache()
    void runScrub(process.env.GEMINI_API_KEY).catch(console.error)
  })
}
