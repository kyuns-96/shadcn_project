import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getDataset } from "@/api/getDataset";
import type { RootState } from "@/store";
import { getFunction } from "@/api/getFunction";

type Dataset = Record<string, Record<string, unknown>>;

interface FunctionListItem {
  method: string;
  path: string;
}

type FunctionListResponse = Record<string, FunctionListItem[]>;

export const fetchDataset = createAsyncThunk<
  Record<string, Record<string, unknown>>,
  void,
  { state: RootState; rejectValue: string }
>("dataset/fetch", async (_, { rejectWithValue, getState }) => {
  try {
    const { selected } = getState();
    const {
      selectedProject = "",
      selectedBlock = "",
      selectedNetver = "",
      selectedRevision = "",
      selectedEconum = "",
      doeName = "",
    } = selected ?? {};

    const funcListRaw = await getFunction();
    const funcList = Object.entries(funcListRaw as FunctionListResponse)
      .filter(([key]) => key !== "Info" && key !== "Version Info")
      .flatMap(([, arr]) =>
        arr.filter((item) => item.method === "GET").map((item) => item.path)
      );

    const result: Record<string, unknown> = {};
    for (const fn of funcList) {
      const data = await getDataset(
        selectedProject || "ASDF",
        selectedBlock || "GGGGG",
        selectedNetver || "ZXCV",
        selectedRevision || "LLLL",
        selectedEconum || "KKKKK",
        fn
      );
      const strippedFn = fn.replace(/\/api\//, "");
      result[strippedFn] = data;
    }
    return { [doeName]: result };
  } catch {
    return rejectWithValue("Failed to fetch dataset");
  }
});

const datasetReducer = createSlice({
  name: "dataset",
  initialState: {} as Dataset,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchDataset.fulfilled, (_, action) => action.payload);
  },
});

export default datasetReducer.reducer;
