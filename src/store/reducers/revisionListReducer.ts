import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchRevisionList as fetchRevisionListAPI } from "@/api/fetchRevisionList";

export interface RevisionListState {
  items: string[];
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: RevisionListState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchRevisionList = createAsyncThunk<
  string[],
  {
    projectName: string | null | undefined;
    blockName: string | null | undefined;
    netverName: string | null | undefined;
  },
  { rejectValue: string }
>(
  "revisionList/fetch",
  async ({ projectName, blockName, netverName }, { rejectWithValue }) => {
    if (!projectName || !blockName || !netverName) {
      return [];
    }
    try {
      const data = await fetchRevisionListAPI(projectName, blockName, netverName);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return rejectWithValue(message);
    }
  }
);

const revisionListSlice = createSlice({
  name: "revisionList",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRevisionList.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRevisionList.fulfilled, (state, action) => {
        state.status = "idle";
        state.items = action.payload;
      })
      .addCase(fetchRevisionList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export default revisionListSlice.reducer;
