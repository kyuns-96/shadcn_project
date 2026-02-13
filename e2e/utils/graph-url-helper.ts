// e2e/utils/graph-url-helper.ts
// DO NOT import from @/hooks/useURLSync - those use browser-only btoa
// DO NOT use @/ path alias - Playwright tests run in Node, not through Vite

// Node-compatible base64 encoding (replaces browser's btoa)
function nodeBase64Encode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64');
}

// ========================================
// COLUMN ENCODING (for data seeding)
// ========================================
// Must match: src/hooks/useURLSync/utils.ts:63-73

const COLUMN_COMPRESSION_MAP = {
  id: 'i', label: 'l', PROJECT_NAME: 'p', BLOCK: 'b',
  NET_VER: 'n', REVISION: 'r', ECO_NUM: 'e',
  POWER_SCENARIO: 's', TIMING_SCENARIO: 't', REVISION_MODE: 'm',
  _needsDataFetch: 'f',
} as const;

interface ColumnMeta {
  id: string;
  label: string;
  PROJECT_NAME: string;
  BLOCK: string;
  NET_VER: string;
  REVISION: string;
  ECO_NUM: string;
  POWER_SCENARIO: string;
  TIMING_SCENARIO: string;
  REVISION_MODE: string;
  _needsDataFetch?: boolean;
}

export function encodeColumnsForNode(columns: ColumnMeta[]): string {
  const compressed = columns.map(col => {
    const result: Record<string, unknown> = {};
    for (const [full, short] of Object.entries(COLUMN_COMPRESSION_MAP)) {
      if (col[full as keyof ColumnMeta] !== undefined) {
        result[short] = col[full as keyof ColumnMeta];
      }
    }
    return result;
  });
  return nodeBase64Encode(encodeURIComponent(JSON.stringify(compressed)));
}

// ========================================
// GRAPH WINDOW ENCODING
// ========================================
// Must match EXACTLY: src/hooks/useURLSync/graphUrlCodec.ts
//
// Payload shape: { v: 2, w: EncodedWindow[] }
// EncodedWindow: { ct, xa:{t,k}, ya:{t,k}, sr:[{mk,c,e,ct}], xr:{n,x}, yr:{n,x} }
//
// Key mappings:
//   ct = chartType ('line' | 'scatter' | 'bar' | 'area' | 'histogram')
//   xa = xAxis, ya = yAxis (EncodedAxis: { t: 'd'|'m', k: string })
//     - t: 'd' = doeMetadata, 'm' = metric
//     - k: key string
//   sr = series array (EncodedSeries[]: { mk, c, e, ct })
//     - mk = metricKey
//     - c = color WITHOUT # prefix (e.g., "ff0000" not "#ff0000")
//     - e = enabled
//     - ct = per-series chartType
//   xr = xRange, yr = yRange (EncodedRange: { n, x })
//     - n = min (null = 'auto')
//     - x = max (null = 'auto')
//
// Encoding: btoa(encodeURIComponent(JSON.stringify(payload)))
// Decoding: JSON.parse(decodeURIComponent(atob(encoded)))
// Color: stored WITHOUT #, restored WITH #
// Decode behavior: windows with invalid/empty sr are dropped

type ChartType = 'line' | 'scatter' | 'bar' | 'area' | 'histogram';

interface TestAxisConfig {
  type: 'doeMetadata' | 'metric';
  key: string;
}

interface TestSeriesConfig {
  metricKey: string;
  color: string;  // WITH # prefix - we strip it during encoding
  enabled: boolean;
  chartType?: ChartType;
}

interface TestRangeConfig {
  min: 'auto' | number;
  max: 'auto' | number;
}

export interface TestGraphWindowConfig {
  chartType: ChartType;
  xAxis: TestAxisConfig;
  yAxis: TestAxisConfig;
  series: TestSeriesConfig[];
  xRange: TestRangeConfig;
  yRange: TestRangeConfig;
}

// Internal encoded types (matching graphUrlCodec.ts exactly)
interface EncodedAxis { t: 'd' | 'm'; k: string; }
interface EncodedSeries { mk: string; c: string; e: boolean; ct?: ChartType; }
interface EncodedRange { n: number | null; x: number | null; }
interface EncodedWindow {
  ct: ChartType;
  xa: EncodedAxis;
  ya: EncodedAxis;
  sr: EncodedSeries[];
  xr: EncodedRange;
  yr: EncodedRange;
}
interface EncodedPayload { v: 2; w: EncodedWindow[]; }

function encodeAxis(axis: TestAxisConfig): EncodedAxis {
  return {
    t: axis.type === 'doeMetadata' ? 'd' : 'm',
    k: axis.key,
  };
}

function encodeRange(range: TestRangeConfig): EncodedRange {
  return {
    n: range.min === 'auto' ? null : range.min,
    x: range.max === 'auto' ? null : range.max,
  };
}

export function encodeGraphWindowsForUrl(configs: TestGraphWindowConfig[]): string {
  // Filter out windows with no series (decode drops them anyway)
  const validConfigs = configs.filter(c => c.series && c.series.length > 0);
  if (validConfigs.length === 0) return '';

  const windows: EncodedWindow[] = validConfigs.map(config => ({
    ct: config.chartType,
    xa: encodeAxis(config.xAxis),
    ya: encodeAxis(config.yAxis),
    sr: config.series.map(s => ({
      mk: s.metricKey,
      c: s.color.replace(/^#/, ''),  // Strip # prefix (restored on decode)
      e: s.enabled,
      ct: s.chartType ?? config.chartType,
    })),
    xr: encodeRange(config.xRange),
    yr: encodeRange(config.yRange),
  }));

  const payload: EncodedPayload = { v: 2, w: windows };
  return nodeBase64Encode(encodeURIComponent(JSON.stringify(payload)));
}

// Verification: round-trip encode→decode equals original (modulo dropped invalid windows)
// This can be verified by decoding in browser context and comparing

export function createSeededTestUrl(page: string = 'qor-compare'): string {
  const columnMeta: ColumnMeta[] = [{
    id: 'doe_test_1',
    label: 'TestDoE-1',
    PROJECT_NAME: 'TestProject1',
    BLOCK: 'BlockA',
    NET_VER: 'v1.0',
    REVISION: 'rev1',
    ECO_NUM: 'ECO001',
    POWER_SCENARIO: 'tt_0.85v_25c',
    TIMING_SCENARIO: 'tt_0.85v_25c',
    REVISION_MODE: 'PRE',
    _needsDataFetch: true,
  }];
  const encoded = encodeColumnsForNode(columnMeta);
  return `/?page=${page}&columns=${encoded}`;
}
