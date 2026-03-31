-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  handle TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_seed TEXT,
  created_at TEXT NOT NULL,
  last_seen TEXT
);

-- Sessions (JWT-less, simple token auth)
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

-- Events log (every user action)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_token TEXT,
  event_type TEXT NOT NULL,
  ticker TEXT,
  metadata TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

-- Saved pitches (persistent memo storage)
CREATE TABLE IF NOT EXISTS saved_pitches (
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
);

-- Ticker interest (crowdsourced signal)
CREATE TABLE IF NOT EXISTS ticker_interest (
  ticker TEXT NOT NULL,
  date TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  pitch_count INTEGER NOT NULL DEFAULT 0,
  watchlist_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ticker, date)
);
