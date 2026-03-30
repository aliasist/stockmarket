import type { AnalyzedArticle, Env, RawArticle } from "./types.js"

type PredictionInput = {
  ticker: string
  recentVectors: Array<{
    signal: string
    confidence: number
    reasoning: string
  }>
  recentNews: Array<{
    title: string
    tone?: string | null
  }>
}

// ── Groq (primary for chat + pitch) ─────────────────────────────────────────

export async function callGroq(
  env: Env,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  model = "llama-3.3-70b-versatile",
  maxTokens = 2048
): Promise<string | null> {
  if (!env.GROQ_API_KEY) return null
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
    })
    if (!res.ok) return null
    const data = await res.json() as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch {
    return null
  }
}

// ── Gemini (secondary, used for news analysis + vectors) ─────────────────────

export async function callGemini(env: Env, prompt: string): Promise<string | null> {
  // Try real Gemini API first
  if (env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1024 },
          }),
        }
      )
      if (res.ok) {
        const data = await res.json() as {
          candidates?: { content?: { parts?: { text?: string }[] } }[]
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
        if (text) return text
      }
    } catch { /* fall through */ }
  }

  // Fallback: Cloudflare Workers AI (Llama)
  if (env.AI) {
    try {
      const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt,
        max_tokens: 1024,
      })
      const text = response?.response
      if (typeof text === "string") return text.trim()
    } catch { /* fall through */ }
  }

  return null
}

// ── FMP (Financial Modeling Prep) ────────────────────────────────────────────

// New FMP stable API (post August 2025)
const FMP_BASE = "https://financialmodelingprep.com/stable"
const fmpCache = new Map<string, { value: unknown; expiresAt: number }>()
const FMP_TTL = 5 * 60 * 1000

async function fmpGet<T>(env: Env, endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!env.FMP_API_KEY) return null
  const cacheKey = endpoint + JSON.stringify(params)
  const cached = fmpCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value as T

  try {
    const qs = new URLSearchParams({ ...params, apikey: env.FMP_API_KEY }).toString()
    const res = await fetch(`${FMP_BASE}/${endpoint}?${qs}`)
    if (!res.ok) return null
    const data = await res.json() as T
    // Check for FMP error message
    if (data && typeof data === "object" && "Error Message" in (data as object)) return null
    fmpCache.set(cacheKey, { value: data, expiresAt: Date.now() + FMP_TTL })
    return data
  } catch {
    return null
  }
}

export async function getFmpProfile(env: Env, ticker: string) {
  // Try stable profile first, then quote as fallback
  const data = await fmpGet<any[]>(env, "profile", { symbol: ticker })
  if (data?.[0]) return data[0]
  // Fallback: quote endpoint
  const quote = await fmpGet<any[]>(env, "quote", { symbol: ticker })
  return quote?.[0] ?? null
}

export async function getFmpMetrics(env: Env, ticker: string) {
  const data = await fmpGet<any[]>(env, "key-metrics", { symbol: ticker, limit: "5", period: "annual" })
  if (data?.length) return data
  // Fallback: TTM metrics
  const ttm = await fmpGet<any>(env, "key-metrics-ttm", { symbol: ticker })
  return ttm ? [ttm] : []
}

export async function getFmpRatings(env: Env, ticker: string) {
  const empty = { buy: 0, hold: 0, sell: 0, strongBuy: 0, strongSell: 0, avgPriceTarget: 0, numAnalysts: 0, consensus: "Hold" }
  // Try ratings-snapshot (new endpoint)
  const snap = await fmpGet<any>(env, "ratings-snapshot", { symbol: ticker })
  if (snap && !Array.isArray(snap)) {
    return {
      buy: snap.ratingsBuy ?? 0,
      hold: snap.ratingsHold ?? 0,
      sell: snap.ratingsSell ?? 0,
      strongBuy: snap.ratingsStrongBuy ?? 0,
      strongSell: snap.ratingsStrongSell ?? 0,
      avgPriceTarget: snap.priceTarget ?? 0,
      numAnalysts: snap.ratingCount ?? 0,
      consensus: snap.rating ?? "Hold",
    }
  }
  // Fallback: analyst estimates
  const est = await fmpGet<any[]>(env, "analyst-estimates", { symbol: ticker, limit: "1", period: "annual" })
  if (est?.[0]) {
    const e = est[0]
    return { ...empty, avgPriceTarget: e.priceTarget ?? 0, consensus: e.analystConsensus ?? "Hold" }
  }
  return empty
}

