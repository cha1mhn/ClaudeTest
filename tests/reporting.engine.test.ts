import { generateReport, generateTrendReport } from "../src/reporting/engine";
import { customers, deals, events, activities, JAN } from "./fixtures";

describe("Reporting Engine", () => {
  const input = { customers, deals, events, activities };

  describe("generateReport", () => {
    it("produces a report with all sections", () => {
      const report = generateReport(input, {
        period: JAN,
        targetRevenue: 200000,
      });

      expect(report.mrr).toBeDefined();
      expect(report.arr).toBeDefined();
      expect(report.churn).toBeDefined();
      expect(report.nrr).toBeDefined();
      expect(report.pipeline).toBeDefined();
      expect(report.salesPerformance).toBeDefined();
      expect(report.highlights.length).toBeGreaterThan(0);
    });

    it("generates alerts when thresholds are breached", () => {
      const report = generateReport(input, {
        period: JAN,
        targetRevenue: 200000,
        alertThresholds: {
          pipelineCoverageWarning: 5, // will definitely trigger
        },
      });
      expect(report.alerts.length).toBeGreaterThan(0);
    });

    it("includes generatedAt timestamp", () => {
      const before = new Date();
      const report = generateReport(input, { period: JAN });
      expect(report.generatedAt >= before).toBe(true);
    });

    it("skips salesPerformance when no activities provided", () => {
      const report = generateReport(
        { customers, deals, events },
        { period: JAN }
      );
      expect(report.salesPerformance).toBeUndefined();
    });

    it("includes cohort data when requested", () => {
      const report = generateReport(input, {
        period: JAN,
        includeCohorts: true,
        cohortPeriods: [JAN],
      });
      expect(report.cohortRetention).toBeDefined();
      expect(report.cohortRetention!.length).toBeGreaterThan(0);
    });
  });

  describe("generateTrendReport", () => {
    it("returns correct number of period reports", () => {
      const base = new Date("2024-03-01");
      const reports = generateTrendReport(input, base, "monthly", 3);
      expect(reports).toHaveLength(3);
    });

    it("periods are in ascending order", () => {
      const base = new Date("2024-03-01");
      const reports = generateTrendReport(input, base, "monthly", 3);
      for (let i = 1; i < reports.length; i++) {
        expect(reports[i].period.start > reports[i - 1].period.start).toBe(true);
      }
    });
  });
});
