const DEFAULT_WATCHLIST = [
    { ticker: "SPY", name: "S&P 500 ETF", type: "etf", addedAt: "seed" },
    { ticker: "QQQ", name: "Nasdaq 100 ETF", type: "etf", addedAt: "seed" },
    { ticker: "BTC-USD", name: "Bitcoin", type: "crypto", addedAt: "seed" },
    { ticker: "AAPL", name: "Apple Inc.", type: "stock", addedAt: "seed" },
    { ticker: "NVDA", name: "NVIDIA Corp.", type: "stock", addedAt: "seed" },
    { ticker: "TSLA", name: "Tesla Inc.", type: "stock", addedAt: "seed" },
];
let schemaReady = null;
async function run(env, sql, ...params) {
    const normalized = params.map((value) => (value === undefined ? null : value));
    return env.DB.prepare(sql).bind(...normalized).run();
}
async function all(env, sql, ...params) {
    const normalized = params.map((value) => (value === undefined ? null : value));
    const result = await env.DB.prepare(sql).bind(...normalized).all();
    return (result.results || []);
}
async function first(env, sql, ...params) {
    const normalized = params.map((value) => (value === undefined ? null : value));
    const result = await env.DB.prepare(sql).bind(...normalized).first();
    return (result ?? null);
}
async function seedWatchlist(env) {
    const countRow = await first(env, "SELECT COUNT(*) as count FROM watchlist");
    if ((countRow?.count ?? 0) > 0) {
        return;
    }
    const now = new Date().toISOString();
    await Promise.all(DEFAULT_WATCHLIST.map((item) => run(env, "INSERT OR IGNORE INTO watchlist (ticker, name, type, added_at) VALUES (?, ?, ?, ?)", item.ticker, item.name, item.type, now)));
}
function mapScrubRun(row) {
    return {
        id: row.id,
        runAt: row.run_at,
        sources: row.sources,
        vectorsFound: row.vectors_found,
        status: row.status,
        summary: row.summary,
    };
}
function mapMarketVector(row) {
    return {
        id: row.id,
        scrubRunId: row.scrub_run_id,
        ticker: row.ticker,
        signal: row.signal,
        confidence: row.confidence,
        reasoning: row.reasoning,
        sources: row.sources,
        createdAt: row.created_at,
    };
}
function mapNewsArticle(row) {
    return {
        id: row.id,
        scrubRunId: row.scrub_run_id,
        title: row.title,
        source: row.source,
        url: row.url,
        publishedAt: row.published_at,
        summary: row.summary,
        tone: row.tone,
        toneReasoning: row.tone_reasoning,
        ticker: row.ticker,
    };
}
function mapEli5Cache(row) {
    return {
        id: row.id,
        term: row.term,
        explanation: row.explanation,
        createdAt: row.created_at,
    };
}
function mapWatchlist(row) {
    return {
        id: row.id,
        ticker: row.ticker,
        name: row.name,
        type: row.type,
        addedAt: row.added_at,
    };
}
export async function ensureSchema(env) {
    if (!schemaReady) {
        schemaReady = (async () => {
            const statements = [
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
                `CREATE TABLE IF NOT EXISTS watchlist (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticker TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'stock',
          added_at TEXT NOT NULL
        )`,
            ];
            for (const sql of statements) {
                await run(env, sql);
            }
            await seedWatchlist(env);
        })();
    }
    return schemaReady;
}
export const storage = {
    async createScrubRun(env, data) {
        await run(env, "INSERT INTO scrub_runs (run_at, sources, vectors_found, status, summary) VALUES (?, ?, ?, ?, ?)", data.runAt, data.sources, data.vectorsFound ?? 0, data.status ?? "pending", data.summary ?? null);
        const row = await first(env, "SELECT * FROM scrub_runs ORDER BY id DESC LIMIT 1");
        return mapScrubRun(row);
    },
    async updateScrubRun(env, id, data) {
        const existingRow = await first(env, "SELECT * FROM scrub_runs WHERE id = ?", id);
        if (!existingRow) {
            return null;
        }
        const existing = mapScrubRun(existingRow);
        await run(env, `UPDATE scrub_runs
       SET run_at = ?, sources = ?, vectors_found = ?, status = ?, summary = ?
       WHERE id = ?`, data.runAt ?? existing.runAt, data.sources ?? existing.sources, data.vectorsFound ?? existing.vectorsFound, data.status ?? existing.status, data.summary ?? existing.summary ?? null, id);
        const row = await first(env, "SELECT * FROM scrub_runs WHERE id = ?", id);
        return row ? mapScrubRun(row) : null;
    },
    async getLatestScrubRun(env) {
        const row = await first(env, "SELECT * FROM scrub_runs ORDER BY id DESC LIMIT 1");
        return row ? mapScrubRun(row) : null;
    },
    async getScrubRuns(env, limit = 20) {
        const rows = await all(env, "SELECT * FROM scrub_runs ORDER BY id DESC LIMIT ?", limit);
        return rows.map(mapScrubRun);
    },
    async createMarketVector(env, data) {
        await run(env, `INSERT INTO market_vectors
       (scrub_run_id, ticker, signal, confidence, reasoning, sources, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, data.scrubRunId, data.ticker ?? null, data.signal, data.confidence, data.reasoning, data.sources, data.createdAt);
        const row = await first(env, "SELECT * FROM market_vectors ORDER BY id DESC LIMIT 1");
        return mapMarketVector(row);
    },
    async getLatestVectors(env, limit = 20) {
        const rows = await all(env, "SELECT * FROM market_vectors ORDER BY id DESC LIMIT ?", limit);
        return rows.map(mapMarketVector);
    },
    async getVectorsByTicker(env, ticker) {
        const rows = await all(env, "SELECT * FROM market_vectors WHERE ticker = ? ORDER BY id DESC LIMIT 10", ticker);
        return rows.map(mapMarketVector);
    },
    async createNewsArticle(env, data) {
        await run(env, `INSERT INTO news_articles
       (scrub_run_id, title, source, url, published_at, summary, tone, tone_reasoning, ticker)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, data.scrubRunId, data.title, data.source, data.url, data.publishedAt ?? null, data.summary ?? null, data.tone ?? null, data.toneReasoning ?? null, data.ticker ?? null);
        const row = await first(env, "SELECT * FROM news_articles ORDER BY id DESC LIMIT 1");
        return mapNewsArticle(row);
    },
    async getLatestNews(env, limit = 50) {
        const rows = await all(env, "SELECT * FROM news_articles ORDER BY id DESC LIMIT ?", limit);
        return rows.map(mapNewsArticle);
    },
    async getEli5(env, term) {
        const row = await first(env, "SELECT * FROM eli5_cache WHERE lower(term) = lower(?) LIMIT 1", term);
        return row ? mapEli5Cache(row) : null;
    },
    async saveEli5(env, data) {
        await run(env, `INSERT INTO eli5_cache (term, explanation, created_at)
       VALUES (?, ?, ?)
       ON CONFLICT(term) DO UPDATE SET explanation = excluded.explanation, created_at = excluded.created_at`, data.term, data.explanation, data.createdAt);
        const row = await first(env, "SELECT * FROM eli5_cache WHERE lower(term) = lower(?) LIMIT 1", data.term);
        return mapEli5Cache(row);
    },
    async getWatchlist(env) {
        const rows = await all(env, "SELECT * FROM watchlist ORDER BY added_at ASC");
        return rows.map(mapWatchlist);
    },
    async addToWatchlist(env, data) {
        await run(env, "INSERT INTO watchlist (ticker, name, type, added_at) VALUES (?, ?, ?, ?)", data.ticker, data.name, data.type, data.addedAt);
        const row = await first(env, "SELECT * FROM watchlist WHERE ticker = ? LIMIT 1", data.ticker);
        return mapWatchlist(row);
    },
    async removeFromWatchlist(env, ticker) {
        await run(env, "DELETE FROM watchlist WHERE ticker = ?", ticker);
    },
};
