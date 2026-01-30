/**
 * @file metrics.ts
 *
 * @purpose
 * Shared metric helper functions for graph components.
 * Provides utilities for filtering metrics and formatting display labels.
 *
 * @dependencies
 * - @/variables/helpers (getMetricFormatStrategy)
 * - @/variables/metricValueExtractor (METRIC_EXTRACTORS)
 */

import { getMetricFormatStrategy } from "@/variables/helpers";
import { METRIC_EXTRACTORS } from "@/variables/metricValueExtractor";

/**
 * Hardcoded DoE metadata keys for X-axis dropdown.
 * Not all DoEEntry fields make sense as X-axis (e.g., arrays like scenarioList).
 */
export const DOE_METADATA_KEYS = [
  "label",
  "PROJECT_NAME",
  "BLOCK",
  "NET_VER",
  "REVISION",
  "ECO_NUM",
  "POWER_SCENARIO",
] as const;

/**
 * Get all numeric metrics (excludes string-only metrics like Formality).
 * Used by Y-axis dropdown.
 */
export function getNumericMetrics(): string[] {
  const allMetrics = Object.keys(METRIC_EXTRACTORS);
  return allMetrics.filter((key) => {
    const format = getMetricFormatStrategy(key);
    return format === "number" || format === "skip-decimal";
  });
}

/**
 * Format metric key for display in UI.
 * Example: "Power(mW)!combinational_Total" → "Power(mW) - Combinational Total"
 */
export function formatMetricForDisplay(key: string): string {
  const [group, label] = key.split("!");
  if (!label) return key;
  const formatted = label
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return `${group} - ${formatted}`;
}
