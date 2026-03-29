/**
 * gemini.js — Unified Google Gemini AI integration
 *
 * CRITICAL BUG FIX NOTE:
 * All three AI features (ELI5, predict, vectors) use the EXACT same
 * initialization and call pattern. There is ONE shared model instance.
 * Never create separate GoogleGenerativeAI instances per endpoint.
 *
 * Bug root cause (predict + vectors): those endpoints were likely creating
 * a new GoogleGenerativeAI instance inside the route handler after checking
 * for the API key differently, and the model.generateContent() call was
 * wrapped in a try/catch that swallowed errors and returned the fallback.
 * Now all helpers call generateText() which centralizes error handling with
 * full stack logging.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Shared singleton ──────────────────────────────────────────────────────────

let _genAI = null;
let _model = null;

function getModel() {
  if (_model) return _model;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  // Initialize once, reuse everywhere
  _genAI = new GoogleGenerativeAI(apiKey);
  _model = _genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  console.log('[gemini] Model initialized: gemini-1.5-flash');
  return _model;
}

// ─── Core text generation helper ──────────────────────────────────────────────

/**
 * Call Gemini with a text prompt and return the plain-text response.
 * Throws on failure so callers can decide how to handle it.
 *
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function generateText(prompt) {
  const model = getModel(); // will throw if API key missing
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return text.trim();
}

// ─── ELI5 ─────────────────────────────────────────────────────────────────────

/**
 * Generate an ELI5 explanation for a financial/economic term.
 * @param {string} term
 * @returns {Promise<string>}
 */
async function explainTerm(term) {
  const prompt = `
You are a friendly financial educator. Explain the term "${term}" as if talking to a curious 10-year-old.
Use a simple analogy, keep it under 120 words, and make it fun and relatable.
Do not use jargon. Return only the explanation text — no labels, no markdown.
  `.trim();

  return generateText(prompt);
}

// ─── Predict ──────────────────────────────────────────────────────────────────

/**
 * Generate a 24-hour market prediction for a ticker.
 *
 * BUG FIX: Previously this used a different Gemini initialization path or
 * had the API key check wrapped around the entire call, causing it to return
 * the fallback even when the key was valid. Now uses the shared getModel().
 *
 * @param {string} ticker
 * @param {object} quoteData — optional live quote snapshot
 * @param {string[]} recentHeadlines — optional recent news headlines
 * @returns {Promise<{prediction: string, confidence: number, reasoning: string, timeframe: string}>}
 */
async function predictTicker(ticker, quoteData = null, recentHeadlines = []) {
  const quoteSection = quoteData
    ? `
Current price data for ${ticker}:
- Price: $${quoteData.price}
- Change: ${quoteData.change} (${quoteData.changePercent}%)
- Volume: ${quoteData.volume?.toLocaleString()}
- 52-week high: $${quoteData.high52w}
- 52-week low: $${quoteData.low52w}
- Previous close: $${quoteData.previousClose}
    `.trim()
    : `No live quote data available for ${ticker}.`;

  const headlinesSection =
    recentHeadlines.length > 0
      ? `Recent news headlines:\n${recentHeadlines.slice(0, 10).map((h, i) => `${i + 1}. ${h}`).join('\n')}`
      : 'No recent news headlines available.';

  const prompt = `
You are a quantitative market analyst AI. Based on the data below, provide a short-term (24-hour) directional prediction for ${ticker}.

${quoteSection}

${headlinesSection}

Respond ONLY with a valid JSON object in this exact format (no markdown, no code fences):
{
  "prediction": "bullish" | "bearish" | "neutral",
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<2-3 concise sentences explaining the call>",
  "timeframe": "24h"
}
  `.trim();

  let rawText;
  try {
    rawText = await generateText(prompt);
    console.log(`[gemini] predict/${ticker} raw response (first 300 chars):`, rawText.slice(0, 300));
  } catch (err) {
    console.error(`[gemini] predict/${ticker} generateText failed:`, err);
    throw err; // re-throw — route handler will return proper error
  }

  // Strip any accidental markdown fences the model might include
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    // Validate required fields
    if (!['bullish', 'bearish', 'neutral'].includes(parsed.prediction)) {
      throw new Error(`Invalid prediction value: ${parsed.prediction}`);
    }
    parsed.confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5));
    parsed.timeframe = '24h';
    return parsed;
  } catch (parseErr) {
    console.error('[gemini] predict JSON parse error:', parseErr.message);
    console.error('[gemini] predict raw response was:', rawText);
    throw new Error(`Gemini returned unparseable response: ${parseErr.message}`);
  }
}

