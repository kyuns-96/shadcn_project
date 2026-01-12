/**
 * @file ag-grid-matrix-table-timing/index.tsx
 *
 * @purpose
 * Timing 전용 AG Grid 기반의 매트릭스 테이블 컴포넌트입니다.
 * DoE별 여러 컬럼 그룹 × flat structure의 행으로 구성됩니다.
 *
 * @structure
 * 1. AgGridTimingTable: 메인 컴포넌트
 * 2. 행 데이터 변환
 * 3. 컬럼 정의 생성
 * 4. 클립보드 복사 기능 지원
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
import type { TimingRowData, EnrichedTimingDoeGroup } from "./types";
import { buildTimingColumnDefs, updateTimingColumnAlignment } from "./columns";

// AG Grid 모듈 등록
ModuleRegistry.registerModules([AllCommunityModule]);

export default function AgGridTimingTable() {
  const gridRef = useRef<AgGridReact<TimingRowData>>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const { rowHeaders } = useAppSelector((state) => state.timingMatrix);
  const timingDoeGroups = useAppSelector((state) => state.timingMatrix.doeGroups);
  const doeRegistry = useAppSelector((state) => state.doeRegistry);

  // Enrich doeGroups with metadata from doeRegistry
  const doeGroups = useMemo(() => {
    return timingDoeGroups.map((doeGroup) => {
      const metadata = doeRegistry.byId[doeGroup.id] || {};
      return {
        ...doeGroup,
        PROJECT_NAME: metadata.PROJECT_NAME,
        BLOCK: metadata.BLOCK,
        NET_VER: metadata.NET_VER,
        REVISION: metadata.REVISION,
        ECO_NUM: metadata.ECO_NUM,
        TIMING_SCENARIO: metadata.TIMING_SCENARIO,
        AVAILABLE_TIMING_SCENARIOS: metadata.AVAILABLE_TIMING_SCENARIOS,
      } as EnrichedTimingDoeGroup;
    });
  }, [timingDoeGroups, doeRegistry]);

  const [rowHeightOption] =
    useState<RowHeightOption>("normal");
  const [textAlignOption] =
    useState<TextAlignOption>("right");

  const currentRowHeight = ROW_HEIGHT_CONFIG[rowHeightOption].height;

  // 행 데이터 변환
  const rowData = useMemo(() => {
    return rowHeaders.map((row) => ({
      id: row.id,
      name: row.label, // 행 라벨 표시
      ...row.data,
    })) as TimingRowData[];
  }, [rowHeaders]);

  // 컬럼 정의 생성
  let columnDefs = useMemo(() => {
    return buildTimingColumnDefs(doeGroups, textAlignOption);
  }, [doeGroups, textAlignOption]);

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
        <p>DoE Name: {doeGroups.map((dg) => dg.label).join(", ") || "None"}</p>
        <p>Rows: {rowHeaders.length}</p>
        <p>Columns (per DoE): {7 * 3} (7 groups × 3 metrics)</p>
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
