import { calculateNrr } from "../src/metrics/nrr";
import { events, JAN } from "./fixtures";

describe("NRR Metrics", () => {
  it("calculates NRR above 100% when expansion > churn", () => {
    // opening 15000, expansion 1000, churn 1000 → NRR = (15000+1000-0-1000)/15000 = 100%
    const result = calculateNrr(events, JAN, 15000);
    expect(result.nrr).toBe(100);
  });

  it("calculates GRR (excludes expansion)", () => {
    const result = calculateNrr(events, JAN, 15000);
    // GRR = (15000 - 0 - 1000) / 15000 * 100 ≈ 93.33%
    expect(result.grr).toBeCloseTo(93.33, 1);
  });

  it("calculates expansion rate", () => {
    const result = calculateNrr(events, JAN, 15000);
    // 1000/15000 * 100 ≈ 6.67%
    expect(result.expansionRate).toBeCloseTo(6.67, 1);
  });

  it("returns zero NRR when opening MRR is 0", () => {
    const result = calculateNrr(events, JAN, 0);
    expect(result.nrr).toBe(0);
    expect(result.grr).toBe(0);
  });

  it("calculates NRR below 100% when churn > expansion", () => {
    const { calculateNrr: calcNrr } = require("../src/metrics/nrr");
    const heavyChurnEvents = [
      {
        id: "x1",
        customerId: "c1",
        type: "churn" as const,
        mrr: -5000,
        arr: -60000,
        date: new Date("2024-01-10"),
      },
    ];
    const result = calcNrr(heavyChurnEvents, JAN, 10000);
    expect(result.nrr).toBeLessThan(100);
    expect(result.grr).toBeLessThan(100);
  });
});