// ─── Tone classification ───────────────────────────────────────────────────────

// Bullish keyword patterns (raise sentiment score)
const BULLISH_KEYWORDS = [
  'surge', 'rally', 'soar', 'breakout', 'beat', 'record', 'growth', 'profit',
  'upgrade', 'buy', 'outperform', 'bullish', 'gain', 'rise', 'jump', 'strong',
  'earnings beat', 'revenue growth', 'expansion', 'acquisition', 'partnership',
  'innovation', 'launch', 'approval', 'dividend', 'buyback', 'upside',
];

// Bearish keyword patterns (lower sentiment score)
const BEARISH_KEYWORDS = [
  'crash', 'collapse', 'plunge', 'drop', 'fall', 'decline', 'loss', 'miss',
  'downgrade', 'sell', 'underperform', 'bearish', 'recession', 'layoff', 'cut',
  'warning', 'risk', 'fear', 'panic', 'crisis', 'debt', 'default', 'fraud',
  'investigation', 'lawsuit', 'fine', 'penalty', 'downside', 'concern',
];

// High-impact headline patterns (amplify score deviation from 0.5)
const HIGH_IMPACT_PATTERNS = [
  /breaking/i, /earnings/i, /fed\s+rate/i, /interest\s+rate/i, /inflation/i,
  /gdp/i, /jobs\s+report/i, /cpi/i, /fomc/i, /sec\s+charges/i, /bankruptcy/i,
];

/**
 * Compute a heuristic sentiment score from title + summary text.
 * Returns a float 0.0–1.0 (0 = very bearish, 0.5 = neutral, 1.0 = very bullish).
 */
function computeHeuristicSentimentScore(title, summary = '') {
  const text = `${title} ${summary}`.toLowerCase();
  let score = 0.5;

  for (const kw of BULLISH_KEYWORDS) {
    if (text.includes(kw)) score += 0.04;
  }
  for (const kw of BEARISH_KEYWORDS) {
    if (text.includes(kw)) score -= 0.04;
  }

  // Amplify if high-impact headline
  const isHighImpact = HIGH_IMPACT_PATTERNS.some((p) => p.test(title));
  if (isHighImpact) {
    // Pull score further from neutral
    score = 0.5 + (score - 0.5) * 1.4;
  }

  return Math.min(1.0, Math.max(0.0, parseFloat(score.toFixed(3))));
}

/**
 * Classify the tone of a news article.
 * @param {string} title
 * @param {string} summary
 * @returns {Promise<'fear_mongering'|'speculative'|'data_backed'|'neutral'>}
 */
async function classifyTone(title, summary = '') {
  const content = summary ? `Title: ${title}\nSummary: ${summary}` : `Title: ${title}`;
  const prompt = `
Classify the tone of this financial news article into exactly one of these categories:
- fear_mongering: sensationalist, alarming, designed to create panic
- speculative: opinion-heavy, prediction-based, lacks hard data
- data_backed: factual, cites numbers/reports, objective
- neutral: balanced or informational without strong bias

${content}

Respond with ONLY the category name — nothing else.
  `.trim();

  try {
    const result = await generateText(prompt);
    const tone = result.toLowerCase().trim().replace(/[^a-z_]/g, '');
    const valid = ['fear_mongering', 'speculative', 'data_backed', 'neutral'];
    return valid.includes(tone) ? tone : 'neutral';
  } catch (err) {
    console.warn('[gemini] classifyTone failed, defaulting to neutral:', err.message);
    return 'neutral';
  }
}

/**
 * Enhanced tone classification that also returns a 0–1 sentiment score.
 * Uses Gemini when available; falls back to heuristic keyword scoring.
 *
 * @param {string} title
 * @param {string} [summary]
 * @returns {Promise<{tone: string, sentiment_score: number}>}
 */
