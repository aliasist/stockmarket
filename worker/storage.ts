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

// ─── Auth / Events / Pitches ──────────────────────────────────────────────────

export type UserRow = {
  id: number
  email: string
  handle: string
  password_hash: string
  display_name: string | null
  bio: string | null
  avatar_seed: string | null
  created_at: string
  last_seen: string | null
}

export type SessionRow = {
  id: number
  user_id: number
  token: string
  created_at: string
  expires_at: string
}

export type EventRow = {
  id: number
  user_id: number | null
  session_token: string | null
  event_type: string
  ticker: string | null
  metadata: string | null
  ip: string | null
  user_agent: string | null
  created_at: string
}

export type SavedPitchRow = {
  id: number
  user_id: number | null
  ticker: string
  company_name: string
  memo_json: string
  is_public: number
  upvotes: number
  share_slug: string | null
  created_at: string
  updated_at: string
}

export type TickerInterestRow = {
  ticker: string
  date: string
  view_count: number
  pitch_count: number
  watchlist_count: number
}

// Extend ensureSchema by adding new tables in a separate exported function
export async function ensureAuthSchema(env: Env): Promise<void> {
  const authStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      handle TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      bio TEXT,
      avatar_seed TEXT,
      created_at TEXT NOT NULL,
      last_seen TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_token TEXT,
      event_type TEXT NOT NULL,
      ticker TEXT,
      metadata TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS saved_pitches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      ticker TEXT NOT NULL,
      company_name TEXT NOT NULL,
      memo_json TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 0,
      upvotes INTEGER NOT NULL DEFAULT 0,
      share_slug TEXT UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS ticker_interest (
      ticker TEXT NOT NULL,
      date TEXT NOT NULL,
      view_count INTEGER NOT NULL DEFAULT 0,
      pitch_count INTEGER NOT NULL DEFAULT 0,
      watchlist_count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (ticker, date)
    )`,
  ]
  for (const sql of authStatements) {
    await run(env, sql)
  }
}

// Auth helpers
export async function hashPassword(password: string): Promise<string> {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${salt}:${hashHex}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":")
  if (!salt || !hash) return false
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex === hash
}

export function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function generateShareSlug(ticker: string): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  const random = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((b) => chars[b % chars.length])
    .join("")
  return `${ticker.toLowerCase()}-${random}`
}

export function safeUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    handle: row.handle,
    display_name: row.display_name,
    bio: row.bio,
    avatar_seed: row.avatar_seed,
    created_at: row.created_at,
    last_seen: row.last_seen,
  }
}

export async function getAuthUser(
  request: Request,
  env: Env
): Promise<UserRow | null> {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  const token = authHeader.slice(7)
  const now = new Date().toISOString()
  const session = await first<SessionRow>(
    env,
    "SELECT * FROM sessions WHERE token = ? AND expires_at > ? LIMIT 1",
    token,
    now
  )
  if (!session) return null
  const user = await first<UserRow>(
    env,
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    session.user_id
  )
  return user
}

export const authStorage = {
  async register(
    env: Env,
    email: string,
    handle: string,
    password: string
  ): Promise<{ user: UserRow; token: string }> {
    const password_hash = await hashPassword(password)
    const now = new Date().toISOString()
    await run(
      env,
      "INSERT INTO users (email, handle, password_hash, created_at) VALUES (?, ?, ?, ?)",
      email.toLowerCase(),
      handle.toLowerCase(),
      password_hash,
      now
    )
    const user = await first<UserRow>(
      env,
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      email.toLowerCase()
    )
    if (!user) throw new Error("Failed to create user")

    const token = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await run(
      env,
      "INSERT INTO sessions (user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?)",
      user.id,
      token,
      now,
      expiresAt
    )
    return { user, token }
  },

  async login(
    env: Env,
    email: string,
    password: string
  ): Promise<{ user: UserRow; token: string } | null> {
    const user = await first<UserRow>(
      env,
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      email.toLowerCase()
    )
    if (!user) return null
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) return null

    const token = generateToken()
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await run(
      env,
      "INSERT INTO sessions (user_id, token, created_at, expires_at) VALUES (?, ?, ?, ?)",
      user.id,
      token,
      now,
      expiresAt
    )
    // Update last_seen
    await run(env, "UPDATE users SET last_seen = ? WHERE id = ?", now, user.id)
    return { user, token }
  },

  async logout(env: Env, token: string): Promise<void> {
    await run(env, "DELETE FROM sessions WHERE token = ?", token)
  },

  async logEvent(
    env: Env,
    data: {
      user_id?: number | null
      session_token?: string | null
      event_type: string
      ticker?: string | null
      metadata?: string | null
      ip?: string | null
      user_agent?: string | null
    }
  ): Promise<void> {
    const now = new Date().toISOString()
    await run(
      env,
      `INSERT INTO events (user_id, session_token, event_type, ticker, metadata, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      data.user_id ?? null,
      data.session_token ?? null,
      data.event_type,
      data.ticker ?? null,
      data.metadata ?? null,
      data.ip ?? null,
      data.user_agent ?? null,
      now
    )

    // Also update ticker_interest if ticker is present
    if (data.ticker) {
      const today = now.slice(0, 10)
      await run(
        env,
        `INSERT INTO ticker_interest (ticker, date, view_count) VALUES (?, ?, 1)
         ON CONFLICT(ticker, date) DO UPDATE SET view_count = view_count + 1`,
        data.ticker.toUpperCase(),
        today
      )
    }
  },

  async getTopTickers(env: Env, days = 7): Promise<TickerInterestRow[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    return all<TickerInterestRow>(
      env,
      `SELECT ticker, SUM(view_count) as view_count, SUM(pitch_count) as pitch_count,
              SUM(watchlist_count) as watchlist_count
       FROM ticker_interest
       WHERE date >= ?
       GROUP BY ticker
       ORDER BY view_count DESC
       LIMIT 10`,
      since
    )
  },

  async getActivityCounts(env: Env, days = 7): Promise<Array<{ event_type: string; count: number }>> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    return all<{ event_type: string; count: number }>(
      env,
      `SELECT event_type, COUNT(*) as count FROM events WHERE created_at >= ? GROUP BY event_type ORDER BY count DESC`,
      since
    )
  },

  async savePitch(
    env: Env,
    data: {
      user_id?: number | null
      ticker: string
      company_name: string
      memo_json: string
      is_public?: number
    }
  ): Promise<SavedPitchRow> {
    const now = new Date().toISOString()
    const slug = generateShareSlug(data.ticker)
    await run(
      env,
      `INSERT INTO saved_pitches (user_id, ticker, company_name, memo_json, is_public, share_slug, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      data.user_id ?? null,
      data.ticker.toUpperCase(),
      data.company_name,
      data.memo_json,
      data.is_public ?? 0,
      slug,
      now,
      now
    )
    const row = await first<SavedPitchRow>(
      env,
      "SELECT * FROM saved_pitches WHERE share_slug = ? LIMIT 1",
      slug
    )
    if (!row) throw new Error("Failed to save pitch")
    return row
  },

  async getMyPitches(env: Env, user_id: number): Promise<SavedPitchRow[]> {
    return all<SavedPitchRow>(
      env,
      "SELECT * FROM saved_pitches WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      user_id
    )
  },

  async getPublicPitches(env: Env): Promise<SavedPitchRow[]> {
    return all<SavedPitchRow>(
      env,
      "SELECT * FROM saved_pitches WHERE is_public = 1 ORDER BY created_at DESC LIMIT 20"
    )
  },

  async getPitchBySlug(env: Env, slug: string): Promise<SavedPitchRow | null> {
    return first<SavedPitchRow>(
      env,
      "SELECT * FROM saved_pitches WHERE share_slug = ? LIMIT 1",
      slug
    )
  },
}
