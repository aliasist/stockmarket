/**
 * server/middleware/cacheControl.js
 *
 * Per-route Cache-Control header helpers.
 * Controlled by CACHE_ENABLED env var (default: true).
 *
 * TTLs:
 *   /api/quotes          → max-age=60   (1 minute)
 *   /api/chart/:ticker   → max-age=300  (5 minutes)
 *   /api/news            → max-age=180  (3 minutes)
 *   /api/predict/:ticker → max-age=3600 (1 hour — expensive Gemini call)
 *   /api/eli5/:term      → max-age=86400 (24 hours — static content)
 *   everything else      → no-store
 */

'use strict';

const CACHE_ENABLED = process.env.CACHE_ENABLED !== 'false';

/**
 * Build a Cache-Control middleware for a given max-age (seconds).
 * @param {number} maxAge  seconds
 * @param {boolean} [isPublic]  whether to use `public` directive (default true)
 * @returns {import('express').RequestHandler}
 */
function cache(maxAge, isPublic = true) {
  return (_req, res, next) => {
    if (CACHE_ENABLED && maxAge > 0) {
      const directive = isPublic ? 'public' : 'private';
      res.setHeader('Cache-Control', `${directive}, max-age=${maxAge}, stale-while-revalidate=${Math.floor(maxAge / 2)}`);
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  };
}

/**
 * Disable caching entirely (for mutation endpoints).
 */
function noCache(_req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
}

// Pre-built cache middlewares for each endpoint tier
const cacheQuotes  = cache(60);       // 1 minute
const cacheChart   = cache(300);      // 5 minutes
const cacheNews    = cache(180);      // 3 minutes
const cachePredict = cache(3600);     // 1 hour
const cacheEli5    = cache(86400);    // 24 hours

module.exports = { cache, noCache, cacheQuotes, cacheChart, cacheNews, cachePredict, cacheEli5 };
