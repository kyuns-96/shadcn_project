import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchBlockList as fetchBlockListAPI } from "@/api/fetchBlockList";

export interface BlockListState {
  items: string[];
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: BlockListState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchBlockList = createAsyncThunk<
  string[],
  string | null | undefined,
  { rejectValue: string }
>("blockList/fetch", async (projectName, { rejectWithValue }) => {
  if (!projectName) {
    return [];
  }
  try {
    const data = await fetchBlockListAPI(projectName);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return rejectWithValue(message);
  }
});

const blockListSlice = createSlice({
  name: "blockList",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlockList.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBlockList.fulfilled, (state, action) => {
        state.status = "idle";
        state.items = action.payload;
      })
      .addCase(fetchBlockList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export default blockListSlice.reducer;
