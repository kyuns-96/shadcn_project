import { createAsyncThunk } from "@reduxjs/toolkit";
import { getMethodList } from "@/api/getMethodList";

type MethodList = string[];

export const fetchMethodList = createAsyncThunk<
  MethodList,
  void,
  { rejectValue: string }
>("methodList/fetch", async (_, { rejectWithValue }) => {
  try {
    const data = await getMethodList();
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    return rejectWithValue(error.message);
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
