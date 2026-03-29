/**
 * routes/health.js
 * GET /api/health
 */
const express = require('express');
const router = express.Router();
const { isConfigured } = require('../gemini');
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        geminiConfigured: isConfigured(),
        cloudflareConfigured: !!process.env.CLOUDFLARE_API_TOKEN,
        timestamp: new Date().toISOString(),
    });
});
module.exports = router;
