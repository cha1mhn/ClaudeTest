import {
  Customer,
  RevenueEvent,
  CohortRetentionData,
  CohortPeriod,
  DateRange,
} from "../types";
import { isInRange, monthsBetween } from "../utils/date";
import { pct, round2, sumBy } from "../utils/math";

/**
 * Builds a cohort retention matrix.
 *
 * Customers are grouped by their first month (contractStartDate).
 * Each row shows how many customers / how much MRR is retained after N months.
 */
export function buildCohortRetention(
  customers: Customer[],
  events: RevenueEvent[],
  cohortPeriods: DateRange[]
): CohortRetentionData[] {
  return cohortPeriods.map((cohortRange) => {
    const cohortCustomers = customers.filter((c) =>
      isInRange(c.contractStartDate, cohortRange)
    );

    const initialMrr = round2(sumBy(cohortCustomers, (c) => c.mrr));
    const cohortIds = cohortCustomers.map((c) => c.id);

    const maxOffset = cohortCustomers.length > 0 ? 24 : 0;
    const periods: CohortPeriod[] = [];

    for (let offset = 0; offset <= maxOffset; offset++) {
      const periodStart = new Date(cohortRange.end);
      periodStart.setMonth(periodStart.getMonth() + offset);
      const measureDate = periodStart;

      const retained = cohortCustomers.filter(
        (c) =>
          c.contractStartDate <= measureDate &&
          (c.churnDate === undefined || c.churnDate > measureDate)
      );

      // MRR retained = opening MRR +/- events up to measure date
      const cohortEvents = events.filter(
        (e) =>
          cohortIds.includes(e.customerId) && e.date <= measureDate
      );

      const expansionMrr = sumBy(
        cohortEvents.filter((e) => e.type === "expansion"),
        (e) => e.mrr
      );
      const contractionMrr = sumBy(
        cohortEvents.filter((e) => e.type === "contraction"),
        (e) => Math.abs(e.mrr)
      );
      const churnMrr = sumBy(
        cohortEvents.filter((e) => e.type === "churn"),
        (e) => Math.abs(e.mrr)
      );

      const retainedMrr = round2(
        initialMrr + expansionMrr - contractionMrr - churnMrr
      );

      periods.push({
        monthOffset: offset,
        retainedCustomers: retained.length,
        retainedMrr: Math.max(0, retainedMrr),
        logoRetentionRate: round2(pct(retained.length, cohortCustomers.length)),
        mrrRetentionRate:
          initialMrr === 0
            ? 0
            : round2(pct(Math.max(0, retainedMrr), initialMrr)),
      });
    }

    const cohortStart = cohortRange.start;
    const label = `${cohortStart.getFullYear()}-${String(cohortStart.getMonth() + 1).padStart(2, "0")}`;

    return {
      cohortMonth: label,
      initialCustomers: cohortCustomers.length,
      initialMrr,
      periods,
    };
  });
}
