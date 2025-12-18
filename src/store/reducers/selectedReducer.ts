import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface SelectedState {
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
    setSelectedEconum: (state, action: PayloadAction<string | null>) => {
      state.selectedEconum = action.payload;
    },
  },
});

export const {
  setSelectedProject,
  setSelectedBlock,
  setSelectedNetver,
  setSelectedRevision,
  setSelectedEconum,
} = selectedSlice.actions;

export default selectedSlice.reducer;
