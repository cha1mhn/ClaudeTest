import {
  Customer,
  ChurnMetrics,
  ChurnReason,
  CustomerSegment,
  DateRange,
} from "../types";
import { isInRange, daysBetween } from "../utils/date";
import { pct, round2, sumBy } from "../utils/math";

/**
 * Calculates comprehensive churn metrics for a given period.
 */
export function calculateChurnMetrics(
  customers: Customer[],
  period: DateRange
): ChurnMetrics {
  const churnedInPeriod = customers.filter(
    (c) => c.churnDate && isInRange(c.churnDate, period)
  );

  // Customers active at the start of the period
  const activeAtStart = customers.filter(
    (c) =>
      c.contractStartDate < period.start &&
      (c.churnDate === undefined || c.churnDate >= period.start)
  );

  const logoChurnRate = round2(
    pct(churnedInPeriod.length, activeAtStart.length)
  );

  const churnedArr = round2(sumBy(churnedInPeriod, (c) => c.arr));
  const openingArr = round2(sumBy(activeAtStart, (c) => c.arr));
  const revenueChurnRate = round2(pct(churnedArr, openingArr));

  // Average customer lifetime in months (based on churned customers)
  const lifetimes = churnedInPeriod
    .filter((c) => c.churnDate)
    .map((c) =>
      daysBetween(c.contractStartDate, c.churnDate!) / 30.44
    );
  const averageCustomerLifetime =
    lifetimes.length === 0
      ? 0
      : round2(lifetimes.reduce((s, v) => s + v, 0) / lifetimes.length);

  const churnByReason = buildChurnByReason(churnedInPeriod);
  const churnBySegment = buildChurnBySegment(churnedInPeriod);

  return {
    period,
    logoChurnRate,
    revenueChurnRate,
    churnedCustomers: churnedInPeriod.length,
    churnedArr,
    averageCustomerLifetime,
    churnByReason,
    churnBySegment,
  };
}

function buildChurnByReason(
  churned: Customer[]
): Record<ChurnReason, number> {
  const reasons: ChurnReason[] = [
    "price",
    "product",
    "competitor",
    "no_budget",
    "champion_left",
    "poor_fit",
    "other",
  ];
  return reasons.reduce<Record<ChurnReason, number>>((acc, r) => {
    acc[r] = churned.filter((c) => c.churnReason === r).length;
    return acc;
  }, {} as Record<ChurnReason, number>);
}

function buildChurnBySegment(
  churned: Customer[]
): Record<CustomerSegment, number> {
  const segments: CustomerSegment[] = [
    "smb",
    "mid_market",
    "enterprise",
    "strategic",
  ];
  return segments.reduce<Record<CustomerSegment, number>>((acc, s) => {
    acc[s] = churned.filter((c) => c.segment === s).length;
    return acc;
  }, {} as Record<CustomerSegment, number>);
}

/**
 * Predicts customers at risk of churning based on heuristics.
 * Flags customers that haven't had expansions and are approaching renewal.
 */
export function identifyChurnRisk(
  customers: Customer[],
  asOf: Date,
  daysToRenewalThreshold = 90
): Customer[] {
  return customers.filter((c) => {
    if (c.churnDate) return false;
    if (!c.contractEndDate) return false;
    const daysUntilRenewal = daysBetween(asOf, c.contractEndDate);
    return daysUntilRenewal >= 0 && daysUntilRenewal <= daysToRenewalThreshold;
  });
}

/**
 * Customer Lifetime Value = ARPA / Churn Rate
 */
export function calculateLtv(
  averageRevenuePerAccount: number,
  monthlyChurnRate: number
): number {
  if (monthlyChurnRate <= 0) return Infinity;
  return round2(averageRevenuePerAccount / (monthlyChurnRate / 100));
}
