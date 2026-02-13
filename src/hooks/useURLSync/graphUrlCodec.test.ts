import { describe, it, expect } from 'vitest';
import { encodeGraphWindows, decodeGraphWindows } from './graphUrlCodec';
import type { GraphWindowConfig } from '@/store/reducers/graphSlice';

function decodeRawPayload(encoded: string): unknown {
  return JSON.parse(decodeURIComponent(atob(encoded)));
}

describe('graphUrlCodec', () => {
  const validWindow: GraphWindowConfig = {
    chartType: "line",
    xAxis: { type: "doeMetadata", key: "PROJECT_NAME" },
    yAxis: { type: "metric", key: "QoR!Total_Power" },
    series: [
      { metricKey: "QoR!Area", color: "#ff0000", enabled: true },
      { metricKey: "QoR!Timing", color: "#00ff00", enabled: false },
    ],
    xRange: { min: 0, max: 100 },
    yRange: { min: "auto", max: "auto" },
  };

  describe('encodeGraphWindows', () => {
    it('returns empty result for empty array', () => {
      const result = encodeGraphWindows([]);
      expect(result.encoded).toBe("");
      expect(result.truncated).toBe(false);
      expect(result.truncatedCount).toBe(0);
      expect(result.originalCount).toBe(0);
    });

    it('encodes single window correctly', () => {
      const result = encodeGraphWindows([validWindow]);
      expect(result.encoded).toBeTruthy();
      expect(result.truncated).toBe(false);
      expect(result.truncatedCount).toBe(0);
      expect(result.originalCount).toBe(1);
    });

    it('emits v2 payload with per-series chart type (sr[].ct)', () => {
      const result = encodeGraphWindows([
        {
          ...validWindow,
          chartType: 'scatter',
          series: [
            { metricKey: 'QoR!Area', color: '#ff0000', enabled: true, chartType: 'bar' },
            { metricKey: 'QoR!Timing', color: '#00ff00', enabled: false, chartType: 'line' },
          ],
        },
      ]);

      const payload = decodeRawPayload(result.encoded) as {
        v: number;
        w: Array<{ ct: string; sr: Array<{ mk: string; c: string; e: boolean; ct?: string }> }>;
      };

      expect(payload.v).toBe(2);
      expect(payload.w[0].ct).toBe('scatter');
      expect(payload.w[0].sr[0].ct).toBe('bar');
      expect(payload.w[0].sr[1].ct).toBe('line');
    });

    it('strips # prefix from colors', () => {
      const result = encodeGraphWindows([validWindow]);
      const decoded = decodeGraphWindows(result.encoded);
      
      expect(decoded[0].series[0].color).toBe("#ff0000");
      expect(decoded[0].series[1].color).toBe("#00ff00");
    });

    it('handles colors without # prefix', () => {
      const windowWithoutHash: GraphWindowConfig = {
        ...validWindow,
        series: [
          { metricKey: "QoR!Area", color: "ff0000", enabled: true },
        ],
      };
      
      const result = encodeGraphWindows([windowWithoutHash]);
      const decoded = decodeGraphWindows(result.encoded);
      
      expect(decoded[0].series[0].color).toBe("#ff0000");
    });

    it('truncates windows from end when >2000 chars', () => {
      const largeWindows: GraphWindowConfig[] = Array.from({ length: 20 }, (_, i) => ({
        chartType: "line" as const,
        xAxis: { type: "doeMetadata" as const, key: `PROJECT_${i}` },
        yAxis: { type: "metric" as const, key: `QoR!Metric_${i}` },
        series: Array.from({ length: 10 }, (_, j) => ({
          metricKey: `Group_${i}!Metric_${j}`,
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          enabled: true,
        })),
        xRange: { min: 0, max: 100 },
        yRange: { min: 0, max: 100 },
      }));

      const result = encodeGraphWindows(largeWindows);
      
      expect(result.encoded.length).toBeLessThanOrEqual(2000);
      expect(result.truncated).toBe(true);
      expect(result.truncatedCount).toBeGreaterThan(0);
      expect(result.originalCount).toBe(20);
    });

    it('keeps single oversized window (truncated: false)', () => {
      const oversizedWindow: GraphWindowConfig = {
        chartType: "line",
        xAxis: { type: "doeMetadata", key: "PROJECT_NAME" },
        yAxis: { type: "metric", key: "QoR!Total_Power" },
        series: Array.from({ length: 10 }, (_, i) => ({
          metricKey: `VeryLongMetricKeyName_Group_${i}!VeryLongMetricLabel_${i}_WithExtraData`,
          color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
          enabled: true,
        })),
        xRange: { min: 0, max: 100 },
        yRange: { min: 0, max: 100 },
      };

      const result = encodeGraphWindows([oversizedWindow]);
      
      expect(result.encoded).toBeTruthy();
      expect(result.truncated).toBe(false);
      expect(result.truncatedCount).toBe(0);
      expect(result.originalCount).toBe(1);
    });
  });

  describe('decodeGraphWindows', () => {
    it('returns empty array for empty string', () => {
      const result = decodeGraphWindows("");
      expect(result).toEqual([]);
    });

    it('adds # prefix to colors', () => {
      const windowWithoutHash: GraphWindowConfig = {
        ...validWindow,
        series: [
          { metricKey: "QoR!Area", color: "ff0000", enabled: true },
        ],
      };
      
      const encoded = encodeGraphWindows([windowWithoutHash]);
      const decoded = decodeGraphWindows(encoded.encoded);
      
      expect(decoded[0].series[0].color).toBe("#ff0000");
      expect(decoded[0].series[0].color.startsWith("#")).toBe(true);
    });

    it('handles invalid base64 gracefully', () => {
      const result = decodeGraphWindows("invalid!!!base64");
      expect(result).toEqual([]);
    });

    it('handles invalid JSON gracefully', () => {
      const invalidJson = btoa(encodeURIComponent("not json"));
      const result = decodeGraphWindows(invalidJson);
      expect(result).toEqual([]);
    });

    it('validates chartType', () => {
      const validEncoded = encodeGraphWindows([validWindow]);
      const decoded = decodeGraphWindows(validEncoded.encoded);
      
      expect(decoded[0].chartType).toBe("line");
      expect(["line", "scatter", "bar", "area", "histogram"]).toContain(decoded[0].chartType);
    });

    it('validates AxisConfig structure', () => {
      const decoded = decodeGraphWindows(encodeGraphWindows([validWindow]).encoded);
      
      expect(decoded[0].xAxis).toHaveProperty("type");
      expect(decoded[0].xAxis).toHaveProperty("key");
      expect(["doeMetadata", "metric"]).toContain(decoded[0].xAxis.type);
      
      expect(decoded[0].yAxis).toHaveProperty("type");
      expect(decoded[0].yAxis).toHaveProperty("key");
      expect(["doeMetadata", "metric"]).toContain(decoded[0].yAxis.type);
    });

    it('validates RangeConfig (min/max: number | "auto")', () => {
      const decoded = decodeGraphWindows(encodeGraphWindows([validWindow]).encoded);
      
      expect(decoded[0].xRange).toHaveProperty("min");
      expect(decoded[0].xRange).toHaveProperty("max");
      expect(typeof decoded[0].xRange.min === "number" || decoded[0].xRange.min === "auto").toBe(true);
      expect(typeof decoded[0].xRange.max === "number" || decoded[0].xRange.max === "auto").toBe(true);
      
      expect(decoded[0].yRange.min).toBe("auto");
      expect(decoded[0].yRange.max).toBe("auto");
    });

    it('drops windows with invalid fields', () => {
      const invalidPayload = btoa(encodeURIComponent(JSON.stringify({
        v: 1,
        w: [
          { ct: "invalid_type", xa: { t: "d", k: "key" }, ya: { t: "m", k: "key" }, sr: [], xr: [0, 100], yr: [0, 100] },
        ],
      })));
      
      const result = decodeGraphWindows(invalidPayload);
      expect(result).toEqual([]);
    });

    it('drops series with invalid fields', () => {
      const windowWithInvalidSeries: GraphWindowConfig = {
        ...validWindow,
        series: [
          { metricKey: "QoR!Valid", color: "#ff0000", enabled: true },
          { metricKey: "", color: "#00ff00", enabled: true },
          { metricKey: "QoR!Valid2", color: "", enabled: true },
        ],
      };
      
      const encoded = encodeGraphWindows([windowWithInvalidSeries]);
      const decoded = decodeGraphWindows(encoded.encoded);
      
      expect(decoded[0].series.length).toBeLessThan(3);
      expect(decoded[0].series.every(s => s.metricKey && s.color)).toBe(true);
    });

    it('decodes legacy v1 payload by falling back to window chartType', () => {
      const v1Payload = {
        v: 1,
        w: [
          {
            ct: 'area',
            xa: { t: 'd', k: 'PROJECT_NAME' },
            ya: { t: 'm', k: 'QoR!Total_Power' },
            sr: [
              { mk: 'QoR!Area', c: 'ff0000', e: true },
              { mk: 'QoR!Timing', c: '00ff00', e: false },
            ],
            xr: { n: null, x: null },
            yr: { n: 0, x: 100 },
          },
        ],
      };

      const encoded = btoa(encodeURIComponent(JSON.stringify(v1Payload)));
      const decoded = decodeGraphWindows(encoded);

      expect(decoded).toHaveLength(1);
      expect(decoded[0].chartType).toBe('area');
      expect(decoded[0].series[0].chartType).toBe('area');
      expect(decoded[0].series[1].chartType).toBe('area');
    });

    it('prefers sr[].ct over window ct during decode', () => {
      const v2Payload = {
        v: 2,
        w: [
          {
            ct: 'line',
            xa: { t: 'd', k: 'PROJECT_NAME' },
            ya: { t: 'm', k: 'QoR!Total_Power' },
            sr: [
              { mk: 'QoR!Area', c: 'ff0000', e: true, ct: 'scatter' },
              { mk: 'QoR!Timing', c: '00ff00', e: false, ct: 'bar' },
            ],
            xr: { n: null, x: null },
            yr: { n: 0, x: 100 },
          },
        ],
      };

      const encoded = btoa(encodeURIComponent(JSON.stringify(v2Payload)));
      const decoded = decodeGraphWindows(encoded);

      expect(decoded).toHaveLength(1);
      expect(decoded[0].series[0].chartType).toBe('scatter');
      expect(decoded[0].series[1].chartType).toBe('bar');
    });

    it('falls back to line when series and window chartType are invalid', () => {
      const malformedPayload = {
        v: 2,
        w: [
          {
            ct: 'not-a-chart-type',
            xa: { t: 'd', k: 'PROJECT_NAME' },
            ya: { t: 'm', k: 'QoR!Total_Power' },
            sr: [
              { mk: 'QoR!Area', c: 'ff0000', e: true, ct: 'also-invalid' },
            ],
            xr: { n: null, x: null },
            yr: { n: 0, x: 100 },
          },
        ],
      };

      const encoded = btoa(encodeURIComponent(JSON.stringify(malformedPayload)));
      const decoded = decodeGraphWindows(encoded);

      expect(decoded).toHaveLength(1);
      expect(decoded[0].series[0].chartType).toBe('line');
      expect(decoded[0].chartType).toBe('line');
    });
  });

  describe('roundtrip', () => {
    it('preserves data through encode→decode cycle', () => {
      const result = encodeGraphWindows([validWindow]);
      const decoded = decodeGraphWindows(result.encoded);
      
      expect(decoded).toHaveLength(1);
      expect(decoded[0].chartType).toBe(validWindow.chartType);
      expect(decoded[0].xAxis).toEqual(validWindow.xAxis);
      expect(decoded[0].yAxis).toEqual(validWindow.yAxis);
      expect(decoded[0].series).toHaveLength(validWindow.series.length);
      expect(decoded[0].xRange).toEqual(validWindow.xRange);
      expect(decoded[0].yRange).toEqual(validWindow.yRange);
    });

    it('handles multiple windows', () => {
      const windows: GraphWindowConfig[] = [
        validWindow,
        {
          chartType: "scatter",
          xAxis: { type: "metric", key: "QoR!Area" },
          yAxis: { type: "metric", key: "QoR!Power" },
          series: [{ metricKey: "QoR!Timing", color: "#0000ff", enabled: true }],
          xRange: { min: "auto", max: "auto" },
          yRange: { min: 0, max: 200 },
        },
      ];
      
      const result = encodeGraphWindows(windows);
      const decoded = decodeGraphWindows(result.encoded);
      
      expect(decoded).toHaveLength(2);
      expect(decoded[0].chartType).toBe("line");
      expect(decoded[1].chartType).toBe("scatter");
    });

    it('handles all chartTypes', () => {
      const chartTypes: Array<"line" | "scatter" | "bar" | "area" | "histogram"> = 
        ["line", "scatter", "bar", "area", "histogram"];
      
      const windows: GraphWindowConfig[] = chartTypes.map(ct => ({
        chartType: ct,
        xAxis: { type: "doeMetadata" as const, key: "PROJECT_NAME" },
        yAxis: { type: "metric" as const, key: "QoR!Power" },
        series: [{ metricKey: "QoR!Area", color: "#ff0000", enabled: true }],
        xRange: { min: 0, max: 100 },
        yRange: { min: 0, max: 100 },
      }));
      
      const result = encodeGraphWindows(windows);
      const decoded = decodeGraphWindows(result.encoded);
      
      if (result.truncated) {
        expect(decoded.length).toBeLessThan(5);
        expect(decoded.length).toBeGreaterThan(0);
      } else {
        expect(decoded).toHaveLength(5);
        decoded.forEach((w, i) => {
          expect(w.chartType).toBe(chartTypes[i]);
        });
      }
    });

    it('handles "auto" ranges', () => {
      const windowWithAuto: GraphWindowConfig = {
        ...validWindow,
        xRange: { min: "auto", max: "auto" },
        yRange: { min: "auto", max: "auto" },
      };
      
      const result = encodeGraphWindows([windowWithAuto]);
      const decoded = decodeGraphWindows(result.encoded);
      
      expect(decoded[0].xRange.min).toBe("auto");
      expect(decoded[0].xRange.max).toBe("auto");
      expect(decoded[0].yRange.min).toBe("auto");
      expect(decoded[0].yRange.max).toBe("auto");
    });
  });
});
