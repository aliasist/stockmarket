/**
 * routes/sentiment.js
 *
 * GET /api/news/sentiment-correlation/:ticker
 *   Returns sentiment score history vs price movement correlation for a ticker.
 *   Useful for validating whether news sentiment predicts price direction.
 */

'use strict';

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const yahooFinance = require('yahoo-finance2').default;

/**
 * GET /api/news/sentiment-correlation/:ticker
 *
 * Returns:
 *   - avg_sentiment_score: average sentiment score for articles mentioning this ticker
 *   - article_count: number of articles analyzed
 *   - current_price: latest price from Yahoo Finance
 *   - price_change_pct: 5-day price change %
 *   - correlation_signal: 'aligned' | 'divergent' | 'insufficient_data'
 *   - articles: recent articles with sentiment scores
 */
router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  try {
    // Fetch recent articles mentioning this ticker (last 7 days)
    const articles = db
      .prepare(
        `SELECT title, source, tone, sentiment_score, scrapedAt
         FROM articles
         WHERE (
           title LIKE ? OR
           title LIKE ? OR
           title LIKE ?
         )
         AND scrapedAt >= datetime('now', '-7 days')
         ORDER BY scrapedAt DESC
         LIMIT 50`
      )
      .all(`%${ticker}%`, `%${ticker.toLowerCase()}%`, `%${ticker.replace('-', '/')}%`);

    if (articles.length === 0) {
      return res.json({
        ticker,
        avg_sentiment_score: null,
        article_count: 0,
        correlation_signal: 'insufficient_data',
        message: `No recent articles found mentioning ${ticker}.`,
        articles: [],
      });
    }

    const avgSentiment =
      articles.reduce((sum, a) => sum + (a.sentiment_score ?? 0.5), 0) / articles.length;

    // Fetch current price data
    let priceData = null;
    try {
      const q = await yahooFinance.quote(ticker);
      priceData = {
        current_price: q.regularMarketPrice,
        price_change_pct: q.regularMarketChangePercent,
        previous_close: q.regularMarketPreviousClose,
      };
    } catch {
      // Price data optional
    }

    // Determine correlation signal
    let correlation_signal = 'insufficient_data';
    if (priceData && articles.length >= 3) {
      const sentimentBullish = avgSentiment > 0.55;
      const sentimentBearish = avgSentiment < 0.45;
      const priceBullish = (priceData.price_change_pct || 0) > 0.5;
      const priceBearish = (priceData.price_change_pct || 0) < -0.5;

      if ((sentimentBullish && priceBullish) || (sentimentBearish && priceBearish)) {
        correlation_signal = 'aligned';
      } else if ((sentimentBullish && priceBearish) || (sentimentBearish && priceBullish)) {
        correlation_signal = 'divergent';
      } else {
        correlation_signal = 'neutral';
      }
    }

    res.json({
      ticker,
      avg_sentiment_score: parseFloat(avgSentiment.toFixed(3)),
      article_count: articles.length,
      correlation_signal,
      price_data: priceData,
      articles: articles.slice(0, 20).map((a) => ({
        title: a.title,
        source: a.source,
        tone: a.tone,
        sentiment_score: a.sentiment_score,
        scraped_at: a.scrapedAt,
      })),
    });
  } catch (err) {
    console.error(`[sentiment] GET /api/news/sentiment-correlation/${ticker} error:`, err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
