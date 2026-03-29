import type {
  Eli5Cache,
  InsertEli5Cache,
  InsertNewsArticle,
  InsertScrubRun,
  InsertWatchlist,
  MarketVector,
  NewsArticle,
  ScrubRun,
  Watchlist,
} from "../shared/schema.js"
import type { Env } from "./types.js"

const DEFAULT_WATCHLIST: InsertWatchlist[] = [
  { ticker: "SPY", name: "S&P 500 ETF", type: "etf", addedAt: "seed" },
  { ticker: "QQQ", name: "Nasdaq 100 ETF", type: "etf", addedAt: "seed" },
  { ticker: "BTC-USD", name: "Bitcoin", type: "crypto", addedAt: "seed" },
  { ticker: "AAPL", name: "Apple Inc.", type: "stock", addedAt: "seed" },
  { ticker: "NVDA", name: "NVIDIA Corp.", type: "stock", addedAt: "seed" },
  { ticker: "TSLA", name: "Tesla Inc.", type: "stock", addedAt: "seed" },
]

let schemaReady: Promise<void> | null = null

type ScrubRunRow = {
  id: number
  run_at: string
  sources: string
  vectors_found: number
  status: string
  summary: string | null
}

type MarketVectorRow = {
  id: number
  scrub_run_id: number
  ticker: string | null
  signal: string
  confidence: number
  reasoning: string
  sources: string
  created_at: string
}

type NewsArticleRow = {
  id: number
  scrub_run_id: number
  title: string
  source: string
  url: string
  published_at: string | null
  summary: string | null
  tone: string | null
  tone_reasoning: string | null
  ticker: string | null
}

type Eli5CacheRow = {
  id: number
  term: string
  explanation: string
  created_at: string
}

type WatchlistRow = {
  id: number
  ticker: string
  name: string
  type: string
  added_at: string
}

async function run(env: Env, sql: string, ...params: unknown[]) {
  const normalized = params.map((value) => (value === undefined ? null : value))
  return env.DB.prepare(sql).bind(...normalized).run()
}

async function all<T>(env: Env, sql: string, ...params: unknown[]): Promise<T[]> {
  const normalized = params.map((value) => (value === undefined ? null : value))
  const result = await env.DB.prepare(sql).bind(...normalized).all<T>()
  return (result.results || []) as T[]
}

async function first<T>(env: Env, sql: string, ...params: unknown[]): Promise<T | null> {
  const normalized = params.map((value) => (value === undefined ? null : value))
  const result = await env.DB.prepare(sql).bind(...normalized).first<T>()
  return (result ?? null) as T | null
}

async function seedWatchlist(env: Env): Promise<void> {
  const countRow = await first<{ count: number }>(
    env,
    "SELECT COUNT(*) as count FROM watchlist"
  )

  if ((countRow?.count ?? 0) > 0) {
    return
  }

  const now = new Date().toISOString()
  await Promise.all(
    DEFAULT_WATCHLIST.map((item) =>
      run(
        env,
        "INSERT OR IGNORE INTO watchlist (ticker, name, type, added_at) VALUES (?, ?, ?, ?)",
        item.ticker,
        item.name,
        item.type,
        now
      )
    )
  )
}

function mapScrubRun(row: ScrubRunRow): ScrubRun {
  return {
    id: row.id,
    runAt: row.run_at,
    sources: row.sources,
    vectorsFound: row.vectors_found,
    status: row.status,
    summary: row.summary,
  }
}

function mapMarketVector(row: MarketVectorRow): MarketVector {
  return {
    id: row.id,
    scrubRunId: row.scrub_run_id,
    ticker: row.ticker,
    signal: row.signal,
    confidence: row.confidence,
    reasoning: row.reasoning,
    sources: row.sources,
    createdAt: row.created_at,
  }
}

