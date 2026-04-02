/**
 * Cloudflare Services Integration
 * - Workers AI: fast LLM inference for ELI5 explanations
 * - D1: persistent cloud database for scrub memory
 */

import axios from "axios";

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const CF_DB_ID = process.env.CLOUDFLARE_D1_DB_ID || "";
const CF_ANALYTICS_DB_ID = process.env.CLOUDFLARE_D1_ANALYTICS_DB_ID || "";

const cfHeaders = {
  Authorization: `Bearer ${CF_API_TOKEN}`,
  "Content-Type": "application/json",
};

// ── Workers AI ───────────────────────────────────────────────────────────────

export async function generateEli5WithCF(term: string): Promise<string | null> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) return null;

  try {
    const resp = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        messages: [
          {
            role: "system",
            content:
              "You are an extremely friendly teacher explaining financial concepts to a 5-year-old. Use ONLY metaphors involving playgrounds, toys, candy, ice cream, piggy banks, or games. Never use jargon. Be warm, fun, and reassuring. Keep it to 2-3 sentences.",
          },
          {
            role: "user",
            content: `Explain this financial term starting with "Imagine...": "${term}"`,
          },
        ],
      },
      { headers: cfHeaders, timeout: 15000 }
    );

    return resp.data?.result?.response || null;
  } catch (err: any) {
    console.error("[CF AI] ELI5 error:", err.message);
    return null;
  }
}

export async function analyzeToneWithCF(
  title: string,
  snippet: string
): Promise<{ tone: string; reasoning: string } | null> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) return null;

  try {
    const resp = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        messages: [
          {
            role: "system",
            content:
              'You are a financial journalism analyst. Classify the tone of news as one of: "fear_mongering", "speculative", "data_backed", or "neutral". Respond with JSON only: {"tone": "...", "reasoning": "one sentence"}',
          },
          {
            role: "user",
            content: `Title: ${title}\nSnippet: ${snippet || "N/A"}`,
          },
        ],
      },
      { headers: cfHeaders, timeout: 15000 }
    );

    const text = resp.data?.result?.response || "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ── D1 Database ───────────────────────────────────────────────────────────────

export async function queryD1(sql: string, params: any[] = []): Promise<any[]> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_DB_ID) return [];

  try {
    const resp = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DB_ID}/query`,
      { sql, params },
      { headers: cfHeaders, timeout: 10000 }
    );

    return resp.data?.result?.[0]?.results || [];
  } catch (err: any) {
    console.error("[CF D1] Query error:", err.message);
    return [];
  }
}

export async function initD1Tables(): Promise<void> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_DB_ID) return;

  const tables = [
    `CREATE TABLE IF NOT EXISTS scrub_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_at TEXT NOT NULL,
      sources TEXT NOT NULL,
      vectors_found INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      summary TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS market_vectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scrub_run_id INTEGER NOT NULL,
      ticker TEXT,
      signal TEXT NOT NULL,
      confidence REAL NOT NULL,
      reasoning TEXT NOT NULL,
      sources TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS news_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scrub_run_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      url TEXT NOT NULL,
      published_at TEXT,
      summary TEXT,
      tone TEXT,
      tone_reasoning TEXT,
      ticker TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS eli5_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL UNIQUE,
      explanation TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
  ];

  for (const sql of tables) {
    await queryD1(sql);
  }

  console.log("[CF D1] Tables initialized");
}

export const cloudflareAvailable = (): boolean =>
  !!(CF_ACCOUNT_ID && CF_API_TOKEN);

export const d1Available = (): boolean =>
  !!(CF_ACCOUNT_ID && CF_API_TOKEN && CF_DB_ID);

export const d1AnalyticsAvailable = (): boolean =>
  !!(CF_ACCOUNT_ID && CF_API_TOKEN && CF_ANALYTICS_DB_ID);

// ── D1 Analytics Database ─────────────────────────────────────────────────────

export async function queryD1Analytics(sql: string, params: any[] = []): Promise<any[]> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_ANALYTICS_DB_ID) return [];

  try {
    const resp = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_ANALYTICS_DB_ID}/query`,
      { sql, params },
      { headers: cfHeaders, timeout: 10000 }
    );

    return resp.data?.result?.[0]?.results || [];
  } catch (err: any) {
    console.error("[CF D1 Analytics] Query error:", err.message);
    return [];
  }
}
