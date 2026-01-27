import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchDataset as fetchDatasetAPI } from "@/api/fetchDataset";
import type { RootState } from "@/store";
import { fetchFunctionList } from "@/api/fetchFunctionList";

type Dataset = Record<string, any>;

export const fetchDataset = createAsyncThunk<
  Record<string, any>,
  void,
  { state: RootState; rejectValue: string }
>("dataset/fetch", async (_, { rejectWithValue, getState }) => {
  try {
    const { selected, page } = getState() as RootState;
    const {
      selectedProject = "",
      selectedBlock = "",
      selectedNetver = "",
      selectedRevision = "",
      selectedEconum = "",
      doeName = "",
      revisionMode,
    } = selected ?? {};
    const currentPage = page.currentPage;

    const funcListRaw = await fetchFunctionList();
    const funcList = Object.entries(
      funcListRaw as Record<string, { method: string; path: string }[]>
    )
      .filter(([key]) => key !== "Info" && key !== "Version Info")
      .flatMap(([, arr]) =>
        arr.filter((item) => item.method !== "GET").map((item) => item.path)
      );

    const getAdjustedEndpoint = (
      endpoint: string,
      mode: 'PRE' | 'POST',
      page: string
    ): string | null | undefined => {
      if (page !== 'qor-compare') {
        return undefined;
      }

      if (mode === 'PRE' && endpoint === '/api/get_layoutcellusage') {
        return '/api/get_syncellusage';
      }

      if (mode === 'PRE' && endpoint === '/api/get_syncellusage') {
        return null;
      }

      if (mode === 'POST' && endpoint === '/api/get_syncellusage') {
        return null;
      }

      return undefined;
    };

    const result: Record<string, any> = {};
    for (const fn of funcList) {
      const adjustedEndpoint = getAdjustedEndpoint(fn, revisionMode, currentPage);

      if (adjustedEndpoint === null) {
        continue;
      }

      const actualEndpoint = adjustedEndpoint ?? fn;

      const shouldOmitEconum = currentPage === 'qor-compare' &&
                               revisionMode === 'PRE' &&
                               actualEndpoint.includes('syncellusage');

      const data = await fetchDatasetAPI(
        selectedProject || "ASDF",
        selectedBlock || "GGGGG",
        selectedNetver || "ZXCV",
        selectedRevision || "LLLL",
        shouldOmitEconum ? undefined : (selectedEconum || "KKKKK"),
        actualEndpoint
      );

      const strippedFn = actualEndpoint.replace(/\/api\//, "");
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
    builder.addCase(fetchDataset.fulfilled, (state, action) => {
      // Merge with existing data instead of replacing
      return { ...state, ...action.payload };
    });
  },
});

export default datasetReducer.reducer;
