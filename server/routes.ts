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
