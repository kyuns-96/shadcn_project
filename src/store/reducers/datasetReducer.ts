import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getDataset } from "@/api/getDataset";
import type { RootState } from "@/store";
import { getFunction } from "@/api/getFunction";

type Dataset = Record<string, any>;

export const fetchDataset = createAsyncThunk<
  Record<string, any>,
  void,
  { state: RootState; rejectValue: string }
>("dataset/fetch", async (_, { rejectWithValue, getState }) => {
  try {
    // Extract selection parameters from the redux store
    const { selected } = getState() as RootState;
    const {
      selectedProject = "",
      selectedBlock = "",
      selectedNetver = "",
      selectedRevision = "",
      selectedEconum = "",
      doeName = "",
    } = selected ?? {};

    // Retrieve function list
    const funcListRaw = await getFunction();
    const excludedKeys = ["Info", "Version Info"];
    const funcList = Object.entries(
      funcListRaw as Record<string, { method: string; path: string }[]>
    )
      .filter(([key]) => key !== "Info" && key !== "Version Info")
      .flatMap(([, arr]) =>
        arr.filter((item) => item.method === "GET").map((item) => item.path)
      );

    const result: Record<string, any> = {};
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
    const key = doeName;
    return { [key]: result };
  } catch (error) {
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
