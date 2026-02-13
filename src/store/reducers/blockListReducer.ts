import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchBlockList as fetchBlockListAPI } from "@/api/fetchBlockList";

type BlockList = string[];

export const fetchBlockList = createAsyncThunk<
  BlockList,
  string | null | undefined,
  { rejectValue: string }
>("blockList/fetch", async (projectName, { rejectWithValue }) => {
  if (!projectName) {
    return [];
  }
  try {
    const data = await fetchBlockListAPI(projectName);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return rejectWithValue(message);
  }
});

const blockListReducer = (
  state: BlockList = [],
  action: { type: string; payload?: BlockList }
) => {
  switch (action.type) {
    case "blockList/set":
    case "blockList/fetch/fulfilled":
      return action.payload || state;
    default:
      return state;
  }
};

export default blockListReducer;
