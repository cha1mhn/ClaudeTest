# revops-reporting

A TypeScript library for synthesizing **Revenue Operations** metrics and performance data into structured reports.

## Features

| Module | Metrics |
|--------|---------|
| **MRR** | Waterfall/bridge, net new MRR, growth rate, multi-period trends |
| **ARR** | ARR, YoY growth, net new ARR, NDR/NRR by segment |
| **Churn** | Logo & revenue churn, churn by reason/segment, LTV, at-risk detection |
| **NRR** | Net Revenue Retention, Gross Revenue Retention, expansion/contraction/churn rates |
| **Pipeline** | Coverage, win rate, average deal size, sales cycle, pipeline velocity, forecast categories |
| **Sales Performance** | Quota attainment, per-rep metrics, funnel conversion rates |
| **Cohort Retention** | Logo and MRR retention matrix by cohort month |
| **Reporting Engine** | Unified report synthesis, trend reports, highlights & alerts |
| **Adapters** | CSV, JSON, Salesforce, HubSpot |

---

## Installation

```bash
npm install revops-reporting
```

---

## Quick Start

```typescript
import {
  generateReport,
  customersFromCsv,
  dealsFromCsv,
  eventsFromCsv,
} from "revops-reporting";

// Load data (CSV, JSON, Salesforce, HubSpot adapters included)
const customers = customersFromCsv(customerCsvString);
const deals      = dealsFromCsv(dealCsvString);
const events     = eventsFromCsv(eventCsvString);

const report = generateReport(
  { customers, deals, events },
  {
    period: { start: new Date("2024-01-01"), end: new Date("2024-01-31") },
    targetRevenue: 500_000,
    alertThresholds: { nrrWarning: 105 },
  }
);

console.log(report.mrr);         // MRR waterfall
console.log(report.nrr);         // NRR / GRR
console.log(report.highlights);  // Auto-generated summary
console.log(report.alerts);      // Threshold-based alerts
```

---

## Metrics Reference

### MRR Waterfall

```typescript
import { calculateMrrBreakdown, mrrFromCustomers } from "revops-reporting";

const openingMrr = mrrFromCustomers(customers, period.start);
const breakdown  = calculateMrrBreakdown(events, period, openingMrr);

// { openingMrr, newBusinessMrr, expansionMrr, contractionMrr,
//   churnMrr, reactivationMrr, closingMrr, netNewMrr, growthRate }
```

### Churn Analysis

```typescript
import { calculateChurnMetrics, identifyChurnRisk } from "revops-reporting";

const churn    = calculateChurnMetrics(customers, period);
// { logoChurnRate, revenueChurnRate, churnedArr, churnByReason, churnBySegment, ... }

const atRisk   = identifyChurnRisk(customers, new Date(), 90); // renewals in 90 days
```

### NRR / GRR

```typescript
import { calculateNrr } from "revops-reporting";

const nrr = calculateNrr(events, period, openingMrr);
// { nrr, grr, expansionRate, contractionRate, churnRate }
```

### Pipeline

```typescript
import { calculatePipelineMetrics, identifyStaleDeals } from "revops-reporting";

const pipeline = calculatePipelineMetrics(deals, period, quarterTarget);
// { totalPipelineValue, weightedPipelineValue, pipelineCoverage,
//   winRate, averageDealSize, averageSalesCycle, pipelineVelocity, ... }

const stale    = identifyStaleDeals(deals, new Date());
```

### Trend Reports

```typescript
import { generateTrendReport } from "revops-reporting";

// Last 6 months of monthly reports
const trend = generateTrendReport(input, new Date(), "monthly", 6);
```

### Cohort Retention

```typescript
import { buildCohortRetention, getPeriodRange } from "revops-reporting";

const cohortPeriods = ["2024-01", "2024-02", "2024-03"].map(
  (m) => getPeriodRange(new Date(m), "monthly")
);
const cohorts = buildCohortRetention(customers, events, cohortPeriods);
// Matrix of logo & MRR retention rates per cohort month
```

---

## Data Adapters

### CSV

```typescript
import { customersFromCsv, dealsFromCsv, eventsFromCsv } from "revops-reporting";
```

Required CSV columns:

| Entity | Required columns |
|--------|-----------------|
| Customer | `id, name, segment, arr, mrr, contractStartDate` |
| Deal | `id, name, accountId, stage, amount, arr, closeDate, createdDate, ownerId, segment` |
| RevenueEvent | `id, customerId, type, mrr, arr, date` |

### Salesforce

```typescript
import { sfAccountToCustomer, sfOpportunityToDeal } from "revops-reporting";

const customers = sfAccounts.map(sfAccountToCustomer);
const deals     = sfOpportunities.map(sfOpportunityToDeal);
```

### HubSpot

```typescript
import { hsCompanyToCustomer, hsDealToDeal } from "revops-reporting";

const customers = hsCompanies.map(hsCompanyToCustomer);
const deals     = hsDeals.map(hsDealToDeal);
```

---

## Alert Thresholds

Configure alerts in `generateReport`:

```typescript
alertThresholds: {
  mrrGrowthWarning: 2,         // % MoM growth
  churnRateWarning: 2,          // % revenue churn
  churnRateCritical: 5,
  nrrWarning: 100,              // % NRR
  nrrCritical: 90,
  pipelineCoverageWarning: 3,   // coverage ratio
  pipelineCoverageCritical: 2,
  winRateWarning: 20,           // % win rate
  quotaAttainmentWarning: 75,   // % quota attainment
  quotaAttainmentCritical: 50,
}
```

---

## Customer Segments

`smb` | `mid_market` | `enterprise` | `strategic`

## Revenue Event Types

`new_business` | `expansion` | `contraction` | `churn` | `reactivation`

---

## Development

```bash
npm test              # run tests
npm run test:coverage # coverage report
npm run build         # compile TypeScript
```
