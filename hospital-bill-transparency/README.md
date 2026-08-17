# What It Cost — Hospital Bill Transparency

A crowdsourced, anonymous record of what people actually paid for medical procedures.
Same procedure, different hospitals, real amounts.

Built on the same component model as [bribes.fyi](https://bribes.fyi): anonymous submission,
public browsing, and aggregated comparison — applied to hospital pricing instead of bribery.

## Components

| Component | What it does |
|---|---|
| **Anonymous submission form** | No account, no email, no name. Procedure · hospital · city · amount · payment method · room category · bill date |
| **Procedure comparison** | Pick a procedure, see every hospital's average bill ranked cheapest → most expensive |
| **Price-gap ranking** | Homepage leaderboard of procedures where the cheapest and priciest reported bills diverge most |
| **Colour-coded bar chart** | Per-hospital averages, green (cheap) → orange (expensive) relative to that procedure's range |
| **Position indicator** | Per-row marker showing where a hospital sits inside the overall price range |
| **Browsable report feed** | Every submitted bill, paginated, newest first |
| **Filters** | Free-text search · city · category · hospital type · payment method |
| **Aggregate stats** | Total reports, hospitals, cities, procedures; average bill by hospital type (government / private / trust) |
| **Rate limiting** | Submission endpoint capped per IP to deter spam |

## Architecture

```
hospital-bill-transparency/
├── backend/                Node.js / Express + SQLite (better-sqlite3)
│   └── src/
│       ├── routes/         reports · procedures · stats
│       ├── services/       db · seedData
│       └── utils/          logger · validate
├── frontend/               React + Vite + Recharts
│   └── src/
│       ├── pages/          Home · Compare · Browse · Submit
│       ├── components/     StatCard · PriceRangeBar · StateMessage
│       └── utils/          api · format
└── docker-compose.yml
```

## Quick Start

### Docker

```bash
docker-compose up --build
```

Frontend at **http://localhost:3100**, API at **http://localhost:4001**.

### Local development

```bash
# Backend
cd backend && npm install && cp .env.example .env && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Frontend at **http://localhost:5173** (Vite proxies `/api` to the backend on port 4001).

The database is created and seeded with illustrative sample data on first run. Delete
`backend/data/reports.db` to reset.

## API Reference

| Endpoint | Description |
|---|---|
| `POST /api/reports` | Submit an anonymous bill report |
| `GET /api/reports` | Paginated, filterable report list |
| `GET /api/procedures` | All procedures with report count, min/max/avg, price-gap ratio |
| `GET /api/procedures/:procedure/compare` | Per-hospital breakdown for one procedure |
| `GET /api/stats/summary` | Totals, widest price gaps, averages by hospital type, recent reports |
| `GET /api/stats/cities` | Distinct cities for filter dropdowns |
| `GET /api/stats/categories` | Distinct categories |
| `GET /health` | Health check |

### `POST /api/reports` body

| Field | Required | Notes |
|---|---|---|
| `procedure` | Yes | e.g. `Cataract Surgery (Phaco, per eye)` |
| `category` | Yes | e.g. `Surgery` |
| `hospital` | Yes | Hospital name |
| `city` / `state` | Yes | Location |
| `amount` | Yes | Total billed, positive number |
| `hospitalType` | No | `private` (default) · `government` · `trust` |
| `paymentType` | No | `cash` (default) · `insurance-cashless` · `insurance-reimbursement` |
| `roomType` | No | `general` · `semi-private` · `private` · `icu` |
| `billDate` | No | `YYYY-MM-DD`, not in the future |
| `notes` | No | Free text, max 500 chars |

### `GET /api/reports` query params

| Param | Values |
|---|---|
| `q` | Free-text across procedure, hospital, city |
| `procedure`, `hospital`, `city`, `state`, `category` | Exact match |
| `hospitalType`, `paymentType` | Exact match |
| `page`, `limit` | Pagination (limit capped at 50) |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4001` | API port |
| `DB_PATH` | `./data/reports.db` | SQLite file location |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins |
| `RATE_LIMIT_MAX` | `20` | Max submissions per window per IP |
| `RATE_LIMIT_WINDOW_MS` | `3600000` | Rate limit window |

## Data caveats

Every figure is self-reported and unverified. Bill totals depend on room category,
complications, length of stay, and what the hospital bundled in — two bills for the "same"
procedure are rarely strictly comparable. The seed data ships with **fictional hospital
names** purely so the UI is explorable before real submissions arrive.

Treat this as a rough signal of what others were charged, not as a quote or a price list.

## License

MIT
