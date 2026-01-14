/**
 * @file ag-grid-matrix-table/index.tsx
 *
 * @purpose
 * AG Grid 기반의 매트릭스 테이블 컴포넌트입니다.
 * 행 그룹핑, 드래그 압 드롭, 셀 편집 등의 기능을 제공합니다.
 *
 * @structure
 * 1. AgGridMatrixTable: 메인 컴포넌트
 * 2. 툴바: 행 높이, 텍스트 정렬, 소수점 자리수 조정
 * 3. 클립보드 복사 기능
 *
 * @dependencies
 * - ag-grid-react: AG Grid React 컴포넌트
 * - ag-grid-community: AG Grid 코어 모듈
 * - @/store: Redux hooks
 * - ./Toolbar: 툴바 컴포넌트
 * - ./columns: 컬럼 정의 빌더
 * - ./hooks: 커스텀 훅들
 */

"use client";

import { useMemo, useCallback, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type GridApi,
} from "ag-grid-community";
import { useAppSelector, useAppDispatch } from "@/store";
import { Toolbar } from "./Toolbar";
import {
  ROW_HEIGHT_CONFIG,
  type RowHeightOption,
  type TextAlignOption,
} from "./constants";
import type { RowData, PowerUnit } from "./types";
import { buildColumnDefs } from "./columns";
import {
  useRowSpanAndClasses,
  useRowDragHandlers,
  useSelectionHandlers,
} from "./hooks";

// AG Grid 모듈 등록
ModuleRegistry.registerModules([AllCommunityModule]);

