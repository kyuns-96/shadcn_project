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
 *
 * @dependencies
 * - ag-grid-react: AG Grid React 컴포넌트
 * - ag-grid-community: AG Grid 코어 모듈
 * - @/store: Redux hooks
 * - ./columns: 컬럼 정의 빌더
 * - ./types: 타입 정의
 */

"use client";

import { useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
} from "ag-grid-community";
import { useAppSelector } from "@/store";
import {
  ROW_HEIGHT_CONFIG,
  type RowHeightOption,
  type TextAlignOption,
} from "./constants";
import type { TimingRowData } from "./types";
import { buildTimingColumnDefs, updateTimingColumnAlignment } from "./columns";

// AG Grid 모듈 등록
ModuleRegistry.registerModules([AllCommunityModule]);

export default function AgGridTimingTable() {
  const gridRef = useRef<AgGridReact<TimingRowData>>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const { rows } = useAppSelector((state) => state.timingMatrix);

  const [rowHeightOption] =
    useState<RowHeightOption>("normal");
  const [textAlignOption] =
    useState<TextAlignOption>("right");

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
    return buildTimingColumnDefs(textAlignOption);
  }, [textAlignOption]);

  // 텍스트 정렬 변경 시 컬럼 업데이트
  columnDefs = useMemo(() => {
    return updateTimingColumnAlignment(columnDefs, textAlignOption);
  }, [columnDefs, textAlignOption]);

  // AG Grid 기본 설정
  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    rowDrag: false,
  };

  return (
    <div className="w-full h-full flex flex-col gap-2">
      {/* 정보 영역 */}
      <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
        <p>DoE Rows: {rows.length}</p>
        <p>Columns: 7 groups × 3 metrics = 21 columns</p>
      </div>

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
          rowHeight={currentRowHeight}
          headerHeight={40}
          domLayout="normal"
          suppressMovableColumns={true}
          groupDisplayType="multipleColumns"
        />
      </div>
    </div>
  );
}
