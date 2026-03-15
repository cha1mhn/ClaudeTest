import {
  Deal,
  DealStage,
  CustomerSegment,
  PipelineMetrics,
  DateRange,
} from "../types";
import { isInRange, daysBetween } from "../utils/date";
import { pct, round2, sumBy } from "../utils/math";

const STAGE_ORDER: DealStage[] = [
  "prospect",
  "qualified",
  "demo",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
];

/**
 * Calculates comprehensive pipeline metrics for a given period.
 */
export function calculatePipelineMetrics(
  deals: Deal[],
  period: DateRange,
  targetRevenue: number
): PipelineMetrics {
  const activeDeals = deals.filter(
    (d) =>
      !["closed_won", "closed_lost"].includes(d.stage) &&
      isInRange(d.closeDate, period)
  );

  const closedWon = deals.filter(
    (d) => d.stage === "closed_won" && d.wonDate && isInRange(d.wonDate, period)
  );
  const closedLost = deals.filter(
    (d) =>
      d.stage === "closed_lost" && d.lostDate && isInRange(d.lostDate, period)
  );

  const totalPipelineValue = round2(sumBy(activeDeals, (d) => d.amount));
  const weightedPipelineValue = round2(
    sumBy(activeDeals, (d) => d.amount * ((d.probability ?? 50) / 100))
  );
  const pipelineCoverage =
    targetRevenue === 0 ? 0 : round2(totalPipelineValue / targetRevenue);

  const dealsCount = activeDeals.length;
  const averageDealSize =
    dealsCount === 0 ? 0 : round2(totalPipelineValue / dealsCount);

  const salesCycles = closedWon
    .filter((d) => d.wonDate)
    .map((d) => daysBetween(d.createdDate, d.wonDate!));
  const averageSalesCycle =
    salesCycles.length === 0
      ? 0
      : round2(salesCycles.reduce((s, v) => s + v, 0) / salesCycles.length);

  const totalClosed = closedWon.length + closedLost.length;
  const winRate = round2(pct(closedWon.length, totalClosed));

  const stageConversionRates = calculateStageConversions(deals, period);
  const pipelineBySegment = calculatePipelineBySegment(activeDeals);

  // Pipeline Velocity = (# Deals × Win Rate × Avg Deal Size) / Sales Cycle (days)
  const pipelineVelocity =
    averageSalesCycle === 0
      ? 0
      : round2(
          (dealsCount * (winRate / 100) * averageDealSize) / averageSalesCycle
        );

  return {
    period,
    totalPipelineValue,
    weightedPipelineValue,
    pipelineCoverage,
    dealsCount,
    averageDealSize,
    averageSalesCycle,
    winRate,
    stageConversionRates,
    pipelineBySegment,
    pipelineVelocity,
  };
}

function calculateStageConversions(
  deals: Deal[],
  period: DateRange
): Record<DealStage, number> {
  const closedDeals = deals.filter(
    (d) =>
      ["closed_won", "closed_lost"].includes(d.stage) &&
      (d.wonDate || d.lostDate) &&
      isInRange((d.wonDate ?? d.lostDate)!, period)
  );

  return STAGE_ORDER.reduce<Record<DealStage, number>>((acc, stage) => {
    const reachedStage = closedDeals.filter(
      (d) => STAGE_ORDER.indexOf(d.stage) >= STAGE_ORDER.indexOf(stage)
    );
    const wonFromStage = closedDeals.filter((d) => d.stage === "closed_won");
    acc[stage] = round2(pct(wonFromStage.length, reachedStage.length));
    return acc;
  }, {} as Record<DealStage, number>);
}

function calculatePipelineBySegment(
  deals: Deal[]
): Record<CustomerSegment, number> {
  const segments: CustomerSegment[] = [
    "smb",
    "mid_market",
    "enterprise",
    "strategic",
  ];
  return segments.reduce<Record<CustomerSegment, number>>((acc, seg) => {
    acc[seg] = round2(
      sumBy(
        deals.filter((d) => d.segment === seg),
        (d) => d.amount
      )
    );
    return acc;
  }, {} as Record<CustomerSegment, number>);
}

/**
 * Returns deals at risk: past expected close date and still open.
 */
export function identifyStaleDeals(deals: Deal[], asOf: Date): Deal[] {
  return deals.filter(
    (d) =>
      !["closed_won", "closed_lost"].includes(d.stage) &&
      d.closeDate < asOf
  );
}

/**
 * Groups pipeline by forecast category.
 */
export function pipelineByForecastCategory(
  deals: Deal[]
): Record<string, number> {
  return deals
    .filter((d) => !["closed_won", "closed_lost"].includes(d.stage))
    .reduce<Record<string, number>>((acc, d) => {
      const cat = d.forecastCategory ?? "unset";
      acc[cat] = round2((acc[cat] ?? 0) + d.amount);
      return acc;
    }, {});
}
