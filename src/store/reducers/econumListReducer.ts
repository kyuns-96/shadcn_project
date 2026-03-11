import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchEconumList as fetchEconumListAPI } from "@/api/fetchEconumList";

export interface EconumListState {
  items: string[];
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: EconumListState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchEconumList = createAsyncThunk<
  string[],
  {
    projectName: string | null | undefined;
    blockName: string | null | undefined;
    netverName: string | null | undefined;
    revisionName: string | null | undefined;
  },
  { rejectValue: string }
>(
  "econumList/fetch",
  async (
    { projectName, blockName, netverName, revisionName },
    { rejectWithValue }
  ) => {
    if (!projectName || !blockName || !netverName || !revisionName) {
      return [];
    }
    try {
      const data = await fetchEconumListAPI(
        projectName,
        blockName,
        netverName,
        revisionName
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return rejectWithValue(message);
    }
  }
);

const econumListSlice = createSlice({
  name: "econumList",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEconumList.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchEconumList.fulfilled, (state, action) => {
        state.status = "idle";
        state.items = action.payload;
      })
      .addCase(fetchEconumList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export default econumListSlice.reducer;
