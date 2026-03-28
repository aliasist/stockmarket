/**
 * routes/scrub.js
 * GET  /api/scrub/latest  — Latest scrub run details
 * GET  /api/scrub/runs    — All scrub runs (last 50)
 * POST /api/scrub/trigger — Manually trigger a scrub run
 */

const express = require('express');
const router = express.Router();
const { db_scrub } = require('../db');
const { runScrub } = require('../scraper');

// Track if a scrub is already in progress to prevent concurrent runs
let scrubInProgress = false;

/**
 * GET /api/scrub/latest
 */
router.get('/latest', (req, res) => {
  try {
    const latest = db_scrub.getLatest();
    if (!latest) {
      return res.status(404).json({ message: 'No scrub runs found.' });
    }
    res.json(latest);
  } catch (err) {
    console.error('[scrub] GET /api/scrub/latest error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/scrub/runs
 */
router.get('/runs', (req, res) => {
  try {
    const runs = db_scrub.getAll();
    res.json(runs);
  } catch (err) {
    console.error('[scrub] GET /api/scrub/runs error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/scrub/trigger
 * Kicks off a scrub in the background (non-blocking) and returns immediately.
 */
router.post('/trigger', async (req, res) => {
  if (scrubInProgress) {
    return res.status(409).json({
      message: 'A scrub is already in progress. Please wait.',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    message: 'Scrub triggered',
    timestamp: new Date().toISOString(),
  });

  // Run in the background — don't await
  scrubInProgress = true;
  runScrub()
    .then((result) => {
      console.log('[scrub] Manual trigger complete:', result.summary);
    })
    .catch((err) => {
      console.error('[scrub] Manual trigger failed:', err.message);
    })
    .finally(() => {
      scrubInProgress = false;
    });
});

/**
 * Export the scrubInProgress flag setter so the cron scheduler can use it.
 */
router.setScrubInProgress = (val) => { scrubInProgress = val; };
router.isScrubInProgress = () => scrubInProgress;

module.exports = router;
