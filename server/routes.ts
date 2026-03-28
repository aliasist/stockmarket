import type { Express } from "express";
import type { Server } from "http";
import cron from "node-cron";
import { storage } from "./storage";
import { runScrub } from "./scrubEngine";
import { generateEli5, generatePredictiveReasoning } from "./geminiService";
import { getQuotes, getChart } from "./marketData";
import { generateEli5WithCF, cloudflareAvailable, initD1Tables, d1Available } from "./cloudflareService";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // ── Initialize Cloudflare D1 tables if available ───────────────────────
  if (d1Available()) {
    initD1Tables().then(() => {
      console.log("[CF D1] Database ready");
    }).catch(console.error);
  }

  // ── Schedule 15-minute scrub ─────────────────────────────────────────────
  cron.schedule("*/15 * * * *", () => {
    console.log("[Scrub] Starting scheduled scrub...");
    runScrub(GEMINI_KEY).catch(console.error);
  });

  // ── Health ────────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      geminiConfigured: !!GEMINI_KEY,
      cloudflareConfigured: cloudflareAvailable(),
      d1Connected: d1Available(),
      timestamp: new Date().toISOString()
    });
  });

  // ── Market Data ───────────────────────────────────────────────────────────
  app.get("/api/quotes", async (req, res) => {
    try {
      const tickers = storage.getWatchlist().map((w) => w.ticker);
      const quotes = await getQuotes(tickers);
      res.json(quotes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/chart/:ticker", async (req, res) => {
    try {
      const { ticker } = req.params;
      const range = (req.query.range as string) || "5d";
      const interval = (req.query.interval as string) || "15m";
      const data = await getChart(ticker, range, interval);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Watchlist ─────────────────────────────────────────────────────────────
  app.get("/api/watchlist", (_req, res) => {
    res.json(storage.getWatchlist());
  });

  app.post("/api/watchlist", (req, res) => {
    const { ticker, name, type } = req.body;
    if (!ticker || !name) return res.status(400).json({ error: "ticker and name required" });
    const item = storage.addToWatchlist({
      ticker: ticker.toUpperCase(),
      name,
      type: type || "stock",
      addedAt: new Date().toISOString(),
    });
    res.json(item);
  });

  app.delete("/api/watchlist/:ticker", (req, res) => {
    storage.removeFromWatchlist(req.params.ticker.toUpperCase());
    res.json({ ok: true });
  });

  // ── Scrub Control ─────────────────────────────────────────────────────────
  app.post("/api/scrub/trigger", async (_req, res) => {
    // Non-blocking — run in background
    runScrub(GEMINI_KEY).catch(console.error);
    res.json({ message: "Scrub triggered", timestamp: new Date().toISOString() });
  });

  app.get("/api/scrub/runs", (_req, res) => {
    res.json(storage.getScrubRuns(20));
  });

  app.get("/api/scrub/latest", (_req, res) => {
    res.json(storage.getLatestScrubRun() || null);
  });

  // ── Market Vectors ────────────────────────────────────────────────────────
  app.get("/api/vectors", (_req, res) => {
    res.json(storage.getLatestVectors(20));
  });

  app.get("/api/vectors/:ticker", (req, res) => {
    res.json(storage.getVectorsByTicker(req.params.ticker.toUpperCase()));
  });

  // ── News Feed ─────────────────────────────────────────────────────────────
  app.get("/api/news", (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    res.json(storage.getLatestNews(limit));
  });

  // ── ELI5 ─────────────────────────────────────────────────────────────────
  app.get("/api/eli5/:term", async (req, res) => {
    const term = decodeURIComponent(req.params.term);
    const cached = storage.getEli5(term);
    if (cached) return res.json(cached);

    let explanation: string | null = null;

    // Try Cloudflare Workers AI first (faster, edge-based)
    if (cloudflareAvailable()) {
      explanation = await generateEli5WithCF(term);
    }

    // Fall back to Gemini if CF unavailable or failed
    if (!explanation && GEMINI_KEY) {
      explanation = await generateEli5(term, GEMINI_KEY);
    }

    if (!explanation) {
      explanation = `Imagine "${term}" is like a secret club rule at the playground. Add GEMINI_API_KEY or CLOUDFLARE_API_TOKEN for real explanations!`;
    }

    const saved = storage.saveEli5({ term: term.toLowerCase(), explanation, createdAt: new Date().toISOString() });
    res.json(saved);
  });

  // ── Predictive Reasoning ──────────────────────────────────────────────────
  app.get("/api/predict/:ticker", async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    const vectors = storage.getVectorsByTicker(ticker);
    const allVectors = storage.getLatestVectors(10);
    const news = storage.getLatestNews(20).filter(
      (n) => !n.ticker || n.ticker === ticker
    );

    if (!GEMINI_KEY) {
      return res.json({
        prediction: "neutral",
        confidence: 0.5,
        reasoning: "Add your GEMINI_API_KEY environment variable to enable AI-powered predictive reasoning for " + ticker + ".",
        timeframe: "24h",
      });
    }

    const combined = [...vectors, ...allVectors].slice(0, 10);
    const result = await generatePredictiveReasoning(ticker, combined, news, GEMINI_KEY);
    res.json(result);
  });

  // ── Initial scrub on startup ──────────────────────────────────────────────
  const latest = storage.getLatestScrubRun();
  if (!latest) {
    console.log("[Scrub] First run — triggering initial scrub...");
    setTimeout(() => runScrub(GEMINI_KEY).catch(console.error), 2000);
  }
}
