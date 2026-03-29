/**
 * server/index.js — Market Pulse & Pedagogy Express Server
 *
 * Startup order:
 *   1. Load environment variables
 *   2. Initialize SQLite database (creates tables + seeds watchlist)
 *   3. Mount all API routes
 *   4. Serve React Vite build from dist/
 *   5. Start HTTP server
 *   6. Schedule 15-minute scrub cron job
 */

'use strict';

// Load .env if present (for local dev; Railway injects env vars directly)
try {
  require('fs').existsSync('.env') && require('fs')
    .readFileSync('.env', 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = val;
    });
} catch (_) { /* .env not required in production */ }

const express = require('express');
const path = require('path');
const http = require('http');
const cron = require('node-cron');
const { securityHeaders } = require('./middleware/securityHeaders');
const { limitDefault, limitPredict, limitScrub } = require('./middleware/rateLimit');
const { cacheQuotes, cacheChart, cacheNews, cachePredict, cacheEli5, noCache } = require('./middleware/cacheControl');
const { attachWebSocket, closeWebSocket } = require('./websocket');

// ─── Initialize DB first (creates tables and seeds watchlist) ─────────────────
// Importing db.js executes all CREATE TABLE and seed logic synchronously.
require('./db');
console.log('[server] Database initialized.');

// ─── Routes ───────────────────────────────────────────────────────────────────
const healthRouter      = require('./routes/health');
const quotesRouter      = require('./routes/quotes');
const chartRouter       = require('./routes/chart');
const newsRouter        = require('./routes/news');
const vectorsRouter     = require('./routes/vectors');
const predictRouter     = require('./routes/predict');
const scrubRouter       = require('./routes/scrub');
const watchlistRouter   = require('./routes/watchlist');
const eli5Router        = require('./routes/eli5');
const predictionsRouter = require('./routes/predictions');
const sentimentRouter   = require('./routes/sentiment');

const { runScrub } = require('./scraper');

// ─── App setup ────────────────────────────────────────────────────────────────
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Security headers on all responses
app.use(securityHeaders);

// CORS — allow all origins in development; tighten in production if needed
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Structured request logger (method, path, status, duration)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(`[${level}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ─── API routes (with rate limiting + cache headers) ─────────────────────────
app.use('/api/health',    limitDefault, healthRouter);
app.use('/api/quotes',    limitDefault, cacheQuotes,  quotesRouter);
app.use('/api/chart',     limitDefault, cacheChart,   chartRouter);
// Sentiment correlation must be mounted before /api/news to avoid route shadowing
app.use('/api/news/sentiment-correlation', limitDefault, cacheChart, sentimentRouter);
app.use('/api/news',      limitDefault, cacheNews,    newsRouter);
app.use('/api/vectors',   limitDefault, vectorsRouter);
app.use('/api/predict',   limitPredict, cachePredict, predictRouter);
app.use('/api/scrub/trigger', limitScrub, noCache);
app.use('/api/scrub',     limitDefault, scrubRouter);
app.use('/api/watchlist', limitDefault, noCache, watchlistRouter);
app.use('/api/eli5',      limitDefault, cacheEli5,   eli5Router);
app.use('/api/predictions', limitDefault, predictionsRouter);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Static file serving (React Vite build) ───────────────────────────────────
const DIST_DIR = path.join(__dirname, '..', 'dist');
const distExists = require('fs').existsSync(DIST_DIR);

if (distExists) {
  app.use(express.static(DIST_DIR, {
    maxAge: '1d',
    etag: true,
  }));

  // SPA fallback — serve index.html for all non-API GET requests
  // (handles React Router / hash-based routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });

  console.log('[server] Serving static build from dist/');
} else {
  console.warn('[server] dist/ directory not found — static file serving disabled.');
  console.warn('[server] Run `npm run build` in the frontend to create dist/.');

  // Fallback for environments without a build
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Market Pulse API is running. Frontend build not found.',
      endpoints: [
        'GET  /api/health',
        'GET  /api/quotes',
        'GET  /api/chart/:ticker',
        'GET  /api/news',
        'GET  /api/vectors',
        'GET  /api/predict/:ticker',
        'GET  /api/scrub/latest',
        'GET  /api/scrub/runs',
        'POST /api/scrub/trigger',
        'GET  /api/watchlist',
        'POST /api/watchlist',
        'DELETE /api/watchlist/:id',
        'GET  /api/eli5/:term',
      ],
    });
  });
}

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ message: err.message || 'Internal server error.' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 3000;
const server = http.createServer(app);

// Attach WebSocket server for real-time price updates
attachWebSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Market Pulse & Pedagogy running on port ${PORT}`);
  console.log(`[server] Gemini configured: ${!!process.env.GEMINI_API_KEY}`);
  console.log(`[server] Cloudflare configured: ${!!process.env.CLOUDFLARE_API_TOKEN}`);
  console.log(`[server] D1 configured: ${!!(process.env.CLOUDFLARE_D1_DB_ID && process.env.CLOUDFLARE_API_TOKEN)}`);
  console.log(`[server] Rate limiting: ${process.env.RATE_LIMIT_ENABLED !== 'false' ? 'enabled' : 'disabled'}`);
  console.log(`[server] WebSocket: ${process.env.WEBSOCKET_ENABLED !== 'false' ? 'enabled at /ws/quotes' : 'disabled'}`);
  console.log(`[server] Node version: ${process.version}`);
});

