/**
 * routes/predict.js
 * GET /api/predict/:ticker — AI-powered 24h directional prediction
 *
 * BUG FIX #2: predict always returned the neutral fallback even with a valid API key.
 *
 * Root cause (likely one of these patterns in the original code):
 *
 *   Pattern A — API key check mismatch:
 *     if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'undefined') {
 *       return res.json(FALLBACK); // triggered incorrectly
 *     }
 *
 *   Pattern B — Separate Gemini instance with silent failure:
 *     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
 *     const model = genAI.getGenerativeModel({ model: 'gemini-pro' }); // wrong model name
 *     try {
 *       const result = await model.generateContent(prompt);
 *       ...
 *     } catch (e) {
 *       return res.json(FALLBACK); // swallowed — no log
 *     }
 *
 *   Pattern C — Wrong method name (e.g., .generate() instead of .generateContent())
 *
 * Fix: Use the shared gemini.predictTicker() which calls the same getModel()
 * singleton as ELI5. Errors are logged before the fallback is returned.
 */

const express = require('express');
const router = express.Router();
const { predictTicker, isConfigured } = require('../gemini');
const yahooFinance = require('yahoo-finance2').default;
const { db_articles } = require('../db');

/**
 * GET /api/predict/:ticker
 *
 * 1. Fetches live quote data for the ticker (for price context)
 * 2. Loads recent news headlines from the DB
 * 3. Calls Gemini via the shared predictTicker() helper
 * 4. Returns the prediction JSON
 */
router.get('/:ticker', async (req, res) => {
  // BUG FIX: req and res are properly scoped as arrow function parameters.
  const { ticker } = req.params;
  const upperTicker = ticker.toUpperCase();

  // Check Gemini configuration BEFORE doing expensive work
  if (!isConfigured()) {
    console.warn(`[predict] GEMINI_API_KEY not set — cannot predict ${upperTicker}`);
    return res.status(503).json({
      message: 'Predictive reasoning requires a valid Gemini API key.',
      prediction: 'neutral',
      confidence: 0.5,
      reasoning: 'Predictive reasoning requires a valid Gemini API key.',
      timeframe: '24h',
    });
  }

  try {
    // 1. Fetch live quote (optional context for Gemini — don't fail if unavailable)
    let quoteData = null;
    try {
      const q = await yahooFinance.quote(upperTicker);
      quoteData = {
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
        volume: q.regularMarketVolume,
        high52w: q.fiftyTwoWeekHigh,
        low52w: q.fiftyTwoWeekLow,
        previousClose: q.regularMarketPreviousClose,
      };
    } catch (quoteErr) {
      console.warn(`[predict] Could not fetch quote for ${upperTicker}:`, quoteErr.message);
    }

    // 2. Load recent headlines from the DB for context
    const recentArticles = db_articles.getLatest(30);
    const headlines = recentArticles.map((a) => a.title);

    // 3. Call Gemini via the shared helper (same singleton as ELI5)
    //    BUG FIX: No try/catch here that silently returns fallback.
    //    If predictTicker throws, we log it and return a 500 with the error message.
    console.log(`[predict] Calling Gemini for ${upperTicker}...`);
    const prediction = await predictTicker(upperTicker, quoteData, headlines);
    console.log(`[predict] ${upperTicker} result:`, prediction);

    res.json(prediction);
  } catch (err) {
    // Log the FULL error so we can see what actually went wrong
    console.error(`[predict] GET /api/predict/${upperTicker} error:`, err);

    // Return a descriptive error response (not a silent fallback)
    res.status(500).json({
      message: `Prediction failed for ${upperTicker}: ${err.message}`,
      prediction: 'neutral',
      confidence: 0.5,
      reasoning: `Prediction error: ${err.message}`,
      timeframe: '24h',
    });
  }
});

module.exports = router;
