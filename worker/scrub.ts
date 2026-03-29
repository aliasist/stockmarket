import { analyzeNewsWithAI, generateVectorsWithAI } from "./ai.js"
import { storage } from "./storage.js"
import type { Env, RawArticle } from "./types.js"

async function fetchJson(url: string, init?: RequestInit): Promise<any | null> {
  try {
    const response = await fetch(url, init)
    if (!response.ok) {
      return null
    }
    return response.json()
  } catch {
    return null
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      return null
    }
    return response.text()
  } catch {
    return null
  }
}

async function fetchHackerNews(): Promise<RawArticle[]> {
  const data = await fetchJson(
    "https://hn.algolia.com/api/v1/search?query=stock+market+finance+bitcoin+fed+interest+rates&tags=story&hitsPerPage=20&numericFilters=points>10"
  )

  return (data?.hits || []).map((hit: any) => ({
    title: hit.title,
    url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    source: "hackernews",
    publishedAt: hit.created_at,
    snippet: hit.story_text?.slice(0, 300),
  }))
}

async function fetchReddit(path: string): Promise<RawArticle[]> {
  const data = await fetchJson(`https://www.reddit.com/${path}.json?limit=20`, {
    headers: { "User-Agent": "MarketPulse/1.0 (educational)" },
  })

  return (data?.data?.children || []).map((post: any) => ({
    title: post.data.title,
    url: `https://www.reddit.com${post.data.permalink}`,
    source: "reddit",
    publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
    snippet: post.data.selftext?.slice(0, 300),
  }))
}

async function fetchBlueSky(): Promise<RawArticle[]> {
  const data = await fetchJson(
    "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=stock+market+fed+inflation&limit=20"
  )

  return (data?.posts || []).map((post: any) => ({
    title: post.record?.text?.slice(0, 120) || "Bluesky post",
    url: `https://bsky.app/profile/${post.author?.handle}/post/${post.uri?.split("/").pop() ?? ""}`,
    source: "bluesky",
    publishedAt: post.indexedAt,
    snippet: post.record?.text?.slice(0, 300),
  }))
}

async function fetchYahooFinanceRSS(): Promise<RawArticle[]> {
  const text = await fetchText(
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY,QQQ,BTC-USD&region=US&lang=en-US"
  )

  if (!text) {
    return []
  }

  const items = text.match(/<item>([\s\S]*?)<\/item>/g) ?? []
  return items.slice(0, 20).map((item) => {
    const title =
      item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
      item.match(/<title>(.*?)<\/title>/)?.[1] ||
      "Finance News"
    const url = item.match(/<link>(.*?)<\/link>/)?.[1] ?? ""
    const publishedAt = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]

    return {
      title,
      url,
      source: "yahoo_finance",
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
    }
  })
}

export async function runScrub(env: Env): Promise<void> {
  const now = new Date().toISOString()
  const run = await storage.createScrubRun(env, {
    runAt: now,
    sources: JSON.stringify([
      "hackernews",
      "reddit_quant",
      "reddit_investing",
      "bluesky",
      "yahoo_finance",
    ]),
    status: "running",
    vectorsFound: 0,
    summary: null,
  })

  try {
    const [hn, rq, ri, bsky, yf] = await Promise.all([
      fetchHackerNews(),
      fetchReddit("r/quant/new"),
      fetchReddit("r/investing/hot"),
      fetchBlueSky(),
      fetchYahooFinanceRSS(),
    ])

    const allArticles = [...hn, ...rq, ...ri, ...bsky, ...yf]
    const seen = new Set<string>()
    const unique = allArticles.filter((article) => {
      const key = article.title.slice(0, 60).toLowerCase()
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })

    const analyzedArticles = await analyzeNewsWithAI(env, unique)
    for (const article of analyzedArticles) {
      await storage.createNewsArticle(env, {
        scrubRunId: run.id,
        title: article.title,
        source: article.source,
        url: article.url,
        publishedAt: article.publishedAt,
        summary: article.summary,
        tone: article.tone,
        toneReasoning: article.toneReasoning,
        ticker: article.ticker ?? null,
      })
    }

    const vectors = await generateVectorsWithAI(env, analyzedArticles)
    for (const vector of vectors) {
      await storage.createMarketVector(env, {
        scrubRunId: run.id,
        ticker: vector.ticker,
        signal: vector.signal,
        confidence: vector.confidence,
        reasoning: vector.reasoning,
        sources: JSON.stringify(vector.sources),
        createdAt: now,
      })
    }

    await storage.updateScrubRun(env, run.id, {
      status: "done",
      vectorsFound: vectors.length,
      summary: `Scraped ${unique.length} articles from 5 sources. Generated ${vectors.length} market vectors.`,
    })
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as Error).message)
        : "Unknown error"

    await storage.updateScrubRun(env, run.id, {
      status: "error",
      summary: `Scrub failed: ${message}`,
    })
  }
}
