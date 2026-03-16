# GTM Pipeline Hygiene Auditor

A full-stack data quality auditor for go-to-market teams. Connects to **HubSpot CRM** and **Clay** to grade pipeline health, flag deal-level issues, identify enrichment gaps, and deliver prioritised RevOps recommendations — embeddable directly in HubSpot as a CRM Card.

## Why This Exists

Bad data is the #1 enemy of accurate forecasts. Stale deals inflate pipeline, missing fields break weighted models, and un-enriched contacts mean your outbound sequences lack personalisation. This tool audits the full GTM data loop:

```
Clay (enrichment) → HubSpot (CRM) → Forecasting accuracy
```

## Features

| Feature | Details |
|---|---|
| **Health Grade (A-F)** | Single score from 0-100 based on issue severity and volume |
| **6 Audit Rules** | Stale deals · Missing fields · Past-due close dates · No contacts · Clay enrichment gaps · Pipeline bottlenecks |
| **Clay Integration** | Checks enrichment completeness, flags contacts not in Clay, triggers Clay table runs |
| **Bottleneck Detection** | Statistical analysis (σ-based) of deal accumulation per stage |
| **Prioritised Recommendations** | Actionable suggestions with tool references (HubSpot Workflows, Clay tables, etc.) |
| **HubSpot CRM Card** | Compact sidebar widget showing grade, issue count, and top actions |
| **Scheduled Audits** | Optional cron-based daily audit runs with logging |
| **Filters** | Pipeline · Owner · Clay enrichment toggle |

## Architecture

```
pipeline-hygiene-auditor/
├── backend/
│   └── src/
│       ├── rules/       staleDeal · missingFields · pastDueClose · noContacts
│       │                enrichmentGap · pipelineBottleneck
│       ├── services/    hubspotClient · clayClient · auditEngine
│       ├── routes/      audit · deals
│       └── utils/       logger · cache
├── frontend/
│   └── src/
│       ├── pages/       Dashboard · HubSpotCard
│       ├── components/  GradeRing · SeverityBar · IssueList
│       │                Recommendations · EnrichmentPanel · RuleBreakdownChart
│       └── utils/       api
├── hubspot/             CRM Card manifest + app config
└── docker-compose.yml
```

## Quick Start

### 1. Create HubSpot Private App

Scopes needed: `crm.objects.deals.read`, `crm.objects.contacts.read`, `crm.objects.owners.read`, `crm.pipelines.read`

### 2. (Optional) Get Clay API Key

In Clay → Settings → API → Generate key. Create a table with your enrichment sources.

### 3. Configure

```bash
cp backend/.env.example backend/.env
# Set HUBSPOT_ACCESS_TOKEN and optionally CLAY_API_KEY + CLAY_TABLE_ID
```

### 4. Run

```bash
# Docker
docker-compose up --build

# Or locally
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Dashboard at **http://localhost:3003** (Docker) or **http://localhost:3000** (dev).

## Audit Rules

| Rule | What it checks | Severity logic |
|---|---|---|
| **Stale Deal** | No modifications in N days (default: 30) | Warning → High → Critical as staleness grows |
| **Missing Fields** | Amount, close date, owner, next step, forecast category | Critical if 3+ missing |
| **Past-Due Close** | Open deal with close date in the past | Critical if 90+ days overdue |
| **No Contacts** | Zero associated contacts on deal | High — blocks attribution & Clay sync |
| **Enrichment Gap** | Contact not in Clay or low completeness score | High if not in Clay at all |
| **Pipeline Bottleneck** | Stage has > 1.5σ more deals than average | Critical if > 2.5σ |

## Scoring

The health score (0-100) uses weighted penalties:

| Severity | Penalty Points |
|---|---|
| Critical | 10 |
| High | 5 |
| Warning | 2 |
| Info | 0 |

Grade thresholds: **A** ≥ 90 · **B** ≥ 75 · **C** ≥ 60 · **D** ≥ 40 · **F** < 40

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/audit` | GET | Full audit report |
| `/api/audit/summary` | GET | Compact summary for CRM card |
| `/api/audit/refresh` | POST | Clear cache and force re-audit |
| `/api/audit/enrich` | POST | Trigger Clay enrichment for contacts |
| `/api/deals/pipelines` | GET | List HubSpot pipelines |
| `/api/deals/owners` | GET | List HubSpot owners |
| `/health` | GET | Health check |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `HUBSPOT_ACCESS_TOKEN` | Yes | HubSpot Private App token |
| `CLAY_API_KEY` | No | Clay API key for enrichment checks |
| `CLAY_TABLE_ID` | No | Default Clay table for enrichment runs |
| `PORT` | No | API port (default: 3002) |
| `STALE_DEAL_DAYS` | No | Days before a deal is "stale" (default: 30) |
| `NO_ACTIVITY_DAYS` | No | Days without activity flag (default: 14) |
| `ENRICHMENT_SCORE_MIN` | No | Minimum Clay completeness % (default: 60) |
| `CACHE_TTL` | No | Cache TTL seconds (default: 300) |
| `AUDIT_CRON` | No | Cron schedule for auto-audit (default: `0 7 * * *`) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

## HubSpot CRM Card Embed

1. Deploy to a public URL
2. Update URLs in `hubspot/crm-card.json`
3. Add the CRM Card in your HubSpot Developer Account → App → CRM Cards
4. The card shows pipeline grade, issue count, and top recommendations in the Deal sidebar

## License

MIT
