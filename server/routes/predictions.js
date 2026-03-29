/**
 * routes/predictions.js
 *
 * POST /api/predictions/log      — Record actual outcome for a prediction
 * GET  /api/predictions/accuracy — Return accuracy metrics (win rate, MAE, RMSE)
 * GET  /api/predictions/recent   — Recent prediction history
 *
 * The daily cron job in server/index.js calls resolvePendingPredictions()
 * to fetch actual prices 24h after predictions and compute accuracy scores.
 */

'use strict';

const express = require('express');
const router = express.Router();
const { db_predictions } = require('../db');
const yahooFinance = require('yahoo-finance2').default;

/**
 * POST /api/predictions/log
 * Body: { ticker, predicted_direction }
 * Records a new prediction for later accuracy tracking.
 */
router.post('/log', (req, res) => {
  try {
    const { ticker, predicted_direction } = req.body || {};

    if (!ticker || typeof ticker !== 'string') {
      return res.status(400).json({ message: 'ticker is required.' });
    }
    const validDirections = ['bullish', 'bearish', 'neutral'];
    if (!validDirections.includes(predicted_direction)) {
      return res.status(400).json({
        message: `predicted_direction must be one of: ${validDirections.join(', ')}`,
      });
    }

    const result = db_predictions.insert({
      ticker: ticker.toUpperCase().trim(),
      predicted_direction,
    });

    res.status(201).json({
      id: result.lastInsertRowid,
      ticker: ticker.toUpperCase().trim(),
      predicted_direction,
      predicted_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[predictions] POST /log error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/predictions/accuracy
 * Returns accuracy metrics per ticker and overall.
 * Metrics: win_rate (%), avg_accuracy, total predictions, resolved count.
 */
router.get('/accuracy', (req, res) => {
  try {
    const rows = db_predictions.getOverallAccuracy();

    const summary = rows.map((r) => ({
      ticker: r.ticker,
      total: r.total,
      resolved: r.resolved,
      win_rate: r.win_rate != null ? parseFloat((r.win_rate * 100).toFixed(1)) : null,
      avg_accuracy: r.avg_accuracy != null ? parseFloat(r.avg_accuracy.toFixed(3)) : null,
    }));

    // Aggregate overall stats
    const totalResolved = rows.reduce((s, r) => s + (r.resolved || 0), 0);
    const totalPredictions = rows.reduce((s, r) => s + (r.total || 0), 0);
    const overallWinRate =
      totalResolved > 0
        ? rows.reduce((s, r) => s + (r.win_rate || 0) * (r.resolved || 0), 0) / totalResolved
        : null;

    res.json({
      overall: {
        total: totalPredictions,
        resolved: totalResolved,
        win_rate: overallWinRate != null ? parseFloat((overallWinRate * 100).toFixed(1)) : null,
      },
      by_ticker: summary,
    });
  } catch (err) {
    console.error('[predictions] GET /accuracy error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/predictions/recent
 * Returns the most recent 50 prediction records.
 */
router.get('/recent', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const rows = db_predictions.getRecent(limit);
    res.json(rows);
  } catch (err) {
    console.error('[predictions] GET /recent error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * Resolve pending predictions by fetching actual prices from Yahoo Finance.
 * Called by the daily cron job in server/index.js.
 * @returns {Promise<{resolved: number, errors: number}>}
 */
async function resolvePendingPredictions() {
  const pending = db_predictions.getPending();
  if (pending.length === 0) {
    console.log('[predictions] No pending predictions to resolve.');
    return { resolved: 0, errors: 0 };
  }

  console.log(`[predictions] Resolving ${pending.length} pending predictions...`);
  let resolved = 0;
  let errors = 0;

  for (const pred of pending) {
    try {
      const q = await yahooFinance.quote(pred.ticker);
      const actualPrice = q.regularMarketPrice;
      if (!actualPrice) continue;

      // Determine actual direction based on price vs previous close
      const prevClose = q.regularMarketPreviousClose || actualPrice;
      const pctChange = ((actualPrice - prevClose) / prevClose) * 100;
      let actual_direction;
      if (pctChange > 0.5) actual_direction = 'bullish';
      else if (pctChange < -0.5) actual_direction = 'bearish';
      else actual_direction = 'neutral';

      // Accuracy score: 1.0 if direction matches, 0.5 if neutral vs directional, 0.0 if opposite
      let accuracy_score;
      if (pred.predicted_direction === actual_direction) {
        accuracy_score = 1.0;
      } else if (pred.predicted_direction === 'neutral' || actual_direction === 'neutral') {
        accuracy_score = 0.5;
      } else {
        accuracy_score = 0.0;
      }

      db_predictions.updateOutcome(pred.id, {
        actual_price_at_24h: actualPrice,
        actual_direction,
        accuracy_score,
      });

      resolved++;
      console.log(
        `[predictions] Resolved #${pred.id} ${pred.ticker}: predicted=${pred.predicted_direction}, actual=${actual_direction}, score=${accuracy_score}`
      );
    } catch (err) {
      console.error(`[predictions] Failed to resolve #${pred.id} ${pred.ticker}:`, err.message);
      errors++;
    }
  }

  console.log(`[predictions] Resolution complete: ${resolved} resolved, ${errors} errors.`);
  return { resolved, errors };
}

router.resolvePendingPredictions = resolvePendingPredictions;
module.exports = router;
