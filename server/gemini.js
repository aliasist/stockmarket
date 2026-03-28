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
  generateVector,
  isConfigured,
};
