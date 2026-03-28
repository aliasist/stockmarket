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
| Deployment | Railway |
| CDN | Cloudflare |

## Deployment (Railway)

1. Push this repo to GitHub
2. Create a new Railway project → Deploy from GitHub
3. Set environment variables:
   - `GEMINI_API_KEY` — Get one at https://aistudio.google.com/app/apikey
4. Railway auto-detects Node.js and runs `npm start`
5. Point your custom domain (e.g., `pulse.aliasist.com`) to the Railway service URL

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