function mapNewsArticle(row: NewsArticleRow): NewsArticle {
  return {
    id: row.id,
    scrubRunId: row.scrub_run_id,
    title: row.title,
    source: row.source,
    url: row.url,
    publishedAt: row.published_at,
    summary: row.summary,
    tone: row.tone,
    toneReasoning: row.tone_reasoning,
    ticker: row.ticker,
  }
}

function mapEli5Cache(row: Eli5CacheRow): Eli5Cache {
  return {
    id: row.id,
    term: row.term,
    explanation: row.explanation,
    createdAt: row.created_at,
  }
}

function mapWatchlist(row: WatchlistRow): Watchlist {
  return {
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    type: row.type,
    addedAt: row.added_at,
  }
}

export async function ensureSchema(env: Env): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const statements = [
        `CREATE TABLE IF NOT EXISTS scrub_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_at TEXT NOT NULL,
          sources TEXT NOT NULL,
          vectors_found INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'pending',
          summary TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS market_vectors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          scrub_run_id INTEGER NOT NULL,
          ticker TEXT,
          signal TEXT NOT NULL,
          confidence REAL NOT NULL,
          reasoning TEXT NOT NULL,
          sources TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS news_articles (
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
        )`,
        `CREATE TABLE IF NOT EXISTS eli5_cache (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          term TEXT NOT NULL UNIQUE,
          explanation TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS watchlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticker TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'stock',
          added_at TEXT NOT NULL
        )`,
      ]

      for (const sql of statements) {
        await run(env, sql)
      }

      await seedWatchlist(env)
    })()
  }

  return schemaReady
}

