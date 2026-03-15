import { calculateChurnMetrics, identifyChurnRisk, calculateLtv } from "../src/metrics/churn";
import { customers, JAN } from "./fixtures";
import { Customer } from "../src/types";

describe("Churn Metrics", () => {
  describe("calculateChurnMetrics", () => {
    it("counts churned customers in period", () => {
      const result = calculateChurnMetrics(customers, JAN);
      expect(result.churnedCustomers).toBe(1); // c3 churned in Jan
    });

    it("calculates logo churn rate", () => {
      const result = calculateChurnMetrics(customers, JAN);
      // 2 customers active at start (c1, c2 started before Jan; c3 also started before)
      // 3 active at start, 1 churned → 33.33%
      expect(result.logoChurnRate).toBeGreaterThan(0);
    });

    it("calculates churned ARR", () => {
      const result = calculateChurnMetrics(customers, JAN);
      expect(result.churnedArr).toBe(12000);
    });

    it("breaks down churn by reason", () => {
      const result = calculateChurnMetrics(customers, JAN);
      expect(result.churnByReason.price).toBe(1);
      expect(result.churnByReason.competitor).toBe(0);
    });

    it("breaks down churn by segment", () => {
      const result = calculateChurnMetrics(customers, JAN);
      expect(result.churnBySegment.smb).toBe(1);
      expect(result.churnBySegment.enterprise).toBe(0);
    });

    it("returns zero when no churn", () => {
      const noChurnCustomers: Customer[] = customers.map((c) => ({
        ...c,
        churnDate: undefined,
      }));
      const result = calculateChurnMetrics(noChurnCustomers, JAN);
      expect(result.churnedCustomers).toBe(0);
      expect(result.logoChurnRate).toBe(0);
    });
  });

  describe("identifyChurnRisk", () => {
    it("flags customers with upcoming renewals", () => {
      const now = new Date("2024-01-01");
      const atRisk: Customer[] = [
        {
          ...customers[0],
          contractEndDate: new Date("2024-03-15"),
        },
      ];
      const risks = identifyChurnRisk(atRisk, now, 90);
      expect(risks).toHaveLength(1);
    });

    it("does not flag already churned customers", () => {
      const now = new Date("2024-01-01");
      const risks = identifyChurnRisk(customers, now, 90);
      // c3 is churned, should not appear
      expect(risks.every((c) => !c.churnDate)).toBe(true);
    });
  });

  describe("calculateLtv", () => {
    it("calculates LTV correctly", () => {
      // ARPA 10000, churn 2% → 10000 / 0.02 = 500000
      expect(calculateLtv(10000, 2)).toBe(500000);
    });

    it("returns Infinity for zero churn", () => {
      expect(calculateLtv(10000, 0)).toBe(Infinity);
    });
  });
});
