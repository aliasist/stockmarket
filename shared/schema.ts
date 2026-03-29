import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

// ── Users ──────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // null for OAuth-only accounts
  googleId: text("google_id").unique(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export const insertUserSchema = createInsertSchema(users)
export type InsertUser = Omit<typeof users.$inferInsert, "id">
export type User = typeof users.$inferSelect

// ── Sessions ───────────────────────────────────────────────────────────────
export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
})

export const insertSessionSchema = createInsertSchema(sessions)
export type InsertSession = Omit<typeof sessions.$inferInsert, "id">
export type Session = typeof sessions.$inferSelect

// ── User Watchlists (per-user) ─────────────────────────────────────────────
export const userWatchlists = sqliteTable("user_watchlists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  ticker: text("ticker").notNull(),
  addedAt: text("added_at").notNull(),
})

export const insertUserWatchlistSchema = createInsertSchema(userWatchlists)
export type InsertUserWatchlist = Omit<typeof userWatchlists.$inferInsert, "id">
export type UserWatchlist = typeof userWatchlists.$inferSelect

// ── Portfolio Holdings ─────────────────────────────────────────────────────
export const portfolioHoldings = sqliteTable("portfolio_holdings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  ticker: text("ticker").notNull(),
  shares: real("shares").notNull(),
  costBasis: real("cost_basis").notNull(), // average cost per share
  addedAt: text("added_at").notNull(),
})

export const insertPortfolioHoldingSchema = createInsertSchema(portfolioHoldings)
export type InsertPortfolioHolding = Omit<typeof portfolioHoldings.$inferInsert, "id">
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect

// ── Scrub Runs ─────────────────────────────────────────────────────────────
export const scrubRuns = sqliteTable("scrub_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runAt: text("run_at").notNull(), // ISO timestamp
  sources: text("sources").notNull(), // JSON: ["sec_edgar","reddit","hn"]
  vectorsFound: integer("vectors_found").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending | running | done | error
  summary: text("summary"),
})

export const insertScrubRunSchema = createInsertSchema(scrubRuns)
export type InsertScrubRun = Omit<typeof scrubRuns.$inferInsert, "id">
export type ScrubRun = typeof scrubRuns.$inferSelect

// ── Market Vectors (cross-referenced signals) ─────────────────────────────
export const marketVectors = sqliteTable("market_vectors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scrubRunId: integer("scrub_run_id").notNull(),
  ticker: text("ticker"), // e.g. "SPY", "BTC", null for macro
  signal: text("signal").notNull(), // bullish | bearish | neutral
  confidence: real("confidence").notNull(), // 0-1
  reasoning: text("reasoning").notNull(), // AI generated logic
  sources: text("sources").notNull(), // JSON array of source URLs
  createdAt: text("created_at").notNull(),
})

export const insertMarketVectorSchema = createInsertSchema(marketVectors)
export type InsertMarketVector = Omit<typeof marketVectors.$inferInsert, "id">
export type MarketVector = typeof marketVectors.$inferSelect

// ── News Articles (journalism feed) ───────────────────────────────────────
export const newsArticles = sqliteTable("news_articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scrubRunId: integer("scrub_run_id").notNull(),
  title: text("title").notNull(),
  source: text("source").notNull(), // reddit | hackernews | bluesky | rss
  url: text("url").notNull(),
  publishedAt: text("published_at"),
  summary: text("summary"),
  tone: text("tone"), // fear_mongering | speculative | data_backed | neutral
  toneReasoning: text("tone_reasoning"),
  ticker: text("ticker"),
})

export const insertNewsArticleSchema = createInsertSchema(newsArticles)
export type InsertNewsArticle = Omit<typeof newsArticles.$inferInsert, "id">
export type NewsArticle = typeof newsArticles.$inferSelect

// ── ELI5 Cache ────────────────────────────────────────────────────────────
export const eli5Cache = sqliteTable("eli5_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  term: text("term").notNull().unique(),
  explanation: text("explanation").notNull(), // metaphor using playground/toys/candy
  createdAt: text("created_at").notNull(),
})

export const insertEli5CacheSchema = createInsertSchema(eli5Cache)
export type InsertEli5Cache = Omit<typeof eli5Cache.$inferInsert, "id">
export type Eli5Cache = typeof eli5Cache.$inferSelect

// ── Market Watchlist ───────────────────────────────────────────────────────
export const watchlist = sqliteTable("watchlist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticker: text("ticker").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull().default("stock"), // stock | crypto | etf | index
  addedAt: text("added_at").notNull(),
})

export const insertWatchlistSchema = createInsertSchema(watchlist)
export type InsertWatchlist = Omit<typeof watchlist.$inferInsert, "id">
export type Watchlist = typeof watchlist.$inferSelect
