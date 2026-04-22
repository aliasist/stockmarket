export interface Env {
  DB: D1Database
  ANALYTICS: D1Database
  AI: {
    run(model: string, inputs: Record<string, unknown>): Promise<any>
  }
  ASSETS: {
    fetch(request: Request): Promise<Response>
  }
  ANALYTICS_ENGINE: AnalyticsEngineDataset
  // API keys — set as Cloudflare Worker Secrets
  GROQ_API_KEY?: string
  GEMINI_API_KEY?: string
  FMP_API_KEY?: string
  DD_API_KEY?: string
  ADMIN_PASSWORD?: string
}

export interface AnalyticsEngineDataset {
  query(query: string, params?: Record<string, unknown>): Promise<any>
  insert(data: Record<string, unknown>): Promise<any>
  writeDataPoint(data: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void
}

export interface RawArticle {
  title: string
  url: string
  source: string
  publishedAt?: string
  snippet?: string
}

export interface AnalyzedArticle extends RawArticle {
  tone?: string
  toneReasoning?: string
  ticker?: string | null
  summary?: string
}
