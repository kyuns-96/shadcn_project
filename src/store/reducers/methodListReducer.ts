import { createAsyncThunk } from "@reduxjs/toolkit";
import { getMethodList } from "@/api/getMethodList";

type MethodList = string[];

interface MethodListAction {
  type: string;
  payload?: MethodList;
}

export const fetchMethodList = createAsyncThunk<
  MethodList,
  void,
  { rejectValue: string }
>("methodList/fetch", async (_, { rejectWithValue }) => {
  try {
    const data = await getMethodList();
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return rejectWithValue(message);
  }
});

const methodListReducer = (
  state: MethodList = [],
  action: MethodListAction
): MethodList => {
  switch (action.type) {
    case "methodList/set":
    case "methodList/fetch/fulfilled":
      return action.payload || state;
    default:
      return state;
  }
};

export default methodListReducer;
