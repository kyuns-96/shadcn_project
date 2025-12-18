import { createAsyncThunk } from "@reduxjs/toolkit";
import { getBlock } from "@/api/getBlock";

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
    const data = await getBlock(projectName);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    return rejectWithValue(error.message);
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
