import { z } from "zod";
import { generateEli5WithAI, generatePredictionWithAI } from "./ai.js";
import { getChart, getQuotes } from "./marketData.js";
import { runScrub } from "./scrub.js";
import { ensureSchema, storage } from "./storage.js";
const PREDICTION_CACHE_TTL_MS = 5 * 60 * 1000;
const predictionCache = new Map();
const watchlistInputSchema = z.object({
    ticker: z.string().min(1),
    name: z.string().min(1),
    type: z.string().min(1),
});
function json(data, init) {
    return new Response(JSON.stringify(data), {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        },
    });
}
function notFound() {
    return json({ message: "Not found" }, { status: 404 });
}
function getCachedPrediction(ticker) {
    const cached = predictionCache.get(ticker);
    if (!cached) {
        return null;
    }
    if (cached.expiresAt <= Date.now()) {
        predictionCache.delete(ticker);
        return null;
    }
    return cached.value;
}
function setCachedPrediction(ticker, value) {
    predictionCache.set(ticker, {
        value,
        expiresAt: Date.now() + PREDICTION_CACHE_TTL_MS,
    });
}
async function serveAsset(request, env) {
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
        return assetResponse;
    }
    const url = new URL(request.url);
    url.pathname = "/index.html";
    return env.ASSETS.fetch(new Request(url.toString(), request));
}
async function handleApi(request, env) {
    if (request.url.includes("/api/analytics")) {
        // Example: Find spikes in analytics_data (assumes a 'value' and 'timestamp' field)
        // This is a simple example; adjust the query as needed for your schema
        try {
            // Find rows where value is a spike (e.g., > 2x the previous value)
            // This assumes your dataset supports SQL-like queries
            const result = await env.ANALYTICS_ENGINE.query(`
          SELECT *,
            LAG(value) OVER (ORDER BY timestamp) AS prev_value
          FROM analytics_data
          QUALIFY value > 2 * prev_value
          ORDER BY timestamp DESC
          LIMIT 20
        `);
            return json({ spikes: result });
        }
        catch (err) {
            return json({ error: 'Failed to query analytics data', details: String(err) }, { status: 500 });
        }
    }
    await ensureSchema(env);
    const url = new URL(request.url);
    const { pathname } = url;
    if (pathname === "/api/health") {
        return json({
            status: "ok",
            aiConfigured: Boolean(env.AI),
            aiProvider: "cloudflare-workers-ai",
            cloudflareConfigured: Boolean(env.DB),
            timestamp: new Date().toISOString(),
        });
    }
    if (pathname === "/api/quotes") {
        const watchlist = await storage.getWatchlist(env);
        const quotes = await getQuotes(watchlist.map((item) => item.ticker));
        return json(quotes);
    }
    if (pathname.startsWith("/api/chart/")) {
        const ticker = decodeURIComponent(pathname.slice("/api/chart/".length)).toUpperCase();
        const range = url.searchParams.get("range") || "5d";
        const interval = url.searchParams.get("interval") || "15m";
        return json(await getChart(ticker, range, interval));
    }
    if (pathname === "/api/vectors") {
        return json(await storage.getLatestVectors(env, 30));
    }
    if (pathname.startsWith("/api/vectors/")) {
        const ticker = decodeURIComponent(pathname.slice("/api/vectors/".length)).toUpperCase();
        return json(await storage.getVectorsByTicker(env, ticker));
    }
    if (pathname === "/api/news") {
        return json(await storage.getLatestNews(env, 50));
    }
    if (pathname.startsWith("/api/predict/")) {
        const ticker = decodeURIComponent(pathname.slice("/api/predict/".length)).toUpperCase();
        const cached = getCachedPrediction(ticker);
        if (cached) {
            return json(cached);
        }
        const recentVectors = (await storage.getLatestVectors(env, 30)).filter((vector) => !vector.ticker || vector.ticker === ticker);
        const recentNews = (await storage.getLatestNews(env, 50)).filter((article) => !article.ticker || article.ticker === ticker);
        const prediction = await generatePredictionWithAI(env, {
            ticker,
            recentVectors,
            recentNews,
        });
        setCachedPrediction(ticker, prediction);
        return json(prediction);
    }
    if (pathname.startsWith("/api/eli5/")) {
        const term = decodeURIComponent(pathname.slice("/api/eli5/".length));
        const cached = await storage.getEli5(env, term);
        if (cached) {
            return json(cached);
        }
        const explanation = await generateEli5WithAI(env, term);
        const saved = await storage.saveEli5(env, {
            term: term.toLowerCase(),
            explanation,
            createdAt: new Date().toISOString(),
        });
        return json(saved);
    }
    if (pathname === "/api/watchlist" && request.method === "GET") {
        return json(await storage.getWatchlist(env));
    }
    if (pathname === "/api/watchlist" && request.method === "POST") {
        const body = await request.json();
        const parsed = watchlistInputSchema.safeParse(body);
        if (!parsed.success) {
            return json({ error: parsed.error.flatten() }, { status: 400 });
        }
        const item = await storage.addToWatchlist(env, {
            ticker: parsed.data.ticker.toUpperCase(),
            name: parsed.data.name,
            type: parsed.data.type,
            addedAt: new Date().toISOString(),
        });
        return json(item);
    }
    if (pathname.startsWith("/api/watchlist/") && request.method === "DELETE") {
        const ticker = decodeURIComponent(pathname.slice("/api/watchlist/".length)).toUpperCase();
        await storage.removeFromWatchlist(env, ticker);
        return new Response(null, { status: 204 });
    }
    if (pathname === "/api/scrub/latest") {
        return json(await storage.getLatestScrubRun(env));
    }
    if (pathname === "/api/scrub/runs") {
        return json(await storage.getScrubRuns(env, 50));
    }
    if (pathname === "/api/scrub/trigger" && request.method === "POST") {
        predictionCache.clear();
        await runScrub(env);
        return json({ message: "Scrub triggered" });
    }
    return notFound();
}
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    Allow: "GET,POST,DELETE,OPTIONS",
                },
            });
        }
        try {
            if (url.pathname.startsWith("/api/")) {
                return await handleApi(request, env);
            }
            return await serveAsset(request, env);
        }
        catch (error) {
            return json({
                message: error && typeof error === "object" && "message" in error
                    ? String(error.message)
                    : "Internal Server Error",
            }, { status: 500 });
        }
    },
    async scheduled(_controller, env) {
        predictionCache.clear();
        await ensureSchema(env);
        await runScrub(env);
    },
};
