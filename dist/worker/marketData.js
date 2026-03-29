const QUOTE_CACHE_TTL_MS = 15_000;
const CHART_CACHE_TTL_MS = 30_000;
const quoteCache = new Map();
const chartCache = new Map();
function getCached(cache, key) {
    const cached = cache.get(key);
    if (!cached) {
        return null;
    }
    if (cached.expiresAt <= Date.now()) {
        cache.delete(key);
        return null;
    }
    return cached.value;
}
function setCached(cache, key, value, ttlMs) {
    cache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
    });
    return value;
}
async function fetchJson(url) {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "MarketPulse/1.0",
            },
        });
        if (!response.ok) {
            return null;
        }
        return response.json();
    }
    catch {
        return null;
    }
}
async function fetchYahooQuote(ticker) {
    const data = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1d&interval=1d`);
    const result = data?.chart?.result?.[0];
    if (!result) {
        return null;
    }
    const meta = result.meta;
    const price = meta.regularMarketPrice || meta.chartPreviousClose || 0;
    const previousClose = meta.chartPreviousClose || meta.previousClose || price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
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
        previousClose,
        open: meta.regularMarketOpen || price,
        timestamp: new Date().toISOString(),
    };
}
async function fetchYahooChart(ticker, range = "5d", interval = "15m") {
    const data = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`);
    const result = data?.chart?.result?.[0];
    if (!result) {
        return [];
    }
    const timestamps = result.timestamp || [];
    const ohlcv = result.indicators?.quote?.[0];
    if (!ohlcv) {
        return [];
    }
    return timestamps
        .map((timestamp, index) => ({
        timestamp: timestamp * 1000,
        open: ohlcv.open?.[index] || 0,
        high: ohlcv.high?.[index] || 0,
        low: ohlcv.low?.[index] || 0,
        close: ohlcv.close?.[index] || 0,
        volume: ohlcv.volume?.[index] || 0,
    }))
        .filter((candle) => candle.close > 0);
}
function mockQuote(ticker) {
    const prices = {
        SPY: 542.18,
        QQQ: 448.73,
        "BTC-USD": 68420.5,
        AAPL: 189.3,
        NVDA: 875.4,
        TSLA: 177.6,
    };
    const base = prices[ticker] || 100;
    const change = (Math.random() - 0.48) * base * 0.03;
    return {
        ticker,
        name: ticker,
        price: +(base + change).toFixed(2),
        change: +change.toFixed(2),
        changePercent: +((change / base) * 100).toFixed(2),
        volume: Math.floor(Math.random() * 50_000_000 + 5_000_000),
        previousClose: base,
        open: +(base + (Math.random() - 0.5) * base * 0.01).toFixed(2),
        timestamp: new Date().toISOString(),
    };
}
function mockCandles(ticker, count = 50) {
    const prices = {
        SPY: 542,
        QQQ: 448,
        "BTC-USD": 68000,
        AAPL: 189,
        NVDA: 875,
        TSLA: 177,
    };
    const candles = [];
    let price = prices[ticker] || 100;
    const now = Date.now();
    for (let index = count; index >= 0; index -= 1) {
        const open = price;
        const change = (Math.random() - 0.49) * price * 0.02;
        const close = +(price + change).toFixed(2);
        const high = +(Math.max(open, close) + Math.random() * price * 0.005).toFixed(2);
        const low = +(Math.min(open, close) - Math.random() * price * 0.005).toFixed(2);
        candles.push({
            timestamp: now - index * 15 * 60 * 1000,
            open,
            high,
            low,
            close,
            volume: Math.floor(Math.random() * 1_000_000 + 100_000),
        });
        price = close;
    }
    return candles;
}
export async function getQuotes(tickers) {
    const cacheKey = tickers.map((ticker) => ticker.toUpperCase()).sort().join(",");
    const cached = getCached(quoteCache, cacheKey);
    if (cached) {
        return cached;
    }
    const results = await Promise.all(tickers.map(fetchYahooQuote));
    const quotes = results.map((quote, index) => quote || mockQuote(tickers[index]));
    return setCached(quoteCache, cacheKey, quotes, QUOTE_CACHE_TTL_MS);
}
export async function getChart(ticker, range = "5d", interval = "15m") {
    const cacheKey = `${ticker.toUpperCase()}|${range}|${interval}`;
    const cached = getCached(chartCache, cacheKey);
    if (cached) {
        return cached;
    }
    const data = await fetchYahooChart(ticker, range, interval);
    if (data.length > 0) {
        return setCached(chartCache, cacheKey, data, CHART_CACHE_TTL_MS);
    }
    return setCached(chartCache, cacheKey, mockCandles(ticker), CHART_CACHE_TTL_MS);
}
