import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  createDoeSetup,
  deleteDoeSetup,
  listDoeSetups,
  type DoESetupResponse,
} from "@/api/doeSetups";

interface SaveSetupPayload {
  name: string;
  config: Record<string, unknown>;
}

interface SavedSetupsState {
  setups: DoESetupResponse[];
  status: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: SavedSetupsState = {
  setups: [],
  status: "idle",
  error: null,
};

export const fetchSavedSetups = createAsyncThunk(
  "savedSetups/fetch",
  async () => listDoeSetups(),
);

export const saveCurrentSetup = createAsyncThunk(
  "savedSetups/save",
  async ({ name, config }: SaveSetupPayload) => createDoeSetup(name, config),
);

export const removeSetup = createAsyncThunk(
  "savedSetups/remove",
  async (setupId: string) => {
    await deleteDoeSetup(setupId);
    return setupId;
  },
);

const savedSetupsSlice = createSlice({
  name: "savedSetups",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavedSetups.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSavedSetups.fulfilled, (state, action) => {
        state.status = "idle";
        state.setups = action.payload;
      })
      .addCase(fetchSavedSetups.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load setups";
      })
      .addCase(saveCurrentSetup.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(saveCurrentSetup.fulfilled, (state, action) => {
        state.status = "idle";
        state.setups.unshift(action.payload);
      })
      .addCase(saveCurrentSetup.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to save setup";
      })
      .addCase(removeSetup.pending, (state) => {
        state.error = null;
      })
      .addCase(removeSetup.fulfilled, (state, action) => {
        state.setups = state.setups.filter((setup) => setup.id !== action.payload);
      })
      .addCase(removeSetup.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to delete setup";
      });
  },
});

export default savedSetupsSlice.reducer;