export default function AgGridMatrixTable() {
  const dispatch = useAppDispatch();
  const gridRef = useRef<AgGridReact<RowData>>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const { columnHeaders, rowHeaders } = useAppSelector((state) => state.matrix);

  const [copied, setCopied] = useState(false);
  const [rowHeightOption, setRowHeightOption] =
    useState<RowHeightOption>("normal");
  const [textAlignOption, setTextAlignOption] =
    useState<TextAlignOption>("right");
  const [decimalPlaces, setDecimalPlaces] = useState<number>(2);
  const [powerUnit, setPowerUnit] = useState<PowerUnit>("mW");

  const currentRowHeight = ROW_HEIGHT_CONFIG[rowHeightOption].height;

  // 단위 변환 배수: API 값은 W이므로, mW일 때 1000을 곱함
  const unitMultiplier = powerUnit === "mW" ? 1000 : 1;

  const handleRowHeightChange = useCallback((option: RowHeightOption) => {
    setRowHeightOption(option);
    const api = gridRef.current?.api as GridApi<RowData> | undefined;
    if (api) {
      const newHeight = ROW_HEIGHT_CONFIG[option].height;
      api.setGridOption("rowHeight", newHeight);
      api.resetRowHeights();
      api.redrawRows();
    }
  }, []);

  const handleTextAlignChange = useCallback((option: TextAlignOption) => {
    setTextAlignOption(option);
    const api = gridRef.current?.api as GridApi<RowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  const handleDecimalIncrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.min(prev + 1, 10));
    const api = gridRef.current?.api as GridApi<RowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  const handleDecimalDecrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.max(prev - 1, 0));
    const api = gridRef.current?.api as GridApi<RowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  const handlePowerUnitChange = useCallback((unit: PowerUnit) => {
    setPowerUnit(unit);
    const api = gridRef.current?.api as GridApi<RowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      const api = gridRef.current?.api as GridApi<RowData> | undefined;
      if (!api) return;
      const allColumns = api.getAllDisplayedColumns();
      const dataColumnOrder = allColumns
        .map((col) => col.getColId())
        .filter((colId) => colId !== "rowGroup" && colId !== "rowHeader");

      // Helper function to format power values with unit conversion
      const formatValue = (value: unknown, rowGroup: string): string => {
        if (value === null || value === undefined || value === "") return "";
        if (value === "___LOADING___") return "";

        // Only apply unit conversion to Power-related row groups
        const isPowerRow = rowGroup.toLowerCase().includes("power");

        const num = parseFloat(String(value));
        if (isNaN(num)) return String(value);

        // Apply unit multiplier only for power rows
        const converted = isPowerRow ? num * unitMultiplier : num;
        return converted.toFixed(decimalPlaces);
      };

      const headers = [
        "Group",
        "Row Header",
        ...dataColumnOrder.map((colId) => {
          const colHeader = columnHeaders.find((c) => c.id === colId);
          return colHeader?.label ?? colId;
        }),
      ];

      const displayedRows: RowData[] = [];
      api.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) displayedRows.push(node.data);
      });

      let prevGroup = "";
      const dataRows = displayedRows.map((row) => {
        const originalRow = rowHeaders.find((r) => r.id === row.id);
        if (!originalRow) return "";
        let groupValue =
          originalRow.rowGroup !== prevGroup ? originalRow.rowGroup : "";
        if (groupValue) {
          groupValue = groupValue
            .replace(/\r?\n+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        }
        prevGroup = originalRow.rowGroup;
        const rowValues = [
          groupValue,
          originalRow.label,
          ...dataColumnOrder.map((colId) =>
            formatValue(originalRow.data[colId], originalRow.rowGroup)
          ),
        ];
        return rowValues.join("\t");
      });

      const tsvContent = [headers.join("\t"), ...dataRows].join("\n");

      // 5. HTML 형식 생성
      const generateHtmlTable = (): string => {
        const htmlRows: string[] = [];
        // 공통 border 스타일: 웹용 CSS + Excel용 MSO 속성
        const borderStyle =
          "border: .5pt solid black; mso-border-alt: solid black .5pt;";

        // 헤더 행
        let headerHtml =
          '<tr style="background-color: #e3f2fd; font-weight: bold; text-align: center;">';
        headerHtml += `<th style="padding: 8px; font-weight: bold; background-color: #e8f5e9; ${borderStyle}">Group</th>`;
        headerHtml += `<th style="padding: 8px; font-weight: bold; background-color: #e8f5e9; ${borderStyle}">Row Header</th>`;
        for (const colId of dataColumnOrder) {
          const colHeader = columnHeaders.find((c) => c.id === colId);
          const label = colHeader?.label ?? colId;
          headerHtml += `<th style="padding: 8px; font-weight: bold; text-align: center; ${borderStyle}">${label}</th>`;
        }
        headerHtml += "</tr>";
        htmlRows.push(headerHtml);

        // 각 그룹별 row span 계산
        const groupRowCounts: Map<string, number> = new Map();
        displayedRows.forEach((row) => {
          const originalRow = rowHeaders.find((r) => r.id === row.id);
          if (originalRow) {
            const group = originalRow.rowGroup;
            groupRowCounts.set(group, (groupRowCounts.get(group) || 0) + 1);
          }
        });

        // 데이터 행들 (row group merge 적용)
        prevGroup = "";
        for (const row of displayedRows) {
          const originalRow = rowHeaders.find((r) => r.id === row.id);
          if (!originalRow) continue;

          const isFirstOfGroup = originalRow.rowGroup !== prevGroup;
          const currentGroup = originalRow.rowGroup;
          const rowSpan = groupRowCounts.get(currentGroup) || 1;

          let rowHtml = '<tr style="text-align: right;">';

          // Group 셀: 첫 행에만 rowspan으로 merge
          if (isFirstOfGroup) {
            let groupValue = currentGroup
              .replace(/\r?\n+/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            rowHtml += `<td style="padding: 8px; text-align: left; vertical-align: middle; background-color: #e8f5e9; ${borderStyle}" rowspan="${rowSpan}">${groupValue}</td>`;
          }

          rowHtml += `<td style="padding: 8px; text-align: left; font-weight: 500; background-color: #e8f5e9; ${borderStyle}">${originalRow.label}</td>`;

          for (const colId of dataColumnOrder) {
            const value = originalRow.data[colId] ?? "";
            rowHtml += `<td style="padding: 8px; text-align: right; ${borderStyle}">${value}</td>`;
          }

          rowHtml += "</tr>";
          htmlRows.push(rowHtml);
          prevGroup = originalRow.rowGroup;
        }

        return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"><style>table { border-collapse: collapse; } td, th { border: .5pt solid black; mso-border-alt: solid black .5pt; }</style></head><body><table cellpadding="8" cellspacing="0" style="font-family: Arial, sans-serif; font-size: 12px;">${htmlRows.join(
          ""
        )}</table></body></html>`;
      };

      const htmlContent = generateHtmlTable();

      // 6. 클립보드에 HTML + TSV 형식으로 복사
      try {
        const blob = new Blob([htmlContent], { type: "text/html" });
        const data = [
          new ClipboardItem({
            "text/html": blob,
            "text/plain": new Blob([tsvContent], { type: "text/plain" }),
          }),
        ];
        await navigator.clipboard.write(data);
      } catch {
        // 다중 형식 미지원시 TSV만 복사
        await navigator.clipboard.writeText(tsvContent);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy table data: ", err);
    }
  }, [columnHeaders, rowHeaders, unitMultiplier, decimalPlaces]);

  const rowData: RowData[] = useMemo(() => {
    return rowHeaders.map((row) => {
      // Only apply unit conversion to Power-related row groups
      const isPowerRow = row.rowGroup.toLowerCase().includes("power");

      // Transform data with unit conversion applied only to Power rows
      const transformedData: Record<string, string | number> = {};
      for (const key in row.data) {
        const value = row.data[key];
        if (value === null || value === undefined || value === "") {
          transformedData[key] = "";
        } else if (value === "___LOADING___") {
          transformedData[key] = "___LOADING___";
        } else {
          const num = parseFloat(String(value));
          if (!isNaN(num) && isPowerRow) {
            // Apply unit conversion only for power rows, keep as number
            transformedData[key] = num * unitMultiplier;
          } else if (!isNaN(num)) {
            // Non-power rows: keep as number for decimal formatting
            transformedData[key] = num;
          } else {
            transformedData[key] = String(value);
          }
        }
      }

      return {
        id: row.id,
        rowGroup: row.rowGroup,
        rowHeader: row.label,
        ...transformedData,
      };
    });
  }, [rowHeaders, unitMultiplier]);

  const {
    isFirstOfGroupFromApi,
    rowGroupRowSpan,
    rowGroupCellClass,
    getRowClass,
  } = useRowSpanAndClasses();
  const { onRowDragMove, onRowDragEnd } = useRowDragHandlers(
    gridRef,
    gridContainerRef,
    rowHeaders,
    dispatch
  );
  const { onCellClicked } = useSelectionHandlers(gridRef);

  const groupColumnWidth = useMemo(() => {
    const getMaxLineLength = (text: string) =>
      Math.max(...text.split("\n").map((l) => l.length));
    const maxGroupLength = Math.max(
      "Group".length,
      ...rowHeaders.map((r) => getMaxLineLength(r.rowGroup))
    );
    return Math.max(80, maxGroupLength * 8 + 50);
  }, [rowHeaders]);

  const rowHeaderColumnWidth = useMemo(() => {
    const maxHeaderLength = Math.max(
      "Row Header".length,
      ...rowHeaders.map((r) => r.label.length)
    );
    return Math.max(100, maxHeaderLength * 8 + 50);
  }, [rowHeaders]);

  const columnDefs = useMemo(
    () =>
      buildColumnDefs({
        columnHeaders,
        groupColumnWidth,
        rowHeaderColumnWidth,
        textAlignOption,
        decimalPlaces,
        rowGroupRowSpan,
        rowGroupCellClass,
        isFirstOfGroupFromApi,
        powerUnit,
      }),
    [
      columnHeaders,
      groupColumnWidth,
      rowHeaderColumnWidth,
      textAlignOption,
      decimalPlaces,
      rowGroupRowSpan,
      rowGroupCellClass,
      isFirstOfGroupFromApi,
      powerUnit,
    ]
  );

  const defaultColDef: ColDef<RowData> = useMemo(
    () => ({
      resizable: true,
      sortable: false,
      headerClass: "ag-header-cell-center",
    }),
    []
  );

  return (
    <div className="flex flex-col gap-2">
      <Toolbar
        rowHeightOption={rowHeightOption}
        onRowHeightChange={handleRowHeightChange}
        textAlignOption={textAlignOption}
        onTextAlignChange={handleTextAlignChange}
        decimalPlaces={decimalPlaces}
        onIncreaseDecimal={handleDecimalIncrease}
        onDecreaseDecimal={handleDecimalDecrease}
        powerUnit={powerUnit}
        onPowerUnitChange={handlePowerUnitChange}
        copied={copied}
        onCopy={handleCopyToClipboard}
      />
      <div
        ref={gridContainerRef}
        className="ag-theme-quartz"
        style={{ height: "calc(90vh - 100px)", width: "100%" }}
      >
        <AgGridReact<RowData>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={currentRowHeight}
          suppressRowTransform={true}
          animateRows={true}
          rowDragManaged={true}
          rowDragMultiRow={true}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          getRowId={(params) => params.data.id}
          getRowClass={getRowClass}
          onRowDragMove={onRowDragMove}
          onRowDragEnd={onRowDragEnd}
          onCellClicked={onCellClicked}
        />
      </div>
    </div>
  );
}
