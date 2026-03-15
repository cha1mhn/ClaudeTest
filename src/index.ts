// ─── Types ────────────────────────────────────────────────────────────────────
export * from "./types";

// ─── Metrics ──────────────────────────────────────────────────────────────────
export * from "./metrics/mrr";
export * from "./metrics/arr";
export * from "./metrics/churn";
export * from "./metrics/nrr";
export * from "./metrics/pipeline";
export * from "./metrics/sales";
export * from "./metrics/cohort";

// ─── Reporting Engine ─────────────────────────────────────────────────────────
export { generateReport, generateTrendReport } from "./reporting/engine";
export type { ReportInput, ReportOptions } from "./reporting/engine";
export { generateAlerts } from "./reporting/alerts";
export type { AlertThresholds } from "./reporting/alerts";
export { buildHighlights } from "./reporting/highlights";

// ─── Adapters ─────────────────────────────────────────────────────────────────
export {
  parseCsv,
  customersFromCsv,
  dealsFromCsv,
  eventsFromCsv,
  toCsv,
} from "./adapters/csv";

export {
  customersFromJson,
  dealsFromJson,
  eventsFromJson,
  activitiesFromJson,
} from "./adapters/json";

export {
  sfAccountToCustomer,
  sfOpportunityToDeal,
} from "./adapters/salesforce";
export type { SFAccount, SFOpportunity } from "./adapters/salesforce";

export {
  hsCompanyToCustomer,
  hsDealToDeal,
} from "./adapters/hubspot";
export type { HSCompany, HSDeal } from "./adapters/hubspot";

// ─── Utilities ────────────────────────────────────────────────────────────────
export {
  getPeriodRange,
  isInRange,
  monthsBetween,
  daysBetween,
  getPreviousPeriod,
  formatPeriodLabel,
} from "./utils/date";

export {
  pct,
  growthRate,
  weightedAverage,
  median,
  round2,
  sumBy,
} from "./utils/math";
