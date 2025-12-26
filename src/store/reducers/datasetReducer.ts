import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getDataset, type DatasetParams } from "@/api/getDataset";
import type { Root } from "react-dom/client";
import type { RootState } from "@/store";
import { getFunction } from "@/api/getFunction";

type Dataset = Record<string, any>;

export const fetchDataset = createAsyncThunk<
  Dataset,
  DatasetParams | void,
  { rejectValue: string; state: any }
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
    const funcList = Object.entries(
      funcListRaw as Record<string, { method: string; path: string }[]>
    )
      .filter(([key]) => key !== "Info" && key !== "Version Info")
      .flatMap(([_, arr]) =>
        arr.filter((item) => item.method === "GET").map((item) => item.path)
      );

    const result: Record<string, any> = {};
    for (const fn of funcList) {
      const data = await getDataset({
        project: selectedProject,
        block: selectedBlock,
        netver: selectedNetver,
        revision: selectedRevision,
        econum: selectedEconum,
        func: fn,
      });
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
