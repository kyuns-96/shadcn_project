/**
 * @file ag-grid-matrix-table-timing/columns.tsx
 *
 * @purpose
 * Timing 테이블의 AG Grid 컬럼 정의를 생성합니다.
 * Row: DoE Name (pinned left)
 * Column: Column Group (setup/hold/clock_mttv 등) -> Metrics (WNS/TNS/NVP)
 *
 * @dependencies
 * - ag-grid-community: AG Grid 컬럼 타입
 * - @/variables/defaultTimingMatrixTemplate: Column group and metric constants
 */

import type { ColDef, ColGroupDef } from "ag-grid-community";
import {
  TIMING_COLUMN_GROUPS,
  TIMING_METRICS,
  generateTimingColumnKey,
} from "@/variables/defaultTimingMatrixTemplate";
import type { TimingRowData } from "./types";
import { type TextAlignOption } from "./constants";

/**
 * Timing 테이블 컬럼 정의 생성
 *
 * 구조:
 * - Row Header Column (DoE name) - pinned left
 * - Column Group: setup(r2r)
 *   - WNS, TNS, NVP 컬럼
 * - Column Group: hold(r2r)
 *   - WNS, TNS, NVP 컬럼
 * - ... (나머지 그룹들)
 */
export const buildTimingColumnDefs = (
  textAlign: TextAlignOption = "right"
): (ColDef | ColGroupDef)[] => {
  const columnDefs: (ColDef | ColGroupDef)[] = [];

  // 1. Row Header Column (DoE name) - pinned left
  columnDefs.push({
    field: "name",
    headerName: "DoE Name",
    width: 150,
    pinned: "left",
    lockPinned: true,
    cellClass: "ag-cell-focus-after font-medium",
  } as ColDef<TimingRowData>);

  // 2. 컬럼 그룹별 컬럼 정의
  TIMING_COLUMN_GROUPS.forEach((columnGroup) => {
    // 각 그룹 내 메트릭들 (WNS, TNS, NVP)
    const metricColumns: ColDef<TimingRowData>[] = TIMING_METRICS.map((metric) => {
      const columnId = generateTimingColumnKey(columnGroup, metric);
      return {
        field: columnId,
        headerName: metric,
        width: 80,
        cellStyle: { textAlign },
        editable: false,
        suppressMovable: true,
      };
    });

    // 컬럼 그룹 (setup/hold/clock_mttv 등)
    columnDefs.push({
      headerName: columnGroup,
      children: metricColumns,
    } as ColGroupDef);
  });

  return columnDefs;
};

/**
 * 텍스트 정렬 설정 업데이트
 * 모든 데이터 컬럼에 적용됩니다 (DoE name 제외).
 */
export const updateTimingColumnAlignment = (
  columnDefs: (ColDef | ColGroupDef)[],
  textAlign: TextAlignOption
): (ColDef | ColGroupDef)[] => {
  return columnDefs.map((colDef) => {
    if ("children" in colDef && colDef.children) {
      // 그룹 컬럼: children 재귀적으로 업데이트
      return {
        ...colDef,
        children: updateTimingColumnAlignment(colDef.children, textAlign),
      };
    }

    if ("field" in colDef && colDef.field !== "name") {
      // 데이터 컬럼: cellStyle 업데이트
      return {
        ...colDef,
        cellStyle: { textAlign },
      };
    }

    return colDef;
  });
};
