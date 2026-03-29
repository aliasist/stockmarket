/**
 * db.js — SQLite database setup using better-sqlite3
 * All table creation and query helpers live here.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
// Allow DATABASE_PATH override for Railway persistent volumes
const DB_PATH = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(__dirname, '..', 'market_pulse.db');
// Ensure the directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(DB_PATH, { verbose: null });
// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
// ─── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS watchlist (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker    TEXT NOT NULL UNIQUE,
    name      TEXT NOT NULL,
    type      TEXT NOT NULL DEFAULT 'stock',
    addedAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scrub_runs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    runAt        TEXT NOT NULL DEFAULT (datetime('now')),
    sources      TEXT NOT NULL DEFAULT '[]',
    vectorsFound INTEGER NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'pending',
    summary      TEXT
  );

  CREATE TABLE IF NOT EXISTS articles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    scrubRunId  INTEGER NOT NULL REFERENCES scrub_runs(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    url         TEXT,
    source      TEXT NOT NULL,
    summary     TEXT,
    tone        TEXT NOT NULL DEFAULT 'neutral',
    publishedAt TEXT,
    scrapedAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vectors (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    scrubRunId INTEGER REFERENCES scrub_runs(id) ON DELETE SET NULL,
    ticker     TEXT,
    signal     TEXT NOT NULL DEFAULT 'neutral',
    confidence REAL NOT NULL DEFAULT 0.5,
    reasoning  TEXT,
    sources    TEXT NOT NULL DEFAULT '[]',
    createdAt  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS eli5_cache (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    term        TEXT NOT NULL UNIQUE,
    explanation TEXT NOT NULL,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
// ─── Seed default watchlist if empty ──────────────────────────────────────────
const watchlistCount = db.prepare('SELECT COUNT(*) as c FROM watchlist').get();
if (watchlistCount.c === 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO watchlist (ticker, name, type) VALUES (?, ?, ?)');
    const seedMany = db.transaction((items) => {
        for (const item of items)
            insert.run(item.ticker, item.name, item.type);
    });
    seedMany([
        { ticker: 'SPY', name: 'S&P 500 ETF', type: 'etf' },
        { ticker: 'QQQ', name: 'NASDAQ-100 ETF', type: 'etf' },
        { ticker: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
        { ticker: 'AAPL', name: 'Apple Inc.', type: 'stock' },
        { ticker: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' },
        { ticker: 'TSLA', name: 'Tesla, Inc.', type: 'stock' },
    ]);
    console.log('[db] Seeded default watchlist.');
}
// ─── Watchlist queries ─────────────────────────────────────────────────────────
const db_watchlist = {
    getAll: () => db.prepare('SELECT * FROM watchlist ORDER BY addedAt ASC').all(),
    add: (ticker, name, type) => db.prepare('INSERT INTO watchlist (ticker, name, type) VALUES (?, ?, ?)').run(ticker, name, type),
    remove: (id) => db.prepare('DELETE FROM watchlist WHERE id = ?').run(id),
};
// ─── Scrub run queries ─────────────────────────────────────────────────────────
const db_scrub = {
    createRun: () => db.prepare("INSERT INTO scrub_runs (status) VALUES ('running')").run(),
    updateRun: (id, { vectorsFound, status, summary, sources }) => db
        .prepare(`UPDATE scrub_runs
         SET vectorsFound = ?, status = ?, summary = ?, sources = ?
         WHERE id = ?`)
        .run(vectorsFound, status, summary, JSON.stringify(sources), id),
    getLatest: () => db.prepare('SELECT * FROM scrub_runs ORDER BY id DESC LIMIT 1').get(),
    getAll: () => db.prepare('SELECT * FROM scrub_runs ORDER BY id DESC LIMIT 50').all(),
};
// ─── Article queries ───────────────────────────────────────────────────────────
const db_articles = {
    insertMany: db.transaction((articles) => {
        const stmt = db.prepare(`INSERT INTO articles (scrubRunId, title, url, source, summary, tone, publishedAt)
       VALUES (@scrubRunId, @title, @url, @source, @summary, @tone, @publishedAt)`);
        for (const a of articles)
            stmt.run(a);
    }),
    getByRun: (scrubRunId) => db
        .prepare('SELECT * FROM articles WHERE scrubRunId = ? ORDER BY id DESC')
        .all(scrubRunId),
    getLatest: (limit = 100) => db
        .prepare(`SELECT a.* FROM articles a
         INNER JOIN scrub_runs r ON a.scrubRunId = r.id
         WHERE r.status = 'done'
         ORDER BY a.id DESC LIMIT ?`)
        .all(limit),
    getLatestBySource: (source, limit = 20) => db
        .prepare(`SELECT a.* FROM articles a
         INNER JOIN scrub_runs r ON a.scrubRunId = r.id
         WHERE r.status = 'done' AND a.source = ?
         ORDER BY a.id DESC LIMIT ?`)
        .all(source, limit),
};
// ─── Vector queries ────────────────────────────────────────────────────────────
const db_vectors = {
    insert: ({ scrubRunId, ticker, signal, confidence, reasoning, sources }) => db
        .prepare(`INSERT INTO vectors (scrubRunId, ticker, signal, confidence, reasoning, sources)
         VALUES (?, ?, ?, ?, ?, ?)`)
        .run(scrubRunId, ticker || null, signal, confidence, reasoning, JSON.stringify(sources || [])),
    getAll: () => db.prepare('SELECT * FROM vectors ORDER BY id DESC LIMIT 100').all(),
    getLatest: () => db.prepare('SELECT * FROM vectors ORDER BY id DESC LIMIT 10').all(),
};
// ─── ELI5 cache queries ────────────────────────────────────────────────────────
const db_eli5 = {
    get: (term) => db
        .prepare('SELECT * FROM eli5_cache WHERE term = ? COLLATE NOCASE')
        .get(term),
    set: (term, explanation) => {
        // Upsert — replace if the term already exists
        return db
            .prepare(`INSERT INTO eli5_cache (term, explanation)
         VALUES (?, ?)
         ON CONFLICT(term) DO UPDATE SET explanation = excluded.explanation,
                                         createdAt = datetime('now')`)
            .run(term, explanation);
    },
};
module.exports = { db, db_watchlist, db_scrub, db_articles, db_vectors, db_eli5 };
