/**
 * server/websocket.js
 *
 * WebSocket server for real-time watchlist price updates.
 * Controlled by WEBSOCKET_ENABLED env var (default: true).
 *
 * Protocol:
 *   Client connects to ws://<host>/ws/quotes
 *   Server emits { type: 'quotes', data: QuoteData[], timestamp: string }
 *     every 5 seconds.
 *   Client can send { type: 'ping' } → server replies { type: 'pong' }.
 *
 * Reconnection: handled client-side with exponential backoff.
 */

'use strict';

const { WebSocketServer, WebSocket } = require('ws');
const { db_watchlist } = require('./db');
const yahooFinance = require('yahoo-finance2').default;

const WEBSOCKET_ENABLED = process.env.WEBSOCKET_ENABLED !== 'false';
const PRICE_UPDATE_INTERVAL_MS = 5_000; // 5 seconds

let wss = null;
let priceInterval = null;

// In-memory quote cache to avoid hammering Yahoo Finance
let lastQuotes = [];
let lastFetchAt = 0;
const QUOTE_CACHE_TTL_MS = 4_000; // slightly less than update interval

/**
 * Fetch quotes for all watchlist tickers.
 * Uses a short in-memory cache to avoid duplicate fetches within the same interval.
 */
async function fetchWatchlistQuotes() {
  const now = Date.now();
  if (lastQuotes.length > 0 && now - lastFetchAt < QUOTE_CACHE_TTL_MS) {
    return lastQuotes;
  }

  try {
    const watchlist = db_watchlist.getAll();
    const tickers = watchlist.map((w) => w.ticker);
    if (tickers.length === 0) return [];

    const results = await Promise.allSettled(
      tickers.map((ticker) =>
        yahooFinance.quote(ticker).catch(() => null)
      )
    );

    const quotes = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value) {
        const q = r.value;
        quotes.push({
          ticker: q.symbol,
          name: q.shortName || q.longName || tickers[i],
          price: q.regularMarketPrice ?? null,
          change: q.regularMarketChange ?? null,
          changePercent: q.regularMarketChangePercent ?? null,
          volume: q.regularMarketVolume ?? null,
          previousClose: q.regularMarketPreviousClose ?? null,
          open: q.regularMarketOpen ?? null,
          timestamp: new Date().toISOString(),
        });
      }
    }

    lastQuotes = quotes;
    lastFetchAt = now;
    return quotes;
  } catch (err) {
    console.error('[ws] fetchWatchlistQuotes error:', err.message);
    return lastQuotes; // return stale data on error
  }
}

/**
 * Broadcast a message to all connected clients.
 * @param {object} payload
 */
function broadcast(payload) {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg, (err) => {
        if (err) console.warn('[ws] Send error:', err.message);
      });
    }
  }
}

/**
 * Attach the WebSocket server to an existing HTTP server.
 * @param {import('http').Server} httpServer
 */
function attachWebSocket(httpServer) {
  if (!WEBSOCKET_ENABLED) {
    console.log('[ws] WebSocket disabled (WEBSOCKET_ENABLED=false)');
    return;
  }

  wss = new WebSocketServer({
    server: httpServer,
    path: '/ws/quotes',
  });

  wss.on('connection', async (ws, req) => {
    const ip =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    console.log(`[ws] Client connected from ${ip}. Total: ${wss.clients.size}`);

    // Send current quotes immediately on connect
    try {
      const quotes = await fetchWatchlistQuotes();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'quotes',
          data: quotes,
          timestamp: new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('[ws] Initial quote send error:', err.message);
    }

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      console.log(`[ws] Client disconnected. Total: ${wss.clients.size}`);
    });

    ws.on('error', (err) => {
      console.warn('[ws] Client error:', err.message);
    });
  });

  wss.on('error', (err) => {
    console.error('[ws] Server error:', err.message);
  });

  // Start broadcasting price updates every 5 seconds
  priceInterval = setInterval(async () => {
    if (wss.clients.size === 0) return; // no clients, skip fetch

    try {
      const quotes = await fetchWatchlistQuotes();
      broadcast({
        type: 'quotes',
        data: quotes,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[ws] Broadcast error:', err.message);
    }
  }, PRICE_UPDATE_INTERVAL_MS);

  console.log('[ws] WebSocket server attached at /ws/quotes');
}

/**
 * Gracefully shut down the WebSocket server.
 */
function closeWebSocket() {
  if (priceInterval) {
    clearInterval(priceInterval);
    priceInterval = null;
  }
  if (wss) {
    wss.close(() => console.log('[ws] WebSocket server closed.'));
    wss = null;
  }
}

module.exports = { attachWebSocket, closeWebSocket };
