/**
 * routes/watchlist.js
 * GET    /api/watchlist     — Get all watchlist items
 * POST   /api/watchlist     — Add a ticker to the watchlist
 * DELETE /api/watchlist/:id — Remove a ticker from the watchlist
 */

const express = require('express');
const router = express.Router();
const { db_watchlist } = require('../db');

const VALID_TYPES = ['stock', 'etf', 'crypto'];

/**
 * GET /api/watchlist
 */
router.get('/', (req, res) => {
  try {
    const items = db_watchlist.getAll();
    res.json(items);
  } catch (err) {
    console.error('[watchlist] GET error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/watchlist
 * Body: { ticker: string, name: string, type: 'stock'|'etf'|'crypto' }
 */
router.post('/', (req, res) => {
  try {
    const { ticker, name, type } = req.body || {};

    if (!ticker || typeof ticker !== 'string') {
      return res.status(400).json({ message: 'ticker is required and must be a string.' });
    }
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'name is required and must be a string.' });
    }
    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const result = db_watchlist.add(
      ticker.toUpperCase().trim(),
      name.trim(),
      type || 'stock'
    );

    if (result.changes === 0) {
      return res.status(409).json({ message: `Ticker ${ticker.toUpperCase()} already in watchlist.` });
    }

    const items = db_watchlist.getAll();
    const added = items.find((i) => i.id === result.lastInsertRowid);
    res.status(201).json(added);
  } catch (err) {
    // SQLite UNIQUE constraint violation
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message?.includes('UNIQUE')) {
      return res.status(409).json({ message: `Ticker already in watchlist.` });
    }
    console.error('[watchlist] POST error:', err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE /api/watchlist/:id
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'id must be a number.' });
    }

    const result = db_watchlist.remove(id);
    if (result.changes === 0) {
      return res.status(404).json({ message: `Watchlist item ${id} not found.` });
    }

    res.json({ message: `Watchlist item ${id} deleted.` });
  } catch (err) {
    console.error('[watchlist] DELETE error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
