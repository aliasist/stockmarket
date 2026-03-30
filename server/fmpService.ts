/**
 * Financial Modeling Prep (FMP) API Service
 * Base URL: https://financialmodelingprep.com/api/v3
 * Key from: process.env.FMP_API_KEY
 *
 * All functions return graceful fallback data on error — never throw.
 * Results are cached in-memory for CACHE_TTL_MS (5 minutes).
 */

import axios from "axios";

// ── Constants ────────────────────────────────────────────────────────────────

const FMP_BASE_URL = "https://financialmodelingprep.com/api/v3";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Cache infrastructure ─────────────────────────────────────────────────────

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T): T {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

function cacheKey(fn: string, ticker: string): string {
  return `${fn}:${ticker.toUpperCase()}`;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface KeyMetricEntry {
  year: number;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  peRatio: number;
  pbRatio: number;
  priceToSalesRatio: number;
  evToEbitda: number;
  returnOnEquity: number;
  returnOnAssets: number;
  debtToEquity: number;
  currentRatio: number;
  dividendYield: number;
}

export interface AnalystRatings {
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  avgPriceTarget: number;
  numAnalysts: number;
  consensus: "Buy" | "Hold" | "Sell" | "Strong Buy" | "Strong Sell";
}

export interface EarningsEntry {
  date: string;
  eps: number | null;
  epsEstimated: number | null;
  revenue: number | null;
  revenueEstimated: number | null;
}

export interface IncomeEntry {
  year: number;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  eps: number;
  ebitda: number;
}

export interface BalanceSheetEntry {
  year: number;
  totalDebt: number;
  cashAndEquivalents: number;
  totalAssets: number;
  totalEquity: number;
}

export interface CompanyProfile {
  name: string;
  sector: string;
  industry: string;
  description: string;
  website: string;
  employees: number;
  ceo: string;
  country: string;
  price: number;
  mktCap: number;
  beta: number;
  volAvg: number;
  lastDiv: number;
  range: string;
  changes: number;
  currency: string;
  ipoDate: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function apiKey(): string | null {
  return process.env.FMP_API_KEY || null;
}

function num(val: unknown, fallback = 0): number {
  const n = Number(val);
  return isFinite(n) ? n : fallback;
}

// ── 1. getKeyMetrics ─────────────────────────────────────────────────────────

export async function getKeyMetrics(ticker: string): Promise<KeyMetricEntry[]> {
  const key = cacheKey("getKeyMetrics", ticker);
  const cached = getCached<KeyMetricEntry[]>(key);
  if (cached) return cached;

  const apikey = apiKey();
  if (!apikey) return setCached(key, []);

  try {
    const url = `${FMP_BASE_URL}/key-metrics/${encodeURIComponent(ticker.toUpperCase())}?limit=5&apikey=${apikey}`;
    const { data } = await axios.get<unknown[]>(url, { timeout: 10_000 });
    if (!Array.isArray(data)) return setCached(key, []);

    const result: KeyMetricEntry[] = data.map((item: Record<string, unknown>) => ({
      year: num(item.calendarYear || new Date(String(item.date || "")).getFullYear()),
      revenuePerShare: num(item.revenuePerShare),
      netIncomePerShare: num(item.netIncomePerShare),
      operatingCashFlowPerShare: num(item.operatingCashFlowPerShare),
      freeCashFlowPerShare: num(item.freeCashFlowPerShare),
      peRatio: num(item.peRatio),
      pbRatio: num(item.pbRatio),
      priceToSalesRatio: num(item.priceToSalesRatio),
      evToEbitda: num(item.evToEbitda),
      returnOnEquity: num(item.returnOnEquity),
      returnOnAssets: num(item.returnOnAssets),
      debtToEquity: num(item.debtToEquity),
      currentRatio: num(item.currentRatio),
      dividendYield: num(item.dividendYield),
    }));

    return setCached(key, result);
  } catch {
    return setCached(key, []);
  }
}

// ── 2. getAnalystRatings ─────────────────────────────────────────────────────

export async function getAnalystRatings(ticker: string): Promise<AnalystRatings> {
  const fallback: AnalystRatings = {
    buy: 0, hold: 0, sell: 0, strongBuy: 0, strongSell: 0,
    avgPriceTarget: 0, numAnalysts: 0, consensus: "Hold",
  };

  const key = cacheKey("getAnalystRatings", ticker);
  const cached = getCached<AnalystRatings>(key);
  if (cached) return cached;

  const apikey = apiKey();
  if (!apikey) return setCached(key, fallback);

  try {
    const url = `${FMP_BASE_URL}/analyst-stock-recommendations/${encodeURIComponent(ticker.toUpperCase())}?limit=10&apikey=${apikey}`;
    const { data } = await axios.get<unknown[]>(url, { timeout: 10_000 });
    if (!Array.isArray(data) || data.length === 0) return setCached(key, fallback);

    let buy = 0, hold = 0, sell = 0, strongBuy = 0, strongSell = 0;
    let priceTargetSum = 0;
    let priceTargetCount = 0;

    for (const item of data as Record<string, unknown>[]) {
      const rec = String(item.analystRatingsStrongBuy !== undefined ? "" : (item.recommendation || item.rating || "")).toLowerCase();

      // Tally recommendation counts from aggregated fields if present
      strongBuy += num(item.analystRatingsStrongBuy);
      buy += num(item.analystRatingsbuy);
      hold += num(item.analystRatingsHold);
      sell += num(item.analystRatingsSell);
      strongSell += num(item.analystRatingsStrongSell);

      // Also handle individual-record style (one row = one analyst)
      if (item.recommendation !== undefined) {
        const r = String(item.recommendation).toLowerCase();
        if (r.includes("strong buy")) strongBuy++;
        else if (r.includes("strong sell")) strongSell++;
        else if (r.includes("buy")) buy++;
        else if (r.includes("sell")) sell++;
        else if (r.includes("hold") || r.includes("neutral")) hold++;
      }

      if (item.priceTarget !== undefined && item.priceTarget !== null) {
        const pt = num(item.priceTarget);
        if (pt > 0) {
          priceTargetSum += pt;
          priceTargetCount++;
        }
      }
    }

    const total = strongBuy + buy + hold + sell + strongSell;
    const avgPriceTarget = priceTargetCount > 0
      ? Math.round((priceTargetSum / priceTargetCount) * 100) / 100
      : 0;

    // Determine consensus
    let consensus: AnalystRatings["consensus"] = "Hold";
    if (total > 0) {
      const bullish = strongBuy + buy;
      const bearish = strongSell + sell;
      const bullRatio = bullish / total;
      const bearRatio = bearish / total;
      if (bullRatio >= 0.6) consensus = strongBuy / total >= 0.3 ? "Strong Buy" : "Buy";
      else if (bearRatio >= 0.6) consensus = strongSell / total >= 0.3 ? "Strong Sell" : "Sell";
      else consensus = "Hold";
    }

    const result: AnalystRatings = {
      buy, hold, sell, strongBuy, strongSell,
      avgPriceTarget,
      numAnalysts: total,
      consensus,
    };

    return setCached(key, result);
  } catch {
    return setCached(key, fallback);
  }
}

// ── 3. getComparables ────────────────────────────────────────────────────────

export async function getComparables(ticker: string): Promise<string[]> {
  const key = cacheKey("getComparables", ticker);
  const cached = getCached<string[]>(key);
  if (cached) return cached;

  const apikey = apiKey();
  if (!apikey) return setCached(key, []);

  try {
    const url = `${FMP_BASE_URL}/stock-peers/${encodeURIComponent(ticker.toUpperCase())}?apikey=${apikey}`;
    const { data } = await axios.get<unknown[]>(url, { timeout: 10_000 });
    if (!Array.isArray(data)) return setCached(key, []);

    // FMP returns [{ symbol, peersList: string[] }] or a flat string[]
    let peers: string[] = [];
    if (data.length > 0) {
      const first = data[0] as Record<string, unknown>;
      if (Array.isArray(first.peersList)) {
        peers = (first.peersList as unknown[]).map(String);
      } else if (typeof first === "string") {
        peers = data.map(String);
      } else {
        // flat array of ticker strings
        peers = data.map((d) => String((d as Record<string, unknown>).symbol || d));
      }
    }

    return setCached(key, peers.slice(0, 8));
  } catch {
    return setCached(key, []);
  }
}

// ── 4. getEarningsCalendar ───────────────────────────────────────────────────

export async function getEarningsCalendar(ticker: string): Promise<EarningsEntry[]> {
  const key = cacheKey("getEarningsCalendar", ticker);
  const cached = getCached<EarningsEntry[]>(key);
  if (cached) return cached;

  const apikey = apiKey();
  if (!apikey) return setCached(key, []);

  try {
    const url = `${FMP_BASE_URL}/historical/earning_calendar/${encodeURIComponent(ticker.toUpperCase())}?limit=8&apikey=${apikey}`;
    const { data } = await axios.get<unknown[]>(url, { timeout: 10_000 });
    if (!Array.isArray(data)) return setCached(key, []);

    const result: EarningsEntry[] = data.map((item: Record<string, unknown>) => ({
      date: String(item.date || ""),
      eps: item.eps !== null && item.eps !== undefined ? num(item.eps) : null,
      epsEstimated: item.epsEstimated !== null && item.epsEstimated !== undefined ? num(item.epsEstimated) : null,
      revenue: item.revenue !== null && item.revenue !== undefined ? num(item.revenue) : null,
      revenueEstimated: item.revenueEstimated !== null && item.revenueEstimated !== undefined ? num(item.revenueEstimated) : null,
    }));

    return setCached(key, result);
  } catch {
    return setCached(key, []);
  }
}

// ── 5. getIncomeStatement ────────────────────────────────────────────────────

export async function getIncomeStatement(ticker: string): Promise<IncomeEntry[]> {
  const key = cacheKey("getIncomeStatement", ticker);
  const cached = getCached<IncomeEntry[]>(key);
  if (cached) return cached;

  const apikey = apiKey();
  if (!apikey) return setCached(key, []);

  try {
    const url = `${FMP_BASE_URL}/income-statement/${encodeURIComponent(ticker.toUpperCase())}?limit=5&period=annual&apikey=${apikey}`;
    const { data } = await axios.get<unknown[]>(url, { timeout: 10_000 });
    if (!Array.isArray(data)) return setCached(key, []);

    const result: IncomeEntry[] = data.map((item: Record<string, unknown>) => ({
      year: num(item.calendarYear || new Date(String(item.date || "")).getFullYear()),
      revenue: num(item.revenue),
      netIncome: num(item.netIncome),
      grossProfit: num(item.grossProfit),
      operatingIncome: num(item.operatingIncome),
      eps: num(item.eps),
      ebitda: num(item.ebitda),
    }));

    return setCached(key, result);
  } catch {
    return setCached(key, []);
  }
}

// ── 6. getBalanceSheet ───────────────────────────────────────────────────────

export async function getBalanceSheet(ticker: string): Promise<BalanceSheetEntry[]> {
  const key = cacheKey("getBalanceSheet", ticker);
  const cached = getCached<BalanceSheetEntry[]>(key);
  if (cached) return cached;

  const apikey = apiKey();
  if (!apikey) return setCached(key, []);

  try {
    const url = `${FMP_BASE_URL}/balance-sheet-statement/${encodeURIComponent(ticker.toUpperCase())}?limit=5&period=annual&apikey=${apikey}`;
    const { data } = await axios.get<unknown[]>(url, { timeout: 10_000 });
    if (!Array.isArray(data)) return setCached(key, []);

    const result: BalanceSheetEntry[] = data.map((item: Record<string, unknown>) => ({
      year: num(item.calendarYear || new Date(String(item.date || "")).getFullYear()),
      totalDebt: num(item.totalDebt),
      cashAndEquivalents: num(item.cashAndCashEquivalents ?? item.cashAndEquivalents),
      totalAssets: num(item.totalAssets),
      totalEquity: num(item.totalStockholdersEquity ?? item.totalEquity),
    }));

    return setCached(key, result);
  } catch {
    return setCached(key, []);
  }
}

// ── 7. getProfile ────────────────────────────────────────────────────────────

export async function getProfile(ticker: string): Promise<CompanyProfile | null> {
  const key = cacheKey("getProfile", ticker);
  const cached = getCached<CompanyProfile | null>(key);
  if (cached !== null) return cached;
  // null could mean "cached as no data" — check map directly
  if (cache.has(key)) return null;

  const apikey = apiKey();
  if (!apikey) {
    setCached(key, null);
    return null;
  }

  try {
    const url = `${FMP_BASE_URL}/profile/${encodeURIComponent(ticker.toUpperCase())}?apikey=${apikey}`;
    const { data } = await axios.get<unknown[]>(url, { timeout: 10_000 });
    if (!Array.isArray(data) || data.length === 0) {
      setCached(key, null);
      return null;
    }

    const item = data[0] as Record<string, unknown>;

    const result: CompanyProfile = {
      name: String(item.companyName || item.name || ""),
      sector: String(item.sector || ""),
      industry: String(item.industry || ""),
      description: String(item.description || ""),
      website: String(item.website || ""),
      employees: num(item.fullTimeEmployees),
      ceo: String(item.ceo || ""),
      country: String(item.country || ""),
      price: num(item.price),
      mktCap: num(item.mktCap),
      beta: num(item.beta),
      volAvg: num(item.volAvg),
      lastDiv: num(item.lastDiv),
      range: String(item.range || ""),
      changes: num(item.changes),
      currency: String(item.currency || "USD"),
      ipoDate: String(item.ipoDate || ""),
    };

    return setCached(key, result);
  } catch {
    setCached(key, null);
    return null;
  }
}
