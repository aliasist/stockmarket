/**
 * routes/news.js
 * GET /api/news?source=&tone=&limit=
 *
 * BUG FIX #1: "req is not defined" — variable scoping error.
 *
 * Root cause: In the original server, the route handler was likely written as:
 *
 *   router.get('/', function() {         // <-- no req/res params!
 *     const { source, tone } = req.query; // req is NOT in scope → ReferenceError
 *     ...
 *   });
 *
 * Or equivalently, the handler was an arrow function whose parameters were
 * accidentally omitted, or `req` was referenced in a nested callback that
 * captured `req` from an outer scope that didn't have it.
 *
 * Fix: The handler is a properly-scoped arrow function (req, res) => { ... }
 * and all query param reads happen inside that function body where req is
 * guaranteed to be in scope.
 */

const express = require('express');
const router = express.Router();
const { db_articles } = require('../db');

/**
 * GET /api/news
 * Query params:
 *   source — filter by source (hackernews, reddit_quant, reddit_investing, bluesky, yahoo_finance)
 *   tone   — filter by tone (fear_mongering, speculative, data_backed, neutral)
 *   limit  — max results (default 100)
 */
router.get('/', (req, res) => {
  // BUG FIX: req and res are properly scoped parameters of this arrow function.
  // All accesses to req.query happen INSIDE this function — never in an outer
  // or detached scope where req would be undefined.
  try {
    const { source, tone, limit: limitStr } = req.query;
    const limit = Math.min(parseInt(limitStr, 10) || 100, 500);

    let articles;

    if (source) {
      // Filter by specific source
      articles = db_articles.getLatestBySource(source, limit);
    } else {
      // Get latest across all sources
      articles = db_articles.getLatest(limit);
    }

    // Apply tone filter in JS (SQLite filter would also work but this is simpler)
    if (tone) {
      const validTones = ['fear_mongering', 'speculative', 'data_backed', 'neutral'];
      if (!validTones.includes(tone)) {
        return res.status(400).json({ message: `Invalid tone. Must be one of: ${validTones.join(', ')}` });
      }
      articles = articles.filter((a) => a.tone === tone);
    }

    res.json(articles);
  } catch (err) {
    console.error('[news] GET /api/news error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/news/stats
 * Returns tone distribution counts for the latest scrub run's articles.
 */
router.get('/stats', (req, res) => {
  try {
    const articles = db_articles.getLatest(500);
    const toneCounts = {
      fear_mongering: 0,
      speculative: 0,
      data_backed: 0,
      neutral: 0,
    };
    const sourceCounts = {};

    for (const article of articles) {
      if (article.tone in toneCounts) toneCounts[article.tone]++;
      sourceCounts[article.source] = (sourceCounts[article.source] || 0) + 1;
    }

    res.json({
      total: articles.length,
      byTone: toneCounts,
      bySource: sourceCounts,
    });
  } catch (err) {
    console.error('[news] GET /api/news/stats error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
