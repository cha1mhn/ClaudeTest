import { Customer, RevenueEvent, ArrMetrics, DateRange } from "../types";
import { isInRange } from "../utils/date";
import { round2, sumBy, growthRate } from "../utils/math";

/**
 * Calculates ARR metrics for a given period.
 */
export function calculateArrMetrics(
  customers: Customer[],
  events: RevenueEvent[],
  period: DateRange,
  previousArr: number
): ArrMetrics {
  const periodEvents = events.filter((e) => isInRange(e.date, period));

  const activeAtEnd = customers.filter(
    (c) =>
      c.contractStartDate <= period.end &&
      (c.churnDate === undefined || c.churnDate > period.end)
  );

  const arr = round2(sumBy(activeAtEnd, (c) => c.arr));

  const newLogoArr = round2(
    sumBy(
      periodEvents.filter((e) => e.type === "new_business"),
      (e) => e.arr
    )
  );
  const expansionArr = round2(
    sumBy(
      periodEvents.filter((e) => e.type === "expansion"),
      (e) => e.arr
    )
  );
  const contractionArr = round2(
    sumBy(
      periodEvents.filter((e) => e.type === "contraction"),
      (e) => Math.abs(e.arr)
    )
  );
  const churnArr = round2(
    sumBy(
      periodEvents.filter((e) => e.type === "churn"),
      (e) => Math.abs(e.arr)
    )
  );
  const netNewArr = round2(newLogoArr + expansionArr - contractionArr - churnArr);
  const arrGrowthRate = round2(growthRate(arr, previousArr));

  // Net Dollar Retention = (opening ARR + expansion - contraction - churn) / opening ARR
  const ndrPercent =
    previousArr === 0
      ? 0
      : round2(
          ((previousArr + expansionArr - contractionArr - churnArr) /
            previousArr) *
            100
        );

  return {
    arr,
    arrGrowthRate,
    newLogoArr,
    expansionArr,
    contractionArr,
    churnArr,
    netNewArr,
    ndrPercent,
  };
}

/**
 * Annualises MRR to ARR.
 */
export function mrrToArr(mrr: number): number {
  return round2(mrr * 12);
}

/**
 * Derives ARR per customer segment.
 */
export function arrBySegment(
  customers: Customer[],
  asOf: Date
): Record<string, number> {
  const active = customers.filter(
    (c) =>
      c.contractStartDate <= asOf &&
      (c.churnDate === undefined || c.churnDate > asOf)
  );

  return active.reduce<Record<string, number>>((acc, c) => {
    acc[c.segment] = round2((acc[c.segment] ?? 0) + c.arr);
    return acc;
  }, {});
}
