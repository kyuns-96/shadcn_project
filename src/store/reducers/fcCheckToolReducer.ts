import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface FCCheckToolState {
  selectedProject: string;
  selectedBlock: string;
  selectedNetver: string;
  selectedRevision: string;
  htmlContent: string;
  error: string | null;
}

const initialState: FCCheckToolState = {
  selectedProject: "",
  selectedBlock: "",
  selectedNetver: "",
  selectedRevision: "",
  htmlContent: "",
  error: null,
};

const fcCheckToolSlice = createSlice({
  name: "fcCheckTool",
  initialState,
  reducers: {
    setFCSelectedProject: (state, action: PayloadAction<string>) => {
      state.selectedProject = action.payload;
      state.selectedBlock = "";
      state.selectedNetver = "";
      state.selectedRevision = "";
    },
    setFCSelectedBlock: (state, action: PayloadAction<string>) => {
      state.selectedBlock = action.payload;
      state.selectedNetver = "";
      state.selectedRevision = "";
    },
    setFCSelectedNetver: (state, action: PayloadAction<string>) => {
      state.selectedNetver = action.payload;
      state.selectedRevision = "";
    },
    setFCSelectedRevision: (state, action: PayloadAction<string>) => {
      state.selectedRevision = action.payload;
    },
    setFCHtmlContent: (state, action: PayloadAction<string>) => {
      state.htmlContent = action.payload;
    },
    setFCError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearFCCheckToolState: () => initialState,
  },
});

export const {
  setFCSelectedProject,
  setFCSelectedBlock,
  setFCSelectedNetver,
  setFCSelectedRevision,
  setFCHtmlContent,
  setFCError,
  clearFCCheckToolState,
} = fcCheckToolSlice.actions;

export default fcCheckToolSlice.reducer;
