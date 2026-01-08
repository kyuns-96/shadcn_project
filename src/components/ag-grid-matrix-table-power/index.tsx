/**
 * @file ag-grid-matrix-table-power/index.tsx
 *
 * @purpose
 * Power 전용 AG Grid 기반의 매트릭스 테이블 컴포넌트입니다.
 * 10개의 행 (Power 메트릭) × DoE당 4개의 컬럼 (Internal, Switching, Leakage, Total)으로 구성됩니다.
 * 각 DoE는 계층형 컬럼 그룹으로 표시됩니다.
 *
 * @structure
 * 1. AgGridPowerTable: 메인 컴포넌트
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
  type GridApi,
} from "ag-grid-community";
import { useAppSelector } from "@/store";
import { PowerToolbar } from "./Toolbar";
import {
  ROW_HEIGHT_CONFIG,
  type RowHeightOption,
  type TextAlignOption,
} from "./constants";
import type { PowerRowData } from "./types";
import { buildPowerColumnDefs } from "./columns";
import { useSelectionHandlers, useRowClasses } from "./hooks";
import { POWER_COLUMN_NAMES } from "@/variables/defaultPowerMatrixTemplate";

// AG Grid 모듈 등록
ModuleRegistry.registerModules([AllCommunityModule]);

export default function AgGridPowerTable() {
  const gridRef = useRef<AgGridReact<PowerRowData>>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const { doeGroups, rowHeaders } = useAppSelector(
    (state) => state.powerMatrix
  );

  const [copied, setCopied] = useState(false);
  const [rowHeightOption, setRowHeightOption] =
    useState<RowHeightOption>("normal");
  const [textAlignOption, setTextAlignOption] =
    useState<TextAlignOption>("right");
  const [decimalPlaces, setDecimalPlaces] = useState<number>(3);

  const currentRowHeight = ROW_HEIGHT_CONFIG[rowHeightOption].height;

  const handleRowHeightChange = useCallback((option: RowHeightOption) => {
    setRowHeightOption(option);
    const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
    if (api) {
      const newHeight = ROW_HEIGHT_CONFIG[option].height;
      api.setGridOption("rowHeight", newHeight);
      api.resetRowHeights();
      api.redrawRows();
    }
  }, []);

  const handleTextAlignChange = useCallback((option: TextAlignOption) => {
    setTextAlignOption(option);
    const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  const handleDecimalIncrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.min(prev + 1, 10));
    const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  const handleDecimalDecrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.max(prev - 1, 0));
    const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
      if (!api) return;

      // Build headers: Component + DoE group columns
      const headers = ["Component"];
      doeGroups.forEach((doeGroup) => {
        POWER_COLUMN_NAMES.forEach((colName) => {
          headers.push(`${doeGroup.label} - ${colName}`);
        });
      });

      // Build data rows
      const displayedRows: PowerRowData[] = [];
      api.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) displayedRows.push(node.data);
      });

      const dataRows = displayedRows.map((row) => {
        const originalRow = rowHeaders.find((r) => r.id === row.id);
        if (!originalRow) return "";

        const rowValues = [originalRow.label];
        doeGroups.forEach((doeGroup) => {
          POWER_COLUMN_NAMES.forEach((colName) => {
            const columnId = `${doeGroup.id}_${colName}`;
            rowValues.push(String(originalRow.data[columnId] ?? ""));
          });
        });
        return rowValues.join("\t");
      });

      const tsvContent = [headers.join("\t"), ...dataRows].join("\n");
      await navigator.clipboard.writeText(tsvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy table data: ", err);
    }
  }, [doeGroups, rowHeaders]);

  // Transform rowHeaders to PowerRowData format
  const rowData: PowerRowData[] = useMemo(() => {
    return rowHeaders.map((row) => ({
      id: row.id,
      rowHeader: row.label,
      rowKey: row.rowKey,
      ...row.data,
    }));
  }, [rowHeaders]);

  const { onCellClicked } = useSelectionHandlers(gridRef);
  const { getRowClass } = useRowClasses();

  // Build column definitions with DoE group hierarchy
  const columnDefs = useMemo(
    () =>
      buildPowerColumnDefs({
        doeGroups,
        textAlignOption,
        decimalPlaces,
      }),
    [doeGroups, textAlignOption, decimalPlaces]
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: false,
      filter: false,
    }),
    []
  );

  return (
    <div
      ref={gridContainerRef}
      className="flex flex-col h-full w-full overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex-shrink-0 p-2 border-b">
        <PowerToolbar
          rowHeightOption={rowHeightOption}
          onRowHeightChange={handleRowHeightChange}
          textAlignOption={textAlignOption}
          onTextAlignChange={handleTextAlignChange}
          decimalPlaces={decimalPlaces}
          onIncreaseDecimal={handleDecimalIncrease}
          onDecreaseDecimal={handleDecimalDecrease}
          copied={copied}
          onCopy={handleCopyToClipboard}
        />
      </div>

      {/* AG Grid */}
      <div className="flex-1 ag-theme-alpine">
        <AgGridReact<PowerRowData>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={currentRowHeight}
          headerHeight={32}
          groupHeaderHeight={32}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          onCellClicked={onCellClicked}
          getRowClass={getRowClass}
          animateRows={true}
          suppressMovableColumns={false}
          suppressColumnMoveAnimation={false}
        />
      </div>
    </div>
  );
}
