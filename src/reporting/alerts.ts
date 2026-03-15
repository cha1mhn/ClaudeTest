import {
  MrrBreakdown,
  ChurnMetrics,
  NrrMetrics,
  PipelineMetrics,
  SalesPerformanceMetrics,
  ReportAlert,
} from "../types";

export interface AlertThresholds {
  mrrGrowthWarning?: number;       // minimum acceptable MoM MRR growth %
  churnRateWarning?: number;        // max acceptable monthly revenue churn %
  churnRateCritical?: number;
  nrrWarning?: number;              // minimum NRR %
  nrrCritical?: number;
  pipelineCoverageWarning?: number; // minimum pipeline coverage ratio
  pipelineCoverageCritical?: number;
  winRateWarning?: number;          // minimum win rate %
  quotaAttainmentWarning?: number;  // minimum team quota attainment %
  quotaAttainmentCritical?: number;
}

const DEFAULTS: Required<AlertThresholds> = {
  mrrGrowthWarning: 2,
  churnRateWarning: 2,
  churnRateCritical: 5,
  nrrWarning: 100,
  nrrCritical: 90,
  pipelineCoverageWarning: 3,
  pipelineCoverageCritical: 2,
  winRateWarning: 20,
  quotaAttainmentWarning: 75,
  quotaAttainmentCritical: 50,
};

export function generateAlerts(
  opts: {
    mrr?: MrrBreakdown;
    churn?: ChurnMetrics;
    nrr?: NrrMetrics;
    pipeline?: PipelineMetrics;
    sales?: SalesPerformanceMetrics;
  },
  thresholds: AlertThresholds = {}
): ReportAlert[] {
  const t = { ...DEFAULTS, ...thresholds };
  const alerts: ReportAlert[] = [];

  if (opts.mrr) {
    const { growthRate } = opts.mrr;
    if (growthRate < t.mrrGrowthWarning) {
      alerts.push({
        severity: growthRate < 0 ? "critical" : "warning",
        metric: "MRR Growth",
        message: `MRR growth is ${growthRate.toFixed(1)}% — below the ${t.mrrGrowthWarning}% threshold`,
        threshold: t.mrrGrowthWarning,
        actual: growthRate,
      });
    }
  }

  if (opts.churn) {
    const { revenueChurnRate } = opts.churn;
    if (revenueChurnRate >= t.churnRateCritical) {
      alerts.push({
        severity: "critical",
        metric: "Revenue Churn",
        message: `Revenue churn rate is ${revenueChurnRate.toFixed(1)}% — exceeds critical threshold of ${t.churnRateCritical}%`,
        threshold: t.churnRateCritical,
        actual: revenueChurnRate,
      });
    } else if (revenueChurnRate >= t.churnRateWarning) {
      alerts.push({
        severity: "warning",
        metric: "Revenue Churn",
        message: `Revenue churn rate is ${revenueChurnRate.toFixed(1)}% — exceeds warning threshold of ${t.churnRateWarning}%`,
        threshold: t.churnRateWarning,
        actual: revenueChurnRate,
      });
    }
  }

  if (opts.nrr) {
    const { nrr } = opts.nrr;
    if (nrr < t.nrrCritical) {
      alerts.push({
        severity: "critical",
        metric: "NRR",
        message: `NRR is ${nrr.toFixed(1)}% — critically below the ${t.nrrCritical}% threshold`,
        threshold: t.nrrCritical,
        actual: nrr,
      });
    } else if (nrr < t.nrrWarning) {
      alerts.push({
        severity: "warning",
        metric: "NRR",
        message: `NRR is ${nrr.toFixed(1)}% — below the ${t.nrrWarning}% threshold`,
        threshold: t.nrrWarning,
        actual: nrr,
      });
    }
  }

  if (opts.pipeline) {
    const { pipelineCoverage, winRate } = opts.pipeline;
    if (pipelineCoverage < t.pipelineCoverageCritical) {
      alerts.push({
        severity: "critical",
        metric: "Pipeline Coverage",
        message: `Pipeline coverage is ${pipelineCoverage.toFixed(1)}x — critically below ${t.pipelineCoverageCritical}x`,
        threshold: t.pipelineCoverageCritical,
        actual: pipelineCoverage,
      });
    } else if (pipelineCoverage < t.pipelineCoverageWarning) {
      alerts.push({
        severity: "warning",
        metric: "Pipeline Coverage",
        message: `Pipeline coverage is ${pipelineCoverage.toFixed(1)}x — below recommended ${t.pipelineCoverageWarning}x`,
        threshold: t.pipelineCoverageWarning,
        actual: pipelineCoverage,
      });
    }
    if (winRate < t.winRateWarning) {
      alerts.push({
        severity: "warning",
        metric: "Win Rate",
        message: `Win rate is ${winRate.toFixed(1)}% — below the ${t.winRateWarning}% threshold`,
        threshold: t.winRateWarning,
        actual: winRate,
      });
    }
  }

  if (opts.sales) {
    const { quotaAttainment } = opts.sales;
    if (quotaAttainment < t.quotaAttainmentCritical) {
      alerts.push({
        severity: "critical",
        metric: "Quota Attainment",
        message: `Team quota attainment is ${quotaAttainment.toFixed(1)}% — critically below ${t.quotaAttainmentCritical}%`,
        threshold: t.quotaAttainmentCritical,
        actual: quotaAttainment,
      });
    } else if (quotaAttainment < t.quotaAttainmentWarning) {
      alerts.push({
        severity: "warning",
        metric: "Quota Attainment",
        message: `Team quota attainment is ${quotaAttainment.toFixed(1)}% — below ${t.quotaAttainmentWarning}%`,
        threshold: t.quotaAttainmentWarning,
        actual: quotaAttainment,
      });
    }
  }

  return alerts;
}