export const storage = {
  async createScrubRun(env: Env, data: InsertScrubRun): Promise<ScrubRun> {
    await run(
      env,
      "INSERT INTO scrub_runs (run_at, sources, vectors_found, status, summary) VALUES (?, ?, ?, ?, ?)",
      data.runAt,
      data.sources,
      data.vectorsFound ?? 0,
      data.status ?? "pending",
      data.summary ?? null
    )

    const row = await first<ScrubRunRow>(
      env,
      "SELECT * FROM scrub_runs ORDER BY id DESC LIMIT 1"
    )
    return mapScrubRun(row!)
  },

  async updateScrubRun(
    env: Env,
    id: number,
    data: Partial<ScrubRun>
  ): Promise<ScrubRun | null> {
    const existingRow = await first<ScrubRunRow>(
      env,
      "SELECT * FROM scrub_runs WHERE id = ?",
      id
    )

    if (!existingRow) {
      return null
    }

    const existing = mapScrubRun(existingRow)

    await run(
      env,
      `UPDATE scrub_runs
       SET run_at = ?, sources = ?, vectors_found = ?, status = ?, summary = ?
       WHERE id = ?`,
      data.runAt ?? existing.runAt,
      data.sources ?? existing.sources,
      data.vectorsFound ?? existing.vectorsFound,
      data.status ?? existing.status,
      data.summary ?? existing.summary ?? null,
      id
    )

    const row = await first<ScrubRunRow>(
      env,
      "SELECT * FROM scrub_runs WHERE id = ?",
      id
    )
    return row ? mapScrubRun(row) : null
  },

  async getLatestScrubRun(env: Env): Promise<ScrubRun | null> {
    const row = await first<ScrubRunRow>(
      env,
      "SELECT * FROM scrub_runs ORDER BY id DESC LIMIT 1"
    )
    return row ? mapScrubRun(row) : null
  },

  async getScrubRuns(env: Env, limit = 20): Promise<ScrubRun[]> {
    const rows = await all<ScrubRunRow>(
      env,
      "SELECT * FROM scrub_runs ORDER BY id DESC LIMIT ?",
      limit
    )
    return rows.map(mapScrubRun)
  },

  async createMarketVector(
    env: Env,
    data: Omit<MarketVector, "id">
  ): Promise<MarketVector> {
    await run(
      env,
      `INSERT INTO market_vectors
       (scrub_run_id, ticker, signal, confidence, reasoning, sources, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      data.scrubRunId,
      data.ticker ?? null,
      data.signal,
      data.confidence,
      data.reasoning,
      data.sources,
      data.createdAt
    )

    const row = await first<MarketVectorRow>(
      env,
      "SELECT * FROM market_vectors ORDER BY id DESC LIMIT 1"
    )
    return mapMarketVector(row!)
  },

  async getLatestVectors(env: Env, limit = 20): Promise<MarketVector[]> {
    const rows = await all<MarketVectorRow>(
      env,
      "SELECT * FROM market_vectors ORDER BY id DESC LIMIT ?",
      limit
    )
    return rows.map(mapMarketVector)
  },

  async getVectorsByTicker(env: Env, ticker: string): Promise<MarketVector[]> {
    const rows = await all<MarketVectorRow>(
      env,
      "SELECT * FROM market_vectors WHERE ticker = ? ORDER BY id DESC LIMIT 10",
      ticker
    )
    return rows.map(mapMarketVector)
  },

  async createNewsArticle(
    env: Env,
    data: InsertNewsArticle
  ): Promise<NewsArticle> {
    await run(
      env,
      `INSERT INTO news_articles
       (scrub_run_id, title, source, url, published_at, summary, tone, tone_reasoning, ticker)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.scrubRunId,
      data.title,
      data.source,
      data.url,
      data.publishedAt ?? null,
      data.summary ?? null,
      data.tone ?? null,
      data.toneReasoning ?? null,
      data.ticker ?? null
    )

    const row = await first<NewsArticleRow>(
      env,
      "SELECT * FROM news_articles ORDER BY id DESC LIMIT 1"
    )
    return mapNewsArticle(row!)
  },

  async getLatestNews(env: Env, limit = 50): Promise<NewsArticle[]> {
    const rows = await all<NewsArticleRow>(
      env,
      "SELECT * FROM news_articles ORDER BY id DESC LIMIT ?",
      limit
    )
    return rows.map(mapNewsArticle)
  },

  async getEli5(env: Env, term: string): Promise<Eli5Cache | null> {
    const row = await first<Eli5CacheRow>(
      env,
      "SELECT * FROM eli5_cache WHERE lower(term) = lower(?) LIMIT 1",
      term
    )
    return row ? mapEli5Cache(row) : null
  },

  async saveEli5(env: Env, data: InsertEli5Cache): Promise<Eli5Cache> {
    await run(
      env,
      `INSERT INTO eli5_cache (term, explanation, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(term) DO UPDATE SET explanation = excluded.explanation, created_at = excluded.created_at`,
      data.term,
      data.explanation,
      data.createdAt
    )

    const row = await first<Eli5CacheRow>(
      env,
      "SELECT * FROM eli5_cache WHERE lower(term) = lower(?) LIMIT 1",
      data.term
    )
    return mapEli5Cache(row!)
  },

  async getWatchlist(env: Env): Promise<Watchlist[]> {
    const rows = await all<WatchlistRow>(
      env,
      "SELECT * FROM watchlist ORDER BY added_at ASC"
    )
    return rows.map(mapWatchlist)
  },

  async addToWatchlist(env: Env, data: InsertWatchlist): Promise<Watchlist> {
    await run(
      env,
      "INSERT INTO watchlist (ticker, name, type, added_at) VALUES (?, ?, ?, ?)",
      data.ticker,
      data.name,
      data.type,
      data.addedAt
    )

    const row = await first<WatchlistRow>(
      env,
      "SELECT * FROM watchlist WHERE ticker = ? LIMIT 1",
      data.ticker
    )
    return mapWatchlist(row!)
  },

  async removeFromWatchlist(env: Env, ticker: string): Promise<void> {
    await run(env, "DELETE FROM watchlist WHERE ticker = ?", ticker)
  },
}
