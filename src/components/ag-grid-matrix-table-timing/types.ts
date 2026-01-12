/**
 * @file ag-grid-matrix-table-timing/types.ts
 *
 * @purpose
 * Timing 테이블의 타입 정의입니다.
 *
 * @dependencies
 * - @/store/reducers/timingMatrixReducer: TimingDoeGroup, TimingRowHeader
 */

import type { TimingDoeGroup } from "@/store/reducers/timingMatrixReducer";
import type { TimingColumnGroup, TimingMetric } from "@/variables/defaultTimingMatrixTemplate";

/**
 * Timing 테이블 행 데이터 타입
 * AG Grid rowData로 사용됩니다.
 */
export interface TimingRowData {
  /** 행 ID */
  id: string;
  /** 행 라벨 (DoE name) */
  name: string;
  /** 동적 데이터: columnId -> value */
  [key: string]: unknown;
}

/**
 * Timing DoE 그룹 (메타데이터 포함)
 * doeRegistry 메타데이터를 enriching한 버전
 */
export interface EnrichedTimingDoeGroup extends TimingDoeGroup {
  PROJECT_NAME?: string;
  BLOCK?: string;
  NET_VER?: string;
  REVISION?: string;
  ECO_NUM?: string;
  TIMING_SCENARIO?: string;
  AVAILABLE_TIMING_SCENARIOS?: string[];
}

/**
 * 컬럼 정의 ID 생성 헬퍼
 * 형식: ${doeId}_${groupName}_${metric}
 */
export const generateTimingColumnId = (
  doeId: string,
  group: TimingColumnGroup,
  metric: TimingMetric
): string => {
  return `${doeId}_${group}_${metric}`;
};

/**
 * 컬럼 ID에서 부분 정보 추출
 */
export const parseTimingColumnId = (
  columnId: string
): { doeId: string; group: string; metric: string } | null => {
  const parts = columnId.split("_");
  if (parts.length < 3) {
    return null;
  }

  // 마지막 부분은 metric (WNS, TNS, NVP)
  const metric = parts[parts.length - 1];
  // 그 앞은 group
  const group = parts[parts.length - 2];
  // 나머지는 doeId
  const doeId = parts.slice(0, -2).join("_");

  return { doeId, group, metric };
};
