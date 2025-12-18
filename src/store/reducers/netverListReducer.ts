import { createAsyncThunk } from "@reduxjs/toolkit";
import { getNetver } from "@/api/getNetver";

type NetverList = string[];

export const fetchNetverList = createAsyncThunk<
  NetverList,
  { projectName: string | null | undefined; blockName: string | null | undefined },
  { rejectValue: string }
>("netverList/fetch", async ({ projectName, blockName }, { rejectWithValue }) => {
  if (!projectName || !blockName) {
    return [];
  }
  try {
    const data = await getNetver(projectName, blockName);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const netverListReducer = (
  state: NetverList = [],
  action: { type: string; payload?: NetverList }
) => {
  switch (action.type) {
    case "netverList/set":
    case "netverList/fetch/fulfilled":
      return action.payload || state;
    default:
      return state;
  }
};

export default netverListReducer;
