import {
  Customer,
  Deal,
  RevenueEvent,
  SalesActivity,
  RevOpsReport,
  DateRange,
  PeriodType,
} from "../types";
import { calculateMrrBreakdown, mrrFromCustomers } from "../metrics/mrr";
import { calculateArrMetrics } from "../metrics/arr";
import { calculateChurnMetrics } from "../metrics/churn";
import { calculateNrr } from "../metrics/nrr";
import { calculatePipelineMetrics } from "../metrics/pipeline";
import { calculateSalesPerformance } from "../metrics/sales";
import { buildCohortRetention } from "../metrics/cohort";
import { buildHighlights } from "./highlights";
import { generateAlerts, AlertThresholds } from "./alerts";
import { getPreviousPeriod, getPeriodRange } from "../utils/date";

export interface ReportInput {
  customers: Customer[];
  deals: Deal[];
  events: RevenueEvent[];
  activities?: SalesActivity[];
  cohortPeriods?: DateRange[];
}

export interface ReportOptions {
  period: DateRange;
  periodType?: PeriodType;
  targetRevenue?: number;
  alertThresholds?: AlertThresholds;
  includeCohorts?: boolean;
  cohortPeriods?: DateRange[];
}

/**
 * Core reporting engine — synthesizes all RevOps metrics into a unified report.
 */
export function generateReport(
  input: ReportInput,
  options: ReportOptions
): RevOpsReport {
  const { customers, deals, events, activities = [] } = input;
  const {
    period,
    periodType = "monthly",
    targetRevenue = 0,
    alertThresholds = {},
    includeCohorts = false,
    cohortPeriods = [],
  } = options;

  const prevPeriod = getPreviousPeriod(period);

  // MRR
  const openingMrr = mrrFromCustomers(customers, period.start);
  const mrr = calculateMrrBreakdown(events, period, openingMrr);

  // ARR
  const previousArr = mrrFromCustomers(customers, prevPeriod.end) * 12;
  const arr = calculateArrMetrics(customers, events, period, previousArr);

  // Churn
  const churn = calculateChurnMetrics(customers, period);

  // NRR
  const nrr = calculateNrr(events, period, openingMrr);

  // Pipeline
  const pipeline = calculatePipelineMetrics(deals, period, targetRevenue);

  // Sales Performance
  const salesPerformance =
    activities.length > 0
      ? calculateSalesPerformance(deals, activities, period)
      : undefined;

  // Cohort Retention
  const cohortRetention =
    includeCohorts && cohortPeriods.length > 0
      ? buildCohortRetention(customers, events, cohortPeriods)
      : undefined;

  const highlights = buildHighlights({
    mrr,
    arr,
    churn,
    nrr,
    pipeline,
    sales: salesPerformance,
  });

  const alerts = generateAlerts(
    { mrr, churn, nrr, pipeline, sales: salesPerformance },
    alertThresholds
  );

  return {
    generatedAt: new Date(),
    period,
    periodType,
    mrr,
    arr,
    churn,
    nrr,
    pipeline,
    salesPerformance,
    cohortRetention,
    highlights,
    alerts,
  };
}

/**
 * Builds reports for multiple consecutive periods (trend analysis).
 */
export function generateTrendReport(
  input: ReportInput,
  basePeriod: Date,
  periodType: PeriodType,
  lookbackCount: number,
  options: Omit<ReportOptions, "period"> = {}
): RevOpsReport[] {
  const periods: DateRange[] = [];
  const d = new Date(basePeriod);

  for (let i = lookbackCount - 1; i >= 0; i--) {
    const offsetDate = new Date(d);
    if (periodType === "monthly") offsetDate.setMonth(d.getMonth() - i);
    else if (periodType === "quarterly") offsetDate.setMonth(d.getMonth() - i * 3);
    else offsetDate.setFullYear(d.getFullYear() - i);

    periods.push(getPeriodRange(offsetDate, periodType));
  }

  return periods.map((period) =>
    generateReport(input, { ...options, period, periodType })
  );
}
