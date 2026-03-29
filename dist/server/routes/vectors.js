/**
 * routes/vectors.js
 * GET /api/vectors — Returns stored market vectors
 * POST /api/vectors/generate — On-demand vector generation (optional)
 *
 * BUG FIX #3: Vectors always returned neutral/0.5 fallback.
 *
 * Root cause: generateVector() in the original code was likely:
 *   1. Creating a new GoogleGenerativeAI instance inside the function (with
 *      a separate API key check that differed from ELI5), OR
 *   2. Catching all errors silently and returning the fallback object without
 *      any logging, making the bug invisible in production logs.
 *
 * Fix: The vector generation now uses gemini.generateVector() which calls
 * the shared getModel() singleton (same path as ELI5). Errors are logged
 * and re-thrown so the scrub runner can record them properly.
 */
const express = require('express');
const router = express.Router();
const { db_vectors, db_articles } = require('../db');
const { generateVector } = require('../gemini');
/**
 * GET /api/vectors
 * Returns the latest stored market vectors.
 */
router.get('/', (req, res) => {
    try {
        const vectors = db_vectors.getAll();
        res.json(vectors);
    }
    catch (err) {
        console.error('[vectors] GET /api/vectors error:', err);
        res.status(500).json({ message: err.message });
    }
});
/**
 * GET /api/vectors/latest
 * Returns only the most recent 10 vectors.
 */
router.get('/latest', (req, res) => {
    try {
        const vectors = db_vectors.getLatest();
        res.json(vectors);
    }
    catch (err) {
        console.error('[vectors] GET /api/vectors/latest error:', err);
        res.status(500).json({ message: err.message });
    }
});
/**
 * POST /api/vectors/generate
 * Triggers on-demand vector generation from the latest articles.
 * Uses the same Gemini path as ELI5 (shared getModel() singleton).
 */
router.post('/generate', async (req, res) => {
    try {
        const articles = db_articles.getLatest(50);
        if (articles.length === 0) {
            return res.status(400).json({ message: 'No articles available. Run a scrub first.' });
        }
        // BUG FIX: generateVector uses the shared Gemini singleton — same path as ELI5.
        // No separate API key check, no swallowed errors.
        const vectorData = await generateVector(articles, null);
        // Persist to DB (no scrubRunId since this is standalone)
        db_vectors.insert({
            scrubRunId: null,
            ticker: null,
            signal: vectorData.signal,
            confidence: vectorData.confidence,
            reasoning: vectorData.reasoning,
            sources: vectorData.sources || [],
        });
        const saved = db_vectors.getLatest()[0];
        res.json(saved);
    }
    catch (err) {
        console.error('[vectors] POST /api/vectors/generate error:', err);
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;
