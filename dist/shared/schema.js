import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
// ── Scrub Runs ─────────────────────────────────────────────────────────────
export const scrubRuns = sqliteTable("scrub_runs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    runAt: text("run_at").notNull(), // ISO timestamp
    sources: text("sources").notNull(), // JSON: ["sec_edgar","reddit","hn"]
    vectorsFound: integer("vectors_found").notNull().default(0),
    status: text("status").notNull().default("pending"), // pending | running | done | error
    summary: text("summary"),
});
export const insertScrubRunSchema = createInsertSchema(scrubRuns);
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
});
export const insertMarketVectorSchema = createInsertSchema(marketVectors);
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
});
export const insertNewsArticleSchema = createInsertSchema(newsArticles);
// ── ELI5 Cache ────────────────────────────────────────────────────────────
export const eli5Cache = sqliteTable("eli5_cache", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    term: text("term").notNull().unique(),
    explanation: text("explanation").notNull(), // metaphor using playground/toys/candy
    createdAt: text("created_at").notNull(),
});
export const insertEli5CacheSchema = createInsertSchema(eli5Cache);
// ── Market Watchlist ───────────────────────────────────────────────────────
export const watchlist = sqliteTable("watchlist", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    ticker: text("ticker").notNull().unique(),
    name: text("name").notNull(),
    type: text("type").notNull().default("stock"), // stock | crypto | etf | index
    addedAt: text("added_at").notNull(),
});
export const insertWatchlistSchema = createInsertSchema(watchlist);
