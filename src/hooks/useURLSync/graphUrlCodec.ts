/**
 * @file graphUrlCodec.ts
 * @purpose Pure encode/decode functions for graph window configurations
 *
 * Handles URL serialization of GraphWindowConfig[] with:
 * - Compact JSON schema (short field names)
 * - Base64 encoding (btoa/atob pattern)
 * - Color normalization (strip # on encode, add # on decode)
 * - Truncation logic (drop windows from end to fit 2000 char limit)
 * - Graceful error handling (no logging, pure functions)
 */

import type {
  GraphWindowConfig,
  ChartType,
  AxisConfig,
  RangeConfig,
} from "@/store/reducers/graphSlice";

// ============================================
// TYPES
// ============================================

interface EncodedSeries {
  mk: string; // metricKey
  c: string; // color WITHOUT # (e.g., "ff0000")
  e: boolean; // enabled
}

interface EncodedAxis {
  t: "d" | "m"; // type: "d" = doeMetadata, "m" = metric
  k: string; // key
}

interface EncodedRange {
  n: number | null; // min (null = auto)
  x: number | null; // max (null = auto)
}

interface EncodedWindow {
  ct: ChartType; // chartType
  xa: EncodedAxis; // xAxis
  ya: EncodedAxis; // yAxis
  sr: EncodedSeries[]; // series
  xr: EncodedRange; // xRange
  yr: EncodedRange; // yRange
}

interface EncodedPayload {
  v: 1; // version
  w: EncodedWindow[]; // windows
}

export interface EncodeResult {
  encoded: string;
  truncated: boolean;
  truncatedCount: number;
  originalCount: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function encodeAxis(axis: AxisConfig): EncodedAxis {
  return {
    t: axis.type === "doeMetadata" ? "d" : "m",
    k: axis.key,
  };
}

function decodeAxis(encoded: EncodedAxis): AxisConfig {
  return {
    type: encoded.t === "d" ? "doeMetadata" : "metric",
    key: encoded.k,
  };
}

function encodeRange(range: RangeConfig): EncodedRange {
  return {
    n: range.min === "auto" ? null : range.min,
    x: range.max === "auto" ? null : range.max,
  };
}

function decodeRange(encoded: EncodedRange): RangeConfig {
  return {
    min: encoded.n === null ? "auto" : encoded.n,
    max: encoded.x === null ? "auto" : encoded.x,
  };
}

function compressConfigs(configs: GraphWindowConfig[]): EncodedWindow[] {
  return configs.map((c) => ({
    ct: c.chartType,
    xa: encodeAxis(c.xAxis),
    ya: encodeAxis(c.yAxis),
    sr: c.series.map((s) => ({
      mk: s.metricKey,
      c: s.color.replace(/^#/, ""), // Strip # prefix
      e: s.enabled,
    })),
    xr: encodeRange(c.xRange),
    yr: encodeRange(c.yRange),
  }));
}

function expandConfigs(encoded: EncodedWindow[]): GraphWindowConfig[] {
  const validChartTypes: ChartType[] = [
    "line",
    "bar",
    "scatter",
    "area",
    "histogram",
  ];

  return encoded
    .filter((w) => {
      // Validate required fields
      if (!validChartTypes.includes(w.ct)) return false;
      if (!w.xa || typeof w.xa.t !== "string" || !w.xa.k) return false;
      if (!w.ya || typeof w.ya.t !== "string" || !w.ya.k) return false;
      if (!Array.isArray(w.sr)) return false;
      if (!w.xr || typeof w.xr !== "object") return false;
      if (!w.yr || typeof w.yr !== "object") return false;
      return true;
    })
    .map((w) => ({
      chartType: w.ct,
      xAxis: decodeAxis(w.xa),
      yAxis: decodeAxis(w.ya),
      series: w.sr
        .filter((s) => {
          // Drop invalid series
          if (!s.mk || typeof s.mk !== "string") return false;
          if (typeof s.c !== "string" || s.c.length === 0) return false;
          return true;
        })
        .map((s) => ({
          metricKey: s.mk,
          color: s.c.startsWith("#") ? s.c : `#${s.c}`, // Ensure # prefix
          enabled: s.e ?? true,
        })),
      xRange: decodeRange(w.xr),
      yRange: decodeRange(w.yr),
    }))
    .filter((w) => w.series.length > 0); // Drop windows with no valid series
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Encode graph window configurations to URL-safe string
 *
 * Handles truncation: drops windows from end until ≤2000 chars
 * Special case: single oversized window is kept (truncated: false)
 *
 * @param configs - Array of GraphWindowConfig to encode
 * @returns EncodeResult with encoded string, truncation info
 */
export function encodeGraphWindows(
  configs: GraphWindowConfig[]
): EncodeResult {
  if (configs.length === 0) {
    return {
      encoded: "",
      truncated: false,
      truncatedCount: 0,
      originalCount: 0,
    };
  }

  const originalCount = configs.length;
  const compressed = compressConfigs(configs);

  let windowsToEncode = [...compressed];
  let truncatedCount = 0;

  while (windowsToEncode.length > 0) {
    try {
      const json = JSON.stringify({ v: 1, w: windowsToEncode });
      const encoded = btoa(encodeURIComponent(json));

      // Check if within limit
      if (encoded.length <= 2000) {
        return {
          encoded,
          truncated: truncatedCount > 0,
          truncatedCount,
          originalCount,
        };
      }

      // If only 1 window left, return it even if oversized
      if (windowsToEncode.length === 1) {
        return {
          encoded,
          truncated: false, // No windows were dropped
          truncatedCount: 0,
          originalCount,
        };
      }

      // Drop last window and try again
      windowsToEncode = windowsToEncode.slice(0, -1);
      truncatedCount++;
    } catch {
      // Encoding error - try with fewer windows
      if (windowsToEncode.length === 1) {
        // Can't encode even 1 window - return empty
        return {
          encoded: "",
          truncated: false,
          truncatedCount: originalCount,
          originalCount,
        };
      }
      windowsToEncode = windowsToEncode.slice(0, -1);
      truncatedCount++;
    }
  }

  // All windows dropped
  return {
    encoded: "",
    truncated: true,
    truncatedCount: originalCount,
    originalCount,
  };
}

/**
 * Decode graph window configurations from URL parameter
 *
 * Returns empty array on any error (graceful degradation)
 * Validates all fields and drops invalid windows/series
 * Normalizes colors to have # prefix
 *
 * @param encoded - Base64-encoded string from URL
 * @returns Array of GraphWindowConfig (empty if decode fails)
 */
export function decodeGraphWindows(encoded: string): GraphWindowConfig[] {
  if (!encoded) return [];

  try {
    const json = decodeURIComponent(atob(encoded));
    const payload = JSON.parse(json) as EncodedPayload;

    if (!payload.w || !Array.isArray(payload.w)) return [];

    return expandConfigs(payload.w);
  } catch {
    return [];
  }
}
