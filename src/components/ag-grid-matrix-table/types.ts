/**
 * @file ag-grid-matrix-table/types.ts
 *
 * @purpose
 * AG Grid 매트릭스 테이블에서 사용되는 타입 정의입니다.
 *
 * @dependencies
 * - 없음 (순수 타입 정의)
 */

/** Power 단위 타입 */
export type PowerUnit = "mW" | "W";

/** 테이블 행 데이터 타입 */
export interface RowData {
  /** 행 고유 식별자 */
  id: string;
  /** 행 그룹 이름 */
  rowGroup: string;
  /** 행 헤더 라벨 */
  rowHeader: string;
  /** 동적 셀 데이터 */
  [key: string]: string | number;
}
