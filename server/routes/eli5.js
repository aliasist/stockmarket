/**
 * routes/eli5.js
 * GET /api/eli5/:term — ELI5 explanation for a financial/economic term
 *
 * This endpoint WORKS in production — it's the reference implementation
 * that proves the Gemini API key is valid and @google/generative-ai works.
 * All other AI endpoints (predict, vectors) now use the SAME Gemini pattern.
 *
 * Behavior:
 *   1. Check the eli5_cache table for an existing explanation (case-insensitive)
 *   2. If found, return the cached result
 *   3. If not found, call Gemini via explainTerm() and cache the result
 */

const express = require('express');
const router = express.Router();
const { explainTerm, isConfigured } = require('../gemini');
const { db_eli5 } = require('../db');

router.get('/:term', async (req, res) => {
  const { term } = req.params;

  if (!term || term.trim().length === 0) {
    return res.status(400).json({ message: 'Term is required.' });
  }

  if (!isConfigured()) {
    return res.status(503).json({
      message: 'ELI5 requires a valid Gemini API key (GEMINI_API_KEY env var).',
    });
  }

  const cleanTerm = term.trim().toLowerCase().replace(/[^a-z0-9\s\-_]/g, '').slice(0, 100);

  try {
    // 1. Check cache
    const cached = db_eli5.get(cleanTerm);
    if (cached) {
      console.log(`[eli5] Cache hit for "${cleanTerm}"`);
      return res.json(cached);
    }

    // 2. Call Gemini (same pattern used by predict and vectors)
    console.log(`[eli5] Calling Gemini for "${cleanTerm}"...`);
    const explanation = await explainTerm(cleanTerm);

    // 3. Cache the result
    const result = db_eli5.set(cleanTerm, explanation);
    const saved = db_eli5.get(cleanTerm);

    res.json(saved);
  } catch (err) {
    console.error(`[eli5] GET /api/eli5/${term} error:`, err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
