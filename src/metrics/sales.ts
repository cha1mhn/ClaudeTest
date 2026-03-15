import {
  Deal,
  SalesActivity,
  SalesPerformanceMetrics,
  RepPerformance,
  DateRange,
} from "../types";
import { isInRange } from "../utils/date";
import { pct, round2, sumBy } from "../utils/math";

/**
 * Calculates team-level and per-rep sales performance metrics.
 */
export function calculateSalesPerformance(
  deals: Deal[],
  activities: SalesActivity[],
  period: DateRange
): SalesPerformanceMetrics {
  const wonInPeriod = deals.filter(
    (d) =>
      d.stage === "closed_won" && d.wonDate && isInRange(d.wonDate, period)
  );

  const totalRevenue = round2(sumBy(wonInPeriod, (d) => d.amount));
  const totalQuota = round2(sumBy(activities, (a) => a.quota));
  const quotaAttainment = round2(pct(totalRevenue, totalQuota));

  const repPerformance = buildRepPerformance(deals, activities, period);

  const atRiskReps = repPerformance
    .filter((r) => r.attainment < 75)
    .map((r) => r.repName);

  // Average ramp time placeholder — requires hire-date data in activities
  const averageRampTime = 0;

  return {
    period,
    totalRevenue,
    quota: totalQuota,
    quotaAttainment,
    repPerformance,
    averageRampTime,
    atRiskReps,
  };
}

function buildRepPerformance(
  deals: Deal[],
  activities: SalesActivity[],
  period: DateRange
): RepPerformance[] {
  const repIds = [...new Set(activities.map((a) => a.repId))];

  return repIds.map((repId) => {
    const activity = activities.find((a) => a.repId === repId)!;
    const repWon = deals.filter(
      (d) =>
        d.ownerId === repId &&
        d.stage === "closed_won" &&
        d.wonDate &&
        isInRange(d.wonDate, period)
    );
    const repPipeline = deals.filter(
      (d) =>
        d.ownerId === repId &&
        !["closed_won", "closed_lost"].includes(d.stage) &&
        isInRange(d.closeDate, period)
    );

    const achieved = round2(sumBy(repWon, (d) => d.amount));
    const attainment = round2(pct(achieved, activity.quota));
    const averageDealSize =
      repWon.length === 0 ? 0 : round2(achieved / repWon.length);
    const pipelineValue = round2(sumBy(repPipeline, (d) => d.amount));
    const pipelineCoverage =
      activity.quota === 0 ? 0 : round2(pipelineValue / activity.quota);

    return {
      repId,
      repName: activity.repName,
      quota: activity.quota,
      achieved,
      attainment,
      dealsWon: repWon.length,
      averageDealSize,
      pipelineCoverage,
    };
  });
}

/**
 * Calculates funnel conversion rates from activities.
 */
export function calculateFunnelMetrics(activities: SalesActivity[]): {
  callToMeetingRate: number;
  meetingToProposalRate: number;
  proposalToCloseRate: number;
} {
  const totalCalls = sumBy(activities, (a) => a.calls);
  const totalMeetings = sumBy(activities, (a) => a.meetings);
  const totalProposals = sumBy(activities, (a) => a.proposalsSent);
  const totalWon = sumBy(activities, (a) => a.closedWon);

  return {
    callToMeetingRate: round2(pct(totalMeetings, totalCalls)),
    meetingToProposalRate: round2(pct(totalProposals, totalMeetings)),
    proposalToCloseRate: round2(pct(totalWon, totalProposals)),
  };
}
