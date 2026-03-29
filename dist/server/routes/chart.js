/**
 * routes/chart.js
 * GET /api/chart/:ticker?range=5d&interval=15m
 *
 * Returns OHLCV candle data for a ticker.
 * Range: 1d, 5d (default), 1m, 3m, 6m, 1y
 * Interval: auto-selected from range if not specified
 */
const express = require('express');
const router = express.Router();
const yahooFinance = require('yahoo-finance2').default;
// Auto-select sensible intervals for each range
const RANGE_INTERVALS = {
    '1d': '5m',
    '5d': '15m',
    '1m': '1h',
    '3m': '1d',
    '6m': '1d',
    '1y': '1d',
};
// Chart data cache: { [ticker+range]: { data, ts } }
const chartCache = new Map();
const CHART_CACHE_TTL_MS = 5 * 60_000; // 5 minutes
router.get('/:ticker', async (req, res) => {
    const { ticker } = req.params;
    const range = req.query.range || '5d';
    const interval = req.query.interval || RANGE_INTERVALS[range] || '15m';
    const cacheKey = `${ticker.toUpperCase()}_${range}_${interval}`;
    const cached = chartCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CHART_CACHE_TTL_MS) {
        return res.json(cached.data);
    }
    try {
        const result = await yahooFinance.chart(ticker.toUpperCase(), {
            period1: getStartDate(range),
            interval,
        });
        const quotes = result?.quotes || [];
        const candles = quotes
            .filter((q) => q.open != null && q.close != null)
            .map((q) => ({
            timestamp: q.date instanceof Date ? q.date.getTime() : q.date,
            open: round(q.open),
            high: round(q.high),
            low: round(q.low),
            close: round(q.close),
            volume: q.volume ?? 0,
        }));
        chartCache.set(cacheKey, { data: candles, ts: Date.now() });
        res.json(candles);
    }
    catch (err) {
        console.error(`[chart] GET /api/chart/${ticker} error:`, err);
        res.status(500).json({ message: err.message });
    }
});
function getStartDate(range) {
    const now = new Date();
    const d = new Date(now);
    switch (range) {
        case '1d':
            d.setDate(d.getDate() - 1);
            break;
        case '5d':
            d.setDate(d.getDate() - 5);
            break;
        case '1m':
            d.setMonth(d.getMonth() - 1);
            break;
        case '3m':
            d.setMonth(d.getMonth() - 3);
            break;
        case '6m':
            d.setMonth(d.getMonth() - 6);
            break;
        case '1y':
            d.setFullYear(d.getFullYear() - 1);
            break;
        default: d.setDate(d.getDate() - 5);
    }
    return d;
}
function round(n) {
    return n != null ? Math.round(n * 100) / 100 : null;
}
module.exports = router;
