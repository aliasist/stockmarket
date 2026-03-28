/**
 * Recursive Internet Scrub Engine
 * Sources: HN, Reddit r/quant, Bluesky public API, Yahoo Finance RSS
 * Falls back gracefully when sources are paywalled/unavailable.
 */

import axios from "axios";
import { storage } from "./storage";
import { analyzeNewsWithGemini, generateMarketVectors } from "./geminiService";

interface RawArticle {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  snippet?: string;
}

// ── Source Scrapers ──────────────────────────────────────────────────────────

async function fetchHackerNews(): Promise<RawArticle[]> {
  try {
    const resp = await axios.get(
      "https://hn.algolia.com/api/v1/search?query=stock+market+finance+bitcoin+fed+interest+rates&tags=story&hitsPerPage=20&numericFilters=points>10",
      { timeout: 8000 }
    );
    return resp.data.hits.map((h: any) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: "hackernews",
      publishedAt: h.created_at,
      snippet: h.story_text?.slice(0, 300),
    }));
  } catch {
    return [];
  }
}

async function fetchRedditQuant(): Promise<RawArticle[]> {
  try {
    const resp = await axios.get(
      "https://www.reddit.com/r/quant/new.json?limit=25",
      {
        timeout: 8000,
        headers: { "User-Agent": "MarketPulse/1.0 (educational)" },
      }
    );
    return resp.data.data.children.map((p: any) => ({
      title: p.data.title,
      url: `https://www.reddit.com${p.data.permalink}`,
      source: "reddit",
      publishedAt: new Date(p.data.created_utc * 1000).toISOString(),
      snippet: p.data.selftext?.slice(0, 300),
    }));
  } catch {
    return [];
  }
}

async function fetchRedditInvesting(): Promise<RawArticle[]> {
  try {
    const resp = await axios.get(
      "https://www.reddit.com/r/investing/hot.json?limit=15",
      {
        timeout: 8000,
        headers: { "User-Agent": "MarketPulse/1.0 (educational)" },
      }
    );
    return resp.data.data.children.map((p: any) => ({
      title: p.data.title,
      url: `https://www.reddit.com${p.data.permalink}`,
      source: "reddit",
      publishedAt: new Date(p.data.created_utc * 1000).toISOString(),
      snippet: p.data.selftext?.slice(0, 300),
    }));
  } catch {
    return [];
  }
}

async function fetchBlueSky(): Promise<RawArticle[]> {
  try {
    // Search public Bluesky posts about finance/markets
    const resp = await axios.get(
      "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=stock+market+fed+inflation&limit=20",
      { timeout: 8000 }
    );
    return (resp.data.posts || []).map((p: any) => ({
      title: p.record?.text?.slice(0, 120) || "Bluesky post",
      url: `https://bsky.app/profile/${p.author?.handle}/post/${p.uri?.split("/").pop()}`,
      source: "bluesky",
      publishedAt: p.indexedAt,
      snippet: p.record?.text?.slice(0, 300),
    }));
  } catch {
    return [];
  }
}

async function fetchYahooFinanceRSS(): Promise<RawArticle[]> {
  try {
    // Yahoo Finance RSS (open, no auth required)
    const resp = await axios.get(
      "https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY,QQQ,BTC-USD&region=US&lang=en-US",
      { timeout: 8000 }
    );
    const text: string = resp.data;
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
    return items.slice(0, 20).map((item) => {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                    item.match(/<title>(.*?)<\/title>/)?.[1] || "Finance News";
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1];
      return {
        title,
        url: link,
        source: "yahoo_finance",
        publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
      };
    });
  } catch {
    return [];
  }
}

// ── Main Scrub Orchestrator ──────────────────────────────────────────────────

export async function runScrub(geminiApiKey?: string): Promise<void> {
  const now = new Date().toISOString();
  const run = storage.createScrubRun({
    runAt: now,
    sources: JSON.stringify(["hackernews", "reddit_quant", "reddit_investing", "bluesky", "yahoo_finance"]),
    status: "running",
  });

  try {
    // Fetch from all sources in parallel
    const [hn, rq, ri, bsky, yf] = await Promise.all([
      fetchHackerNews(),
      fetchRedditQuant(),
      fetchRedditInvesting(),
      fetchBlueSky(),
      fetchYahooFinanceRSS(),
    ]);

    const allArticles = [...hn, ...rq, ...ri, ...bsky, ...yf];

    // Deduplicate by title similarity
    const seen = new Set<string>();
    const unique = allArticles.filter((a) => {
      const key = a.title.slice(0, 60).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Analyze with Gemini if API key is present
    let analyzedArticles: Array<RawArticle & { tone?: string; toneReasoning?: string; ticker?: string; summary?: string }> = unique;
    
    if (geminiApiKey && unique.length > 0) {
      analyzedArticles = await analyzeNewsWithGemini(unique, geminiApiKey);
    } else {
      // Fallback: simple heuristic tone classification
      analyzedArticles = unique.map((a) => {
        const t = a.title.toLowerCase();
        let tone = "neutral";
        if (t.includes("crash") || t.includes("collapse") || t.includes("crisis") || t.includes("fear")) tone = "fear_mongering";
        else if (t.includes("could") || t.includes("might") || t.includes("may") || t.includes("predict")) tone = "speculative";
        else if (t.includes("data") || t.includes("report") || t.includes("earnings") || t.includes("gdp")) tone = "data_backed";
        return { ...a, tone, toneReasoning: "Heuristic classification (no Gemini key)" };
      });
    }

    // Store articles
    for (const article of analyzedArticles) {
      storage.createNewsArticle({
        scrubRunId: run.id,
        title: article.title,
        source: article.source,
        url: article.url,
        publishedAt: article.publishedAt,
        summary: article.summary,
        tone: article.tone,
        toneReasoning: article.toneReasoning,
        ticker: article.ticker,
      });
    }

    // Generate market vectors from the batch
    let vectorCount = 0;
    if (geminiApiKey && analyzedArticles.length > 0) {
      const vectors = await generateMarketVectors(analyzedArticles, geminiApiKey);
      for (const v of vectors) {
        storage.createMarketVector({
          scrubRunId: run.id,
          ticker: v.ticker,
          signal: v.signal,
          confidence: v.confidence,
          reasoning: v.reasoning,
          sources: JSON.stringify(v.sources),
          createdAt: now,
        });
        vectorCount++;
      }
    } else {
      // Synthetic demo vector if no key
      storage.createMarketVector({
        scrubRunId: run.id,
        ticker: "SPY",
        signal: "neutral",
        confidence: 0.5,
        reasoning: "No Gemini API key configured — add GEMINI_API_KEY to enable AI-powered analysis.",
        sources: JSON.stringify(["https://example.com"]),
        createdAt: now,
      });
      vectorCount = 1;
    }

    storage.updateScrubRun(run.id, {
      status: "done",
      vectorsFound: vectorCount,
      summary: `Scraped ${unique.length} articles from ${5} sources. Generated ${vectorCount} market vectors.`,
    });
  } catch (err: any) {
    storage.updateScrubRun(run.id, {
      status: "error",
      summary: `Scrub failed: ${err.message}`,
    });
  }
}
