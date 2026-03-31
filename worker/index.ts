import { z } from "zod"
import {
  generateEli5WithAI,
  generatePredictionWithAI,
  callGroq,
  getFmpPitchBundle,
  getFmpProfile,
  getFmpMetrics,
  getFmpRatings,
  getFmpPeers,
  getFmpEarnings,
  getFmpIncome,
  getFmpBalance,
  generatePitchMemo,
} from "./ai.js"
import { getChart, getQuotes } from "./marketData.js"
import { runScrub } from "./scrub.js"
import { ensureSchema, storage, ensureAuthSchema, authStorage, getAuthUser, safeUser } from "./storage.js"
import type { Env } from "./types.js"
import { logChat, logUsage } from "./analytics.js"

type PredictionCacheEntry = {
  expiresAt: number
  value: unknown
}

const PREDICTION_CACHE_TTL_MS = 5 * 60 * 1000
const predictionCache = new Map<string, PredictionCacheEntry>()
const watchlistInputSchema = z.object({
  ticker: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
})

function json(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
}

function notFound(): Response {
  return json({ message: "Not found" }, { status: 404 })
}

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

async function serveAsset(request: Request, env: Env): Promise<Response> {
  const assetResponse = await env.ASSETS.fetch(request)
  if (assetResponse.status !== 404) {
    return assetResponse
  }

  const url = new URL(request.url)
  url.pathname = "/index.html"
  return env.ASSETS.fetch(new Request(url.toString(), request))
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  await ensureSchema(env)
  await ensureAuthSchema(env)

  const url = new URL(request.url)
  const { pathname } = url

  if (pathname === "/api/health") {
    return json({
      status: "ok",
      aiConfigured: Boolean(env.AI),
      aiProvider: env.GROQ_API_KEY ? "groq" : env.GEMINI_API_KEY ? "gemini" : "cloudflare-workers-ai",
      groqConfigured: Boolean(env.GROQ_API_KEY),
      geminiConfigured: Boolean(env.GEMINI_API_KEY),
      fmpConfigured: Boolean(env.FMP_API_KEY),
      cloudflareConfigured: Boolean(env.DB),
      timestamp: new Date().toISOString(),
    })
  }

  if (pathname === "/api/quotes") {
    const watchlist = await storage.getWatchlist(env)
    const quotes = await getQuotes(watchlist.map((item) => item.ticker))
    if (env.ANALYTICS) {
      logUsage(env.ANALYTICS, "stockmarket", "quotes", "fetch", undefined, { count: quotes.length }).catch(() => {})
    }
    return json(quotes)
  }

  if (pathname.startsWith("/api/chart/")) {
    const ticker = decodeURIComponent(pathname.slice("/api/chart/".length)).toUpperCase()
    const range = url.searchParams.get("range") || "5d"
    const interval = url.searchParams.get("interval") || "15m"
    return json(await getChart(ticker, range, interval))
  }

  if (pathname === "/api/vectors") {
    return json(await storage.getLatestVectors(env, 30))
  }

  if (pathname.startsWith("/api/vectors/")) {
    const ticker = decodeURIComponent(pathname.slice("/api/vectors/".length)).toUpperCase()
    return json(await storage.getVectorsByTicker(env, ticker))
  }

  if (pathname === "/api/news") {
    return json(await storage.getLatestNews(env, 50))
  }

  if (pathname.startsWith("/api/predict/")) {
    const ticker = decodeURIComponent(pathname.slice("/api/predict/".length)).toUpperCase()
    const cached = getCachedPrediction(ticker)
    if (cached) {
      return json(cached)
    }

    const recentVectors = (await storage.getLatestVectors(env, 30)).filter(
      (vector) => !vector.ticker || vector.ticker === ticker
    )
    const recentNews = (await storage.getLatestNews(env, 50)).filter(
      (article) => !article.ticker || article.ticker === ticker
    )

    const prediction = await generatePredictionWithAI(env, {
      ticker,
      recentVectors,
      recentNews,
    })

    setCachedPrediction(ticker, prediction)
    return json(prediction)
  }

  if (pathname.startsWith("/api/eli5/")) {
    const term = decodeURIComponent(pathname.slice("/api/eli5/".length))
    const cached = await storage.getEli5(env, term)
    if (cached) {
      return json(cached)
    }

    const explanation = await generateEli5WithAI(env, term)
    const saved = await storage.saveEli5(env, {
      term: term.toLowerCase(),
      explanation,
      createdAt: new Date().toISOString(),
    })

    return json(saved)
  }

  if (pathname === "/api/watchlist" && request.method === "GET") {
    return json(await storage.getWatchlist(env))
  }

  if (pathname === "/api/watchlist" && request.method === "POST") {
    const body = await request.json()
    const parsed = watchlistInputSchema.safeParse(body)
    if (!parsed.success) {
      return json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const item = await storage.addToWatchlist(env, {
      ticker: parsed.data.ticker.toUpperCase(),
      name: parsed.data.name,
      type: parsed.data.type,
      addedAt: new Date().toISOString(),
    })

    if (env.ANALYTICS) {
      logUsage(env.ANALYTICS, "stockmarket", "watchlist", "add", parsed.data.ticker.toUpperCase(), { name: parsed.data.name }).catch(() => {})
    }
    return json(item)
  }

  if (pathname.startsWith("/api/watchlist/") && request.method === "DELETE") {
    const ticker = decodeURIComponent(pathname.slice("/api/watchlist/".length)).toUpperCase()
    await storage.removeFromWatchlist(env, ticker)
    if (env.ANALYTICS) {
      logUsage(env.ANALYTICS, "stockmarket", "watchlist", "remove", ticker).catch(() => {})
    }
    return new Response(null, { status: 204 })
  }

  if (pathname === "/api/scrub/latest") {
    return json(await storage.getLatestScrubRun(env))
  }

  if (pathname === "/api/scrub/runs") {
    return json(await storage.getScrubRuns(env, 50))
  }

  if (pathname === "/api/scrub/trigger" && request.method === "POST") {
    predictionCache.clear()
    await runScrub(env)
    if (env.ANALYTICS) {
      logUsage(env.ANALYTICS, "stockmarket", "scrub", "trigger").catch(() => {})
    }
    return json({ message: "Scrub triggered" })
  }

  // ── AI Chat (Groq proxy) ───────────────────────────────────────────────────
  if (pathname === "/api/chat" && request.method === "POST") {
    if (!env.GROQ_API_KEY) {
      return json({ error: "GROQ_API_KEY not configured", reply: null }, { status: 503 })
    }
    const body = await request.json() as { message?: string; messages?: Array<{ role: string; content: string }>; model?: string }
    let messages = body.messages
    if (!messages?.length && body.message) {
      messages = [{ role: "user", content: body.message }]
    }
    if (!messages?.length) return json({ error: "No messages provided", reply: null }, { status: 400 })
    const normalized = messages
      .filter((m) => m.content)
      .map((m) => ({ role: (m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user") as "system" | "user" | "assistant", content: m.content }))
    const reply = await callGroq(env, normalized, body.model ?? "llama-3.3-70b-versatile", 2048)
    if (!reply) return json({ error: "Groq request failed", reply: null }, { status: 502 })
    // Log chat to analytics
    const userMsg = normalized.filter(m => m.role === "user").map(m => m.content).join(" ") || ""
    if (env.ANALYTICS) {
      logChat(env.ANALYTICS, "stockmarket", userMsg, reply, body.model ?? "llama-3.3-70b-versatile").catch(() => {})
    }
    return json({ reply })
  }

  // ── FMP endpoints ─────────────────────────────────────────────────────────
  if (pathname.startsWith("/api/fmp/")) {
    const fmpPath = pathname.slice("/api/fmp/".length)
    const parts = fmpPath.split("/")
    const resource = parts[0]
    const ticker = parts[1]?.toUpperCase()

    if (!ticker) return json({ error: "Ticker required" }, { status: 400 })

    if (resource === "pitch") {
      const bundle = await getFmpPitchBundle(env, ticker)
      // Also try to get current price from Yahoo
      let currentPrice: number | undefined
      try {
        const quotes = await getQuotes([ticker])
        currentPrice = quotes[0]?.price
      } catch { /* no price */ }
      // Generate AI pitch memo if Groq is available
      const aiSections = await generatePitchMemo(env, ticker, bundle, currentPrice)
      return json({ ...bundle, currentPrice, aiSections })
    }
    if (resource === "profile") return json(await getFmpProfile(env, ticker))
    if (resource === "metrics") return json(await getFmpMetrics(env, ticker))
    if (resource === "ratings") return json(await getFmpRatings(env, ticker))
    if (resource === "peers") return json(await getFmpPeers(env, ticker))
    if (resource === "earnings") return json(await getFmpEarnings(env, ticker))
    if (resource === "income") return json(await getFmpIncome(env, ticker))
    if (resource === "balance") return json(await getFmpBalance(env, ticker))
    return notFound()
  }


  // ── Auth routes ──────────────────────────────────────────────────────────────
  if (pathname === "/api/auth/register" && request.method === "POST") {
    try {
      const body = await request.json() as { email?: string; handle?: string; password?: string }
      if (!body.email || !body.handle || !body.password) {
        return json({ error: "email, handle, and password are required" }, { status: 400 })
      }
      const { user, token } = await authStorage.register(env, body.email, body.handle, body.password)
      return json({ token, user: safeUser(user) })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes("UNIQUE") || msg.includes("unique")) {
        return json({ error: "Email or handle already taken" }, { status: 409 })
      }
      return json({ error: msg }, { status: 500 })
    }
  }

  if (pathname === "/api/auth/login" && request.method === "POST") {
    try {
      const body = await request.json() as { email?: string; password?: string }
      if (!body.email || !body.password) {
        return json({ error: "email and password are required" }, { status: 400 })
      }
      const result = await authStorage.login(env, body.email, body.password)
      if (!result) return json({ error: "Invalid credentials" }, { status: 401 })
      return json({ token: result.token, user: safeUser(result.user) })
    } catch (err) {
      return json({ error: String(err) }, { status: 500 })
    }
  }

  if (pathname === "/api/auth/logout" && request.method === "POST") {
    const authHeader = request.headers.get("Authorization")
    if (authHeader?.startsWith("Bearer ")) {
      await authStorage.logout(env, authHeader.slice(7))
    }
    return json({ ok: true })
  }

  if (pathname === "/api/auth/me") {
    const user = await getAuthUser(request, env)
    if (!user) return json({ error: "Unauthorized" }, { status: 401 })
    return json({ user: safeUser(user) })
  }

  // ── Event logging ─────────────────────────────────────────────────────────────
  if (pathname === "/api/events" && request.method === "POST") {
    try {
      const body = await request.json() as { event_type?: string; ticker?: string; metadata?: Record<string, unknown> }
      if (!body.event_type) return json({ error: "event_type required" }, { status: 400 })
      const user = await getAuthUser(request, env)
      const authHeader = request.headers.get("Authorization")
      const sessionToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
      await authStorage.logEvent(env, {
        user_id: user?.id ?? null,
        session_token: sessionToken,
        event_type: body.event_type,
        ticker: body.ticker ?? null,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        ip: request.headers.get("CF-Connecting-IP") ?? null,
        user_agent: request.headers.get("User-Agent") ?? null,
      })
      return json({ ok: true })
    } catch (err) {
      return json({ error: String(err) }, { status: 500 })
    }
  }

  if (pathname === "/api/analytics/top-tickers") {
    try {
      const rows = await authStorage.getTopTickers(env, 7)
      return json({ tickers: rows })
    } catch (err) {
      return json({ error: String(err) }, { status: 500 })
    }
  }

  if (pathname === "/api/analytics/activity") {
    try {
      const rows = await authStorage.getActivityCounts(env, 7)
      return json({ activity: rows })
    } catch (err) {
      return json({ error: String(err) }, { status: 500 })
    }
  }

  // ── Pitch persistence ─────────────────────────────────────────────────────────
  if (pathname === "/api/pitches/save" && request.method === "POST") {
    try {
      const body = await request.json() as {
        ticker?: string
        company_name?: string
        memo_json?: string
        is_public?: boolean
      }
      if (!body.ticker || !body.company_name || !body.memo_json) {
        return json({ error: "ticker, company_name, and memo_json are required" }, { status: 400 })
      }
      const user = await getAuthUser(request, env)
      const saved = await authStorage.savePitch(env, {
        user_id: user?.id ?? null,
        ticker: body.ticker,
        company_name: body.company_name,
        memo_json: body.memo_json,
        is_public: body.is_public ? 1 : 0,
      })
      // Update pitch_count in ticker_interest
      const today = new Date().toISOString().slice(0, 10)
      await env.DB.prepare(
        `INSERT INTO ticker_interest (ticker, date, pitch_count) VALUES (?, ?, 1)
         ON CONFLICT(ticker, date) DO UPDATE SET pitch_count = pitch_count + 1`
      ).bind(body.ticker.toUpperCase(), today).run()
      return json({
        ok: true,
        slug: saved.share_slug,
        share_url: `https://pulse.aliasist.com/#/pitch/share/${saved.share_slug}`,
      })
    } catch (err) {
      return json({ error: String(err) }, { status: 500 })
    }
  }

  if (pathname === "/api/pitches/my") {
    const user = await getAuthUser(request, env)
    if (!user) return json({ error: "Unauthorized" }, { status: 401 })
    const pitches = await authStorage.getMyPitches(env, user.id)
    return json({ pitches })
  }

  if (pathname === "/api/pitches/public") {
    const pitches = await authStorage.getPublicPitches(env)
    return json({ pitches })
  }

  if (pathname.startsWith("/api/pitches/") && !pathname.includes("/my") && !pathname.includes("/public") && !pathname.includes("/save")) {
    const slug = pathname.slice("/api/pitches/".length)
    if (!slug) return notFound()
    const pitch = await authStorage.getPitchBySlug(env, slug)
    if (!pitch) return notFound()
    return json({ pitch })
  }

  return notFound()
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          Allow: "GET,POST,DELETE,OPTIONS",
        },
      })
    }

    try {
      if (url.pathname.startsWith("/api/")) {
        return await handleApi(request, env)
      }

      return await serveAsset(request, env)
    } catch (error) {
      return json(
        {
          message:
            error && typeof error === "object" && "message" in error
              ? String((error as Error).message)
              : "Internal Server Error",
        },
        { status: 500 }
      )
    }
  },

  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    predictionCache.clear()
    await ensureSchema(env)
    await runScrub(env)
  },
}
