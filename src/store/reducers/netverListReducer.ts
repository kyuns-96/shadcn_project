import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchNetverList as fetchNetverListAPI } from "@/api/fetchNetverList";

export interface NetverListState {
  items: string[];
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: NetverListState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchNetverList = createAsyncThunk<
  string[],
  { projectName: string | null | undefined; blockName: string | null | undefined },
  { rejectValue: string }
>("netverList/fetch", async ({ projectName, blockName }, { rejectWithValue }) => {
  if (!projectName || !blockName) {
    return [];
  }
  try {
    const data = await fetchNetverListAPI(projectName, blockName);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return rejectWithValue(message);
  }
});

const netverListSlice = createSlice({
  name: "netverList",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNetverList.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNetverList.fulfilled, (state, action) => {
        state.status = "idle";
        state.items = action.payload;
      })
      .addCase(fetchNetverList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export default netverListSlice.reducer;
