import type { ColDef, GridApi, ICellRendererParams } from "ag-grid-community";
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
  decimalPlaces: Record<string, number>;
  rowGroupRowSpan: ColDef<RowData>["rowSpan"];
  rowGroupCellClass: ColDef<RowData>["cellClass"];
  isFirstOfGroupFromApi: (
    api: GridApi,
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
      const baseStyle: Record<string, string | number> = {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingLeft: "12px",
        backgroundColor: "var(--ag-header-background-color)",
        fontWeight: hasGroup ? 650 : 550,
        borderRight: "1px solid var(--ag-border-color)",
        cursor: "grab",
        whiteSpace: "pre-line",
      };

      if (!hasGroup) {
        return baseStyle;
      }

      if (rowIndex !== undefined && rowIndex !== null && rowIndex > 0) {
        const api = params.api;
        const prevNode = api?.getDisplayedRowAtIndex(rowIndex - 1);
        const prevRowGroup = prevNode?.data?.rowGroup;
        if (prevRowGroup === params.data?.rowGroup) {
          return { ...baseStyle, display: "none" };
        }
      }

      return baseStyle;
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
    cellStyle: (params) => {
      const style: Record<string, string | number> = {
        display: "block",
        fontWeight: 550,
        backgroundColor: "var(--ag-header-background-color)",
        borderRight: "1px solid var(--ag-border-color)",
        cursor: "grab",
      };

      if (!params.data?.rowGroup) {
        style.display = "none";
      }

      return style;
    },
  };

  const dataColumns: ColDef<RowData>[] = columnHeaders.map((col) => ({
    field: col.id,
    headerName: col.label,
    width: 150,
    editable: true,
    cellStyle: { textAlign: textAlignOption },
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
        const decimals = decimalPlaces[rowGroup || ""] ?? 0;
        const num = parseFloat(String(value));
        
        // If user set decimals > 0 for this group, respect it even if strategy is skip-decimal
        if (!isNaN(num) && decimals > 0) {
          return num.toFixed(decimals);
        }

        const result = isNaN(num) ? String(value) : String(Math.floor(num));
        if (isEcoRuntime) {
          console.log(`  skip-decimal 적용, parseFloat:`, num, "결과:", result);
        }
        return result;
      }

      // number: 일반 숫자 포맷팅 (decimal 적용)
      const num = parseFloat(String(value));
      if (!isNaN(num)) {
        const decimals = decimalPlaces[rowGroup || ""] ?? 2;
        const result = num.toFixed(decimals);
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
      return params.valueFormatted ?? params.value;
    },
  }));

  return [rowGroupCol, rowHeaderCol, ...dataColumns];
}
