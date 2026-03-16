# RevOps Forecasting Tool

A full-stack revenue operations forecasting tool that pulls live deal data from HubSpot CRM and embeds directly into the HubSpot interface as a CRM Card.

## Features

| Feature | Details |
|---|---|
| **4 Forecast Methods** | Weighted Pipeline · Forecast Category · Historical Win-Rate · Trend (Linear Regression) |
| **Pipeline Coverage** | Open pipeline vs closed-won ratio with colour-coded health indicator |
| **Stage Funnel** | Probability-weighted breakdown per pipeline stage |
| **Rep Leaderboard** | Ranked by weighted forecast with progress bars |
| **Quota Attainment** | Gauge chart showing % of period quota achieved |
| **HubSpot CRM Card** | Compact iframe that embeds in Deals/Contacts/Companies sidebar |
| **Filters** | Method · Period · Pipeline · Owner · Close Date range |
| **Caching** | Server-side cache (configurable TTL) reduces HubSpot API calls |
| **Docker** | Single `docker-compose up` deployment |

## Architecture

```
revops-forecasting-tool/
├── backend/          Node.js / Express API
│   └── src/
│       ├── routes/   forecast · deals · metrics · auth
│       ├── services/ hubspotClient · forecastEngine
│       └── utils/    logger · cache
├── frontend/         React + Vite + Recharts
│   └── src/
│       ├── pages/    Dashboard · HubSpotCard
│       ├── components/
│       └── utils/    api · format
├── hubspot/          CRM Card manifest + app config
└── docker-compose.yml
```

## Quick Start

### 1. HubSpot Private App Token (recommended for internal tools)

1. In HubSpot → Settings → Integrations → Private Apps → **Create a private app**
2. Grant scopes: `crm.objects.deals.read`, `crm.objects.owners.read`, `crm.pipelines.read`
3. Copy the generated token

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set HUBSPOT_ACCESS_TOKEN=pat-na1-...
```

### 3. Run with Docker

```bash
docker-compose up --build
```

Dashboard available at **http://localhost:3000**

### 4. Run locally (development)

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

## HubSpot CRM Card Embed

### Option A – CRM Card (sidebar widget)

1. Deploy the backend and frontend to a public URL (Heroku, Railway, Render, etc.)
2. Update `hubspot/crm-card.json` — replace `YOUR_BACKEND_URL` and `YOUR_FRONTEND_URL`
3. In HubSpot Developer Account → Apps → create/edit app → **CRM Cards** → upload `crm-card.json`
4. The card will appear in the right sidebar of Deal, Contact, and Company records

### Option B – OAuth Connected App (multi-portal)

1. Create a HubSpot Public App in the developer portal
2. Set `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`, `HUBSPOT_REDIRECT_URI` in `.env`
3. Direct users to `/auth/install` to authorise
4. Tokens are received at `/auth/callback`

## Forecast Methods

| Method | How it works |
|---|---|
| **Weighted Pipeline** | `amount × stage_probability` for each open deal |
| **Forecast Category** | Uses HubSpot forecast categories: Commit (90%), Best Case (50%), Pipeline (20%) |
| **Historical Win Rate** | Computes actual win-rate per stage from last 12 months of closed deals |
| **Trend (Linear)** | Linear regression on monthly closed-won revenue to project next period |

## API Reference

| Endpoint | Description |
|---|---|
| `GET /api/forecast` | Full forecast with period buckets, stage & rep breakdown |
| `GET /api/forecast/summary` | Compact summary for CRM card |
| `GET /api/deals` | Paginated deal list |
| `GET /api/deals/pipelines` | All pipelines |
| `GET /api/deals/stages?pipelineId=` | Stages for a pipeline |
| `GET /api/deals/owners` | Sales reps |
| `GET /api/metrics/kpis` | Win rate, avg deal size, sales cycle, pipeline velocity |
| `GET /api/metrics/attainment` | Quota attainment for current period |
| `GET /health` | Health check |

### Query Parameters (forecast endpoints)

| Param | Values | Default |
|---|---|---|
| `method` | `weighted`, `category`, `historical`, `trend` | `weighted` |
| `period` | `monthly`, `quarterly` | `quarterly` |
| `pipelineId` | HubSpot pipeline ID | all |
| `ownerId` | HubSpot owner ID | all |
| `startDate` | ISO date string | none |
| `endDate` | ISO date string | none |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `HUBSPOT_ACCESS_TOKEN` | Yes* | Private App access token |
| `HUBSPOT_CLIENT_ID` | OAuth only | Connected App client ID |
| `HUBSPOT_CLIENT_SECRET` | OAuth only | Connected App client secret |
| `HUBSPOT_REDIRECT_URI` | OAuth only | OAuth callback URL |
| `PORT` | No | API port (default: 3001) |
| `JWT_SECRET` | No | JWT signing secret |
| `CACHE_TTL` | No | Cache TTL in seconds (default: 300) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

*Use either Private App token OR OAuth, not both.

## License

MIT
