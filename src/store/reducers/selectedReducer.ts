import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

export type RevisionMode = 'PRE' | 'POST';

export interface SelectedState {
  selectedProject: string | null;
  selectedBlock: string | null;
  selectedNetver: string | null;
  selectedRevision: string | null;
  selectedEconum: string | null;
  doeName: string;
  /** 컬럼별 선택된 Power Scenario 매핑 (columnId -> scenarioName) */
  columnPowerScenarios: Record<string, string>;
  revisionMode: RevisionMode;
  isRestoringColumns: boolean;
}

// Payload type for restoring state from URL
export interface RestoreFromURLPayload {
  selectedProject: string | null;
  selectedBlock: string | null;
  selectedNetver: string | null;
  selectedRevision: string | null;
  selectedEconum: string | null;
}

const initialState: SelectedState = {
  selectedProject: null,
  selectedBlock: null,
  selectedNetver: null,
  selectedRevision: null,
  selectedEconum: null,
  doeName: "",
  columnPowerScenarios: {},
  revisionMode: 'POST',
  isRestoringColumns: false,
};

const selectedSlice = createSlice({
  name: "selected",
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<string | null>) => {
      state.selectedProject = action.payload;
      state.selectedBlock = null;
      state.selectedNetver = null;
      state.selectedRevision = null;
      state.selectedEconum = null;
    },
    setSelectedBlock: (state, action: PayloadAction<string | null>) => {
      state.selectedBlock = action.payload;
      state.selectedNetver = null;
      state.selectedRevision = null;
      state.selectedEconum = null;
    },
    setSelectedNetver: (state, action: PayloadAction<string | null>) => {
      state.selectedNetver = action.payload;
      state.selectedRevision = null;
      state.selectedEconum = null;
    },
    setSelectedRevision: (state, action: PayloadAction<string | null>) => {
      state.selectedRevision = action.payload;
      state.selectedEconum = null;
    },
    setSelectedRevisionOnly: (state, action: PayloadAction<string | null>) => {
      state.selectedRevision = action.payload;
      // DO NOT clear selectedEconum - used for PRE mode revision changes
    },
    setSelectedEconum: (state, action: PayloadAction<string | null>) => {
      state.selectedEconum = action.payload;
    },
    setDoeName: (state, action: PayloadAction<string>) => {
      state.doeName = action.payload;
    },
    // Restore all selections from URL parameters at once
    // This does not reset dependent values since they are restored together
    restoreFromURL: (state, action: PayloadAction<RestoreFromURLPayload>) => {
      state.selectedProject = action.payload.selectedProject;
      state.selectedBlock = action.payload.selectedBlock;
      state.selectedNetver = action.payload.selectedNetver;
      state.selectedRevision = action.payload.selectedRevision;
      state.selectedEconum = action.payload.selectedEconum;
    },
    // Set Power Scenario for a specific column
    setColumnPowerScenario: (
      state,
      action: PayloadAction<{ columnId: string; scenario: string }>
    ) => {
      const { columnId, scenario } = action.payload;
      state.columnPowerScenarios[columnId] = scenario;
    },
    // Remove Power Scenario mapping when column is deleted
    clearColumnPowerScenario: (state, action: PayloadAction<string>) => {
      delete state.columnPowerScenarios[action.payload];
    },
    // Clear all Power Scenario mappings
    resetColumnPowerScenarios: (state) => {
      state.columnPowerScenarios = {};
    },
    setRevisionMode: (state, action: PayloadAction<RevisionMode>) => {
      state.revisionMode = action.payload;
    },
    setIsRestoringColumns: (state, action: PayloadAction<boolean>) => {
      state.isRestoringColumns = action.payload;
    },
  },
});

export const {
  setSelectedProject,
  setSelectedBlock,
  setSelectedNetver,
  setSelectedRevision,
  setSelectedRevisionOnly,
  setSelectedEconum,
  setDoeName,
  restoreFromURL,
  setColumnPowerScenario,
  clearColumnPowerScenario,
  resetColumnPowerScenarios,
  setRevisionMode,
  setIsRestoringColumns,
} = selectedSlice.actions;

export default selectedSlice.reducer;
