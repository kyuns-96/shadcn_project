/**
 * @file ag-grid-matrix-table-timing/types.ts
 *
 * @purpose
 * Timing 테이블의 타입 정의입니다.
 * Row: DoE Name
 * Column: 7개 그룹 × 3개 메트릭 = 21개 컬럼
 */

/**
 * Timing 테이블 행 데이터 타입
 * AG Grid rowData로 사용됩니다.
 */
export interface TimingRowData {
  /** 행 ID (DoE ID) */
  id: string;
  /** 행 라벨 (DoE name) */
  name: string;
  /** 동적 데이터: columnId -> value */
  [key: string]: unknown;
}
