# Market Pulse & Pedagogy

Real-time stock dashboard with AI-powered analysis, news scraping, and ELI5 learning mode.

**Created by [Aliasist.com](https://aliasist.com) · dev@aliasist.com**

## Features

- **Live Watchlist** — Real-time quotes for SPY, QQQ, BTC-USD, AAPL, NVDA, TSLA
- **Price Charts** — Interactive line charts with 1D, 5D, 1M, 3M time ranges
- **Predictive Reasoning** — AI-generated 24h directional predictions via Google Gemini
- **Market Vectors** — Sentiment signals derived from scraped news articles
- **News Feed** — Scraped from Hacker News, Reddit, BlueSky, Yahoo Finance with tone classification
- **Learning Mode (ELI5)** — Kid-friendly explanations of financial terms
- **Recursive Scrub Engine** — Automatic 15-minute news scraping cycle

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript (Vite) |
| Backend | Express.js |
| AI | Google Gemini 1.5 Flash |
| Market Data | Yahoo Finance |
| Database | SQLite (better-sqlite3) |
| Runtime | Node.js |
| Cloud Services | Cloudflare |

## Deployment

1. Push this repo to GitHub
2. For the current Node runtime, install dependencies and build with npm:
   - `npm install`
   - `npm run build`
3. Run the production server with:
   - `npm start`
4. Set environment variables:
   - `GEMINI_API_KEY` — Get one at https://aistudio.google.com/app/apikey
   - `CLOUDFLARE_ACCOUNT_ID` — Optional, enables Cloudflare Workers AI and D1 access
   - `CLOUDFLARE_API_TOKEN` — Optional, enables Cloudflare Workers AI and D1 access
   - `CLOUDFLARE_D1_DB_ID` — Optional, enables Cloudflare D1 queries
5. Point your custom domain (for example `pulse.aliasist.com`) at the host serving this Node app

## Cloudflare Workers Migration

This repo now also includes a Cloudflare-native runtime:

1. Build the frontend assets:
   - `npm run build:client`
2. Create a D1 database in Cloudflare and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `wrangler.jsonc`
3. Apply the schema:
   - `npm run cf:d1:migrate`
4. Enable the Workers AI binding in `wrangler.jsonc` for AI features
5. Preview locally:
   - `npm run cf:preview`
6. Deploy:
   - `npm run cf:deploy`

The Worker entrypoint lives in `worker/index.ts`, serves the built SPA from `dist/client`, uses D1 for persistence, uses Workers AI for LLM features, and runs the scrub job every 15 minutes via Cloudflare cron.

## Local Development

```bash
cp .env.example .env
# Edit .env and add your Gemini API key
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/health | Server status |
| GET | /api/quotes | All watchlist quotes |
| GET | /api/chart/:ticker | OHLCV chart data |
| GET | /api/news | Scraped news articles |
| GET | /api/vectors | Market sentiment signals |
| GET | /api/predict/:ticker | AI prediction |
| GET | /api/eli5/:term | ELI5 explanation |
| GET | /api/scrub/latest | Latest scrub run |
| POST | /api/scrub/trigger | Manual scrub |
| GET/POST/DELETE | /api/watchlist | Manage tickers |
