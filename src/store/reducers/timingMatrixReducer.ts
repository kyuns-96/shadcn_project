/**
 * @file timingMatrixReducer.ts
 *
 * @purpose
 * Timing Page 전용 매트릭스 상태 관리 리듀서입니다.
 * DoE 그룹 (여러 컬럼 그룹: setup/hold/clock_mttv/data_mttv/max_cap/cpc/gnoise)과
 * flat structure의 행을 관리합니다.
 *
 * @structure
 * 1. TimingMatrixState: DoE 그룹 + 행 헤더 상태
 * 2. addDoeGroup: 새 DoE 추가 (모든 컬럼 그룹 포함)
 * 3. updateTimingCell: 개별 셀 값 업데이트
 * 4. addTimingRow: 새 Timing 행 추가
 * 5. removeDoeGroup: DoE 그룹 삭제
 *
 * @dependencies
 * - @reduxjs/toolkit: Redux 툴킷
 * - @/variables/defaultTimingMatrixTemplate: Timing 행 상수
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { TimingRowKey } from "@/variables/defaultTimingMatrixTemplate";

/** DoE 그룹 헤더 타입 */
export interface TimingDoeGroup {
  /** DoE 고유 ID (예: "doe1703849234567") - doeRegistry 참조용 */
  id: string;
  /** DoE 표시 이름 (예: "DoE-001") */
  label: string;
  /** URL 복원 시 데이터 fetch 필요 여부 */
  _needsDataFetch?: boolean;
}

/** Timing 행 헤더 타입 */
export interface TimingRowHeader {
  /** 행 고유 ID */
  id: string;
  /** 행 표시 라벨 */
  label: string;
  /** 행 키 (메트릭 경로 매핑용) */
  rowKey: TimingRowKey;
  /** 동적 데이터: columnId -> value */
  data: Record<string, unknown>;
}

/** Timing 매트릭스 상태 타입 */
export interface TimingMatrixState {
  /** DoE 그룹 목록 (각 DoE는 여러 컬럼 그룹 포함) */
  doeGroups: TimingDoeGroup[];
  /** 행 헤더 목록 (flat structure) */
  rowHeaders: TimingRowHeader[];
}

const initialState: TimingMatrixState = {
  doeGroups: [],
  rowHeaders: [],
};

const timingMatrixSlice = createSlice({
  name: "timingMatrix",
  initialState,
  reducers: {
    /**
     * 새 DoE 그룹을 추가합니다.
     * 각 DoE 그룹은 여러 컬럼 그룹을 포함합니다 (setup/hold/clock_mttv 등).
     */
    addDoeGroup: (
      state,
      action: PayloadAction<{
        id?: string;
        label: string;
        defaultValue?: string;
        _needsDataFetch?: boolean;
      }>
    ) => {
      const { label, defaultValue = "", _needsDataFetch } = action.payload;
      const id = action.payload.id || `doe-${Date.now()}`;

      // Add the new DoE group
      state.doeGroups.push({
        id,
        label,
        _needsDataFetch,
      });

      // Initialize data for all existing rows
      // 각 row에서 이 DoE의 모든 컬럼(그룹별)에 대한 데이터를 초기화합니다.
      // 실제 컬럼 ID 형식은 ag-grid-matrix-table-timing에서 정의됩니다.
      state.rowHeaders.forEach((row) => {
        // 기본적으로 컬럼 ID는 ${doeId}_${columnGroupName}_${metric} 형식일 것으로 예상
        // 여기서는 초기값만 설정
        const columnId = `${id}`;
        if (!(columnId in row.data)) {
          row.data[columnId] = defaultValue;
        }
      });
    },

    /**
     * 새 Timing 행을 추가합니다.
     */
    addTimingRow: (
      state,
      action: PayloadAction<{
        id: string;
        label: string;
        rowKey: TimingRowKey;
      }>
    ) => {
      const { id, label, rowKey } = action.payload;

      const newRow: TimingRowHeader = {
        id,
        label,
        rowKey,
        data: {},
      };

      // Initialize data for all existing DoE groups
      state.doeGroups.forEach((doeGroup) => {
        const columnId = `${doeGroup.id}`;
        newRow.data[columnId] = "";
      });

      state.rowHeaders.push(newRow);
    },

    /**
     * 개별 셀 값을 업데이트합니다.
     */
    updateTimingCell: (
      state,
      action: PayloadAction<{
        rowId: string;
        columnId: string;
        value: unknown;
      }>
    ) => {
      const { rowId, columnId, value } = action.payload;
      const row = state.rowHeaders.find((r) => r.id === rowId);
      if (row) {
        row.data[columnId] = value;
      }
    },

    /**
     * DoE 그룹을 삭제합니다.
     */
    removeDoeGroup: (state, action: PayloadAction<string>) => {
      const doeId = action.payload;
      state.doeGroups = state.doeGroups.filter((group) => group.id !== doeId);

      // Remove this DoE's data from all rows
      state.rowHeaders.forEach((row) => {
        Object.keys(row.data).forEach((columnId) => {
          if (columnId.startsWith(`${doeId}_`)) {
            delete row.data[columnId];
          }
        });
      });
    },

    /**
     * 여러 행을 설정합니다 (초기화 또는 복원용).
     */
    setRowHeaders: (state, action: PayloadAction<TimingRowHeader[]>) => {
      state.rowHeaders = action.payload;
    },

    /**
     * 여러 DoE 그룹을 설정합니다 (URL 복원용).
     */
    setDoeGroups: (state, action: PayloadAction<TimingDoeGroup[]>) => {
      state.doeGroups = action.payload;
    },

    /**
     * 전체 상태를 초기화합니다.
     */
    resetTimingMatrix: () => initialState,
  },
});

export const {
  addDoeGroup,
  addTimingRow,
  updateTimingCell,
  removeDoeGroup,
  setRowHeaders,
  setDoeGroups,
  resetTimingMatrix,
} = timingMatrixSlice.actions;

export default timingMatrixSlice.reducer;
