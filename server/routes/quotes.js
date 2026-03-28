/**
 * routes/quotes.js
 * GET /api/quotes — Returns quote data for all watchlist tickers
 */

const express = require('express');
const router = express.Router();
const yahooFinance = require('yahoo-finance2').default;
const { db_watchlist } = require('../db');

// Cache quotes for 60 seconds to avoid hammering Yahoo Finance
let quotesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

async function fetchQuotes(tickers) {
  try {
    // yahoo-finance2 quoteSummary can fetch multiple tickers
    const results = await Promise.allSettled(
      tickers.map((ticker) =>
        yahooFinance.quote(ticker).catch((err) => {
          console.warn(`[quotes] Failed to fetch ${ticker}:`, err.message);
          return null;
        })
      )
    );

    const quotes = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled' && result.value) {
        const q = result.value;
        quotes.push({
          ticker: q.symbol,
          name: q.shortName || q.longName || tickers[i],
          price: q.regularMarketPrice ?? null,
          change: q.regularMarketChange ?? null,
          changePercent: q.regularMarketChangePercent ?? null,
          volume: q.regularMarketVolume ?? null,
          high52w: q.fiftyTwoWeekHigh ?? null,
          low52w: q.fiftyTwoWeekLow ?? null,
          previousClose: q.regularMarketPreviousClose ?? null,
          open: q.regularMarketOpen ?? null,
          timestamp: new Date().toISOString(),
        });
      }
    }
    return quotes;
  } catch (err) {
    console.error('[quotes] fetchQuotes error:', err);
    throw err;
  }
}

router.get('/', async (req, res) => {
  try {
    // Get watchlist tickers from DB
    const watchlist = db_watchlist.getAll();
    const tickers = watchlist.map((w) => w.ticker);

    if (tickers.length === 0) {
      return res.json([]);
    }

    // Return cached result if fresh
    const now = Date.now();
    if (quotesCache && now - cacheTimestamp < CACHE_TTL_MS) {
      return res.json(quotesCache);
    }

    const quotes = await fetchQuotes(tickers);
    quotesCache = quotes;
    cacheTimestamp = now;

    res.json(quotes);
  } catch (err) {
    console.error('[quotes] GET /api/quotes error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/quotes/:ticker — Single ticker quote
 */
router.get('/:ticker', async (req, res) => {
  const { ticker } = req.params;
  try {
    const q = await yahooFinance.quote(ticker.toUpperCase());
    res.json({
      ticker: q.symbol,
      name: q.shortName || q.longName || ticker,
      price: q.regularMarketPrice ?? null,
      change: q.regularMarketChange ?? null,
      changePercent: q.regularMarketChangePercent ?? null,
      volume: q.regularMarketVolume ?? null,
      high52w: q.fiftyTwoWeekHigh ?? null,
      low52w: q.fiftyTwoWeekLow ?? null,
      previousClose: q.regularMarketPreviousClose ?? null,
      open: q.regularMarketOpen ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[quotes] GET /api/quotes/${ticker} error:`, err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
