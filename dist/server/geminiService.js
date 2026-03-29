/**
 * Gemini AI Service
 * - News tone analysis
 * - Market vector generation
 * - ELI5 explanations
 * - Predictive reasoning
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
function getModel(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}
// ── News Analysis ────────────────────────────────────────────────────────────
export async function analyzeNewsWithGemini(articles, apiKey) {
    const model = getModel(apiKey);
    // Process in batches of 10 to avoid token limits
    const batchSize = 10;
    const results = [];
    for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);
        const prompt = `You are a financial journalism analyst. Analyze these news articles and for each one provide:
1. tone: one of "fear_mongering", "speculative", "data_backed", or "neutral"
2. toneReasoning: one sentence explaining why
3. ticker: relevant stock/crypto ticker if mentioned (e.g. "AAPL", "BTC-USD"), or null
4. summary: one sentence summary of the key point

Articles:
${batch.map((a, idx) => `[${idx}] Title: ${a.title}\nSource: ${a.source}\nSnippet: ${a.snippet || "N/A"}`).join("\n\n")}

Respond with a JSON array of objects with keys: tone, toneReasoning, ticker, summary
ONLY return valid JSON, no markdown.`;
        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleaned);
            batch.forEach((a, idx) => {
                results.push({ ...a, ...parsed[idx] });
            });
        }
        catch {
            // Fallback: return articles unmodified
            batch.forEach((a) => results.push({ ...a, tone: "neutral" }));
        }
    }
    return results;
}
// ── Market Vector Generation ─────────────────────────────────────────────────
export async function generateMarketVectors(articles, apiKey) {
    const model = getModel(apiKey);
    const prompt = `You are a quantitative market analyst. Based on these ${articles.length} recent news articles and social media posts, identify 3-5 "Logical Market Vectors" — cross-referenced signals that suggest directional pressure on assets.

Headlines:
${articles.slice(0, 30).map((a) => `- [${a.source}] ${a.title} (tone: ${a.tone || "unknown"})`).join("\n")}

For each vector, provide:
- ticker: specific ticker (e.g. "SPY", "NVDA", "BTC-USD") or null for macro
- signal: "bullish", "bearish", or "neutral"  
- confidence: number 0.0-1.0
- reasoning: 2-3 sentences of AI logic explaining why cross-referencing these sources suggests this direction
- sources: array of 2-3 article titles that support this vector

Return a JSON array. ONLY return valid JSON, no markdown.`;
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return JSON.parse(cleaned);
    }
    catch {
        return [{
                ticker: null,
                signal: "neutral",
                confidence: 0.5,
                reasoning: "Unable to generate vectors at this time. Please retry.",
                sources: [],
            }];
    }
}
// ── ELI5 Explanation ─────────────────────────────────────────────────────────
export async function generateEli5(term, apiKey) {
    const model = getModel(apiKey);
    const prompt = `You are an extremely friendly teacher explaining financial concepts to a 5-year-old. 
Use ONLY metaphors involving playgrounds, toys, candy, ice cream, piggy banks, or games. 
Never use jargon. Be warm, fun, and reassuring.

Explain this financial term in 2-3 sentences: "${term}"

Start your explanation with "Imagine..."`;
    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    }
    catch {
        return `Imagine "${term}" is like... (Gemini API key needed for ELI5 explanations)`;
    }
}
// ── Predictive Reasoning ─────────────────────────────────────────────────────
export async function generatePredictiveReasoning(ticker, recentVectors, recentNews, apiKey) {
    const model = getModel(apiKey);
    const prompt = `You are a quantitative analyst providing predictive reasoning for ${ticker}.

Recent market vectors:
${recentVectors.slice(0, 5).map((v) => `- ${v.signal.toUpperCase()} (${Math.round(v.confidence * 100)}%): ${v.reasoning}`).join("\n")}

Recent relevant news:
${recentNews.slice(0, 10).map((n) => `- [${n.tone || "neutral"}] ${n.title}`).join("\n")}

Provide a short-term (24-72 hour) directional prediction with:
- prediction: "bullish", "bearish", or "neutral"
- confidence: 0.0-1.0
- reasoning: 3-4 sentences of quantitative reasoning synthesizing the signals
- timeframe: "24h", "48h", or "72h"

Return JSON only.`;
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return JSON.parse(cleaned);
    }
    catch {
        return {
            prediction: "neutral",
            confidence: 0.5,
            reasoning: "Predictive reasoning requires a valid Gemini API key.",
            timeframe: "24h",
        };
    }
}
