import type { Express } from "express"
import { storage } from "./storage.js"
import { runScrub } from "./scrubEngine.js"
import {
  generateEli5,
  generatePredictiveReasoning,
} from "./geminiService.js"
import { insertWatchlistSchema } from "../shared/schema.js"
import nodeCron from "node-cron"
import { getChart, getQuotes } from "./marketData.js"
import { createConversation, addMessage } from './api/chatbot'
import { groqChatHandler } from './api/groqChat.js'
import { getKeyMetrics, getAnalystRatings, getComparables, getEarningsCalendar, getIncomeStatement, getBalanceSheet, getProfile } from './fmpService.js'

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

function getAdminPasswordError(
  providedPassword: string | undefined
): { status: number; message: string } | null {
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim()
  if (!configuredPassword) {
    return { status: 503, message: "Admin password is not configured on the server" }
  }

  const incoming = providedPassword?.trim()
  if (!incoming) {
    return { status: 401, message: "Unauthorized - admin password required" }
  }

  if (incoming !== configuredPassword) {
    return { status: 403, message: "Forbidden - invalid admin password" }
  }

  return null
}

export async function registerRoutes(app: Express): Promise<void> {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
      groqConfigured: Boolean(process.env.GROQ_API_KEY),
      cloudflareConfigured: Boolean(process.env.CLOUDFLARE_API_TOKEN),
      fmpConfigured: Boolean(process.env.FMP_API_KEY),
      timestamp: new Date().toISOString(),
    })
  })

  app.get("/api/quotes", async (_req, res) => {
    try {
      const list = await storage.getWatchlist()
      const quotes = await getQuotes(list.map((item) => item.ticker))
      res.json(quotes)
    } catch (error) {
      console.error("Failed to load quotes:", error)
      res.status(500).json({ message: "Failed to load quotes" })
    }
  })

  app.get("/api/chart/:ticker", async (req, res) => {
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

  app.get("/api/vectors", async (_req, res) => {
    const vectors = await storage.getLatestVectors(30)
    res.json(vectors)
  })

  app.get("/api/vectors/:ticker", async (req, res) => {
    const vectors = await storage.getVectorsByTicker(
      req.params.ticker.toUpperCase()
    )
    res.json(vectors)
  })

  app.get("/api/news", async (_req, res) => {
    const news = await storage.getLatestNews(50)
    res.json(news)
  })

  app.get("/api/predict/:ticker", async (req, res) => {
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

  app.get("/api/eli5/:term", async (req, res) => {
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

  app.get("/api/watchlist", async (_req, res) => {
    const list = await storage.getWatchlist()
    res.json(list)
  })

  app.post("/api/watchlist", async (req, res) => {
    const adminError = getAdminPasswordError(req.header("x-admin-password"))
    if (adminError) {
      return res.status(adminError.status).json({ error: adminError.message })
    }

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

  app.delete("/api/watchlist/:ticker", async (req, res) => {
    const adminError = getAdminPasswordError(req.header("x-admin-password"))
    if (adminError) {
      return res.status(adminError.status).json({ error: adminError.message })
    }

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

  app.post("/api/scrub/trigger", async (req, res) => {
    const adminError = getAdminPasswordError(req.header("x-admin-password"))
    if (adminError) {
      return res.status(adminError.status).json({ error: adminError.message })
    }

    clearPredictionCache()
    void runScrub(process.env.GEMINI_API_KEY).catch(console.error)
    res.json({ message: "Scrub triggered" })
  })

  nodeCron.schedule("*/15 * * * *", () => {
    console.log("Running scheduled market scrub...")
    clearPredictionCache()
    void runScrub(process.env.GEMINI_API_KEY).catch(console.error)
  })

  // ── Groq AI chat (server-side key) ─────────────────────────────────────
  app.post("/api/chat", groqChatHandler)

  // ── Chatbot Conversation/Message Endpoints ─────────────────────────────
  app.post("/api/chatbot/conversation", createConversation)
  app.post("/api/chatbot/message", addMessage)

  // ── Financial Modeling Prep (FMP) Endpoints ──────────────────────────────

  app.get("/api/fmp/profile/:ticker", async (req, res) => {
    try {
      const result = await getProfile(req.params.ticker.toUpperCase())
      res.json(result)
    } catch (error) {
      console.error("FMP profile error:", error)
      res.status(500).json({ message: "Failed to fetch company profile" })
    }
  })

  app.get("/api/fmp/metrics/:ticker", async (req, res) => {
    try {
      const result = await getKeyMetrics(req.params.ticker.toUpperCase())
      res.json(result)
    } catch (error) {
      console.error("FMP metrics error:", error)
      res.status(500).json({ message: "Failed to fetch key metrics" })
    }
  })

  app.get("/api/fmp/ratings/:ticker", async (req, res) => {
    try {
      const result = await getAnalystRatings(req.params.ticker.toUpperCase())
      res.json(result)
    } catch (error) {
      console.error("FMP ratings error:", error)
      res.status(500).json({ message: "Failed to fetch analyst ratings" })
    }
  })

  app.get("/api/fmp/peers/:ticker", async (req, res) => {
    try {
      const result = await getComparables(req.params.ticker.toUpperCase())
      res.json(result)
    } catch (error) {
      console.error("FMP peers error:", error)
      res.status(500).json({ message: "Failed to fetch peer tickers" })
    }
  })

  app.get("/api/fmp/earnings/:ticker", async (req, res) => {
    try {
      const result = await getEarningsCalendar(req.params.ticker.toUpperCase())
      res.json(result)
    } catch (error) {
      console.error("FMP earnings error:", error)
      res.status(500).json({ message: "Failed to fetch earnings calendar" })
    }
  })

  app.get("/api/fmp/income/:ticker", async (req, res) => {
    try {
      const result = await getIncomeStatement(req.params.ticker.toUpperCase())
      res.json(result)
    } catch (error) {
      console.error("FMP income error:", error)
      res.status(500).json({ message: "Failed to fetch income statement" })
    }
  })

  app.get("/api/fmp/balance/:ticker", async (req, res) => {
    try {
      const result = await getBalanceSheet(req.params.ticker.toUpperCase())
      res.json(result)
    } catch (error) {
      console.error("FMP balance error:", error)
      res.status(500).json({ message: "Failed to fetch balance sheet" })
    }
  })

  app.get("/api/fmp/pitch/:ticker", async (req, res) => {
    try {
      const ticker = req.params.ticker.toUpperCase()
      const [profile, metrics, ratings, peers, earnings, income, balance] = await Promise.all([
        getProfile(ticker),
        getKeyMetrics(ticker),
        getAnalystRatings(ticker),
        getComparables(ticker),
        getEarningsCalendar(ticker),
        getIncomeStatement(ticker),
        getBalanceSheet(ticker),
      ])
      res.json({ profile, metrics, ratings, peers, earnings, income, balance })
    } catch (error) {
      console.error("FMP pitch error:", error)
      res.status(500).json({ message: "Failed to fetch pitch data" })
    }
  })
}
