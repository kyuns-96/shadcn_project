import { describe, it, expect } from "vitest";
import {
  DOE_METADATA_KEYS,
  getNumericMetrics,
  formatMetricForDisplay,
} from "./metrics";
import { METRIC_EXTRACTORS } from "@/variables/metricValueExtractor";
import { getMetricFormatStrategy } from "@/variables/helpers";

describe("metrics utilities", () => {
  describe("DOE_METADATA_KEYS", () => {
    it("should export array of DoE metadata keys", () => {
      expect(DOE_METADATA_KEYS).toBeInstanceOf(Array);
      expect(DOE_METADATA_KEYS.length).toBeGreaterThan(0);
    });

    it("should contain expected metadata keys", () => {
      expect(DOE_METADATA_KEYS).toContain("label");
      expect(DOE_METADATA_KEYS).toContain("PROJECT_NAME");
      expect(DOE_METADATA_KEYS).toContain("BLOCK");
      expect(DOE_METADATA_KEYS).toContain("NET_VER");
      expect(DOE_METADATA_KEYS).toContain("REVISION");
      expect(DOE_METADATA_KEYS).toContain("ECO_NUM");
      expect(DOE_METADATA_KEYS).toContain("POWER_SCENARIO");
    });
  });

  describe("getNumericMetrics", () => {
    it("should return an array", () => {
      const result = getNumericMetrics();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return only numeric metrics", () => {
      const numericMetrics = getNumericMetrics();

      numericMetrics.forEach((key) => {
        const format = getMetricFormatStrategy(key);
        expect(["number", "skip-decimal"]).toContain(format);
      });
    });

    it("should exclude string-only metrics", () => {
      const numericMetrics = getNumericMetrics();
      const allMetrics = Object.keys(METRIC_EXTRACTORS);

      const stringOnlyMetrics = allMetrics.filter(
        (key) => getMetricFormatStrategy(key) === "string-only"
      );

      stringOnlyMetrics.forEach((key) => {
        expect(numericMetrics).not.toContain(key);
      });
    });

    it("should include Power metrics", () => {
      const numericMetrics = getNumericMetrics();
      const powerMetrics = numericMetrics.filter((key) =>
        key.startsWith("Power")
      );
      expect(powerMetrics.length).toBeGreaterThan(0);
    });

    it("should include Timing metrics", () => {
      const numericMetrics = getNumericMetrics();
      const timingMetrics = numericMetrics.filter((key) =>
        key.startsWith("Timing")
      );
      expect(timingMetrics.length).toBeGreaterThan(0);
    });
  });

  describe("formatMetricForDisplay", () => {
    it("should format metric with group and label", () => {
      const result = formatMetricForDisplay("Power(mW)!combinational_Total");
      expect(result).toBe("Power(mW) - Combinational Total");
    });

    it("should handle keys without separator", () => {
      const result = formatMetricForDisplay("simple_key");
      expect(result).toBe("simple_key");
    });

    it("should capitalize each word in label", () => {
      const result = formatMetricForDisplay("Timing(ps)!worst_negative_slack");
      expect(result).toBe("Timing(ps) - Worst Negative Slack");
    });

    it("should handle single word labels", () => {
      const result = formatMetricForDisplay("Power(mW)!Total");
      expect(result).toBe("Power(mW) - Total");
    });

    it("should handle multiple underscores", () => {
      const result = formatMetricForDisplay(
        "Area(um^2)!gate_count_sequential_total"
      );
      expect(result).toBe("Area(um^2) - Gate Count Sequential Total");
    });

    it("should preserve group name with special characters", () => {
      const result = formatMetricForDisplay("Area(um^2)!SRAM");
      expect(result).toBe("Area(um^2) - SRAM");
    });

    it("should handle empty label after separator", () => {
      const result = formatMetricForDisplay("Power(mW)!");
      expect(result).toBe("Power(mW)!");
    });

    it("should handle multiple separators", () => {
      const result = formatMetricForDisplay("Group!label!extra");
      expect(result).toBe("Group - Label");
    });
  });
});
