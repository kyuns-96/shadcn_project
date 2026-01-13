/**
 * @file ag-grid-matrix-table-timing/constants.ts
 *
 * @purpose
 * Timing 테이블 상수 및 설정을 정의합니다.
 *
 * @dependencies
 * - @/variables/defaultTimingMatrixTemplate: Timing column groups and metrics
 * - lucide-react: 아이콘
 */

import {
  TIMING_COLUMN_GROUPS,
  TIMING_METRICS,
} from "@/variables/defaultTimingMatrixTemplate";
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from "lucide-react";

// ============================================================
// Row Height Configuration
// ============================================================

export const ROW_HEIGHT_CONFIG = {
  compact: { height: 24, label: "Compact" },
  normal: { height: 32, label: "Normal" },
  comfortable: { height: 40, label: "Comfortable" },
} as const;

export type RowHeightOption = keyof typeof ROW_HEIGHT_CONFIG;

// ============================================================
// Text Alignment Configuration
// ============================================================

export const TEXT_ALIGN_OPTIONS = ["left", "center", "right"] as const;

export type TextAlignOption = (typeof TEXT_ALIGN_OPTIONS)[number];

export const TEXT_ALIGN_CONFIG: Record<
  TextAlignOption,
  { label: string; icon: typeof AlignLeftIcon }
> = {
  left: { label: "Left", icon: AlignLeftIcon },
  center: { label: "Center", icon: AlignCenterIcon },
  right: { label: "Right", icon: AlignRightIcon },
};

// ============================================================
// Timing Column Groups and Metrics
// ============================================================

/**
 * Timing 테이블의 컬럼 그룹 정의
 * 각 DoE마다 모든 그룹과 메트릭의 컬럼이 생성됩니다.
 */
export const TIMING_COLUMN_GROUP_CONFIG = TIMING_COLUMN_GROUPS.map((group) => ({
  name: group,
  metrics: TIMING_METRICS,
}));

/**
 * 데이터셋 경로 매핑
 * get_timing_summary.timing_summary_data.${SCENARIO}.${GROUP}.${METRIC}
 */
export const TIMING_DATASET_PATH = {
  ROOT: "get_timing_summary",
  DATA: "timing_summary_data",
} as const;

// ============================================================
// Default Cell Values
// ============================================================

export const EMPTY_CELL_VALUE = "-";
export const LOADING_CELL_VALUE = "___LOADING___";
