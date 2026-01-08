/**
 * @file powerMatrixReducer.ts
 *
 * @purpose
 * Power Page 전용 매트릭스 상태 관리 리듀서입니다.
 * DoE 그룹 (4개 컬럼: Internal, Switching, Leakage, Total)과
 * 10개의 행 (Power 메트릭)을 관리합니다.
 *
 * @structure
 * 1. PowerMatrixState: DoE 그룹 + 행 헤더 상태
 * 2. addDoeGroup: 새 DoE 추가 (4개 컬럼 그룹)
 * 3. updatePowerCell: 개별 셀 값 업데이트
 * 4. updateDoeScenario: DoE 그룹의 시나리오 업데이트
 *
 * @dependencies
 * - @reduxjs/toolkit: Redux 툴킷
 * - @/variables/defaultPowerMatrixTemplate: Power 행 상수
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PowerRowKey } from "@/variables/defaultPowerMatrixTemplate";

/** DoE 그룹 헤더 타입 */
export interface PowerDoeGroup {
  /** DoE 고유 ID (예: "doe1703849234567") */
  id: string;
  /** DoE 표시 이름 (예: "DoE-001") */
  label: string;
  /** 프로젝트 이름 */
  PROJECT_NAME?: string;
  /** 블록 이름 */
  BLOCK?: string;
  /** 넷 버전 */
  NET_VER?: string;
  /** 리비전 */
  REVISION?: string;
  /** ECO 번호 */
  ECO_NUM?: string;
  /** 선택된 Power Scenario */
  POWER_SCENARIO?: string;
  /** 사용 가능한 시나리오 목록 */
  AVAILABLE_SCENARIOS?: string[];
  /** URL 복원 시 데이터 fetch 필요 여부 */
  _needsDataFetch?: boolean;
}

/** Power 행 헤더 타입 */
export interface PowerRowHeader {
  /** 행 고유 ID */
  id: string;
  /** 행 표시 라벨 (예: "Clock Network") */
  label: string;
  /** 행 키 (메트릭 경로 매핑용, 예: "clock_network") */
  rowKey: PowerRowKey;
  /** 동적 데이터: columnId -> value */
  data: Record<string, unknown>;
}

/** Power 매트릭스 상태 타입 */
export interface PowerMatrixState {
  /** DoE 그룹 목록 (각 DoE는 4개 컬럼 포함) */
  doeGroups: PowerDoeGroup[];
  /** 행 헤더 목록 (10개 Power 메트릭 행) */
  rowHeaders: PowerRowHeader[];
}

const initialState: PowerMatrixState = {
  doeGroups: [],
  rowHeaders: [],
};

