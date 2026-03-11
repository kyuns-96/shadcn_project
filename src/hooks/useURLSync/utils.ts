/**
 * @file useURLSync/utils.ts
 *
 * @purpose
 * URL 인코딩/디코딩 및 압축 유틸리티 함수
 */

import type { ColumnMeta, TimingRowMeta, PowerDoeMeta } from "./types";

// Property shorthand mapping for compression
const COMPRESS_MAP: Record<string, string> = {
  id: "i",
  label: "l",
  PROJECT_NAME: "p",
  BLOCK: "b",
  NET_VER: "n",
  REVISION: "r",
  ECO_NUM: "e",
  POWER_SCENARIO: "s",
  AVAILABLE_SCENARIOS: "a",
  TIMING_SCENARIO: "t",
  AVAILABLE_TIMING_SCENARIOS: "at",
  REVISION_MODE: "m",
};

// Reverse mapping for decompression
const DECOMPRESS_MAP: Record<string, string> = Object.entries(
  COMPRESS_MAP
).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {} as Record<string, string>
);

/**
 * Compress object by shortening property names
 */
function compressObject(obj: Record<string, unknown>): Record<string, unknown> {
  const compressed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const shortKey = COMPRESS_MAP[key] || key;
    compressed[shortKey] = value;
  }
  return compressed;
}

/**
 * Decompress object by restoring original property names
 */
function decompressObject<T = Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  const decompressed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const originalKey = DECOMPRESS_MAP[key] || key;
    decompressed[originalKey] = value;
  }
  return decompressed as T;
}

/**
 * Encode column headers to a compact URL-safe string with compression
 */
export function encodeColumns(columns: ColumnMeta[]): string {
  if (columns.length === 0) return "";
  try {
    const compressed = columns.map((col) => {
      const obj = { ...col } as Record<string, unknown>;
      return compressObject(obj);
    });
    return btoa(encodeURIComponent(JSON.stringify(compressed)));
  } catch {
    return "";
  }
}

/**
 * Decode columns from URL parameter with decompression
 */
export function decodeColumns(encoded: string): ColumnMeta[] {
  if (!encoded) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(encoded)));
    return parsed.map((obj: Record<string, unknown>) => {
      return decompressObject<ColumnMeta>(obj);
    });
  } catch {
    return [];
  }
}

/**
 * Encode timing rows to a compact URL-safe string with compression
 */
export function encodeTimingRows(rows: TimingRowMeta[]): string {
  if (rows.length === 0) return "";
  try {
    const compressed = rows.map((row) => {
      const obj = { ...row } as Record<string, unknown>;
      return compressObject(obj);
    });
    return btoa(encodeURIComponent(JSON.stringify(compressed)));
  } catch {
    return "";
  }
}

/**
 * Decode timing rows from URL parameter with decompression
 */
export function decodeTimingRows(encoded: string): TimingRowMeta[] {
  if (!encoded) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(encoded)));
    return parsed.map((obj: Record<string, unknown>) => {
      return decompressObject<TimingRowMeta>(obj);
    });
  } catch {
    return [];
  }
}

/**
 * Encode power DoE groups to a compact URL-safe string with compression
 */
export function encodePowerDoes(does: PowerDoeMeta[]): string {
  if (does.length === 0) return "";
  try {
    const compressed = does.map((doe) => {
      const obj = { ...doe } as Record<string, unknown>;
      return compressObject(obj);
    });
    return btoa(encodeURIComponent(JSON.stringify(compressed)));
  } catch {
    return "";
  }
}

/**
 * Decode power DoE groups from URL parameter with decompression
 */
export function decodePowerDoes(encoded: string): PowerDoeMeta[] {
  if (!encoded) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(encoded)));
    return parsed.map((obj: Record<string, unknown>) => {
      return decompressObject<PowerDoeMeta>(obj);
    });
  } catch {
    return [];
  }
}
