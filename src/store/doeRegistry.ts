/**
 * @file doeRegistry.ts
 *
 * @purpose
 * 모든 DoE(Design of Experiments)의 이름과 메타데이터를 중앙에서 관리합니다.
 * PowerPage와 QoRComparePage에서 공유하는 단일 소스입니다.
 *
 * @structure
 * 1. DoEEntry: DoE의 이름과 메타데이터
 * 2. addDoE: 새 DoE 추가
 * 3. updateDoEMetadata: DoE 메타데이터 업데이트 (모든 참조처에 자동 반영)
 * 4. removeDoE: DoE 삭제
 * 5. Selectors: DoE 조회
 *
 * @dependencies
 * - @reduxjs/toolkit: Redux 툴킷
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * DoE 항목의 이름과 메타데이터를 저장합니다.
 * PowerPage와 QoRComparePage에서 공유합니다.
 */
export interface DoEEntry {
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
}

/**
 * DoE 레지스트리 상태 타입
 */
export interface DoERegistryState {
  /** 모든 DoE 항목 맵 (id -> DoEEntry) */
  byId: Record<string, DoEEntry>;
  /** DoE ID 순서 (정렬 유지용) */
  allIds: string[];
}

const initialState: DoERegistryState = {
  byId: {},
  allIds: [],
};

const doeRegistrySlice = createSlice({
  name: "doeRegistry",
  initialState,
  reducers: {
    /**
     * 새 DoE를 레지스트리에 추가합니다.
     * 이 액션으로 PowerPage와 QoRComparePage 모두에서 참조될 수 있습니다.
     */
    addDoE: (
      state,
      action: PayloadAction<{
        id?: string;
        label: string;
        PROJECT_NAME?: string;
        BLOCK?: string;
        NET_VER?: string;
        REVISION?: string;
        ECO_NUM?: string;
        POWER_SCENARIO?: string;
        AVAILABLE_SCENARIOS?: string[];
      }>
    ) => {
      const {
        label,
        PROJECT_NAME,
        BLOCK,
        NET_VER,
        REVISION,
        ECO_NUM,
        POWER_SCENARIO,
        AVAILABLE_SCENARIOS,
      } = action.payload;
      const id = action.payload.id || `doe-${Date.now()}`;

      state.byId[id] = {
        id,
        label,
        ...(PROJECT_NAME && { PROJECT_NAME }),
        ...(BLOCK && { BLOCK }),
        ...(NET_VER && { NET_VER }),
        ...(REVISION && { REVISION }),
        ...(ECO_NUM && { ECO_NUM }),
        ...(POWER_SCENARIO && { POWER_SCENARIO }),
        ...(AVAILABLE_SCENARIOS && { AVAILABLE_SCENARIOS }),
      };

      if (!state.allIds.includes(id)) {
        state.allIds.push(id);
      }
    },

    /**
     * DoE의 메타데이터를 업데이트합니다.
     * 이 변경사항은 이 DoE를 참조하는 모든 페이지(PowerPage, QoRComparePage)에 자동으로 반영됩니다.
     */
    updateDoEMetadata: (
      state,
      action: PayloadAction<{
        doeId: string;
        PROJECT_NAME?: string;
        BLOCK?: string;
        NET_VER?: string;
        REVISION?: string;
        ECO_NUM?: string;
        POWER_SCENARIO?: string;
        AVAILABLE_SCENARIOS?: string[];
      }>
    ) => {
      const { doeId, ...metadata } = action.payload;
      const entry = state.byId[doeId];
      if (entry) {
        // Update only provided fields
        Object.entries(metadata).forEach(([key, value]) => {
          if (value !== undefined) {
            (entry as any)[key] = value;
          }
        });
      }
    },

    /**
     * DoE의 이름을 업데이트합니다.
     */
    updateDoELabel: (
      state,
      action: PayloadAction<{
        doeId: string;
        label: string;
      }>
    ) => {
      const { doeId, label } = action.payload;
      const entry = state.byId[doeId];
      if (entry) {
        entry.label = label;
      }
    },

    /**
     * DoE를 레지스트리에서 삭제합니다.
     */
    removeDoE: (state, action: PayloadAction<string>) => {
      const doeId = action.payload;
      delete state.byId[doeId];
      state.allIds = state.allIds.filter((id) => id !== doeId);
    },

    /**
     * 여러 DoE를 한 번에 설정합니다 (초기화/URL 복원용).
     */
    setDoEs: (state, action: PayloadAction<DoEEntry[]>) => {
      state.byId = {};
      state.allIds = [];
      action.payload.forEach((doe) => {
        state.byId[doe.id] = doe;
        state.allIds.push(doe.id);
      });
    },

    /**
     * 전체 상태를 초기화합니다.
     */
    resetDoERegistry: () => initialState,
  },
});

export const {
  addDoE,
  updateDoEMetadata,
  updateDoELabel,
  removeDoE,
  setDoEs,
  resetDoERegistry,
} = doeRegistrySlice.actions;

export default doeRegistrySlice.reducer;

// ============================================================
// Selectors
// ============================================================

/**
 * ID로 DoE를 조회합니다.
 */
export const selectDoEById = (
  state: { doeRegistry: DoERegistryState },
  doeId: string
) => state.doeRegistry.byId[doeId];

/**
 * 모든 DoE를 조회합니다.
 */
export const selectAllDoEs = (state: {
  doeRegistry: DoERegistryState;
}): DoEEntry[] => {
  const { byId, allIds } = state.doeRegistry;
  return allIds.map((id) => byId[id]);
};

/**
 * 이름으로 DoE를 조회합니다.
 */
export const selectDoEByName = (
  state: { doeRegistry: DoERegistryState },
  label: string
) => {
  const { byId } = state.doeRegistry;
  return Object.values(byId).find((doe) => doe.label === label);
};

/**
 * DoE 존재 여부를 확인합니다 (이름으로).
 */
export const selectDoEExistsByName = (
  state: { doeRegistry: DoERegistryState },
  label: string
) => {
  const { byId } = state.doeRegistry;
  return Object.values(byId).some((doe) => doe.label === label);
};

/**
 * 모든 DoE 이름을 배열로 반환합니다.
 */
export const selectAllDoELabels = (state: {
  doeRegistry: DoERegistryState;
}): string[] => {
  const { byId, allIds } = state.doeRegistry;
  return allIds.map((id) => byId[id].label);
};
