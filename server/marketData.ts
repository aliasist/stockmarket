/**
 * Market Data Service
 * Primary: Yahoo Finance (via yf-api compatible endpoint, no key needed)
 * Fallback: Mock data with realistic structure
 */

import axios from "axios";

export interface QuoteData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52w?: number;
  low52w?: number;
  previousClose: number;
  open: number;
  timestamp: string;
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Yahoo Finance v8 API (public, no key required)
async function fetchYahooQuote(ticker: string): Promise<QuoteData | null> {
  try {
    const resp = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`,
      {
        timeout: 8000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );
    const result = resp.data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.chartPreviousClose || 0;
    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
    return {
      ticker,
      name: meta.longName || meta.shortName || meta.symbol,
      price,
      change: +change.toFixed(2),
      changePercent: +changePercent.toFixed(2),
      volume: meta.regularMarketVolume || 0,
      marketCap: meta.marketCap,
      high52w: meta.fiftyTwoWeekHigh,
      low52w: meta.fiftyTwoWeekLow,
      previousClose: prevClose,
      open: meta.regularMarketOpen || price,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Intraday chart data
async function fetchYahooChart(ticker: string, range = "5d", interval = "15m"): Promise<CandleData[]> {
  try {
    const resp = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`,
      {
        timeout: 8000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );
    const result = resp.data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp || [];
    const ohlcv = result.indicators?.quote?.[0];
    if (!ohlcv) return [];

    return timestamps.map((ts: number, i: number) => ({
      timestamp: ts * 1000,
      open: ohlcv.open?.[i] || 0,
      high: ohlcv.high?.[i] || 0,
      low: ohlcv.low?.[i] || 0,
      close: ohlcv.close?.[i] || 0,
      volume: ohlcv.volume?.[i] || 0,
    })).filter((c) => c.close > 0);
  } catch {
    return [];
  }
}

// Generate mock data as ultimate fallback
function mockQuote(ticker: string): QuoteData {
  const prices: Record<string, number> = {
    "SPY": 542.18, "QQQ": 448.73, "BTC-USD": 68420.50,
    "AAPL": 189.30, "NVDA": 875.40, "TSLA": 177.60,
  };
  const base = prices[ticker] || 100;
  const change = (Math.random() - 0.48) * base * 0.03;
  return {
    ticker,
    name: ticker,
    price: +(base + change).toFixed(2),
    change: +change.toFixed(2),
    changePercent: +((change / base) * 100).toFixed(2),
    volume: Math.floor(Math.random() * 50000000 + 5000000),
    previousClose: base,
    open: +(base + (Math.random() - 0.5) * base * 0.01).toFixed(2),
    timestamp: new Date().toISOString(),
  };
}

function mockCandles(ticker: string, count = 50): CandleData[] {
  const prices: Record<string, number> = {
    "SPY": 542, "QQQ": 448, "BTC-USD": 68000,
    "AAPL": 189, "NVDA": 875, "TSLA": 177,
  };
  const base = prices[ticker] || 100;
  const candles: CandleData[] = [];
  let price = base;
  const now = Date.now();

  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.49) * price * 0.02;
    const close = +(price + change).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * price * 0.005).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * price * 0.005).toFixed(2);
    candles.push({
      timestamp: now - i * 15 * 60 * 1000,
      open, high, low, close,
      volume: Math.floor(Math.random() * 1000000 + 100000),
    });
    price = close;
  }
  return candles;
}

// Public API
export async function getQuotes(tickers: string[]): Promise<QuoteData[]> {
  const results = await Promise.all(tickers.map(fetchYahooQuote));
  return results.map((q, i) => q || mockQuote(tickers[i]));
}

export async function getChart(ticker: string, range = "5d", interval = "15m"): Promise<CandleData[]> {
  const data = await fetchYahooChart(ticker, range, interval);
  if (data.length > 0) return data;
  return mockCandles(ticker);
}
