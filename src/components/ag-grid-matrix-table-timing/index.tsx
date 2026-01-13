/**
 * @file ag-grid-matrix-table-timing/index.tsx
 *
 * @purpose
 * Timing 전용 AG Grid 기반의 매트릭스 테이블 컴포넌트입니다.
 * Row: DoE Name (pinned left)
 * Column: 7개 그룹 × 3개 메트릭 = 21개 컬럼
 *
 * @structure
 * 1. AgGridTimingTable: 메인 컴포넌트
 * 2. 행 데이터 변환 (DoE별 1개 행)
 * 3. 컬럼 정의 생성 (고정)
 * 4. Toolbar: 행 높이, 텍스트 정렬, 소수점 자리수, 클립보드 복사
 *
 * @dependencies
 * - ag-grid-react: AG Grid React 컴포넌트
 * - ag-grid-community: AG Grid 코어 모듈
 * - @/store: Redux hooks
 * - ./columns: 컬럼 정의 빌더
 * - ./types: 타입 정의
 * - ./Toolbar: 툴바 컴포넌트
 */

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type GridApi,
} from "ag-grid-community";
import { useAppSelector } from "@/store";
import {
  ROW_HEIGHT_CONFIG,
  type RowHeightOption,
  type TextAlignOption,
} from "./constants";
import type { TimingRowData } from "./types";
import {
  buildTimingColumnDefs,
  updateTimingColumnAlignment,
  formatTimingValue,
} from "./columns";
import { TimingToolbar } from "./Toolbar";
import {
  TIMING_COLUMN_GROUPS,
  TIMING_METRICS,
  generateTimingColumnKey,
} from "@/variables/defaultTimingMatrixTemplate";

// AG Grid 모듈 등록
ModuleRegistry.registerModules([AllCommunityModule]);

