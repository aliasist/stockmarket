/**
 * scraper.js — News scraping engine for Market Pulse & Pedagogy
 *
 * Sources:
 * 1. hackernews    — Hacker News top stories via official Firebase API
 * 2. reddit_quant  — r/quant hot posts via public JSON API
 * 3. reddit_investing — r/investing hot posts via public JSON API
 * 4. bluesky       — BlueSky public feed via AT Protocol API
 * 5. yahoo_finance — Yahoo Finance news via yahoo-finance2 package
 *
 * Each run:
 *   1. Fetches articles from all 5 sources in parallel
 *   2. Classifies each article's tone with Gemini (fear_mongering, speculative, data_backed, neutral)
 *   3. Generates 1+ market vectors from the classified articles
 *   4. Stores everything in SQLite
 */

const { db_scrub, db_articles, db_vectors } = require('./db');
const { classifyTone, generateVector, classifyToneWithScore } = require('./gemini');

// Use native fetch (Node 18+) or fall back to node-fetch
const fetchImpl =
  typeof fetch !== 'undefined'
    ? fetch
    : (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const USER_AGENT =
  'Mozilla/5.0 (compatible; MarketPulseScraper/1.0; +https://github.com/market-pulse)';

// ─── Individual source scrapers ────────────────────────────────────────────────

/**
 * Hacker News — uses official Firebase REST API.
 * Fetches top 30 story IDs, then fetches each story's metadata.
 */
async function scrapeHackerNews(limit = 15) {
  try {
    const idsRes = await fetchImpl(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) }
    );
    if (!idsRes.ok) throw new Error(`HN topstories HTTP ${idsRes.status}`);
    const allIds = await idsRes.json();
    const ids = allIds.slice(0, limit);

    const stories = await Promise.allSettled(
      ids.map(async (id) => {
        const res = await fetchImpl(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(5000) }
        );
        return res.json();
      })
    );

    const articles = [];
    for (const result of stories) {
      if (result.status === 'fulfilled' && result.value && result.value.title) {
        const story = result.value;
        // Filter to finance/market-related stories
        const title = story.title || '';
        const url = story.url || `https://news.ycombinator.com/item?id=${story.id}`;
        articles.push({
          title,
          url,
          source: 'hackernews',
          summary: story.text ? story.text.replace(/<[^>]+>/g, '').slice(0, 500) : null,
          publishedAt: story.time ? new Date(story.time * 1000).toISOString() : null,
        });
      }
    }

    console.log(`[scraper] HackerNews: fetched ${articles.length} articles`);
    return articles;
  } catch (err) {
    console.error('[scraper] HackerNews error:', err.message);
    return [];
  }
}

/**
 * Reddit — uses public .json API (no auth required).
 * @param {string} subreddit
 * @param {string} sourceKey
 */
async function scrapeReddit(subreddit, sourceKey, limit = 15) {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
    const res = await fetchImpl(url, {
      headers: {
        'User-Agent': `${USER_AGENT} (Reddit scraper)`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Reddit HTTP ${res.status} for r/${subreddit}`);
    const data = await res.json();

    const posts = data?.data?.children || [];
    const articles = posts
      .filter((p) => p.kind === 't3' && p.data?.title)
      .map((p) => {
        const post = p.data;
        return {
          title: post.title,
          url: post.url || `https://reddit.com${post.permalink}`,
          source: sourceKey,
          summary: post.selftext ? post.selftext.slice(0, 500) : null,
          publishedAt: post.created_utc
            ? new Date(post.created_utc * 1000).toISOString()
            : null,
        };
      });

    console.log(`[scraper] Reddit r/${subreddit}: fetched ${articles.length} articles`);
    return articles;
  } catch (err) {
    console.error(`[scraper] Reddit r/${subreddit} error:`, err.message);
    return [];
  }
}

/**
 * BlueSky — uses the public AT Protocol search API.
 * Queries for finance/market-related posts.
 */
