/**
 * @file timingMatrixReducer.ts
 *
 * @purpose
 * Timing Page 전용 매트릭스 상태 관리 리듀서입니다.
 * 각 행은 DoE를 나타내며, 컬럼은 타이밍 메트릭입니다.
 * Row: DoE Name, Column: 7개 그룹 × 3개 메트릭
 *
 * @structure
 * 1. TimingMatrixState: 행 목록 상태
 * 2. addTimingRow: DoE 추가 시 새 행 생성
 * 3. updateTimingCell: 개별 셀 값 업데이트
 * 4. removeTimingRow: DoE 행 삭제
 *
 * @dependencies
 * - @reduxjs/toolkit: Redux 툴킷
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { LOADING_PLACEHOLDER } from "@/lib/constants";
import {
  TIMING_COLUMN_GROUPS,
  TIMING_METRICS,
  generateTimingColumnKey,
} from "@/variables/defaultTimingMatrixTemplate";

/** Timing 행 타입 (DoE 1개 = 1개 행) */
export interface TimingRow {
  /** DoE 고유 ID (doeRegistry와 연결) */
  id: string;
  /** DoE 표시 이름 (Row Header에 표시됨) */
  label: string;
  /** 동적 데이터: columnId -> value */
  data: Record<string, unknown>;
  /** URL 복원 시 데이터 fetch 필요 여부 */
  _needsDataFetch?: boolean;
  /** URL 복원용 metadata 필드들 (doeRegistry에도 저장되지만 타이밍 이슈 방지용) */
  PROJECT_NAME?: string;
  BLOCK?: string;
  NET_VER?: string;
  REVISION?: string;
  ECO_NUM?: string;
  TIMING_SCENARIO?: string;
  AVAILABLE_TIMING_SCENARIOS?: string[];
}

/** Timing 매트릭스 상태 타입 */
export interface TimingMatrixState {
  /** 행 목록 (각 행은 DoE를 나타냄) */
  rows: TimingRow[];
}

const initialState: TimingMatrixState = {
  rows: [],
};

const timingMatrixSlice = createSlice({
  name: "timingMatrix",
  initialState,
  reducers: {
    /**
     * 새 DoE 행을 추가합니다.
     * DoE 추가 버튼 클릭 시 호출됩니다.
     */
    addTimingRow: (
      state,
      action: PayloadAction<{
        id: string;
        label: string;
        _needsDataFetch?: boolean;
      }>
    ) => {
      const { id, label, _needsDataFetch } = action.payload;

      // 중복 체크
      if (state.rows.some((row) => row.id === id)) {
        return;
      }

      // [WHY] 항상 LOADING 상태로 초기화하여 spinner가 표시되도록 함
      // _needsDataFetch는 URL 복원 시 useRestoreTimingRowData가 데이터를 fetch할지 결정
      const initialData: Record<string, unknown> = {};
      TIMING_COLUMN_GROUPS.forEach((columnGroup) => {
        TIMING_METRICS.forEach((metric) => {
          const columnId = generateTimingColumnKey(columnGroup, metric);
          initialData[columnId] = LOADING_PLACEHOLDER;
        });
      });

      state.rows.push({
        id,
        label,
        data: initialData,
        _needsDataFetch,
      });
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
      const row = state.rows.find((r) => r.id === rowId);
      if (row) {
        row.data[columnId] = value;
      }
    },

    /**
     * DoE 행을 삭제합니다.
     */
    removeTimingRow: (state, action: PayloadAction<string>) => {
      const rowId = action.payload;
      state.rows = state.rows.filter((row) => row.id !== rowId);
    },

    /**
     * DoE 행의 라벨을 업데이트합니다.
     */
    updateTimingRowLabel: (
      state,
      action: PayloadAction<{
        rowId: string;
        label: string;
      }>
    ) => {
      const { rowId, label } = action.payload;
      const row = state.rows.find((r) => r.id === rowId);
      if (row) {
        row.label = label;
      }
    },

    reorderTimingRows: (state, action: PayloadAction<string[]>) => {
      const idsInOrder = action.payload;
      const orderMap = new Map(idsInOrder.map((id, index) => [id, index]));
      const knownRows = state.rows
        .filter((row) => orderMap.has(row.id))
        .sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);
      const unknownRows = state.rows.filter((row) => !orderMap.has(row.id));

      state.rows = [...knownRows, ...unknownRows];
    },

    /**
     * 여러 행을 설정합니다 (URL 복원용).
     * [WHY] _needsDataFetch가 true인 행은 LOADING 상태로 초기화하여 spinner가 표시되도록 함
     */
    setTimingRows: (state, action: PayloadAction<TimingRow[]>) => {
      state.rows = action.payload.map((row) => {
        // _needsDataFetch가 true이고 data가 비어있으면 LOADING 상태로 초기화
        if (row._needsDataFetch && Object.keys(row.data).length === 0) {
          const initialData: Record<string, unknown> = {};
          TIMING_COLUMN_GROUPS.forEach((columnGroup) => {
            TIMING_METRICS.forEach((metric) => {
              const columnId = generateTimingColumnKey(columnGroup, metric);
              initialData[columnId] = LOADING_PLACEHOLDER;
            });
          });
          return { ...row, data: initialData };
        }
        return row;
      });
    },

    /**
     * 행의 _needsDataFetch 플래그를 해제합니다.
     */
    markTimingRowFetched: (state, action: PayloadAction<string>) => {
      const rowId = action.payload;
      const row = state.rows.find((r) => r.id === rowId);
      if (row) {
        row._needsDataFetch = false;
      }
    },

    /**
     * 전체 상태를 초기화합니다.
     */
    resetTimingMatrix: () => initialState,
  },
});

export const {
  addTimingRow,
  updateTimingCell,
  removeTimingRow,
  updateTimingRowLabel,
  reorderTimingRows,
  setTimingRows,
  markTimingRowFetched,
  resetTimingMatrix,
} = timingMatrixSlice.actions;

export default timingMatrixSlice.reducer;
