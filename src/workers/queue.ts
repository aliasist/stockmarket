/**
 * Cloudflare Queue Consumer — Scraping Jobs
 * Consumes messages from the market-pulse-scrape queue and runs the news
 * scraping + AI analysis pipeline, storing results in D1.
 */

export interface Env {
  DB: D1Database
  SCRAPE_QUEUE: Queue
  GEMINI_API_KEY: string
}

interface ScrapeMessage {
  type: "scrape"
  triggeredAt: string
}

interface RawArticle {
  title: string
  url: string
  source: string
  publishedAt?: string
  snippet?: string
}

// ── Source scrapers ───────────────────────────────────────────────────────────

async function fetchHackerNews(): Promise<RawArticle[]> {
  try {
    const resp = await fetch(
      "https://hn.algolia.com/api/v1/search?query=stock+market+finance+bitcoin+fed+interest+rates&tags=story&hitsPerPage=20&numericFilters=points>10",
      { signal: AbortSignal.timeout(8000) }
    )
    const data = await resp.json() as any
    return data.hits.map((h: any) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: "hackernews",
      publishedAt: h.created_at,
      snippet: h.story_text?.slice(0, 300),
    }))
  } catch {
    return []
  }
}

async function fetchRedditQuant(): Promise<RawArticle[]> {
  try {
    const resp = await fetch("https://www.reddit.com/r/quant/new.json?limit=25", {
      headers: { "User-Agent": "MarketPulse/1.0 (educational)" },
      signal: AbortSignal.timeout(8000),
    })
    const data = await resp.json() as any
    return data.data.children.map((p: any) => ({
      title: p.data.title,
      url: `https://www.reddit.com${p.data.permalink}`,
      source: "reddit",
      publishedAt: new Date(p.data.created_utc * 1000).toISOString(),
      snippet: p.data.selftext?.slice(0, 300),
    }))
  } catch {
    return []
  }
}

async function fetchRedditInvesting(): Promise<RawArticle[]> {
  try {
    const resp = await fetch("https://www.reddit.com/r/investing/hot.json?limit=15", {
      headers: { "User-Agent": "MarketPulse/1.0 (educational)" },
      signal: AbortSignal.timeout(8000),
    })
    const data = await resp.json() as any
    return data.data.children.map((p: any) => ({
      title: p.data.title,
      url: `https://www.reddit.com${p.data.permalink}`,
      source: "reddit",
      publishedAt: new Date(p.data.created_utc * 1000).toISOString(),
      snippet: p.data.selftext?.slice(0, 300),
    }))
  } catch {
    return []
  }
}

async function fetchBlueSky(): Promise<RawArticle[]> {
  try {
    const resp = await fetch(
      "https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=stock+market+fed+inflation&limit=20",
      { signal: AbortSignal.timeout(8000) }
    )
    const data = await resp.json() as any
    return (data.posts || []).map((p: any) => ({
      title: p.record?.text?.slice(0, 120) || "Bluesky post",
      url: `https://bsky.app/profile/${p.author?.handle}/post/${p.uri?.split("/").pop() ?? ""}`,
      source: "bluesky",
      publishedAt: p.indexedAt,
      snippet: p.record?.text?.slice(0, 300),
    }))
  } catch {
    return []
  }
}

async function fetchYahooFinanceRSS(): Promise<RawArticle[]> {
  try {
    const resp = await fetch(
      "https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY,QQQ,BTC-USD&region=US&lang=en-US",
      { signal: AbortSignal.timeout(8000) }
    )
    const text = await resp.text()
    const items = text.match(/<item>([\s\S]*?)<\/item>/g) ?? []
    return items.slice(0, 20).map((item) => {
      const title =
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        item.match(/<title>(.*?)<\/title>/)?.[1] ||
        "Finance News"
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? ""
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]
      return {
        title,
        url: link,
        source: "yahoo_finance",
        publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined,
      }
    })
  } catch {
    return []
  }
}

// ── Gemini analysis ───────────────────────────────────────────────────────────

async function analyzeWithGemini(
  articles: RawArticle[],
  apiKey: string
): Promise<Array<RawArticle & { tone?: string; toneReasoning?: string; ticker?: string; summary?: string }>> {
  const batchSize = 10
  const results: Array<RawArticle & { tone?: string; toneReasoning?: string; ticker?: string; summary?: string }> = []

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)
    const prompt = `You are a financial journalism analyst. Analyze these news articles and for each one provide:
1. tone: one of "fear_mongering", "speculative", "data_backed", or "neutral"
2. toneReasoning: one sentence explaining why
3. ticker: relevant stock/crypto ticker if mentioned (e.g. "AAPL", "BTC-USD"), or null
4. summary: one sentence summary

Articles:
${batch.map((a, idx) => `[${idx}] Title: ${a.title}\nSource: ${a.source}\nSnippet: ${a.snippet || "N/A"}`).join("\n\n")}

Respond with a JSON array of objects with keys: tone, toneReasoning, ticker, summary
ONLY return valid JSON, no markdown.`

    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      )
      const data = await resp.json() as any
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      const parsed = JSON.parse(cleaned)
      batch.forEach((a, idx) => results.push({ ...a, ...parsed[idx] }))
    } catch {
      batch.forEach((a) => results.push({ ...a, tone: "neutral" }))
    }
  }

  return results
}