async function scrapeBluesky(limit = 10) {
  try {
    // Use the public Bluesky feed search API (no auth required)
    const queries = ['stock market', 'investing', 'finance'];
    const allArticles = [];

    for (const q of queries) {
      const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(q)}&limit=10&sort=latest`;
      const res = await fetchImpl(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        console.warn(`[scraper] BlueSky search "${q}" HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const posts = data?.posts || [];
      for (const post of posts.slice(0, 5)) {
        const text = post?.record?.text || '';
        if (text.length < 20) continue;
        allArticles.push({
          title: text.slice(0, 200),
          url: post?.uri
            ? `https://bsky.app/profile/${post.author?.handle}/post/${post.uri.split('/').pop()}`
            : 'https://bsky.app',
          source: 'bluesky',
          summary: text.slice(0, 500),
          publishedAt: post?.record?.createdAt || null,
        });
      }
    }

    // Deduplicate by title
    const seen = new Set();
    const deduped = allArticles.filter((a) => {
      if (seen.has(a.title)) return false;
      seen.add(a.title);
      return true;
    });

    const result = deduped.slice(0, limit);
    console.log(`[scraper] BlueSky: fetched ${result.length} posts`);
    return result;
  } catch (err) {
    console.error('[scraper] BlueSky error:', err.message);
    return [];
  }
}

/**
 * Yahoo Finance — uses yahoo-finance2 search to get recent market news.
 * Queries for SPY, QQQ, BTC-USD, AAPL to get broad market news.
 */
