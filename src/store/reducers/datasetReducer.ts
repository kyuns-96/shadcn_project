import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchDataset as fetchDatasetAPI } from "@/api/fetchDataset";
import type { RootState } from "@/store";
import { fetchFunctionList } from "@/api/fetchFunctionList";

export type DatasetRecord = Record<string, unknown>;

export interface DatasetState {
  data: Record<string, DatasetRecord>;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
}

export interface FetchDatasetParams {
  project: string;
  block: string;
  netver: string;
  revision: string;
  econum?: string;
  doeName: string;
  revisionMode: 'PRE' | 'POST';
  currentPage: string;
}

export const fetchDataset = createAsyncThunk<
  Record<string, DatasetRecord>,
  FetchDatasetParams,
  { state: RootState; rejectValue: string }
>("dataset/fetch", async (params, { rejectWithValue }) => {
  try {
    const {
      project,
      block,
      netver,
      revision,
      econum,
      doeName,
      revisionMode,
      currentPage,
    } = params;

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

    const result: DatasetRecord = {};
    
    const fetchPromises = funcList.map(async (fn) => {
      const adjustedEndpoint = getAdjustedEndpoint(fn, revisionMode, currentPage);

      if (adjustedEndpoint === null) {
        return { endpoint: fn, data: null };
      }

      const actualEndpoint = adjustedEndpoint ?? fn;

      const shouldOmitEconum = currentPage === 'qor-compare' &&
                               revisionMode === 'PRE' &&
                               actualEndpoint.includes('syncellusage');

      const data = await fetchDatasetAPI(
        project || "ASDF",
        block || "GGGGG",
        netver || "ZXCV",
        revision || "LLLL",
        shouldOmitEconum ? undefined : (econum || "KKKKK"),
        actualEndpoint
      );

      const strippedFn = actualEndpoint.replace(/\/api\//, "");
      return { endpoint: strippedFn, data };
    });

    const settledResults = await Promise.allSettled(fetchPromises);
    
    for (const settled of settledResults) {
      if (settled.status === 'fulfilled' && settled.value.data !== null) {
        result[settled.value.endpoint] = settled.value.data;
      }
    }
    
    const key = doeName;
    return { [key]: result };
  } catch {
    return rejectWithValue("Failed to fetch dataset");
  }
});

const datasetReducer = createSlice({
  name: "dataset",
  initialState: { data: {}, loading: {}, error: {} } as DatasetState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDataset.pending, (state, action) => {
        const doeName = action.meta.arg.doeName;
        state.loading[doeName] = true;
        state.error[doeName] = null;
      })
      .addCase(fetchDataset.fulfilled, (state, action) => {
        const doeName = action.meta.arg.doeName;
        state.loading[doeName] = false;
        // Merge with existing data instead of replacing
        Object.assign(state.data, action.payload);
      })
      .addCase(fetchDataset.rejected, (state, action) => {
        const doeName = action.meta.arg.doeName;
        state.loading[doeName] = false;
        state.error[doeName] = action.payload ?? 'Unknown error';
      });
  },
});

export const selectDatasetLoading = (doeName: string) => (state: RootState) =>
  state.dataset.loading[doeName] ?? false;

export const selectDatasetError = (doeName: string) => (state: RootState) =>
  state.dataset.error[doeName] ?? null;

export const selectAnyDatasetLoading = (state: RootState) =>
  Object.values(state.dataset.loading).some(Boolean);

export default datasetReducer.reducer;
