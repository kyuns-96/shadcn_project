import { createAsyncThunk } from "@reduxjs/toolkit";
import { getDataset, type DatasetParams } from "@/api/getDataset";

type Dataset = Record<string, any>;

export const fetchDataset = createAsyncThunk<
  Dataset,
  DatasetParams | void,
  { rejectValue: string; state: any }
>("dataset/fetch", async (params, { rejectWithValue, getState }) => {
  try {
    let datasetParams: DatasetParams;

    if (params) {
      datasetParams = params;
    } else {
      // If no params provided, get from state
      const state = getState();
      const selected = state.selected;
      datasetParams = {
        PROJECT_NAME: selected.selectedProject || "",
        BLOCK: selected.selectedBlock || "",
        NET_VER: selected.selectedNetver || "",
        REVISION: selected.selectedRevision || "",
        ECO_NUM: selected.selectedEconum || "",
      };
    }

    // Validate that all required params are present
    if (
      !datasetParams.PROJECT_NAME ||
      !datasetParams.BLOCK ||
      !datasetParams.NET_VER ||
      !datasetParams.REVISION ||
      !datasetParams.ECO_NUM
    ) {
      return {};
    }

    const data = await getDataset(datasetParams);
    return data || {};
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const datasetReducer = (
  state: Dataset = {},
  action: { type: string; payload?: Dataset }
) => {
  switch (action.type) {
    case "dataset/set":
    case "dataset/fetch/fulfilled":
      return action.payload || state;
    default:
      return state;
  }
};

export default datasetReducer;
