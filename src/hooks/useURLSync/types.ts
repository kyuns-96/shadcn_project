/**
 * @file useURLSync/types.ts
 *
 * @purpose
 * URL 동기화 관련 타입 및 상수 정의
 */

import type { PageType } from "@/store/reducers/pageReducer";

// URL parameter keys
export const URL_PARAMS = {
  PAGE: "page",
  // QOR Compare params
  COLUMNS: "columns", // JSON encoded column metadata
  // FC Check Tool params (prefixed with fc_)
  FC_PROJECT: "fc_project",
  FC_BLOCK: "fc_block",
  FC_NETVER: "fc_netver",
  FC_REVISION: "fc_revision",
  // Timing Page params
  TIMING_ROWS: "timing_rows", // Compressed timing row metadata
  // Power Page params
  POWER_DOES: "power_does", // Compressed power DoE metadata
} as const;

// Valid page types for validation
export const VALID_PAGES: PageType[] = [
  "fc-check-tool",
  "qor-compare",
  "timing",
  "power",
];

// Column metadata structure for URL
export interface ColumnMeta {
  id: string;
  label: string;
  PROJECT_NAME?: string;
  BLOCK?: string;
  NET_VER?: string;
  REVISION?: string;
  ECO_NUM?: string;
  POWER_SCENARIO?: string;
  AVAILABLE_SCENARIOS?: string[];
}

// Timing row metadata structure for URL
export interface TimingRowMeta {
  id: string;
  label: string;
  PROJECT_NAME?: string;
  BLOCK?: string;
  NET_VER?: string;
  REVISION?: string;
  ECO_NUM?: string;
  TIMING_SCENARIO?: string;
  AVAILABLE_TIMING_SCENARIOS?: string[];
}

// Power DoE metadata structure for URL
export interface PowerDoeMeta {
  id: string;
  label: string;
  PROJECT_NAME?: string;
  BLOCK?: string;
  NET_VER?: string;
  REVISION?: string;
  ECO_NUM?: string;
  POWER_SCENARIO?: string;
  AVAILABLE_SCENARIOS?: string[];
}
