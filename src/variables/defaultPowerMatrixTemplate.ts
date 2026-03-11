/**
 * @file defaultPowerMatrixTemplate.ts
 *
 * @purpose
 * Power Page의 기본 매트릭스 템플릿을 정의합니다.
 * 10개의 행(flat structure, no grouping)과 4개의 컬럼(Internal, Switching, Leakage, Total)으로 구성됩니다.
 * 각 DoE는 4개의 컬럼 그룹(DoE name을 parent header로)을 생성합니다.
 *
 * @structure
 * 1. POWER_ROW_NAMES: 행 이름 상수 정의 (쉽게 수정 가능)
 * 2. POWER_COLUMN_NAMES: 컬럼 이름 상수 정의 (쉽게 수정 가능)
 * 3. POWER_ROW_KEYS: 메트릭 경로에서 사용되는 행 키
 * 4. DEFAULT_POWER_MATRIX_TEMPLATE: 기본 행 헤더 정의
 * 5. initializePowerMatrixRows: Redux store에 기본 행 추가
 *
 * @dependencies
 * - @/store/reducers/powerMatrixReducer: addPowerRow 액션
 * - @/store: AppDispatch 타입
 */

import type { AppDispatch } from "@/store";
import { addPowerRow } from "@/store/reducers/powerMatrixReducer";

// ============================================================
// [MODIFY HERE] Row and Column Names - Easy to customize
// ============================================================

/**
 * Power 테이블의 행 이름 (UI에 표시됨)
 * 순서대로 10개의 행이 표시됩니다.
 */
export const POWER_ROW_NAMES = [
  "Clock Network",
  "Register",
  "Combinational",
  "Sequential",
  "Memory",
  "IO Pad",
  "Black Box",
  "Decap",
  "Power Switch",
  "Total",
] as const;

/**
 * Power 테이블의 컬럼 이름 (UI에 표시됨)
 * 각 DoE당 4개의 컬럼이 생성됩니다.
 */
export const POWER_COLUMN_NAMES = [
  "Internal",
  "Switching",
  "Leakage",
  "Total",
] as const;

/**
 * 메트릭 키에서 사용되는 행 키 (데이터 경로와 매핑)
 * POWER_ROW_NAMES와 순서가 일치해야 합니다.
 *
 * @example
 * "Clock Network" -> "clock_network" -> "Power(mW)!clock_network_Internal"
 */
export const POWER_ROW_KEYS = [
  "clock_network",
  "register",
  "combinational",
  "sequential",
  "memory",
  "io_pad",
  "black_box",
  "decap",
  "power_switch",
  "total",
] as const;

// ============================================================
// Type definitions
// ============================================================

export type PowerRowName = (typeof POWER_ROW_NAMES)[number];
export type PowerColumnName = (typeof POWER_COLUMN_NAMES)[number];
export type PowerRowKey = (typeof POWER_ROW_KEYS)[number];

/** Power 매트릭스 행 데이터 타입 */
export interface PowerMatrixRowDefinition {
  id: string;
  label: string;
  rowKey: PowerRowKey;
  /** 동적 데이터: columnId -> value */
  data: Record<string, string>;
}

// ============================================================
// Helper functions
// ============================================================

/**
 * 주어진 행 키와 컬럼 이름으로 메트릭 키를 생성합니다.
 *
 * @param rowKey - 행 키 (예: "clock_network")
 * @param columnName - 컬럼 이름 (예: "Internal")
 * @returns 메트릭 키 (예: "Power(mW)!clock_network_Internal")
 */
export const getMetricKey = (
  rowKey: PowerRowKey,
  columnName: PowerColumnName
): string => {
  return `Power(mW)!${rowKey}_${columnName}`;
};

/**
 * DoE 이름과 컬럼 이름으로 컬럼 ID를 생성합니다.
 *
 * @param doeId - DoE 고유 ID (예: "col1703849234567")
 * @param columnName - 컬럼 이름 (예: "Internal")
 * @returns 컬럼 ID (예: "col1703849234567_Internal")
 */
export const getColumnId = (
  doeId: string,
  columnName: PowerColumnName
): string => {
  return `${doeId}_${columnName}`;
};

// ============================================================
// Default template definition
// ============================================================

/**
 * 기본 Power 매트릭스 템플릿 정의
 * 10개의 행 헤더를 정의합니다 (컬럼은 DoE 추가 시 동적으로 생성)
 */
export const DEFAULT_POWER_MATRIX_TEMPLATE = {
  /** 기본 행 헤더 (10개 행, flat structure) */
  rowHeaders: POWER_ROW_NAMES.map((name, index) => ({
    id: `power-row-${index + 1}`,
    label: name,
    rowKey: POWER_ROW_KEYS[index],
    data: {} as Record<string, string>,
  })) as PowerMatrixRowDefinition[],
};

/**
 * Redux store에 기본 Power 매트릭스 행들을 초기화합니다.
 *
 * @param dispatch - Redux dispatch 함수
 */
export const initializePowerMatrixRows = (dispatch: AppDispatch): void => {
  DEFAULT_POWER_MATRIX_TEMPLATE.rowHeaders.forEach((row) => {
    dispatch(addPowerRow(row));
  });
};
