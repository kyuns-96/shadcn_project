import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { fetchProjectList as fetchProjectListAPI } from "@/api/fetchProjectList";

export interface ProjectListState {
  items: string[];
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: ProjectListState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchProjectList = createAsyncThunk<
  string[],
  void,
  { rejectValue: string }
>("projectList/fetch", async (_, { rejectWithValue }) => {
  try {
    const data = await fetchProjectListAPI();
    return data.project_list;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return rejectWithValue(message);
  }
});

const projectListSlice = createSlice({
  name: "projectList",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectList.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProjectList.fulfilled, (state, action) => {
        state.status = "idle";
        state.items = action.payload;
      })
      .addCase(fetchProjectList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export default projectListSlice.reducer;
