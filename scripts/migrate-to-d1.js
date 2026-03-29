#!/usr/bin/env node
/**
 * scripts/migrate-to-d1.js
 *
 * Syncs the local SQLite schema to Cloudflare D1.
 * Run this once after setting up your D1 database.
 *
 * Usage:
 *   CLOUDFLARE_ACCOUNT_ID=xxx CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_D1_DB_ID=xxx \
 *     node scripts/migrate-to-d1.js
 *
 * What it does:
 *   1. Creates all tables in D1 (idempotent — uses CREATE TABLE IF NOT EXISTS)
 *   2. Creates indexes for performance
 *   3. Optionally seeds the default watchlist if D1 watchlist is empty
 *
 * Note: This script uses the Cloudflare D1 REST API directly.
 * For production use, consider using Wrangler: `wrangler d1 execute <db-name> --file=schema.sql`
 */

'use strict';

const https = require('https');

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_TOKEN  = process.env.CLOUDFLARE_API_TOKEN;
const CF_DB_ID      = process.env.CLOUDFLARE_D1_DB_ID;

if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_DB_ID) {
  console.error('Error: Missing required environment variables.');
  console.error('  CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_D1_DB_ID');
  process.exit(1);
}

/**
 * Execute a SQL statement against Cloudflare D1 via REST API.
 */
async function d1Query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ sql, params });
    const options = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DB_ID}/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.success) {
            reject(new Error(`D1 error: ${JSON.stringify(parsed.errors)}`));
          } else {
            resolve(parsed.result?.[0]?.results || []);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const SCHEMA_STATEMENTS = [
  // Tables
  `CREATE TABLE IF NOT EXISTS watchlist (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker  TEXT NOT NULL UNIQUE,
    name    TEXT NOT NULL,
    type    TEXT NOT NULL DEFAULT 'stock',
    addedAt TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS scrub_runs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    runAt        TEXT NOT NULL DEFAULT (datetime('now')),
    sources      TEXT NOT NULL DEFAULT '[]',
    vectorsFound INTEGER NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'pending',
    summary      TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS articles (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    scrubRunId      INTEGER NOT NULL REFERENCES scrub_runs(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    url             TEXT,
    source          TEXT NOT NULL,
    summary         TEXT,
    tone            TEXT NOT NULL DEFAULT 'neutral',
    sentiment_score REAL NOT NULL DEFAULT 0.5,
    publishedAt     TEXT,
    scrapedAt       TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS vectors (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    scrubRunId INTEGER REFERENCES scrub_runs(id) ON DELETE SET NULL,
    ticker     TEXT,
    signal     TEXT NOT NULL DEFAULT 'neutral',
    confidence REAL NOT NULL DEFAULT 0.5,
    reasoning  TEXT,
    sources    TEXT NOT NULL DEFAULT '[]',
    createdAt  TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS eli5_cache (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    term        TEXT NOT NULL UNIQUE,
    explanation TEXT NOT NULL,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS predictions_history (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker              TEXT NOT NULL,
    predicted_direction TEXT NOT NULL,
    predicted_at        TEXT NOT NULL DEFAULT (datetime('now')),
    actual_price_at_24h REAL,
    actual_direction    TEXT,
    accuracy_score      REAL,
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_watchlist_ticker       ON watchlist(ticker)`,
  `CREATE INDEX IF NOT EXISTS idx_articles_scrapedAt     ON articles(scrapedAt)`,
  `CREATE INDEX IF NOT EXISTS idx_articles_tone          ON articles(tone)`,
  `CREATE INDEX IF NOT EXISTS idx_vectors_ticker         ON vectors(ticker)`,
  `CREATE INDEX IF NOT EXISTS idx_vectors_createdAt      ON vectors(createdAt)`,
  `CREATE INDEX IF NOT EXISTS idx_predictions_ticker     ON predictions_history(ticker)`,
  `CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions_history(created_at)`,
];

const DEFAULT_WATCHLIST = [
  { ticker: 'SPY',     name: 'S&P 500 ETF',       type: 'etf'    },
  { ticker: 'QQQ',     name: 'NASDAQ-100 ETF',     type: 'etf'    },
  { ticker: 'BTC-USD', name: 'Bitcoin',            type: 'crypto' },
  { ticker: 'AAPL',    name: 'Apple Inc.',         type: 'stock'  },
  { ticker: 'NVDA',    name: 'NVIDIA Corporation', type: 'stock'  },
  { ticker: 'TSLA',    name: 'Tesla, Inc.',        type: 'stock'  },
];

async function main() {
  console.log(`[migrate] Connecting to D1 database: ${CF_DB_ID}`);
  console.log(`[migrate] Account: ${CF_ACCOUNT_ID}`);
  console.log('');

  // 1. Create tables and indexes
  console.log('[migrate] Creating tables and indexes...');
  for (const sql of SCHEMA_STATEMENTS) {
    const label = sql.trim().split('\n')[0].slice(0, 60);
    try {
      await d1Query(sql);
      console.log(`  ✓ ${label}`);
    } catch (err) {
      console.error(`  ✗ ${label}`);
      console.error(`    Error: ${err.message}`);
    }
  }

  // 2. Seed default watchlist if empty
  console.log('\n[migrate] Checking watchlist...');
  try {
    const rows = await d1Query('SELECT COUNT(*) as c FROM watchlist');
    const count = rows[0]?.c || 0;
    if (count === 0) {
      console.log('[migrate] Seeding default watchlist...');
      for (const item of DEFAULT_WATCHLIST) {
        await d1Query(
          `INSERT OR IGNORE INTO watchlist (ticker, name, type) VALUES (?, ?, ?)`,
          [item.ticker, item.name, item.type]
        );
        console.log(`  ✓ Seeded ${item.ticker}`);
      }
    } else {
      console.log(`[migrate] Watchlist already has ${count} items — skipping seed.`);
    }
  } catch (err) {
    console.error('[migrate] Watchlist check failed:', err.message);
  }

  console.log('\n[migrate] D1 migration complete!');
  console.log('\nNext steps:');
  console.log('  1. Set CLOUDFLARE_D1_DB_ID in your Railway environment variables');
  console.log('  2. Set CLOUDFLARE_API_TOKEN in your Railway environment variables');
  console.log('  3. Set CLOUDFLARE_ACCOUNT_ID in your Railway environment variables');
  console.log('  4. Deploy your app — it will use D1 for cloud storage');
}

main().catch((err) => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
