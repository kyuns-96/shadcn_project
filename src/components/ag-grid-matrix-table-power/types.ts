/**
 * @file ag-grid-matrix-table-power/types.ts
 *
 * @purpose
 * Power 전용 AG Grid 매트릭스 테이블에서 사용되는 타입 정의입니다.
 *
 * @dependencies
 * - @/variables/defaultPowerMatrixTemplate: Power 관련 상수 타입
 */

import type { PowerRowKey } from "@/variables/defaultPowerMatrixTemplate";

/** Power 단위 타입 */
export type PowerUnit = "mW" | "W";

/** Power 테이블 행 데이터 타입 */
export interface PowerRowData {
  /** 행 고유 식별자 */
  id: string;
  /** 행 헤더 라벨 (예: "Clock Network") */
  rowHeader: string;
  /** 행 키 (메트릭 경로 매핑용, 예: "clock_network") */
  rowKey: PowerRowKey;
  /** 동적 셀 데이터: columnId -> value */
  [key: string]: string | PowerRowKey;
}

/** DoE 컬럼 그룹 헤더 타입 */
export interface DoeColumnGroup {
  /** DoE 고유 ID (예: "col1703849234567") */
  id: string;
  /** DoE 표시 이름 (예: "DoE-001") */
  label: string;
  /** 프로젝트 이름 */
  PROJECT_NAME?: string;
  /** 블록 이름 */
  BLOCK?: string;
  /** 넷 버전 */
  NET_VER?: string;
  /** 리비전 */
  REVISION?: string;
  /** ECO 번호 */
  ECO_NUM?: string;
  /** 선택된 Power Scenario */
  POWER_SCENARIO?: string;
  /** 사용 가능한 시나리오 목록 */
  AVAILABLE_SCENARIOS?: string[];
  /** URL 복원 시 데이터 fetch 필요 여부 */
  _needsDataFetch?: boolean;
}

/** Power 컬럼 헤더 타입 (DoE 그룹의 하위 컬럼) */
export interface PowerColumnHeader {
  /** 컬럼 고유 ID (예: "col1703849234567_Internal") */
  id: string;
  /** 컬럼 표시 이름 (예: "Internal") */
  label: string;
  /** accessor 키 (id와 동일) */
  accessorKey: string;
  /** 부모 DoE 그룹 ID */
  doeGroupId: string;
  /** 메트릭 컬럼 유형 (Internal, Switching, Leakage, Total) */
  metricColumn: string;
}
