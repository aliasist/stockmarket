import { drizzle } from "drizzle-orm/better-sqlite3"
import Database from "better-sqlite3"
import { eq, desc } from "drizzle-orm"
import * as schema from "../shared/schema.js"
import {
  scrubRuns,
  marketVectors,
  newsArticles,
  eli5Cache,
  watchlist,
  type ScrubRun,
  type InsertScrubRun,
  type MarketVector,
  type InsertMarketVector,
  type NewsArticle,
  type InsertNewsArticle,
  type Eli5Cache,
  type InsertEli5Cache,
  type Watchlist,
  type InsertWatchlist,
} from "../shared/schema.js"

const sqlite = new Database("market_pulse.db")
const db = drizzle(sqlite, { schema })

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS scrub_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_at TEXT NOT NULL,
    sources TEXT NOT NULL,
    vectors_found INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    summary TEXT
  );
  CREATE TABLE IF NOT EXISTS market_vectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scrub_run_id INTEGER NOT NULL,
    ticker TEXT,
    signal TEXT NOT NULL,
    confidence REAL NOT NULL,
    reasoning TEXT NOT NULL,
    sources TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scrub_run_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    url TEXT NOT NULL,
    published_at TEXT,
    summary TEXT,
    tone TEXT,
    tone_reasoning TEXT,
    ticker TEXT
  );
  CREATE TABLE IF NOT EXISTS eli5_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    term TEXT NOT NULL UNIQUE,
    explanation TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'stock',
    added_at TEXT NOT NULL
  );
`)

try {
  const existing = db.select().from(watchlist).all()
  if (existing.length === 0) {
    const now = new Date().toISOString()
    db.insert(watchlist)
      .values([
        { ticker: "SPY", name: "S&P 500 ETF", type: "etf", addedAt: now },
        { ticker: "QQQ", name: "Nasdaq 100 ETF", type: "etf", addedAt: now },
        { ticker: "BTC-USD", name: "Bitcoin", type: "crypto", addedAt: now },
        { ticker: "AAPL", name: "Apple Inc.", type: "stock", addedAt: now },
        { ticker: "NVDA", name: "NVIDIA Corp.", type: "stock", addedAt: now },
        { ticker: "TSLA", name: "Tesla Inc.", type: "stock", addedAt: now },
      ])
      .run()
    console.log("Database seeded with default watchlist.")
  }
} catch (e) {
  console.error("Storage initialization warning:", e)
}

export interface IStorage {
  createScrubRun(data: InsertScrubRun): ScrubRun
  updateScrubRun(id: number, data: Partial<ScrubRun>): ScrubRun | undefined
  getLatestScrubRun(): ScrubRun | undefined
  getScrubRuns(limit?: number): ScrubRun[]
  createMarketVector(data: InsertMarketVector): MarketVector
  getLatestVectors(limit?: number): MarketVector[]
  getVectorsByTicker(ticker: string): MarketVector[]
  createNewsArticle(data: InsertNewsArticle): NewsArticle
  getLatestNews(limit?: number): NewsArticle[]
  getEli5(term: string): Eli5Cache | undefined
  saveEli5(data: InsertEli5Cache): Eli5Cache
  getWatchlist(): Watchlist[]
  addToWatchlist(data: InsertWatchlist): Watchlist
  removeFromWatchlist(ticker: string): void
}

export const storage: IStorage = {
  createScrubRun(data) {
    return db.insert(scrubRuns).values(data).returning().get()!
  },
  updateScrubRun(id, data) {
    return db
      .update(scrubRuns)
      .set(data)
      .where(eq(scrubRuns.id, id))
      .returning()
      .get()
  },
  getLatestScrubRun() {
    return db
      .select()
      .from(scrubRuns)
      .orderBy(desc(scrubRuns.id))
      .limit(1)
      .get()
  },
  getScrubRuns(limit = 20) {
    return db
      .select()
      .from(scrubRuns)
      .orderBy(desc(scrubRuns.id))
      .limit(limit)
      .all()
  },
  createMarketVector(data) {
    return db.insert(marketVectors).values(data).returning().get()!
  },
  getLatestVectors(limit = 20) {
    return db
      .select()
      .from(marketVectors)
      .orderBy(desc(marketVectors.id))
      .limit(limit)
      .all()
  },
  getVectorsByTicker(ticker) {
    return db
      .select()
      .from(marketVectors)
      .where(eq(marketVectors.ticker, ticker))
      .orderBy(desc(marketVectors.id))
      .limit(10)
      .all()
  },
  createNewsArticle(data) {
    return db.insert(newsArticles).values(data).returning().get()!
  },
  getLatestNews(limit = 50) {
    return db
      .select()
      .from(newsArticles)
      .orderBy(desc(newsArticles.id))
      .limit(limit)
      .all()
  },
  getEli5(term) {
    return db
      .select()
      .from(eli5Cache)
      .where(eq(eli5Cache.term, term.toLowerCase()))
      .get()
  },
  saveEli5(data) {
    return db
      .insert(eli5Cache)
      .values(data)
      .onConflictDoUpdate({
        target: eli5Cache.term,
        set: { explanation: data.explanation },
      })
      .returning()
      .get()!
  },
  getWatchlist() {
    return db.select().from(watchlist).all()
  },
  addToWatchlist(data) {
    return db.insert(watchlist).values(data).returning().get()!
  },
  removeFromWatchlist(ticker) {
    db.delete(watchlist).where(eq(watchlist.ticker, ticker)).run()
  },
}