async function generateVectors(
  articles: Array<RawArticle & { tone?: string }>,
  apiKey: string
): Promise<Array<{ ticker: string | null; signal: string; confidence: number; reasoning: string; sources: string[] }>> {
  const prompt = `You are a quantitative market analyst. Based on these ${articles.length} recent news articles, identify 3-5 "Logical Market Vectors" — cross-referenced signals that suggest directional pressure on assets.

Headlines:
${articles.slice(0, 30).map((a) => `- [${a.source}] ${a.title} (tone: ${a.tone || "unknown"})`).join("\n")}

For each vector, provide:
- ticker: specific ticker (e.g. "SPY", "NVDA", "BTC-USD") or null for macro
- signal: "bullish", "bearish", or "neutral"
- confidence: number 0.0-1.0
- reasoning: 2-3 sentences of AI logic
- sources: array of 2-3 article titles that support this vector

Return a JSON array. ONLY return valid JSON, no markdown.`

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )
    const data = await resp.json() as any
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    return JSON.parse(cleaned)
  } catch {
    return [{ ticker: null, signal: "neutral", confidence: 0.5, reasoning: "Unable to generate vectors.", sources: [] }]
  }
}

// ── Main scrape orchestrator ──────────────────────────────────────────────────

async function runScrape(env: Env): Promise<void> {
  const now = new Date().toISOString()

  // Create scrub run record
  const runResult = await env.DB.prepare(
    "INSERT INTO scrub_runs (run_at, sources, status) VALUES (?, ?, 'running') RETURNING id"
  )
    .bind(now, JSON.stringify(["hackernews", "reddit_quant", "reddit_investing", "bluesky", "yahoo_finance"]))
    .first<{ id: number }>()

  if (!runResult) {
    console.error("[queue] Failed to create scrub run record")
    return
  }

  const runId = runResult.id

  try {
    const [hn, rq, ri, bsky, yf] = await Promise.all([
      fetchHackerNews(),
      fetchRedditQuant(),
      fetchRedditInvesting(),
      fetchBlueSky(),
      fetchYahooFinanceRSS(),
    ])

    const allArticles = [...hn, ...rq, ...ri, ...bsky, ...yf]

    // Deduplicate
    const seen = new Set<string>()
    const unique = allArticles.filter((a) => {
      const key = a.title.slice(0, 60).toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Analyze with Gemini or fall back to heuristics
    let analyzed: Array<RawArticle & { tone?: string; toneReasoning?: string; ticker?: string; summary?: string }>

    if (env.GEMINI_API_KEY && unique.length > 0) {
      analyzed = await analyzeWithGemini(unique, env.GEMINI_API_KEY)
    } else {
      analyzed = unique.map((a) => {
        const t = a.title.toLowerCase()
        let tone = "neutral"
        if (t.includes("crash") || t.includes("collapse") || t.includes("crisis") || t.includes("fear")) {
          tone = "fear_mongering"
        } else if (t.includes("could") || t.includes("might") || t.includes("may") || t.includes("predict")) {
          tone = "speculative"
        } else if (t.includes("data") || t.includes("report") || t.includes("earnings") || t.includes("gdp")) {
          tone = "data_backed"
        }
        return { ...a, tone, toneReasoning: "Heuristic classification (no Gemini key)" }
      })
    }

    // Batch insert articles
    const insertArticle = env.DB.prepare(
      "INSERT INTO news_articles (scrub_run_id, title, source, url, published_at, summary, tone, tone_reasoning, ticker) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    await env.DB.batch(
      analyzed.map((a) =>
        insertArticle.bind(
          runId,
          a.title,
          a.source,
          a.url,
          a.publishedAt || null,
          a.summary || null,
          a.tone || "neutral",
          a.toneReasoning || null,
          a.ticker || null
        )
      )
    )

    // Generate market vectors
    let vectorCount = 0
    if (env.GEMINI_API_KEY && analyzed.length > 0) {
      const vectors = await generateVectors(analyzed, env.GEMINI_API_KEY)
      const insertVector = env.DB.prepare(
        "INSERT INTO market_vectors (scrub_run_id, ticker, signal, confidence, reasoning, sources, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      await env.DB.batch(
        vectors.map((v) =>
          insertVector.bind(runId, v.ticker, v.signal, v.confidence, v.reasoning, JSON.stringify(v.sources), now)
        )
      )
      vectorCount = vectors.length
    } else {
      await env.DB.prepare(
        "INSERT INTO market_vectors (scrub_run_id, ticker, signal, confidence, reasoning, sources, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(
          runId,
          "SPY",
          "neutral",
          0.5,
          "No Gemini API key configured — add GEMINI_API_KEY to enable AI-powered analysis.",
          JSON.stringify(["https://example.com"]),
          now
        )
        .run()
      vectorCount = 1
    }

    await env.DB.prepare(
      "UPDATE scrub_runs SET status = 'done', vectors_found = ?, summary = ? WHERE id = ?"
    )
      .bind(
        vectorCount,
        `Scraped ${unique.length} articles from 5 sources. Generated ${vectorCount} market vectors.`,
        runId
      )
      .run()

    console.log(`[queue] Scrape complete: ${unique.length} articles, ${vectorCount} vectors`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    await env.DB.prepare("UPDATE scrub_runs SET status = 'error', summary = ? WHERE id = ?")
      .bind(`Scrape failed: ${message}`, runId)
      .run()
    console.error("[queue] Scrape failed:", message)
  }
}

// ── Queue consumer export ─────────────────────────────────────────────────────

export default {
  async queue(batch: MessageBatch<ScrapeMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        console.log(`[queue] Processing scrape message from ${message.body.triggeredAt}`)
        await runScrape(env)
        message.ack()
      } catch (err) {
        console.error("[queue] Message processing failed:", err)
        message.retry()
      }
    }
  },
}
