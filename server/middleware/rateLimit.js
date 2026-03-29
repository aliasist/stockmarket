/**
 * server/middleware/rateLimit.js
 *
 * In-process rate limiter using a sliding window counter per IP.
 * Controlled by RATE_LIMIT_ENABLED env var (default: true).
 *
 * Limits:
 *   /api/predict/*      → 10 req/min per IP  (expensive Gemini calls)
 *   /api/scrub/trigger  → 1  req/min per IP
 *   all other /api/*    → 100 req/min per IP
 */

'use strict';

const RATE_LIMIT_ENABLED = process.env.RATE_LIMIT_ENABLED !== 'false';

// Map<ip, Map<window_key, count>>
const counters = new Map();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, windows] of counters.entries()) {
    for (const [key] of windows.entries()) {
      const ts = parseInt(key.split(':')[1], 10);
      if (now - ts > 120_000) windows.delete(key);
    }
    if (windows.size === 0) counters.delete(ip);
  }
}, 5 * 60_000);

/**
 * Get the current request count for an IP within the current 1-minute window.
 * @param {string} ip
 * @returns {number}
 */
function getCount(ip) {
  const windowKey = `w:${Math.floor(Date.now() / 60_000)}`;
  if (!counters.has(ip)) counters.set(ip, new Map());
  const windows = counters.get(ip);
  return windows.get(windowKey) || 0;
}

/**
 * Increment the counter for an IP in the current window.
 * @param {string} ip
 */
function increment(ip) {
  const windowKey = `w:${Math.floor(Date.now() / 60_000)}`;
  if (!counters.has(ip)) counters.set(ip, new Map());
  const windows = counters.get(ip);
  windows.set(windowKey, (windows.get(windowKey) || 0) + 1);
}

/**
 * Build a rate-limit middleware for a given max requests per minute.
 * @param {number} maxPerMinute
 * @returns {import('express').RequestHandler}
 */
function createLimiter(maxPerMinute) {
  return (req, res, next) => {
    if (!RATE_LIMIT_ENABLED) return next();

    const ip =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const count = getCount(ip);
    if (count >= maxPerMinute) {
      res.setHeader('Retry-After', '60');
      res.setHeader('X-RateLimit-Limit', String(maxPerMinute));
      res.setHeader('X-RateLimit-Remaining', '0');
      return res.status(429).json({
        message: 'Too many requests. Please wait before retrying.',
        retryAfter: 60,
      });
    }

    increment(ip);
    res.setHeader('X-RateLimit-Limit', String(maxPerMinute));
    res.setHeader('X-RateLimit-Remaining', String(maxPerMinute - count - 1));
    next();
  };
}

// Pre-built limiters for each tier
const limitDefault  = createLimiter(100);
const limitPredict  = createLimiter(10);
const limitScrub    = createLimiter(1);

module.exports = { createLimiter, limitDefault, limitPredict, limitScrub };
