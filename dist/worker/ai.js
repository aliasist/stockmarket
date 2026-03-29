async function callGemini(env, prompt) {
    if (!env.AI) {
        return null;
    }
    try {
        const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            prompt,
            max_tokens: 1024,
        });
        const text = response?.response;
        if (typeof text !== "string") {
            return null;
        }
        return text.trim();
    }
    catch {
        return null;
    }
}
function cleanJsonPayload(text) {
    return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}
export function classifyFallback(articles) {
    return articles.map((article) => {
        const title = article.title.toLowerCase();
        let tone = "neutral";
        if (title.includes("crash") ||
            title.includes("collapse") ||
            title.includes("panic") ||
            title.includes("fear")) {
            tone = "fear_mongering";
        }
        else if (title.includes("could") ||
            title.includes("might") ||
            title.includes("may") ||
            title.includes("prediction")) {
            tone = "speculative";
        }
        else if (title.includes("data") ||
            title.includes("earnings") ||
            title.includes("report") ||
            title.includes("inflation")) {
            tone = "data_backed";
        }
        return {
            ...article,
            tone,
            toneReasoning: "Heuristic classification (no AI key configured)",
            summary: article.snippet || article.title,
            ticker: null,
        };
    });
}
export async function analyzeNewsWithAI(env, articles) {
    if (!env.AI || articles.length === 0) {
        return classifyFallback(articles);
    }
    const batchSize = 10;
    const results = [];
    for (let index = 0; index < articles.length; index += batchSize) {
        const batch = articles.slice(index, index + batchSize);
        const prompt = `You are a financial journalism analyst. Analyze these articles and return a JSON array.

For each article provide:
- tone: one of "fear_mongering", "speculative", "data_backed", or "neutral"
- toneReasoning: one sentence
- ticker: stock or crypto ticker if clearly relevant, otherwise null
- summary: one sentence

Articles:
${batch
            .map((article, batchIndex) => `[${batchIndex}] Title: ${article.title}\nSource: ${article.source}\nSnippet: ${article.snippet || "N/A"}`)
            .join("\n\n")}

Return JSON only.`;
        const text = await callGemini(env, prompt);
        if (!text) {
            results.push(...classifyFallback(batch));
            continue;
        }
        try {
            const parsed = JSON.parse(cleanJsonPayload(text));
            batch.forEach((article, batchIndex) => {
                results.push({
                    ...article,
                    ...parsed[batchIndex],
                });
            });
        }
        catch {
            results.push(...classifyFallback(batch));
        }
    }
    return results;
}
export async function generateEli5WithAI(env, term) {
    const prompt = `You are an extremely friendly teacher explaining financial concepts to a 5-year-old.
Use ONLY metaphors involving playgrounds, toys, candy, ice cream, piggy banks, or games.
Never use jargon. Be warm and reassuring.

Explain this financial term in 2-3 sentences: "${term}"
Start with "Imagine..."`;
    const text = await callGemini(env, prompt);
    if (text) {
        return text;
    }
    return `Imagine ${term} is like a game where everyone is trying to guess what the prize will be worth later.`;
}
export async function generateVectorsWithAI(env, articles) {
    if (!env.AI || articles.length === 0) {
        return [
            {
                ticker: "SPY",
                signal: "neutral",
                confidence: 0.5,
                reasoning: "No AI key is configured, so this vector is a neutral fallback rather than a synthesized market read.",
                sources: articles.slice(0, 3).map((article) => article.url),
            },
        ];
    }
    const prompt = `You are a quantitative market analyst.

Based on these recent articles, identify 3 to 5 market vectors.
For each vector provide:
- ticker: specific ticker or null
- signal: "bullish", "bearish", or "neutral"
- confidence: number from 0 to 1
- reasoning: 2 to 3 sentences
- sources: array of 2 to 3 article URLs

Articles:
${articles
        .slice(0, 30)
        .map((article) => `- [${article.source}] ${article.title} (${article.url}) tone=${article.tone || "unknown"}`)
        .join("\n")}

Return JSON only.`;
    const text = await callGemini(env, prompt);
    if (!text) {
        return [
            {
                ticker: "SPY",
                signal: "neutral",
                confidence: 0.5,
                reasoning: "Unable to generate vectors right now.",
                sources: [],
            },
        ];
    }
    try {
        return JSON.parse(cleanJsonPayload(text));
    }
    catch {
        return [
            {
                ticker: "SPY",
                signal: "neutral",
                confidence: 0.5,
                reasoning: "AI returned an unreadable vector payload.",
                sources: [],
            },
        ];
    }
}
export async function generatePredictionWithAI(env, input) {
    if (!env.AI) {
        return {
            prediction: "neutral",
            confidence: 0.5,
            reasoning: "Predictive reasoning requires a configured AI binding.",
            timeframe: "24h",
        };
    }
    const prompt = `You are a quantitative analyst providing predictive reasoning for ${input.ticker}.

Recent market vectors:
${input.recentVectors
        .slice(0, 5)
        .map((vector) => `- ${vector.signal.toUpperCase()} (${Math.round(vector.confidence * 100)}%): ${vector.reasoning}`)
        .join("\n")}

Recent relevant news:
${input.recentNews
        .slice(0, 10)
        .map((news) => `- [${news.tone || "neutral"}] ${news.title}`)
        .join("\n")}

Return JSON only with:
- prediction: bullish, bearish, or neutral
- confidence: 0 to 1
- reasoning: 3 to 4 sentences
- timeframe: 24h, 48h, or 72h`;
    const text = await callGemini(env, prompt);
    if (!text) {
        return {
            prediction: "neutral",
            confidence: 0.5,
            reasoning: "Predictive reasoning is temporarily unavailable.",
            timeframe: "24h",
        };
    }
    try {
        return JSON.parse(cleanJsonPayload(text));
    }
    catch {
        return {
            prediction: "neutral",
            confidence: 0.5,
            reasoning: "Predictive reasoning returned an unreadable response.",
            timeframe: "24h",
        };
    }
}
