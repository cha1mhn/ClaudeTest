import { calculateMrrBreakdown, mrrFromCustomers, buildMrrTrend } from "../src/metrics/mrr";
import { customers, events, JAN, FEB } from "./fixtures";

describe("MRR Metrics", () => {
  describe("calculateMrrBreakdown", () => {
    it("calculates correct closing MRR", () => {
      const result = calculateMrrBreakdown(events, JAN, 15000);
      // opening 15000 + newBiz 2000 + expansion 1000 - churn 1000 = 17000
      expect(result.closingMrr).toBe(17000);
      expect(result.newBusinessMrr).toBe(2000);
      expect(result.expansionMrr).toBe(1000);
      expect(result.churnMrr).toBe(1000);
      expect(result.contractionMrr).toBe(0);
      expect(result.netNewMrr).toBe(2000);
    });

    it("calculates growth rate", () => {
      const result = calculateMrrBreakdown(events, JAN, 15000);
      // (2000 / 15000) * 100 ≈ 13.33
      expect(result.growthRate).toBeCloseTo(13.33, 1);
    });

    it("handles zero opening MRR", () => {
      const result = calculateMrrBreakdown(events, JAN, 0);
      expect(result.growthRate).toBe(0);
      expect(result.closingMrr).toBe(2000);
    });

    it("returns empty period when no events", () => {
      const result = calculateMrrBreakdown([], JAN, 10000);
      expect(result.closingMrr).toBe(10000);
      expect(result.netNewMrr).toBe(0);
    });
  });

  describe("mrrFromCustomers", () => {
    it("sums MRR of active customers at a given date", () => {
      const asOf = new Date("2024-01-01");
      // c1 (10000) + c2 (4000) + c3 (1000, not yet churned) = 15000
      expect(mrrFromCustomers(customers, asOf)).toBe(15000);
    });

    it("excludes churned customers", () => {
      const asOf = new Date("2024-01-16"); // c3 churned on Jan 15
      // c1 + c2 only = 14000
      expect(mrrFromCustomers(customers, asOf)).toBe(14000);
    });
  });

  describe("buildMrrTrend", () => {
    it("chains opening MRR across periods", () => {
      const trend = buildMrrTrend(events, [JAN, FEB]);
      expect(trend).toHaveLength(2);
      expect(trend[0].openingMrr).toBe(0);
      expect(trend[1].openingMrr).toBe(trend[0].closingMrr);
    });
  });
});
