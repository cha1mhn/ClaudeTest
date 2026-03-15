import {
  Customer,
  RevenueEvent,
  MrrBreakdown,
  DateRange,
} from "../types";
import { isInRange } from "../utils/date";
import { round2, sumBy } from "../utils/math";

/**
 * Calculates a full MRR waterfall / bridge for a given period.
 *
 * Opening MRR + New Business + Expansion - Contraction - Churn + Reactivation = Closing MRR
 */
export function calculateMrrBreakdown(
  events: RevenueEvent[],
  period: DateRange,
  openingMrr: number
): MrrBreakdown {
  const periodEvents = events.filter((e) => isInRange(e.date, period));

  const newBusinessMrr = round2(
    sumBy(periodEvents.filter((e) => e.type === "new_business"), (e) => e.mrr)
  );
  const expansionMrr = round2(
    sumBy(periodEvents.filter((e) => e.type === "expansion"), (e) => e.mrr)
  );
  const contractionMrr = round2(
    sumBy(periodEvents.filter((e) => e.type === "contraction"), (e) => Math.abs(e.mrr))
  );
  const churnMrr = round2(
    sumBy(periodEvents.filter((e) => e.type === "churn"), (e) => Math.abs(e.mrr))
  );
  const reactivationMrr = round2(
    sumBy(periodEvents.filter((e) => e.type === "reactivation"), (e) => e.mrr)
  );

  const netNewMrr = round2(
    newBusinessMrr + expansionMrr - contractionMrr - churnMrr + reactivationMrr
  );
  const closingMrr = round2(openingMrr + netNewMrr);
  const growthRate =
    openingMrr === 0 ? 0 : round2((netNewMrr / openingMrr) * 100);

  return {
    period,
    openingMrr,
    newBusinessMrr,
    expansionMrr,
    contractionMrr,
    churnMrr,
    reactivationMrr,
    closingMrr,
    netNewMrr,
    growthRate,
  };
}

/**
 * Derives MRR from an active customer list at a point in time.
 */
export function mrrFromCustomers(customers: Customer[], asOf: Date): number {
  return round2(
    sumBy(
      customers.filter(
        (c) =>
          c.contractStartDate <= asOf &&
          (c.churnDate === undefined || c.churnDate > asOf)
      ),
      (c) => c.mrr
    )
  );
}

/**
 * Builds a multi-period MRR trend from a list of revenue events.
 */
export function buildMrrTrend(
  events: RevenueEvent[],
  periods: DateRange[]
): MrrBreakdown[] {
  const trend: MrrBreakdown[] = [];
  let openingMrr = 0;

  for (const period of periods) {
    const breakdown = calculateMrrBreakdown(events, period, openingMrr);
    trend.push(breakdown);
    openingMrr = breakdown.closingMrr;
  }

  return trend;
}
