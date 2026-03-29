# Market Pulse & Pedagogy

Real-time stock dashboard with AI-powered analysis, news scraping, WebSocket live updates, and ELI5 learning mode.

**Created by [Aliasist.com](https://aliasist.com) · dev@aliasist.com**

## Features

- **Live Watchlist** — Real-time quotes via WebSocket (5s updates) with HTTP polling fallback
- **Price Charts** — Interactive area charts with 1D, 5D, 1M, 3M time ranges
- **Predictive Reasoning** — AI-generated 24h directional predictions via Google Gemini
- **Prediction Accuracy Tracking** — Records outcomes 24h later; tracks win rate per ticker
- **Market Vectors** — Cross-referenced sentiment signals from scraped news
- **Enhanced Sentiment Analysis** — 0–1 sentiment scores with bullish/bearish keyword matching
- **Sentiment Correlation** — Compare news sentiment vs actual price movement per ticker
- **News Feed** — Scraped from Hacker News, Reddit, BlueSky, Yahoo Finance with tone classification
- **Learning Mode (ELI5)** — Kid-friendly explanations of financial terms
- **Recursive Scrub Engine** — Automatic 15-minute news scraping cycle
- **Rate Limiting** — Per-IP limits to protect expensive Gemini API calls
- **Security Headers** — HSTS, X-Frame-Options, X-Content-Type-Options on all responses
- **Cloudflare D1 Ready** — Schema migration script for edge database sync

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Backend | Express.js + WebSocket (ws) |
| AI | Google Gemini 1.5 Flash |
| Market Data | Yahoo Finance |
| Database | SQLite (better-sqlite3) / Cloudflare D1 |
| Deployment | Railway |
| CDN / Edge | Cloudflare |

## Deployment (Railway)

1. Push this repo to GitHub
2. Create a new Railway project → Deploy from GitHub
3. Set environment variables (see `.env.example` for full list):
   - `GEMINI_API_KEY` — Get one at https://aistudio.google.com/app/apikey
   - `CLOUDFLARE_ACCOUNT_ID` — Optional, for D1 and Workers AI
   - `CLOUDFLARE_API_TOKEN` — Optional, for D1 and Workers AI
   - `CLOUDFLARE_D1_DB_ID` — Optional, for edge database sync
4. Railway auto-detects Node.js and runs `npm start`
5. Point your custom domain (e.g., `pulse.aliasist.com`) to the Railway service URL

## Cloudflare D1 Setup (Optional)

To sync your schema to Cloudflare D1 for edge performance:

```bash
# 1. Create a D1 database in the Cloudflare dashboard
# 2. Set environment variables
export CLOUDFLARE_ACCOUNT_ID=your_account_id
export CLOUDFLARE_API_TOKEN=your_api_token
export CLOUDFLARE_D1_DB_ID=your_d1_db_id

# 3. Run the migration script
node scripts/migrate-to-d1.js
```

## Local Development

```bash
cp .env.example .env
# Edit .env and add your Gemini API key
npm install
npm run dev
```

## Feature Flags

| Variable | Default | Description |
|---|---|---|
| `RATE_LIMIT_ENABLED` | `true` | Enable per-IP rate limiting |
| `CACHE_ENABLED` | `true` | Enable Cache-Control headers |
| `WEBSOCKET_ENABLED` | `true` | Enable WebSocket real-time updates |

## API Endpoints

| Method | Endpoint | Cache TTL | Rate Limit |
|---|---|---|---|
| GET | /api/health | no-store | 100/min |
| GET | /api/quotes | 60s | 100/min |
| GET | /api/chart/:ticker | 300s | 100/min |
| GET | /api/news | 180s | 100/min |
| GET | /api/news/sentiment-correlation/:ticker | 300s | 100/min |
| GET | /api/vectors | — | 100/min |
| GET | /api/predict/:ticker | 3600s | **10/min** |
| GET | /api/eli5/:term | 86400s | 100/min |
| GET | /api/scrub/latest | — | 100/min |
| POST | /api/scrub/trigger | no-store | **1/min** |
| GET/POST/DELETE | /api/watchlist | no-store | 100/min |
| POST | /api/predictions/log | — | 100/min |
| GET | /api/predictions/accuracy | — | 100/min |
| GET | /api/predictions/recent | — | 100/min |

## WebSocket

Connect to `ws://<host>/ws/quotes` for real-time price updates every 5 seconds.

```js
const ws = new WebSocket('ws://localhost:3000/ws/quotes');
ws.onmessage = (e) => {
  const { type, data, timestamp } = JSON.parse(e.data);
  if (type === 'quotes') console.log(data); // QuoteData[]
};
// Heartbeat
ws.send(JSON.stringify({ type: 'ping' })); // → { type: 'pong' }
```

The frontend automatically reconnects with exponential backoff (1s → 2s → 4s → … → 30s max).
