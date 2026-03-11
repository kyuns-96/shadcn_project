import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchMethodList as fetchMethodListAPI } from "@/api/fetchMethodList";

export interface MethodListState {
  items: string[];
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: MethodListState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchMethodList = createAsyncThunk<
  string[],
  void,
  { rejectValue: string }
>("methodList/fetch", async (_, { rejectWithValue }) => {
  try {
    const data = await fetchMethodListAPI();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return rejectWithValue(message);
  }
});

const methodListSlice = createSlice({
  name: "methodList",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMethodList.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMethodList.fulfilled, (state, action) => {
        state.status = "idle";
        state.items = action.payload;
      })
      .addCase(fetchMethodList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export default methodListSlice.reducer;
