import {
  MrrBreakdown,
  ArrMetrics,
  ChurnMetrics,
  NrrMetrics,
  PipelineMetrics,
  SalesPerformanceMetrics,
  ReportHighlight,
} from "../types";

function fmt(n: number, prefix = "", suffix = ""): string {
  return `${prefix}${n.toLocaleString("en-US", { maximumFractionDigits: 1 })}${suffix}`;
}

function direction(change: number): "up" | "down" | "flat" {
  if (change > 0.5) return "up";
  if (change < -0.5) return "down";
  return "flat";
}

export function buildHighlights(opts: {
  mrr?: MrrBreakdown;
  arr?: ArrMetrics;
  churn?: ChurnMetrics;
  nrr?: NrrMetrics;
  pipeline?: PipelineMetrics;
  sales?: SalesPerformanceMetrics;
}): ReportHighlight[] {
  const highlights: ReportHighlight[] = [];

  if (opts.mrr) {
    const { closingMrr, netNewMrr, growthRate } = opts.mrr;
    highlights.push({
      metric: "Closing MRR",
      value: fmt(closingMrr, "$"),
      change: growthRate,
      direction: direction(growthRate),
      sentiment: growthRate >= 0 ? "positive" : "negative",
      description: `MRR ${growthRate >= 0 ? "grew" : "declined"} ${Math.abs(growthRate).toFixed(1)}% with net new MRR of ${fmt(netNewMrr, "$")}`,
    });
  }

  if (opts.arr) {
    const { arr, arrGrowthRate, ndrPercent } = opts.arr;
    highlights.push({
      metric: "ARR",
      value: fmt(arr, "$"),
      change: arrGrowthRate,
      direction: direction(arrGrowthRate),
      sentiment: arrGrowthRate >= 0 ? "positive" : "negative",
      description: `ARR ${arrGrowthRate >= 0 ? "grew" : "declined"} ${Math.abs(arrGrowthRate).toFixed(1)}% YoY`,
    });
    highlights.push({
      metric: "NDR",
      value: fmt(ndrPercent, "", "%"),
      direction: ndrPercent >= 100 ? "up" : "down",
      sentiment: ndrPercent >= 100 ? "positive" : "negative",
      description:
        ndrPercent >= 100
          ? `Expansion exceeds churn — existing customers are growing`
          : `Net revenue from existing customers is contracting`,
    });
  }

  if (opts.churn) {
    const { revenueChurnRate, logoChurnRate, churnedArr } = opts.churn;
    highlights.push({
      metric: "Revenue Churn Rate",
      value: fmt(revenueChurnRate, "", "%"),
      direction: direction(-revenueChurnRate),
      sentiment: revenueChurnRate <= 1 ? "positive" : revenueChurnRate <= 3 ? "neutral" : "negative",
      description: `${fmt(churnedArr, "$")} ARR churned (${fmt(logoChurnRate, "", "%")} logo churn)`,
    });
  }

  if (opts.nrr) {
    const { nrr, grr } = opts.nrr;
    highlights.push({
      metric: "NRR",
      value: fmt(nrr, "", "%"),
      direction: nrr >= 100 ? "up" : "down",
      sentiment: nrr >= 110 ? "positive" : nrr >= 100 ? "neutral" : "negative",
      description: `Gross retention at ${fmt(grr, "", "%")} — net retention ${nrr >= 100 ? "above" : "below"} 100%`,
    });
  }

  if (opts.pipeline) {
    const { totalPipelineValue, winRate, pipelineCoverage, pipelineVelocity } =
      opts.pipeline;
    highlights.push({
      metric: "Pipeline Value",
      value: fmt(totalPipelineValue, "$"),
      direction: "flat",
      sentiment: pipelineCoverage >= 3 ? "positive" : pipelineCoverage >= 2 ? "neutral" : "negative",
      description: `${fmt(pipelineCoverage)}x coverage at ${fmt(winRate, "", "%")} win rate — velocity: ${fmt(pipelineVelocity, "$")}/day`,
    });
  }

  if (opts.sales) {
    const { quotaAttainment, totalRevenue, quota } = opts.sales;
    highlights.push({
      metric: "Quota Attainment",
      value: fmt(quotaAttainment, "", "%"),
      direction: quotaAttainment >= 100 ? "up" : "down",
      sentiment:
        quotaAttainment >= 100 ? "positive" : quotaAttainment >= 75 ? "neutral" : "negative",
      description: `${fmt(totalRevenue, "$")} revenue vs ${fmt(quota, "$")} quota`,
    });
  }

  return highlights;
}
