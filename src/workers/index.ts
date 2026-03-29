/**
 * Cloudflare Worker — Main Entry Point
 * Routes API requests, validates JWT on protected routes, and queues scraping jobs.
 */

import {
  handleRegister,
  handleLogin,
  handleGoogleOAuth,
  handleLogout,
  handleMe,
  handleRefresh,
  verifyJwt,
} from "./auth"

export interface Env {
  DB: D1Database
  SCRAPE_QUEUE: Queue
  JWT_SECRET: string
  GEMINI_API_KEY: string
  GOOGLE_OAUTH_CLIENT_ID: string
  GOOGLE_OAUTH_CLIENT_SECRET: string
}

// ── CORS ──────────────────────────────────────────────────────────────────────

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  })
}

// ── JWT middleware ────────────────────────────────────────────────────────────

async function requireAuth(
  request: Request,
  env: Env
): Promise<{ userId: number; email: string } | Response> {
  const auth = request.headers.get("Authorization")
  const token = auth?.replace("Bearer ", "")
  if (!token) return json({ error: "Unauthorized — no token provided" }, 401)

  const payload = await verifyJwt(token, env.JWT_SECRET)
  if (!payload) return json({ error: "Unauthorized — invalid or expired token" }, 401)

  return { userId: payload.sub as number, email: payload.email as string }
}

// ── Route handlers ────────────────────────────────────────────────────────────

async function handleHealth(env: Env): Promise<Response> {
  return json({
    status: "ok",
    geminiConfigured: Boolean(env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
    runtime: "cloudflare-workers",
  })
}

async function handleQuotes(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  // Fetch watchlist for this user
  const { results: watchlistItems } = await env.DB.prepare(
    "SELECT ticker FROM user_watchlists WHERE user_id = ? ORDER BY added_at ASC"
  )
    .bind(auth.userId)
    .all<{ ticker: string }>()

  // Fall back to global watchlist if user has none
  const tickers =
    watchlistItems.length > 0
      ? watchlistItems.map((w) => w.ticker)
      : (
          await env.DB.prepare("SELECT ticker FROM watchlist ORDER BY added_at ASC")
            .all<{ ticker: string }>()
        ).results.map((w) => w.ticker)

  // Fetch quotes from Yahoo Finance
  const quotes = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const resp = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          }
        )
        const data = await resp.json() as any
        const result = data?.chart?.result?.[0]
        if (!result) return null
        const meta = result.meta
        const price = meta.regularMarketPrice || meta.chartPreviousClose || 0
        const prevClose = meta.chartPreviousClose || meta.previousClose || price
        const change = price - prevClose
        return {
          ticker,
          name: meta.longName || meta.shortName || meta.symbol,
          price,
          change: +change.toFixed(2),
          changePercent: prevClose > 0 ? +((change / prevClose) * 100).toFixed(2) : 0,
          volume: meta.regularMarketVolume || 0,
          previousClose: prevClose,
          open: meta.regularMarketOpen || price,
          timestamp: new Date().toISOString(),
        }
      } catch {
        return null
      }
    })
  )

  return json(quotes.filter(Boolean))
}

async function handleChart(request: Request, env: Env, ticker: string): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  const url = new URL(request.url)
  const range = url.searchParams.get("range") || "5d"
  const interval = url.searchParams.get("interval") || "15m"

  try {
    const resp = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker.toUpperCase())}?range=${range}&interval=${interval}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    )
    const data = await resp.json() as any
    const result = data?.chart?.result?.[0]
    if (!result) return json([])

    const timestamps: number[] = result.timestamp || []
    const ohlcv = result.indicators?.quote?.[0]
    if (!ohlcv) return json([])

    const candles = timestamps
      .map((ts: number, i: number) => ({
        timestamp: ts * 1000,
        open: ohlcv.open?.[i] || 0,
        high: ohlcv.high?.[i] || 0,
        low: ohlcv.low?.[i] || 0,
        close: ohlcv.close?.[i] || 0,
        volume: ohlcv.volume?.[i] || 0,
      }))
      .filter((c) => c.close > 0)

    return json(candles)
  } catch {
    return json([])
  }
}

async function handleVectors(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  const { results } = await env.DB.prepare(
    "SELECT * FROM market_vectors ORDER BY id DESC LIMIT 30"
  ).all()
  return json(results)
}

async function handleNews(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  const { results } = await env.DB.prepare(
    "SELECT * FROM news_articles ORDER BY id DESC LIMIT 50"
  ).all()
  return json(results)
}

