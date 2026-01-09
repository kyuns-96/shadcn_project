/**
 * @file ag-grid-matrix-table-power/columns.tsx
 *
 * @purpose
 * Power 전용 AG Grid 테이블의 컬럼 정의를 생성합니다.
 * 행 헤더 컬럼 + DoE 그룹 컬럼 (4개의 하위 컬럼: Internal, Switching, Leakage, Total)으로 구성됩니다.
 *
 * @structure
 * 1. buildPowerColumnDefs: 전체 컬럼 정의 생성
 * 2. Row Header 컬럼: 왼쪽 고정, 10개 행 라벨 표시
 * 3. DoE 그룹 컬럼: 각 DoE당 parent header + 4개의 sub-columns
 *
 * @dependencies
 * - ag-grid-community: AG Grid 타입들
 * - @/components/ui/spinner: 로딩 스피너
 * - @/components/ColumnHeaderWithPopup: 컬럼 헤더 팝업
 */

import type {
  ColDef,
  ColGroupDef,
  ICellRendererParams,
  IHeaderParams,
} from "ag-grid-community";
import { Spinner } from "@/components/ui/spinner";
import type { PowerRowData, DoeColumnGroup } from "./types";
import type { TextAlignOption } from "./constants";
import { POWER_TABLE_CONFIG } from "./constants";
import { POWER_COLUMN_NAMES } from "@/variables/defaultPowerMatrixTemplate";
import ColumnHeaderWithPopup from "@/components/ColumnHeaderWithPopup";

/**
 * DoE 그룹 헤더 렌더러 - 중앙정렬
 */
function DoeGroupHeader(props: IHeaderParams) {
  const displayText = (props as any).columnGroup?.displayName || props.displayName;
  return (
    <div className="w-full h-full flex items-center justify-center !text-center">
      <span className="truncate">{displayText}</span>
    </div>
  );
}

/**
 * Power 테이블의 컬럼 정의를 생성합니다.
 *
 * @param args - 컬럼 생성 옵션
 * @returns AG Grid 컬럼 정의 배열
 */
export function buildPowerColumnDefs(args: {
  /** DoE 그룹 목록 */
  doeGroups: DoeColumnGroup[];
  /** 텍스트 정렬 옵션 */
  textAlignOption: TextAlignOption;
  /** 소수점 자리수 */
  decimalPlaces: number;
}): (ColDef<PowerRowData> | ColGroupDef<PowerRowData>)[] {
  const { doeGroups, textAlignOption, decimalPlaces } = args;

  // Row Header 컬럼 (왼쪽 고정)
  const rowHeaderCol: ColDef<PowerRowData> = {
    field: "rowHeader",
    headerName: "",
    width: POWER_TABLE_CONFIG.rowHeaderColumnWidth,
    pinned: "left",
    lockPosition: true,
    suppressMovable: true,
    cellStyle: {
      fontWeight: 550,
      backgroundColor: "var(--ag-header-background-color)",
      borderRight: "1px solid var(--ag-border-color)",
      textAlign: "right",
    } as any,
  };

  // DoE 그룹 컬럼들 (계층형: parent header + 4 sub-columns)
  const doeGroupColumns: ColGroupDef<PowerRowData>[] = doeGroups.map(
    (doeGroup) => {
      // 4개의 하위 컬럼 생성 (Internal, Switching, Leakage, Total)
      const childColumns: ColDef<PowerRowData>[] = POWER_COLUMN_NAMES.map(
        (columnName) => {
          const columnId = `${doeGroup.id}_${columnName}`;
          return {
            field: columnId,
            headerName: columnName,
            width: POWER_TABLE_CONFIG.dataColumnWidth,
            editable: true,
            cellStyle: { textAlign: textAlignOption } as any,
            headerComponent: ColumnHeaderWithPopup,
            headerComponentParams: {
              columnMetadata: {
                id: columnId,
                label: columnName,
                accessorKey: columnId,
                PROJECT_NAME: doeGroup.PROJECT_NAME,
                BLOCK: doeGroup.BLOCK,
                NET_VER: doeGroup.NET_VER,
                REVISION: doeGroup.REVISION,
                ECO_NUM: doeGroup.ECO_NUM,
                POWER_SCENARIO: doeGroup.POWER_SCENARIO,
              },
            },
            valueFormatter: (params) => {
              const value = params.value;
              if (value === null || value === undefined || value === "")
                return "";
              const valueStr = value.toString();
              if (valueStr.includes(".")) {
                const num = parseFloat(value);
                if (!isNaN(num)) return num.toFixed(decimalPlaces);
              }
              return value;
            },
            cellRenderer: (params: ICellRendererParams<PowerRowData>) => {
              if (params.value === "___LOADING___")
                return <Spinner className="mx-auto" />;
              return (params as any).valueFormatted ?? params.value;
            },
          };
        }
      );

      // DoE 그룹 (parent header)
      return {
        headerName: doeGroup.label,
        headerClass: "doe-group-header",
        headerComponent: DoeGroupHeader,
        marryChildren: true,
        children: childColumns,
      };
    }
  );

  return [rowHeaderCol, ...doeGroupColumns];
}