export async function getFmpPeers(env: Env, ticker: string): Promise<string[]> {
  const data = await fmpGet<any>(env, "stock-peers", { symbol: ticker })
  if (Array.isArray(data)) return data.slice(0, 8)
  if (data?.peersList) return data.peersList.slice(0, 8)
  if (data?.peers) return data.peers.slice(0, 8)
  return []
}

export async function getFmpEarnings(env: Env, ticker: string) {
  const data = await fmpGet<any[]>(env, "earnings", { symbol: ticker, limit: "8" })
  return (data ?? []).map((e: any) => ({
    date: e.date,
    eps: e.eps ?? e.epsActual ?? null,
    epsEstimated: e.epsEstimated ?? null,
    revenue: e.revenue ?? e.revenueActual ?? null,
    revenueEstimated: e.revenueEstimated ?? null,
  }))
}

export async function getFmpIncome(env: Env, ticker: string) {
  const data = await fmpGet<any[]>(env, "income-statement", { symbol: ticker, limit: "5", period: "annual" })
  return (data ?? []).map((e: any) => ({
    year: e.calendarYear ?? new Date(e.date ?? Date.now()).getFullYear(),
    revenue: e.revenue ?? 0,
    netIncome: e.netIncome ?? 0,
    grossProfit: e.grossProfit ?? 0,
    operatingIncome: e.operatingIncome ?? 0,
    eps: e.eps ?? e.epsdiluted ?? 0,
    ebitda: e.ebitda ?? 0,
  }))
}

export async function getFmpBalance(env: Env, ticker: string) {
  const data = await fmpGet<any[]>(env, "balance-sheet-statement", { symbol: ticker, limit: "5", period: "annual" })
  return (data ?? []).map((e: any) => ({
    year: e.calendarYear ?? new Date(e.date ?? Date.now()).getFullYear(),
    totalDebt: e.totalDebt ?? 0,
    cashAndEquivalents: e.cashAndCashEquivalents ?? 0,
    totalAssets: e.totalAssets ?? 0,
    totalEquity: e.totalStockholdersEquity ?? 0,
  }))
}

export async function getFmpPitchBundle(env: Env, ticker: string) {
  const [profile, metrics, ratings, peers, earnings, income, balance] = await Promise.all([
    getFmpProfile(env, ticker),
    getFmpMetrics(env, ticker),
    getFmpRatings(env, ticker),
    getFmpPeers(env, ticker),
    getFmpEarnings(env, ticker),
    getFmpIncome(env, ticker),
    getFmpBalance(env, ticker),
  ])
  return { profile, metrics, ratings, peers, earnings, income, balance }
}

// ── News Analysis ─────────────────────────────────────────────────────────────

function cleanJsonPayload(text: string): string {
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
}

export function classifyFallback(articles: RawArticle[]): AnalyzedArticle[] {
  return articles.map((article) => {
    const title = article.title.toLowerCase()
    let tone = "neutral"
    if (title.includes("crash") || title.includes("collapse") || title.includes("panic") || title.includes("fear")) {
      tone = "fear_mongering"
    } else if (title.includes("could") || title.includes("might") || title.includes("may") || title.includes("prediction")) {
      tone = "speculative"
    } else if (title.includes("data") || title.includes("earnings") || title.includes("report") || title.includes("inflation")) {
      tone = "data_backed"
    }
    return { ...article, tone, toneReasoning: "Heuristic classification", summary: article.snippet || article.title, ticker: null }
  })
}