async function handlePredict(request: Request, env: Env, ticker: string): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  if (!env.GEMINI_API_KEY) {
    return json({
      prediction: "neutral",
      confidence: 0.5,
      reasoning: "Predictive reasoning requires a valid Gemini API key.",
      timeframe: "24h",
    }, 503)
  }

  const { results: vectors } = await env.DB.prepare(
    "SELECT signal, confidence, reasoning, created_at FROM market_vectors WHERE ticker = ? OR ticker IS NULL ORDER BY id DESC LIMIT 5"
  )
    .bind(ticker.toUpperCase())
    .all<{ signal: string; confidence: number; reasoning: string; created_at: string }>()

  const { results: news } = await env.DB.prepare(
    "SELECT title, tone FROM news_articles WHERE ticker = ? OR ticker IS NULL ORDER BY id DESC LIMIT 10"
  )
    .bind(ticker.toUpperCase())
    .all<{ title: string; tone: string | null }>()

  const prompt = `You are a quantitative analyst providing predictive reasoning for ${ticker.toUpperCase()}.

Recent market vectors:
${vectors.map((v) => `- ${v.signal.toUpperCase()} (${Math.round(v.confidence * 100)}%): ${v.reasoning}`).join("\n")}

Recent relevant news:
${news.map((n) => `- [${n.tone || "neutral"}] ${n.title}`).join("\n")}

Provide a short-term (24-72 hour) directional prediction with:
- prediction: "bullish", "bearish", or "neutral"
- confidence: 0.0-1.0
- reasoning: 3-4 sentences of quantitative reasoning
- timeframe: "24h", "48h", or "72h"

Return JSON only.`

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )
    const data = await resp.json() as any
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    return json(JSON.parse(cleaned))
  } catch {
    return json({
      prediction: "neutral",
      confidence: 0.5,
      reasoning: "Prediction failed unexpectedly.",
      timeframe: "24h",
    }, 500)
  }
}

async function handleEli5(request: Request, env: Env, term: string): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  const cached = await env.DB.prepare(
    "SELECT id, term, explanation, created_at FROM eli5_cache WHERE term = ?"
  )
    .bind(term.toLowerCase())
    .first<{ id: number; term: string; explanation: string; created_at: string }>()

  if (cached) return json(cached)

  if (!env.GEMINI_API_KEY) {
    return json({ error: "Gemini API key not configured" }, 503)
  }

  const prompt = `You are an extremely friendly teacher explaining financial concepts to a 5-year-old. Use ONLY metaphors involving playgrounds, toys, candy, ice cream, piggy banks, or games. Never use jargon. Be warm, fun, and reassuring. Explain this financial term in 2-3 sentences: "${term}". Start with "Imagine..."`

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    )
    const data = await resp.json() as any
    const explanation = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
    const now = new Date().toISOString()

    await env.DB.prepare(
      "INSERT INTO eli5_cache (term, explanation, created_at) VALUES (?, ?, ?) ON CONFLICT(term) DO UPDATE SET explanation = excluded.explanation"
    )
      .bind(term.toLowerCase(), explanation, now)
      .run()

    const saved = await env.DB.prepare(
      "SELECT id, term, explanation, created_at FROM eli5_cache WHERE term = ?"
    )
      .bind(term.toLowerCase())
      .first()

    return json(saved)
  } catch {
    return json({ error: "Failed to generate explanation" }, 500)
  }
}

// ── Watchlist (user-specific) ─────────────────────────────────────────────────

async function handleWatchlistGet(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  const { results } = await env.DB.prepare(
    "SELECT id, ticker, added_at FROM user_watchlists WHERE user_id = ? ORDER BY added_at ASC"
  )
    .bind(auth.userId)
    .all()
  return json(results)
}

async function handleWatchlistPost(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  let body: { ticker?: string; name?: string; type?: string }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { ticker, name, type } = body
  if (!ticker) return json({ error: "ticker is required" }, 400)

  const now = new Date().toISOString()

  // Also upsert into global watchlist for quote fetching
  await env.DB.prepare(
    "INSERT OR IGNORE INTO watchlist (ticker, name, type, added_at) VALUES (?, ?, ?, ?)"
  )
    .bind(ticker.toUpperCase(), name || ticker.toUpperCase(), type || "stock", now)
    .run()

  const existing = await env.DB.prepare(
    "SELECT id FROM user_watchlists WHERE user_id = ? AND ticker = ?"
  )
    .bind(auth.userId, ticker.toUpperCase())
    .first()

  if (existing) return json({ error: "Ticker already in watchlist" }, 409)

  const result = await env.DB.prepare(
    "INSERT INTO user_watchlists (user_id, ticker, added_at) VALUES (?, ?, ?) RETURNING *"
  )
    .bind(auth.userId, ticker.toUpperCase(), now)
    .first()

  return json(result, 201)
}

async function handleWatchlistDelete(request: Request, env: Env, ticker: string): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  await env.DB.prepare(
    "DELETE FROM user_watchlists WHERE user_id = ? AND ticker = ?"
  )
    .bind(auth.userId, ticker.toUpperCase())
    .run()

  return new Response(null, { status: 204, headers: corsHeaders() })
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

async function handlePortfolioGet(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  const { results } = await env.DB.prepare(
    "SELECT id, ticker, shares, cost_basis, added_at FROM portfolio_holdings WHERE user_id = ? ORDER BY added_at ASC"
  )
    .bind(auth.userId)
    .all()
  return json(results)
}

