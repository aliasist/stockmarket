import type { Express } from "express"
import { storage } from "./storage.js"
import { runScrub } from "./scrubEngine.js"
import { generateEli5 } from "./geminiService.js"
import { insertWatchlistSchema } from "@shared/schema.js"
import nodeCron from "node-cron"

export async function registerRoutes(app: Express): Promise<void> {
  // ── Market Data Endpoints ──────────────────────────────────────────────

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

  // ── Scrub Automation ────────────────────────────────────────────────────

  app.post("/api/scrub/trigger", async (_req, res) => {
    void runScrub(process.env.GEMINI_API_KEY).catch(console.error)
    res.json({ message: "Scrub triggered" })
  })

  nodeCron.schedule("*/15 * * * *", () => {
    console.log("Running scheduled market scrub...")
    void runScrub(process.env.GEMINI_API_KEY).catch(console.error)
  })
}