export default function AgGridTimingTable() {
  const gridRef = useRef<AgGridReact<TimingRowData>>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const { rows } = useAppSelector((state) => state.timingMatrix);

  // UI 상태 관리
  const [rowHeightOption, setRowHeightOption] =
    useState<RowHeightOption>("normal");
  const [textAlignOption, setTextAlignOption] =
    useState<TextAlignOption>("right");
  const [decimalPlaces, setDecimalPlaces] = useState<number>(3);
  const [copied, setCopied] = useState(false);

  const currentRowHeight = ROW_HEIGHT_CONFIG[rowHeightOption].height;

  // 행 데이터 변환 (DoE별 1개 행)
  const rowData = useMemo(() => {
    return rows.map((row) => ({
      id: row.id,
      name: row.label, // DoE name
      ...row.data,
    })) as TimingRowData[];
  }, [rows]);

  // 컬럼 정의 생성 (고정 - DoE와 무관)
  let columnDefs = useMemo(() => {
    return buildTimingColumnDefs(textAlignOption, decimalPlaces);
  }, [textAlignOption, decimalPlaces]);

  // 텍스트 정렬 변경 시 컬럼 업데이트
  columnDefs = useMemo(() => {
    return updateTimingColumnAlignment(
      columnDefs,
      textAlignOption,
      decimalPlaces
    );
  }, [columnDefs, textAlignOption, decimalPlaces]);

  // ============================================================
  // Toolbar 핸들러
  // ============================================================

  /**
   * 행 높이 변경 핸들러
   */
  const handleRowHeightChange = useCallback((option: RowHeightOption) => {
    setRowHeightOption(option);
    const api = gridRef.current?.api as GridApi<TimingRowData> | undefined;
    if (api) {
      const newHeight = ROW_HEIGHT_CONFIG[option].height;
      api.setGridOption("rowHeight", newHeight);
      api.resetRowHeights();
      api.redrawRows();
    }
  }, []);

  /**
   * 텍스트 정렬 변경 핸들러
   */
  const handleTextAlignChange = useCallback((option: TextAlignOption) => {
    setTextAlignOption(option);
    const api = gridRef.current?.api as GridApi<TimingRowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  /**
   * 소수점 자리수 증가 핸들러
   */
  const handleDecimalIncrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.min(prev + 1, 10));
    const api = gridRef.current?.api as GridApi<TimingRowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  /**
   * 소수점 자리수 감소 핸들러
   */
  const handleDecimalDecrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.max(prev - 1, 0));
    const api = gridRef.current?.api as GridApi<TimingRowData> | undefined;
    api?.refreshCells({ force: true });
  }, []);

  /**
   * 클립보드 복사 핸들러
   * TSV 형식으로 포맷팅된 데이터를 복사합니다.
   * 헤더: 계층 구조 (GroupName / MetricName)
   */
  const handleCopyToClipboard = useCallback(async () => {
    try {
      const api = gridRef.current?.api as GridApi<TimingRowData> | undefined;
      if (!api) return;

      // 1. 헤더 생성: 계층 구조 (그룹명 행, 메트릭명 행)
      const groupHeaderRow: string[] = ["DoE Name"];
      const metricHeaderRow: string[] = [""];

      // 각 컬럼 그룹별 메트릭 헤더 생성
      TIMING_COLUMN_GROUPS.forEach((group) => {
        TIMING_METRICS.forEach((metric) => {
          groupHeaderRow.push(group);
          metricHeaderRow.push(metric);
        });
      });

      // 2. 데이터 행 수집 (현재 표시된 행들)
      const displayedRows: TimingRowData[] = [];
      api.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) displayedRows.push(node.data);
      });

      // 3. TSV 형식으로 변환 (포맷팅된 값 사용)
      const dataRows = displayedRows.map((row) => {
        const originalRow = rows.find((r) => r.id === row.id);
        if (!originalRow) return "";

        // DoE 이름만 표시 (시나리오 제외)
        const rowLabel = originalRow.label;

        // 각 컬럼의 포맷팅된 값
        const rowValues: string[] = [rowLabel];
        TIMING_COLUMN_GROUPS.forEach((group) => {
          TIMING_METRICS.forEach((metric) => {
            const columnId = generateTimingColumnKey(group, metric);
            const rawValue = originalRow.data[columnId];
            const isNVP = metric === "NVP";
            const formattedValue = formatTimingValue(
              rawValue,
              decimalPlaces,
              isNVP
            );
            rowValues.push(formattedValue);
          });
        });

        return rowValues.join("\t");
      });

      // 4. 클립보드에 복사 (헤더 2행 + 데이터 행)
      const tsvContent = [
        groupHeaderRow.join("\t"),
        metricHeaderRow.join("\t"),
        ...dataRows,
      ].join("\n");
      await navigator.clipboard.writeText(tsvContent);

      // 5. 피드백 UI
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy table data: ", err);
    }
  }, [rows, decimalPlaces]);

  // AG Grid 기본 설정
  const defaultColDef = {
    sortable: false,
    filter: false,
    resizable: true,
    rowDrag: false,
  };

  // 그룹 헤더 기본 설정
  const defaultColGroupDef = {
    headerClass: "ag-header-group-center-text",
  };

  return (
    <div className="w-full h-full flex flex-col gap-2">
      {/* Toolbar */}
      <TimingToolbar
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

      {/* AG Grid */}
      <div
        ref={gridContainerRef}
        className="ag-theme-quartz flex-1 border rounded"
        style={{ width: "100%", height: "100%" }}
      >
        <AgGridReact<TimingRowData>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          defaultColGroupDef={defaultColGroupDef}
          rowHeight={currentRowHeight}
          headerHeight={40}
          groupHeaderHeight={40}
          domLayout="normal"
          suppressMovableColumns={true}
          groupDisplayType="multipleColumns"
          rowDragManaged={true}
          animateRows={true}
        />
      </div>
    </div>
  );
}