const powerMatrixSlice = createSlice({
  name: "powerMatrix",
  initialState,
  reducers: {
    /**
     * 새 DoE 그룹을 추가합니다.
     * 각 DoE 그룹은 4개의 컬럼 (Internal, Switching, Leakage, Total)을 포함합니다.
     */
    addDoeGroup: (
      state,
      action: PayloadAction<{
        id?: string;
        label: string;
        defaultValue?: string;
        meta?: {
          PROJECT_NAME?: string;
          BLOCK?: string;
          NET_VER?: string;
          REVISION?: string;
          ECO_NUM?: string;
          POWER_SCENARIO?: string;
          AVAILABLE_SCENARIOS?: string[];
        };
      }>
    ) => {
      const { label, defaultValue = "", meta } = action.payload;
      const id = action.payload.id || `doe-${Date.now()}`;

      // Add the new DoE group
      state.doeGroups.push({
        id,
        label,
        ...(meta || {}),
      });

      // Initialize data for this DoE's 4 columns in all existing rows
      const columnNames = ["Internal", "Switching", "Leakage", "Total"];
      state.rowHeaders.forEach((row) => {
        columnNames.forEach((colName) => {
          const columnId = `${id}_${colName}`;
          row.data[columnId] = defaultValue;
        });
      });
    },

    /**
     * 새 행을 추가합니다 (초기화용).
     */
    addPowerRow: (
      state,
      action: PayloadAction<{
        id?: string;
        label: string;
        rowKey: PowerRowKey;
        data?: Record<string, unknown>;
      }>
    ) => {
      const { label, rowKey, data } = action.payload;
      const id = action.payload.id || `power-row-${Date.now()}`;

      // Initialize data with existing DoE columns
      const columnNames = ["Internal", "Switching", "Leakage", "Total"];
      const rowData: Record<string, unknown> =
        data ||
        state.doeGroups.reduce((acc, doeGroup) => {
          columnNames.forEach((colName) => {
            const columnId = `${doeGroup.id}_${colName}`;
            acc[columnId] = doeGroup._needsDataFetch ? "___LOADING___" : "";
          });
          return acc;
        }, {} as Record<string, unknown>);

      // Merge provided data with any missing column initializations
      if (data) {
        state.doeGroups.forEach((doeGroup) => {
          columnNames.forEach((colName) => {
            const columnId = `${doeGroup.id}_${colName}`;
            if (!(columnId in rowData)) {
              rowData[columnId] = doeGroup._needsDataFetch
                ? "___LOADING___"
                : "";
            }
          });
        });
      }

      state.rowHeaders.push({
        id,
        label,
        rowKey,
        data: rowData,
      });
    },

    /**
     * 행 헤더 목록을 설정합니다 (초기화용).
     */
    setPowerRowHeaders: (state, action: PayloadAction<PowerRowHeader[]>) => {
      state.rowHeaders = action.payload;
    },

    /**
     * 개별 셀 값을 업데이트합니다.
     */
    updatePowerCell: (
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
     * DoE 그룹의 시나리오를 업데이트합니다.
     */
    updateDoeScenario: (
      state,
      action: PayloadAction<{
        doeId: string;
        scenario: string;
        availableScenarios?: string[];
      }>
    ) => {
      const { doeId, scenario, availableScenarios } = action.payload;
      const doeGroup = state.doeGroups.find((doe) => doe.id === doeId);
      if (doeGroup) {
        doeGroup.POWER_SCENARIO = scenario;
        if (availableScenarios) {
          doeGroup.AVAILABLE_SCENARIOS = availableScenarios;
        }
      }
    },

    /**
     * DoE 그룹을 삭제합니다.
     */
    removeDoeGroup: (state, action: PayloadAction<string>) => {
      const doeId = action.payload;
      // Remove from doeGroups
      state.doeGroups = state.doeGroups.filter((doe) => doe.id !== doeId);

      // Remove column data from all rows
      const columnNames = ["Internal", "Switching", "Leakage", "Total"];
      state.rowHeaders.forEach((row) => {
        columnNames.forEach((colName) => {
          const columnId = `${doeId}_${colName}`;
          delete row.data[columnId];
        });
      });
    },

    /**
     * DoE 그룹을 fetch 완료로 표시합니다.
     */
    markDoeFetched: (state, action: PayloadAction<string>) => {
      const doeGroup = state.doeGroups.find((doe) => doe.id === action.payload);
      if (doeGroup) {
        doeGroup._needsDataFetch = false;
      }
    },

    /**
     * URL에서 DoE 그룹을 복원합니다.
     */
    restoreDoeGroupsFromURL: (
      state,
      action: PayloadAction<PowerDoeGroup[]>
    ) => {
      // Mark DoE groups as needing data fetch
      state.doeGroups = action.payload.map((doe) => ({
        ...doe,
        _needsDataFetch: true,
      }));

      // Initialize data for all DoE columns in existing rows with loading placeholder
      const columnNames = ["Internal", "Switching", "Leakage", "Total"];
      action.payload.forEach((doeGroup) => {
        state.rowHeaders.forEach((row) => {
          columnNames.forEach((colName) => {
            const columnId = `${doeGroup.id}_${colName}`;
            if (!(columnId in row.data)) {
              row.data[columnId] = "___LOADING___";
            }
          });
        });
      });
    },

    /**
     * 전체 상태를 초기화합니다.
     */
    resetPowerMatrix: () => initialState,
  },
});

export const {
  addDoeGroup,
  addPowerRow,
  setPowerRowHeaders,
  updatePowerCell,
  updateDoeScenario,
  removeDoeGroup,
  markDoeFetched,
  restoreDoeGroupsFromURL,
  resetPowerMatrix,
} = powerMatrixSlice.actions;

export default powerMatrixSlice.reducer;
