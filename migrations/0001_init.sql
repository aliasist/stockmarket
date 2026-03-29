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

INSERT OR IGNORE INTO watchlist (ticker, name, type, added_at) VALUES
  ('SPY', 'S&P 500 ETF', 'etf', CURRENT_TIMESTAMP),
  ('QQQ', 'Nasdaq 100 ETF', 'etf', CURRENT_TIMESTAMP),
  ('BTC-USD', 'Bitcoin', 'crypto', CURRENT_TIMESTAMP),
  ('AAPL', 'Apple Inc.', 'stock', CURRENT_TIMESTAMP),
  ('NVDA', 'NVIDIA Corp.', 'stock', CURRENT_TIMESTAMP),
  ('TSLA', 'Tesla Inc.', 'stock', CURRENT_TIMESTAMP);
