import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchMethodList as fetchMethodListAPI } from "@/api/fetchMethodList";

type MethodList = string[];

export const fetchMethodList = createAsyncThunk<
  MethodList,
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

const methodListReducer = (
  state: MethodList = [],
  action: { type: string; payload?: MethodList }
) => {
  switch (action.type) {
    case "methodList/set":
    case "methodList/fetch/fulfilled":
      return action.payload || state;
    default:
      return state;
  }
};

export default methodListReducer;
