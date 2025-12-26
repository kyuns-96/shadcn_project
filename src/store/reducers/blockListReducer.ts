import { createAsyncThunk } from "@reduxjs/toolkit";
import { getBlock } from "@/api/getBlock";

type BlockList = string[];

interface BlockListAction {
  type: string;
  payload?: BlockList;
}

export const fetchBlockList = createAsyncThunk<
  BlockList,
  string | null | undefined,
  { rejectValue: string }
>("blockList/fetch", async (projectName, { rejectWithValue }) => {
  if (!projectName) {
    return [];
  }
  try {
    const data = await getBlock(projectName);
    return Array.isArray(data) ? data : [];
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return rejectWithValue(message);
  }
});

const blockListReducer = (
  state: BlockList = [],
  action: BlockListAction
): BlockList => {
  switch (action.type) {
    case "blockList/set":
    case "blockList/fetch/fulfilled":
      return action.payload || state;
    default:
      return state;
  }
};

export default blockListReducer;
