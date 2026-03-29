export interface Env {
  DB: D1Database
  AI: {
    run(model: string, inputs: Record<string, unknown>): Promise<any>
  }
  ASSETS: {
    fetch(request: Request): Promise<Response>
  }
  ANALYTICS_ENGINE: AnalyticsEngineDataset
}

export interface AnalyticsEngineDataset {
  query(query: string, params?: Record<string, unknown>): Promise<any>
  insert(data: Record<string, unknown>): Promise<any>
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
