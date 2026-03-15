import { RevenueEvent, NrrMetrics, DateRange } from "../types";
import { isInRange } from "../utils/date";
import { round2, sumBy } from "../utils/math";

/**
 * Net Revenue Retention (NRR) / Net Dollar Retention (NDR)
 *
 * NRR = (Opening MRR + Expansion - Contraction - Churn) / Opening MRR * 100
 *
 * Gross Revenue Retention (GRR) = (Opening MRR - Contraction - Churn) / Opening MRR * 100
 */
export function calculateNrr(
  events: RevenueEvent[],
  period: DateRange,
  openingMrr: number
): NrrMetrics {
  const cohortEvents = events.filter((e) => isInRange(e.date, period));

  const expansionMrr = round2(
    sumBy(cohortEvents.filter((e) => e.type === "expansion"), (e) => e.mrr)
  );
  const contractionMrr = round2(
    sumBy(cohortEvents.filter((e) => e.type === "contraction"), (e) => Math.abs(e.mrr))
  );
  const churnMrr = round2(
    sumBy(cohortEvents.filter((e) => e.type === "churn"), (e) => Math.abs(e.mrr))
  );

  const nrr =
    openingMrr === 0
      ? 0
      : round2(
          ((openingMrr + expansionMrr - contractionMrr - churnMrr) /
            openingMrr) *
            100
        );

  const grr =
    openingMrr === 0
      ? 0
      : round2(
          ((openingMrr - contractionMrr - churnMrr) / openingMrr) * 100
        );

  const expansionRate =
    openingMrr === 0 ? 0 : round2((expansionMrr / openingMrr) * 100);
  const contractionRate =
    openingMrr === 0 ? 0 : round2((contractionMrr / openingMrr) * 100);
  const churnRate =
    openingMrr === 0 ? 0 : round2((churnMrr / openingMrr) * 100);

  return {
    period,
    nrr,
    grr,
    expansionRate,
    contractionRate,
    churnRate,
  };
}

/**
 * Calculates NRR for a specific customer cohort (customers who started in a reference period).
 */
export function calculateCohortNrr(
  events: RevenueEvent[],
  cohortCustomerIds: string[],
  measurementPeriod: DateRange,
  openingMrr: number
): NrrMetrics {
  const cohortEvents = events.filter(
    (e) =>
      cohortCustomerIds.includes(e.customerId) &&
      isInRange(e.date, measurementPeriod)
  );
  return calculateNrr(cohortEvents, measurementPeriod, openingMrr);
}
