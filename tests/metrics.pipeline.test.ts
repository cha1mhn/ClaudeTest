import {
  calculatePipelineMetrics,
  identifyStaleDeals,
  pipelineByForecastCategory,
} from "../src/metrics/pipeline";
import { deals, JAN } from "./fixtures";
import { Deal } from "../src/types";

describe("Pipeline Metrics", () => {
  describe("calculatePipelineMetrics", () => {
    it("calculates total pipeline value (open deals only)", () => {
      const result = calculatePipelineMetrics(deals, JAN, 200000);
      // d1 is open (proposal), d2 is closed_won, d3 is closed_lost
      expect(result.totalPipelineValue).toBe(150000);
    });

    it("calculates pipeline coverage", () => {
      const result = calculatePipelineMetrics(deals, JAN, 200000);
      // 150000 / 200000 = 0.75
      expect(result.pipelineCoverage).toBe(0.75);
    });

    it("calculates win rate", () => {
      const result = calculatePipelineMetrics(deals, JAN, 200000);
      // 1 won, 1 lost → 50%
      expect(result.winRate).toBe(50);
    });

    it("calculates average deal size", () => {
      const result = calculatePipelineMetrics(deals, JAN, 200000);
      // only 1 open deal worth 150000
      expect(result.averageDealSize).toBe(150000);
    });

    it("handles zero target revenue", () => {
      const result = calculatePipelineMetrics(deals, JAN, 0);
      expect(result.pipelineCoverage).toBe(0);
    });
  });

  describe("identifyStaleDeals", () => {
    it("flags deals past close date", () => {
      const asOf = new Date("2024-02-01");
      const stale = identifyStaleDeals(deals, asOf);
      // d1 close date Jan 31, still open → stale
      expect(stale.some((d) => d.id === "d1")).toBe(true);
    });

    it("does not flag closed deals", () => {
      const asOf = new Date("2024-02-01");
      const stale = identifyStaleDeals(deals, asOf);
      expect(stale.every((d) => !["closed_won", "closed_lost"].includes(d.stage))).toBe(true);
    });
  });

  describe("pipelineByForecastCategory", () => {
    it("groups open deals by forecast category", () => {
      const result = pipelineByForecastCategory(deals);
      expect(result.commit).toBe(150000);
    });

    it("excludes closed deals", () => {
      const result = pipelineByForecastCategory(deals);
      const values = Object.values(result);
      // closed won (60000) and closed lost (30000) should not appear
      expect(values.includes(60000)).toBe(false);
    });
  });
});
