/**
 * @file defaultTimingMatrixTemplate.ts
 *
 * @purpose
 * Timing Page의 기본 매트릭스 템플릿을 정의합니다.
 * 행은 flat structure로 정의되며, 각 DoE는 여러 컬럼 그룹을 포함합니다.
 * 컬럼 그룹은: setup(r2r), hold(r2r), clock_mttv, data_mttv, max_cap, cpc, gnoise
 * 각 그룹 내 메트릭은: WNS, TNS, NVP
 *
 * @structure
 * 1. TIMING_ROW_NAMES: 행 이름 상수 정의
 * 2. TIMING_ROW_KEYS: 메트릭 경로에서 사용되는 행 키
 * 3. TIMING_COLUMN_GROUPS: 컬럼 그룹 정의
 * 4. TIMING_METRICS: 각 그룹 내 메트릭
 * 5. DEFAULT_TIMING_MATRIX_TEMPLATE: 기본 행 헤더 정의
 * 6. initializeTimingMatrixRows: Redux store에 기본 행 추가
 *
 * @dependencies
 * - @/store/reducers/timingMatrixReducer: addTimingRow 액션
 * - @/store: AppDispatch 타입
 */

import type { AppDispatch } from "@/store";
import { addTimingRow } from "@/store/reducers/timingMatrixReducer";

// ============================================================
// [MODIFY HERE] Row and Column Names - Easy to customize
// ============================================================

/**
 * Timing 테이블의 행 이름 (UI에 표시됨)
 * flat structure - row grouping 없음
 * 필요에 따라 행을 추가/제거할 수 있습니다.
 */
export const TIMING_ROW_NAMES = [
  "Setup Time",
  "Hold Time",
  "Max Transition",
  "Max Capacitance",
  "Total Power",
] as const;

/**
 * 메트릭 키에서 사용되는 행 키 (데이터 경로와 매핑)
 * TIMING_ROW_NAMES와 순서가 일치해야 합니다.
 *
 * @example
 * "Setup Time" -> "setup_time" -> "get_timing_summary.timing_summary_data.${scenario}.setup(r2r).WNS"
 */
export const TIMING_ROW_KEYS = [
  "setup_time",
  "hold_time",
  "max_transition",
  "max_capacitance",
  "total_power",
] as const;

/**
 * Timing 테이블의 컬럼 그룹 (각 DoE당 여러 그룹)
 * 컬럼 그룹 구조: Group (setup/hold/clock_mttv 등) -> Metrics (WNS/TNS/NVP)
 */
export const TIMING_COLUMN_GROUPS = [
  "setup(r2r)",
  "hold(r2r)",
  "clock_mttv",
  "data_mttv",
  "max_cap",
  "cpc",
  "gnoise",
] as const;

/**
 * 각 컬럼 그룹 내의 메트릭
 */
export const TIMING_METRICS = ["WNS", "TNS", "NVP"] as const;

// ============================================================
// Type definitions
// ============================================================

export type TimingRowName = (typeof TIMING_ROW_NAMES)[number];
export type TimingRowKey = (typeof TIMING_ROW_KEYS)[number];
export type TimingColumnGroup = (typeof TIMING_COLUMN_GROUPS)[number];
export type TimingMetric = (typeof TIMING_METRICS)[number];

/** Timing 매트릭스 행 데이터 타입 */
export interface TimingMatrixRowDefinition {
  id: string;
  label: string;
  rowKey: TimingRowKey;
  /** 동적 데이터: columnId -> value */
  data: Record<string, string>;
}

/** 데이터 로딩 중 표시되는 플레이스홀더 */
export const LOADING_PLACEHOLDER = "___LOADING___";

// ============================================================
// Helper functions
// ============================================================

/**
 * 기본 Timing 매트릭스 템플릿 (행 헤더)
 * TimingPage 초기화 시 사용됩니다.
 */
export const DEFAULT_TIMING_MATRIX_TEMPLATE = TIMING_ROW_NAMES.map(
  (label, index) => ({
    id: `timing-row-${index}`,
    label,
    rowKey: TIMING_ROW_KEYS[index],
  })
);

/**
 * Redux store에 기본 Timing 행을 초기화합니다.
 * TimingPage 또는 useEffect에서 호출됩니다.
 */
export const initializeTimingMatrixRows = (dispatch: AppDispatch) => {
  DEFAULT_TIMING_MATRIX_TEMPLATE.forEach((row) => {
    dispatch(
      addTimingRow({
        id: row.id,
        label: row.label,
        rowKey: row.rowKey,
      })
    );
  });
};