// ─── 15-minute scrub cron scheduler ──────────────────────────────────────────
// Runs every 15 minutes: 0, 15, 30, 45 minutes past each hour
cron.schedule('*/15 * * * *', async () => {
  if (scrubRouter.isScrubInProgress()) {
    console.log('[cron] Skipping scheduled scrub — one is already running.');
    return;
  }

  console.log('[cron] Starting scheduled scrub run...');
  scrubRouter.setScrubInProgress(true);

  try {
    const result = await runScrub();
    console.log('[cron] Scheduled scrub complete:', result.summary);
  } catch (err) {
    console.error('[cron] Scheduled scrub failed:', err.message);
  } finally {
    scrubRouter.setScrubInProgress(false);
  }
});

console.log('[cron] Scrub scheduler started — runs every 15 minutes.');

// ─── Daily prediction accuracy resolution cron ────────────────────────────────
// Runs once per day at 06:00 UTC to resolve predictions made 24h+ ago
cron.schedule('0 6 * * *', async () => {
  console.log('[cron] Running daily prediction accuracy resolution...');
  try {
    const result = await predictionsRouter.resolvePendingPredictions();
    console.log(`[cron] Prediction resolution: ${result.resolved} resolved, ${result.errors} errors.`);
  } catch (err) {
    console.error('[cron] Prediction resolution failed:', err.message);
  }
});
console.log('[cron] Prediction accuracy resolver scheduled — runs daily at 06:00 UTC.');

// ─── Run an initial scrub after a short startup delay ─────────────────────────
// Delay 30 seconds to let Railway finish container initialization
setTimeout(async () => {
  if (scrubRouter.isScrubInProgress()) return;
  console.log('[server] Running initial startup scrub...');
  scrubRouter.setScrubInProgress(true);
  try {
    const result = await runScrub();
    console.log('[server] Initial scrub complete:', result.summary);
  } catch (err) {
    console.error('[server] Initial scrub error:', err.message);
  } finally {
    scrubRouter.setScrubInProgress(false);
  }
}, 30_000);

// ─── Graceful shutdown ────────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`[server] Received ${signal} — shutting down gracefully...`);
  closeWebSocket();
  server.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });
  // Force-kill after 10 seconds if connections don't drain
  setTimeout(() => {
    console.error('[server] Force kill after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = app; // for testing