async function classifyToneWithScore(title, summary = '') {
  const content = summary ? `Title: ${title}\nSummary: ${summary}` : `Title: ${title}`;
  const prompt = `
You are a financial news sentiment analyst. Analyze this article and respond with JSON only (no markdown):
{
  "tone": "<fear_mongering|speculative|data_backed|neutral>",
  "sentiment_score": <float 0.0-1.0 where 0=very bearish, 0.5=neutral, 1.0=very bullish>,
  "impact": "<breaking|earnings|regulatory|routine>"
}

Rules for sentiment_score:
- 0.0–0.2: Severe negative (crash, bankruptcy, fraud, major loss)
- 0.2–0.4: Moderately negative (decline, miss, downgrade, layoffs)
- 0.4–0.6: Neutral (informational, mixed signals)
- 0.6–0.8: Moderately positive (growth, beat, upgrade, partnership)
- 0.8–1.0: Strongly positive (record high, major breakthrough, massive rally)

${content}
  `.trim();

  try {
    const raw = await generateText(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const valid = ['fear_mongering', 'speculative', 'data_backed', 'neutral'];
    const tone = valid.includes(parsed.tone) ? parsed.tone : 'neutral';
    const sentiment_score = Math.min(1.0, Math.max(0.0, Number(parsed.sentiment_score) || 0.5));
    return { tone, sentiment_score };
  } catch (err) {
    console.warn('[gemini] classifyToneWithScore failed, using heuristic:', err.message);
    // Fallback: heuristic keyword scoring
    const tone = await classifyTone(title, summary).catch(() => 'neutral');
    const sentiment_score = computeHeuristicSentimentScore(title, summary);
    return { tone, sentiment_score };
  }
}

// ─── Market vector generation ──────────────────────────────────────────────────

/**
 * Generate a market vector (directional signal) from a batch of article summaries.
 *
 * BUG FIX: Previously this used a different Gemini initialization or had a
 * broad try/catch that returned the fallback object on any error without logging.
 * Now uses the shared getModel() and logs errors before re-throwing.
 *
 * @param {Array<{title: string, source: string, tone: string}>} articles
 * @param {string|null} ticker — optional specific ticker context
 * @returns {Promise<{signal: string, confidence: number, reasoning: string, sources: string[]}>}
 */
async function generateVector(articles, ticker = null) {
  if (!articles || articles.length === 0) {
    throw new Error('No articles provided for vector generation.');
  }

  const articleList = articles
    .slice(0, 20)
    .map((a, i) => `${i + 1}. [${a.source}] [${a.tone}] ${a.title}`)
    .join('\n');

  const tickerContext = ticker ? `Focus specifically on signals relevant to ${ticker}.` : 'Generate a broad market signal.';

  const prompt = `
You are a quantitative signal generator. Analyze the following news articles and generate a market sentiment vector.

${tickerContext}

Articles:
${articleList}

Respond ONLY with a valid JSON object (no markdown, no code fences):
{
  "signal": "bullish" | "bearish" | "neutral",
  "confidence": <number between 0.0 and 1.0>,
  "reasoning": "<2-3 sentences summarizing the dominant market narrative>",
  "sources": ["<source1>", "<source2>"]
}
  `.trim();

  let rawText;
  try {
    rawText = await generateText(prompt);
    console.log('[gemini] generateVector raw response (first 300 chars):', rawText.slice(0, 300));
  } catch (err) {
    console.error('[gemini] generateVector generateText failed:', err);
    throw err; // re-throw — caller logs and stores fallback
  }

  const cleaned = rawText.replace(/```json|```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!['bullish', 'bearish', 'neutral'].includes(parsed.signal)) {
      throw new Error(`Invalid signal value: ${parsed.signal}`);
    }
    parsed.confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5));
    parsed.sources = Array.isArray(parsed.sources) ? parsed.sources : [];
    return parsed;
  } catch (parseErr) {
    console.error('[gemini] generateVector JSON parse error:', parseErr.message);
    console.error('[gemini] generateVector raw response was:', rawText);
    throw new Error(`Gemini returned unparseable response: ${parseErr.message}`);
  }
}

// ─── Health check ──────────────────────────────────────────────────────────────

function isConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

module.exports = {
  generateText,
  explainTerm,
  predictTicker,
  classifyTone,
  classifyToneWithScore,
  computeHeuristicSentimentScore,
  generateVector,
  isConfigured,
};
