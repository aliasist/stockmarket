-- D1 Schema Migrations for Market Pulse
-- Run with: wrangler d1 execute market-pulse-d1 --file=src/workers/d1-migrations.sql

-- ── Users ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT,                          -- NULL for OAuth-only accounts
  google_id     TEXT    UNIQUE,
  created_at    TEXT    NOT NULL,
  updated_at    TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google   ON users(google_id);

-- ── Sessions (refresh tokens) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT    NOT NULL UNIQUE,
  expires_at TEXT    NOT NULL,
  created_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token);

-- ── User Watchlists (per-user, replaces global watchlist for auth'd users) ─────
CREATE TABLE IF NOT EXISTS user_watchlists (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker   TEXT    NOT NULL,
  added_at TEXT    NOT NULL,
  UNIQUE(user_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_user_watchlists_user_id ON user_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_ticker  ON user_watchlists(ticker);

-- ── Portfolio Holdings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker     TEXT    NOT NULL,
  shares     REAL    NOT NULL,
  cost_basis REAL    NOT NULL,               -- average cost per share
  added_at   TEXT    NOT NULL,
  UNIQUE(user_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_ticker  ON portfolio_holdings(ticker);

-- ── Scrub Runs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrub_runs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  run_at       TEXT    NOT NULL,
  sources      TEXT    NOT NULL DEFAULT '[]',
  vectors_found INTEGER NOT NULL DEFAULT 0,
  status       TEXT    NOT NULL DEFAULT 'pending',
  summary      TEXT
);

-- ── Market Vectors ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_vectors (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  scrub_run_id INTEGER NOT NULL REFERENCES scrub_runs(id) ON DELETE CASCADE,
  ticker       TEXT,
  signal       TEXT    NOT NULL,
  confidence   REAL    NOT NULL,
  reasoning    TEXT    NOT NULL,
  sources      TEXT    NOT NULL DEFAULT '[]',
  created_at   TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_market_vectors_ticker ON market_vectors(ticker);

-- ── News Articles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS news_articles (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  scrub_run_id INTEGER NOT NULL REFERENCES scrub_runs(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  source       TEXT    NOT NULL,
  url          TEXT    NOT NULL,
  published_at TEXT,
  summary      TEXT,
  tone         TEXT,
  tone_reasoning TEXT,
  ticker       TEXT
);

CREATE INDEX IF NOT EXISTS idx_news_articles_ticker ON news_articles(ticker);

-- ── ELI5 Cache ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eli5_cache (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  term        TEXT    NOT NULL UNIQUE,
  explanation TEXT    NOT NULL,
  created_at  TEXT    NOT NULL
);

-- ── Global Watchlist (fallback for unauthenticated / seeded data) ──────────────
CREATE TABLE IF NOT EXISTS watchlist (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker   TEXT    NOT NULL UNIQUE,
  name     TEXT    NOT NULL,
  type     TEXT    NOT NULL DEFAULT 'stock',
  added_at TEXT    NOT NULL
);

-- Seed default watchlist
INSERT OR IGNORE INTO watchlist (ticker, name, type, added_at) VALUES
  ('SPY',     'S&P 500 ETF',     'etf',    datetime('now')),
  ('QQQ',     'Nasdaq 100 ETF',  'etf',    datetime('now')),
  ('BTC-USD', 'Bitcoin',         'crypto', datetime('now')),
  ('AAPL',    'Apple Inc.',      'stock',  datetime('now')),
  ('NVDA',    'NVIDIA Corp.',    'stock',  datetime('now')),
  ('TSLA',    'Tesla Inc.',      'stock',  datetime('now'));