export async function analyzeNewsWithAI(env: Env, articles: RawArticle[]): Promise<AnalyzedArticle[]> {
  if (articles.length === 0) return []
  const batchSize = 10
  const results: AnalyzedArticle[] = []

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)
    const prompt = `You are a financial journalism analyst. Analyze these articles and return a JSON array.
For each article provide:
- tone: one of "fear_mongering", "speculative", "data_backed", or "neutral"
- toneReasoning: one sentence
- ticker: stock ticker if relevant, otherwise null
- summary: one sentence

Articles:
${batch.map((a, idx) => `[${idx}] Title: ${a.title}\nSource: ${a.source}\nSnippet: ${a.snippet || "N/A"}`).join("\n\n")}

Return JSON only.`

    // Try Groq first (faster), then Gemini/CF
    let text: string | null = null
    if (env.GROQ_API_KEY) {
      text = await callGroq(env, [{ role: "user", content: prompt }], "llama-3.3-70b-versatile", 512)
    }
    if (!text) text = await callGemini(env, prompt)

    if (!text) { results.push(...classifyFallback(batch)); continue }

    try {
      const parsed = JSON.parse(cleanJsonPayload(text)) as Array<Pick<AnalyzedArticle, "tone" | "toneReasoning" | "ticker" | "summary">>
      batch.forEach((a, idx) => results.push({ ...a, ...parsed[idx] }))
    } catch {
      results.push(...classifyFallback(batch))
    }
  }

  return results
}

export async function generateEli5WithAI(env: Env, term: string): Promise<string> {
  const prompt = `You are an extremely friendly teacher explaining financial concepts to a 5-year-old.
Use ONLY metaphors involving playgrounds, toys, candy, ice cream, piggy banks, or games.
Never use jargon. Be warm and reassuring.

Explain this financial term in 2-3 sentences: "${term}"
Start with "Imagine..."`

  let text: string | null = null
  if (env.GROQ_API_KEY) {
    text = await callGroq(env, [{ role: "user", content: prompt }], "llama-3.3-70b-versatile", 256)
  }
  if (!text) text = await callGemini(env, prompt)
  return text ?? `Imagine "${term}" is like a game where everyone is trying to guess what the prize will be worth later.`
}

export async function generateVectorsWithAI(env: Env, articles: AnalyzedArticle[]) {
  if (articles.length === 0) {
    return [{ ticker: "SPY", signal: "neutral", confidence: 0.5, reasoning: "No articles available for analysis.", sources: [] }]
  }

  const prompt = `You are a quantitative market analyst. Based on these recent articles, identify 3 to 5 market vectors.
For each vector provide:
- ticker: specific ticker or null for macro
- signal: "bullish", "bearish", or "neutral"
- confidence: number from 0 to 1
- reasoning: 2 to 3 sentences
- sources: array of 2 to 3 article titles

Articles:
${articles.slice(0, 30).map((a) => `- [${a.source}] ${a.title} (tone=${a.tone || "unknown"})`).join("\n")}

Return JSON only.`

  let text: string | null = null
  if (env.GROQ_API_KEY) {
    text = await callGroq(env, [{ role: "user", content: prompt }], "llama-3.3-70b-versatile", 1024)
  }
  if (!text) text = await callGemini(env, prompt)
  if (!text) return [{ ticker: "SPY", signal: "neutral", confidence: 0.5, reasoning: "Unable to generate vectors right now.", sources: [] }]

  try { return JSON.parse(cleanJsonPayload(text)) }
  catch { return [{ ticker: "SPY", signal: "neutral", confidence: 0.5, reasoning: "AI returned unreadable payload.", sources: [] }] }
}