async function scrapeYahooFinance(limit = 10) {
  try {
    // Dynamically require to avoid startup errors if package missing
    const yahooFinance = require('yahoo-finance2').default;

    const tickers = ['SPY', 'AAPL', 'BTC-USD', 'NVDA'];
    const allArticles = [];

    for (const ticker of tickers) {
      try {
        const results = await yahooFinance.search(ticker, {
          newsCount: 5,
          quotesCount: 0,
        });
        const news = results?.news || [];
        for (const item of news) {
          allArticles.push({
            title: item.title || 'Untitled',
            url: item.link || null,
            source: 'yahoo_finance',
            summary: item.summary || null,
            publishedAt: item.providerPublishTime
              ? new Date(item.providerPublishTime * 1000).toISOString()
              : null,
          });
        }
      } catch (tickerErr) {
        console.warn(`[scraper] Yahoo Finance search for ${ticker}:`, tickerErr.message);
      }
    }

    // Deduplicate by URL
    const seen = new Set();
    const deduped = allArticles.filter((a) => {
      const key = a.url || a.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const result = deduped.slice(0, limit);
    console.log(`[scraper] Yahoo Finance: fetched ${result.length} articles`);
    return result;
  } catch (err) {
    console.error('[scraper] Yahoo Finance error:', err.message);
    return [];
  }
}

// ─── Tone classification (batch with rate limiting) ────────────────────────────

/**
 * Classify tones and compute sentiment scores for a batch of articles.
 * Processes in small batches to avoid overwhelming Gemini.
 * sentiment_score: 0.0 = very bearish/negative, 1.0 = very bullish/positive, 0.5 = neutral
 */
async function classifyArticles(articles) {
  const BATCH_SIZE = 5;
  const results = [];

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const classified = await Promise.allSettled(
      batch.map(async (article) => {
        try {
          // Use enhanced classification with sentiment score when available
          if (typeof classifyToneWithScore === 'function') {
            const { tone, sentiment_score } = await classifyToneWithScore(article.title, article.summary);
            return { ...article, tone, sentiment_score };
          }
          const tone = await classifyTone(article.title, article.summary);
          return { ...article, tone, sentiment_score: toneToScore(tone) };
        } catch {
          return { ...article, tone: 'neutral', sentiment_score: 0.5 };
        }
      })
    );
    for (const r of classified) {
      results.push(
        r.status === 'fulfilled' ? r.value : { ...batch[results.length % BATCH_SIZE], tone: 'neutral', sentiment_score: 0.5 }
      );
    }
    // Small delay between batches
    if (i + BATCH_SIZE < articles.length) {
      await new Promise((res) => setTimeout(res, 500));
    }
  }
  return results;
}

/**
 * Map a tone label to a default sentiment score.
 * fear_mongering → 0.1 (very negative), speculative → 0.4, neutral → 0.5, data_backed → 0.65
 */
function toneToScore(tone) {
  const map = {
    fear_mongering: 0.1,
    speculative: 0.4,
    neutral: 0.5,
    data_backed: 0.65,
  };
  return map[tone] ?? 0.5;
}

// ─── Main scrub runner ─────────────────────────────────────────────────────────

/**
 * Run a full scrub cycle:
 * 1. Scrape all 5 sources
 * 2. Classify article tones
 * 3. Generate market vectors
 * 4. Persist to DB
 *
 * @returns {Promise<{runId: number, articleCount: number, vectorCount: number, summary: string}>}
 */
async function runScrub() {
  const runRow = db_scrub.createRun();
  const runId = runRow.lastInsertRowid;
  console.log(`[scraper] Starting scrub run #${runId}`);

  const sources = ['hackernews', 'reddit_quant', 'reddit_investing', 'bluesky', 'yahoo_finance'];

  try {
    // 1. Scrape all sources in parallel
    const [hn, rq, ri, bsky, yf] = await Promise.all([
      scrapeHackerNews(15),
      scrapeReddit('quant', 'reddit_quant', 10),
      scrapeReddit('investing', 'reddit_investing', 10),
      scrapeBluesky(10),
      scrapeYahooFinance(10),
    ]);

    const rawArticles = [...hn, ...rq, ...ri, ...bsky, ...yf];
    console.log(`[scraper] Scraped ${rawArticles.length} articles from ${sources.length} sources`);

    // 2. Classify tones
    let classifiedArticles;
    try {
      classifiedArticles = await classifyArticles(rawArticles);
      console.log('[scraper] Tone classification complete');
    } catch (classErr) {
      console.error('[scraper] Tone classification error:', classErr.message);
      classifiedArticles = rawArticles.map((a) => ({ ...a, tone: 'neutral' }));
    }

    // 3. Persist articles
    const articlesForDB = classifiedArticles.map((a) => ({
      scrubRunId: runId,
      title: a.title,
      url: a.url || null,
      source: a.source,
      summary: a.summary || null,
      tone: a.tone || 'neutral',
      sentiment_score: typeof a.sentiment_score === 'number' ? a.sentiment_score : 0.5,
      publishedAt: a.publishedAt || null,
    }));
    db_articles.insertMany(articlesForDB);

    // 4. Generate market vectors from classified articles
    let vectorCount = 0;
    try {
      if (classifiedArticles.length > 0) {
        const vectorData = await generateVector(classifiedArticles, null);
        db_vectors.insert({
          scrubRunId: runId,
          ticker: null,
          signal: vectorData.signal,
          confidence: vectorData.confidence,
          reasoning: vectorData.reasoning,
          sources: vectorData.sources || sources,
        });
        vectorCount = 1;
        console.log(`[scraper] Generated market vector: ${vectorData.signal} (${vectorData.confidence})`);
      }
    } catch (vectorErr) {
      console.error('[scraper] Vector generation failed:', vectorErr.message);
      // Store a fallback vector so the run record isn't empty
      db_vectors.insert({
        scrubRunId: runId,
        ticker: null,
        signal: 'neutral',
        confidence: 0.5,
        reasoning: 'Vector generation failed during this scrub run. Check Gemini API.',
        sources: sources,
      });
      vectorCount = 1;
    }

    // 5. Update the run record as done
    const summary = `Scraped ${rawArticles.length} articles from ${sources.length} sources. Generated ${vectorCount} market vectors.`;
    db_scrub.updateRun(runId, {
      vectorsFound: vectorCount,
      status: 'done',
      summary,
      sources,
    });

    console.log(`[scraper] Scrub run #${runId} complete: ${summary}`);
    return { runId, articleCount: rawArticles.length, vectorCount, summary };
  } catch (err) {
    console.error(`[scraper] Scrub run #${runId} failed:`, err);
    db_scrub.updateRun(runId, {
      vectorsFound: 0,
      status: 'error',
      summary: `Scrub run failed: ${err.message}`,
      sources,
    });
    throw err;
  }
}

module.exports = { runScrub };
