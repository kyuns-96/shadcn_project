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

import type {
  ColDef,
  ColGroupDef,
  ICellRendererParams,
} from "ag-grid-community";
import { LOADING_PLACEHOLDER } from "@/lib/constants";
import {
  TIMING_COLUMN_GROUPS,
  TIMING_METRICS,
  generateTimingColumnKey,
} from "@/variables/defaultTimingMatrixTemplate";
import type { TimingRowData } from "./types";
import {
  type TextAlignOption,
  EMPTY_CELL_VALUE,
} from "./constants";
import { Spinner } from "@/components/ui/spinner";

import { TIMING_DEFAULT_DECIMALS } from "../ag-grid-matrix-table/decimalDefaults";

/**
 * 숫자 값 포맷팅 함수
 * - 0값은 소수점 없이 "0"으로 표시
 * - NVP 컬럼은 정수로 표시
 * - 로딩 중인 값은 "-"로 표시
 * - 그 외 숫자는 지정된 소수점 자리수로 표시
 */
export const formatTimingValue = (
  value: unknown,
  decimalPlaces: Record<string, number>,
  columnGroup: string,
  isNVP: boolean
): string => {
  // null, undefined, 빈 문자열 처리
  if (value === null || value === undefined || value === "") {
    return EMPTY_CELL_VALUE;
  }

  // 로딩 중인 값 처리
  if (value === LOADING_PLACEHOLDER) {
    return EMPTY_CELL_VALUE;
  }

  // NVP 컬럼은 정수로 표시
  if (isNVP) {
    const num = parseInt(String(value), 10);
    if (!isNaN(num)) {
      return String(num);
    }
    return String(value);
  }

  // 숫자 변환 시도
  const num = parseFloat(String(value));
  if (isNaN(num)) {
    return String(value);
  }

  // 0인 경우 소수점 없이 "0"으로 표시
  if (num === 0) {
    return "0";
  }

  // 그 외 숫자는 지정된 소수점 자리수로 표시
  const decimals =
    decimalPlaces[columnGroup] ??
    (TIMING_DEFAULT_DECIMALS as Record<string, number>)[columnGroup] ??
    3;
  return num.toFixed(decimals);
};

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
  textAlign: TextAlignOption = "right",
  decimalPlaces: Record<string, number>
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
    rowDrag: true,
  } as ColDef<TimingRowData>);

  // 2. 컬럼 그룹별 컬럼 정의
  TIMING_COLUMN_GROUPS.forEach((columnGroup) => {
    // 각 그룹 내 메트릭들 (WNS, TNS, NVP)
    const metricColumns: ColDef<TimingRowData>[] = TIMING_METRICS.map(
      (metric) => {
        const columnId = generateTimingColumnKey(columnGroup, metric);
        const isNVP = metric === "NVP";
        return {
          field: columnId,
          headerName: metric,
          width: 85,
          headerClass: "ag-header-cell-center",
          cellStyle: { textAlign },
          editable: false,
          suppressMovable: true,
          sortable: false,
          valueFormatter: (params) => {
            return formatTimingValue(params.value, decimalPlaces, columnGroup, isNVP);
          },
          cellRenderer: (params: ICellRendererParams<TimingRowData>) => {
            if (params.value === LOADING_PLACEHOLDER) {
              return <Spinner className="mx-auto" />;
            }
            return params.valueFormatted ?? params.value;
          },
        };
      }
    );

    // 컬럼 그룹 (setup/hold/clock_mttv 등)
    columnDefs.push({
      headerName: columnGroup,
      headerClass: "ag-header-group-center",
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
  textAlign: TextAlignOption,
  decimalPlaces: Record<string, number>
): (ColDef | ColGroupDef)[] => {
  return columnDefs.map((colDef) => {
    if ("children" in colDef && colDef.children) {
      // 그룹 컬럼: children 재귀적으로 업데이트
      return {
        ...colDef,
        children: updateTimingColumnAlignment(
          colDef.children,
          textAlign,
          decimalPlaces
        ),
      };
    }

    if ("field" in colDef && colDef.field !== "name") {
      // 데이터 컬럼: cellStyle 업데이트 및 valueFormatter 재설정
      const field = colDef.field as string;
      
      // field format: ${group}_${metric}
      // 메트릭(WNS, TNS, NVP)은 underscore를 포함하지 않으므로 마지막 underscore로 분리 가능
      const lastUnderscoreIndex = field.lastIndexOf("_");
      const columnGroup = lastUnderscoreIndex !== -1 
        ? field.substring(0, lastUnderscoreIndex) 
        : "";
      
      const isNVP = field.endsWith("_NVP");
      
      return {
        ...colDef,
        cellStyle: { textAlign },
        valueFormatter: (params: { value: unknown }) => {
          return formatTimingValue(params.value, decimalPlaces, columnGroup, isNVP);
        },
      };
    }

    return colDef;
  });
};