async function handlePortfolioPost(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  let body: { ticker?: string; shares?: number; costBasis?: number }
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid JSON body" }, 400)
  }

  const { ticker, shares, costBasis } = body
  if (!ticker || shares == null || costBasis == null) {
    return json({ error: "ticker, shares, and costBasis are required" }, 400)
  }

  const now = new Date().toISOString()
  const result = await env.DB.prepare(
    "INSERT INTO portfolio_holdings (user_id, ticker, shares, cost_basis, added_at) VALUES (?, ?, ?, ?, ?) RETURNING *"
  )
    .bind(auth.userId, ticker.toUpperCase(), shares, costBasis, now)
    .first()

  return json(result, 201)
}

async function handlePortfolioDelete(request: Request, env: Env, id: string): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  await env.DB.prepare(
    "DELETE FROM portfolio_holdings WHERE id = ? AND user_id = ?"
  )
    .bind(parseInt(id, 10), auth.userId)
    .run()

  return new Response(null, { status: 204, headers: corsHeaders() })
}

// ── Scrub ─────────────────────────────────────────────────────────────────────

async function handleScrubLatest(env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    "SELECT * FROM scrub_runs ORDER BY id DESC LIMIT 1"
  ).first()
  return json(result || null)
}

async function handleScrubRuns(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT * FROM scrub_runs ORDER BY id DESC LIMIT 50"
  ).all()
  return json(results)
}

async function handleScrubTrigger(request: Request, env: Env): Promise<Response> {
  await env.SCRAPE_QUEUE.send({ type: "scrape", triggeredAt: new Date().toISOString() })
  return json({ message: "Scrape job queued" })
}

// ── Main fetch handler ────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const { pathname, method } = url as { pathname: string; method?: string }
    const httpMethod = request.method

    // Handle CORS preflight
    if (httpMethod === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    // ── Public routes ──────────────────────────────────────────────────────
    if (pathname === "/api/health" && httpMethod === "GET") {
      return handleHealth(env)
    }

    if (pathname === "/api/auth/register" && httpMethod === "POST") {
      return handleRegister(request, env)
    }
    if (pathname === "/api/auth/login" && httpMethod === "POST") {
      return handleLogin(request, env)
    }
    if (pathname === "/api/auth/google" && httpMethod === "POST") {
      return handleGoogleOAuth(request, env)
    }
    if (pathname === "/api/auth/logout" && httpMethod === "POST") {
      return handleLogout(request, env)
    }
    if (pathname === "/api/auth/refresh" && httpMethod === "POST") {
      return handleRefresh(request, env)
    }

    // ── Protected routes ───────────────────────────────────────────────────
    if (pathname === "/api/auth/me" && httpMethod === "GET") {
      return handleMe(request, env)
    }

    if (pathname === "/api/quotes" && httpMethod === "GET") {
      return handleQuotes(request, env)
    }

    const chartMatch = pathname.match(/^\/api\/chart\/([^/]+)$/)
    if (chartMatch && httpMethod === "GET") {
      return handleChart(request, env, chartMatch[1])
    }

    if (pathname === "/api/vectors" && httpMethod === "GET") {
      return handleVectors(request, env)
    }

    if (pathname === "/api/news" && httpMethod === "GET") {
      return handleNews(request, env)
    }

    const predictMatch = pathname.match(/^\/api\/predict\/([^/]+)$/)
    if (predictMatch && httpMethod === "GET") {
      return handlePredict(request, env, predictMatch[1])
    }

    const eli5Match = pathname.match(/^\/api\/eli5\/([^/]+)$/)
    if (eli5Match && httpMethod === "GET") {
      return handleEli5(request, env, decodeURIComponent(eli5Match[1]))
    }

    if (pathname === "/api/watchlist") {
      if (httpMethod === "GET") return handleWatchlistGet(request, env)
      if (httpMethod === "POST") return handleWatchlistPost(request, env)
    }

    const watchlistDeleteMatch = pathname.match(/^\/api\/watchlist\/([^/]+)$/)
    if (watchlistDeleteMatch && httpMethod === "DELETE") {
      return handleWatchlistDelete(request, env, watchlistDeleteMatch[1])
    }

    if (pathname === "/api/portfolio") {
      if (httpMethod === "GET") return handlePortfolioGet(request, env)
      if (httpMethod === "POST") return handlePortfolioPost(request, env)
    }

    const portfolioDeleteMatch = pathname.match(/^\/api\/portfolio\/([^/]+)$/)
    if (portfolioDeleteMatch && httpMethod === "DELETE") {
      return handlePortfolioDelete(request, env, portfolioDeleteMatch[1])
    }

    if (pathname === "/api/scrub/latest" && httpMethod === "GET") {
      return handleScrubLatest(env)
    }
    if (pathname === "/api/scrub/runs" && httpMethod === "GET") {
      return handleScrubRuns(env)
    }
    if (pathname === "/api/scrub/trigger" && httpMethod === "POST") {
      return handleScrubTrigger(request, env)
    }

    return json({ error: "Not found" }, 404)
  },
}