export async function generatePredictionWithAI(env: Env, input: PredictionInput) {
  const prompt = `You are a quantitative analyst providing predictive reasoning for ${input.ticker}.

Recent market vectors:
${input.recentVectors.slice(0, 5).map((v) => `- ${v.signal.toUpperCase()} (${Math.round(v.confidence * 100)}%): ${v.reasoning}`).join("\n")}

Recent relevant news:
${input.recentNews.slice(0, 10).map((n) => `- [${n.tone || "neutral"}] ${n.title}`).join("\n")}

Return JSON only with: prediction (bullish/bearish/neutral), confidence (0-1), reasoning (3-4 sentences), timeframe (24h/48h/72h)`

  let text: string | null = null
  if (env.GROQ_API_KEY) {
    text = await callGroq(env, [{ role: "user", content: prompt }], "llama-3.3-70b-versatile", 512)
  }
  if (!text) text = await callGemini(env, prompt)
  if (!text) return { prediction: "neutral", confidence: 0.5, reasoning: "Predictive reasoning temporarily unavailable.", timeframe: "24h" }

  try { return JSON.parse(cleanJsonPayload(text)) }
  catch { return { prediction: "neutral", confidence: 0.5, reasoning: "AI returned unreadable response.", timeframe: "24h" } }
}

// ── Pitch generation via Groq ─────────────────────────────────────────────────

export async function generatePitchMemo(env: Env, ticker: string, fmpData: Awaited<ReturnType<typeof getFmpPitchBundle>>, currentPrice?: number) {
  const { profile, metrics, ratings, peers, income } = fmpData
  const m = metrics?.[0] ?? {}
  const inc = income?.[0] as { revenue?: number; netIncome?: number; ebitda?: number } | undefined ?? {}

  const dataPrompt = `Generate a professional equity pitch memo for ${ticker}.

Company: ${profile?.companyName ?? ticker}
Sector: ${profile?.sector ?? "Unknown"} | Industry: ${profile?.industry ?? "Unknown"}
Current Price: $${currentPrice ?? profile?.price ?? "N/A"} | Market Cap: $${profile?.mktCap ? (profile.mktCap / 1e9).toFixed(1) + "B" : "N/A"}
52W Range: ${profile?.range ?? "N/A"}

Recent Financials (annual):
Revenue: $${inc.revenue ? (inc.revenue / 1e9).toFixed(1) + "B" : "N/A"} | Net Income: $${inc.netIncome ? (inc.netIncome / 1e9).toFixed(1) + "B" : "N/A"} | EBITDA: $${inc.ebitda ? (inc.ebitda / 1e9).toFixed(1) + "B" : "N/A"}

Key Metrics:
P/E: ${m.peRatio?.toFixed(1) ?? "N/A"} | EV/EBITDA: ${m.evToEbitda?.toFixed(1) ?? "N/A"} | ROE: ${m.returnOnEquity ? (m.returnOnEquity * 100).toFixed(1) + "%" : "N/A"} | Debt/Equity: ${m.debtToEquity?.toFixed(2) ?? "N/A"}

Analyst Consensus: ${ratings?.consensus ?? "N/A"} (${ratings?.numAnalysts ?? 0} analysts) | Avg Price Target: $${ratings?.avgPriceTarget ?? "N/A"}
Peer Group: ${peers?.join(", ") ?? "N/A"}

Return a JSON object with EXACTLY these keys:
{
  "executiveSummary": "2-3 sentence investment case overview",
  "businessOverview": "3-4 sentences on business model and competitive position",
  "investmentThesis": "4-5 sentences — the bull case and what the market may be missing",
  "bearCase": "2-3 sentences — key risks and why thesis could be wrong",
  "catalysts": ["near-term catalyst 1", "catalyst 2", "catalyst 3"],
  "valuation": "3-4 sentences on valuation vs peers and history",
  "priceTarget": "$XXX (XX% upside/downside from current)",
  "recommendation": "BUY" or "HOLD" or "SELL"
}

Return JSON only. Be specific with numbers. Use analyst-quality language.`

  const text = await callGroq(env, [
    { role: "system", content: "You are a senior equity research analyst at a top-tier hedge fund. Generate precise, numbers-backed investment memos." },
    { role: "user", content: dataPrompt }
  ], "llama-3.3-70b-versatile", 2048)

  if (!text) return null
  try { return JSON.parse(cleanJsonPayload(text)) }
  catch { return null }
}
