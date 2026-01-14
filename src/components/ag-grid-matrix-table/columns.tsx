import type { ColDef, ICellRendererParams } from "ag-grid-community";
import ColumnHeaderWithPopup, {
  type ColumnMetadata,
} from "@/components/ColumnHeaderWithPopup";
import { Spinner } from "@/components/ui/spinner";
import type { RowData, PowerUnit } from "./types";
import type { TextAlignOption } from "./constants";
import { getMetricFormatStrategy } from "@/variables/helpers";

export function buildColumnDefs(args: {
  columnHeaders: Array<{ id: string; label: string } & Partial<ColumnMetadata>>;
  groupColumnWidth: number;
  rowHeaderColumnWidth: number;
  textAlignOption: TextAlignOption;
  decimalPlaces: number;
  rowGroupRowSpan: ColDef<RowData>["rowSpan"];
  rowGroupCellClass: ColDef<RowData>["cellClass"];
  isFirstOfGroupFromApi: (
    api: any,
    rowIndex: number,
    groupName: string
  ) => boolean;
  powerUnit?: PowerUnit;
}): ColDef<RowData>[] {
  const {
    columnHeaders,
    groupColumnWidth,
    rowHeaderColumnWidth,
    textAlignOption,
    decimalPlaces,
    rowGroupRowSpan,
    rowGroupCellClass,
    isFirstOfGroupFromApi,
  } = args;

  const rowGroupCol: ColDef<RowData> = {
    field: "rowGroup",
    headerName: "Group",
    width: groupColumnWidth,
    pinned: "left",
    lockPosition: true,
    suppressMovable: true,
    rowSpan: rowGroupRowSpan,
    colSpan: (params) => (!params.data?.rowGroup ? 2 : 1),
    cellClass: rowGroupCellClass,
    rowDrag: (params) => {
      if (!params.data?.rowGroup) return true;
      const rowIndex = params.node?.rowIndex;
      if (rowIndex === undefined || rowIndex === null) return false;
      return isFirstOfGroupFromApi(params.api, rowIndex, params.data.rowGroup);
    },
    valueGetter: (params) =>
      !params.data?.rowGroup
        ? params.data?.rowHeader || ""
        : params.data.rowGroup,
    cellStyle: (params) => {
      const rowIndex = params.node?.rowIndex;
      const hasGroup = !!params.data?.rowGroup;
      if (!hasGroup) {
        return {
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingLeft: "12px",
          backgroundColor: "var(--ag-header-background-color)",
          fontWeight: "550",
          borderRight: "1px solid var(--ag-border-color)",
          cursor: "grab",
          whiteSpace: "pre-line",
        } as any;
      }
      if (rowIndex !== undefined && rowIndex !== null && rowIndex > 0) {
        const api = params.api;
        const prevNode = api?.getDisplayedRowAtIndex(rowIndex - 1);
        const prevRowGroup = prevNode?.data?.rowGroup;
        if (prevRowGroup === params.data?.rowGroup) {
          return { display: "none" } as any;
        }
      }
      return {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingLeft: "12px",
        backgroundColor: "var(--ag-header-background-color)",
        fontWeight: "650",
        borderRight: "1px solid var(--ag-border-color)",
        cursor: "grab",
        whiteSpace: "pre-line",
      } as any;
    },
  };

  const rowHeaderCol: ColDef<RowData> = {
    field: "rowHeader",
    headerName: "Row Header",
    width: rowHeaderColumnWidth,
    pinned: "left",
    lockPosition: true,
    suppressMovable: true,
    rowDrag: (params) => !!params.data?.rowGroup,
    cellStyle: (params) =>
      !params.data?.rowGroup
        ? ({ display: "none" } as any)
        : ({
            fontWeight: 550,
            backgroundColor: "var(--ag-header-background-color)",
            borderRight: "1px solid var(--ag-border-color)",
            cursor: "grab",
          } as any),
  };

  const dataColumns: ColDef<RowData>[] = columnHeaders.map((col) => ({
    field: col.id,
    headerName: col.label,
    width: 150,
    editable: true,
    cellStyle: { textAlign: textAlignOption } as any,
    headerComponent: ColumnHeaderWithPopup,
    headerComponentParams: {
      columnMetadata: col as ColumnMetadata,
    },
    valueFormatter: (params) => {
      const value = params.value;
      if (value === null || value === undefined || value === "") return "";

      const rowGroup = params.data?.rowGroup;
      const rowHeader = params.data?.rowHeader;
      const metricKey = `${rowGroup}!${rowHeader}`;

      const strategy = getMetricFormatStrategy(metricKey);

      const isEcoRuntime = metricKey === "Physical Info!ECO Runtime";
      if (isEcoRuntime) {
        console.log(`[valueFormatter] ECO Runtime 입력:`, value);
        console.log(`  strategy:`, strategy);
      }

      // string-only: 문자열 그대로 반환 (숫자 처리 스킵)
      if (strategy === "string-only") {
        const result = String(value);
        if (isEcoRuntime) {
          console.log(`  string-only 적용, 결과:`, result);
        }
        return result;
      }

      // skip-decimal: 문자열로 반환하되, 숫자인 경우 정수로 변환
      if (strategy === "skip-decimal") {
        const num = parseFloat(String(value));
        const result = isNaN(num) ? String(value) : String(Math.floor(num));
        if (isEcoRuntime) {
          console.log(`  skip-decimal 적용, parseFloat:`, num, "결과:", result);
        }
        return result;
      }

      // number: 일반 숫자 포맷팅 (decimal 적용)
      const num = parseFloat(String(value));
      if (!isNaN(num)) {
        const result = num.toFixed(decimalPlaces);
        if (isEcoRuntime) {
          console.log(`  number 적용, parseFloat:`, num, "결과:", result);
        }
        return result;
      }

      const result = String(value);
      if (isEcoRuntime) {
        console.log(`  기본값, 결과:`, result);
      }
      return result;
    },
    cellRenderer: (params: ICellRendererParams<RowData>) => {
      if (params.value === "___LOADING___")
        return <Spinner className="mx-auto" />;
      return (params as any).valueFormatted ?? params.value;
    },
  }));

  return [rowGroupCol, rowHeaderCol, ...dataColumns];
}
