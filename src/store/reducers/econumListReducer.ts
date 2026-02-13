import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchEconumList as fetchEconumListAPI } from "@/api/fetchEconumList";

type EconumList = string[];

export const fetchEconumList = createAsyncThunk<
  EconumList,
  {
    projectName: string | null | undefined;
    blockName: string | null | undefined;
    netverName: string | null | undefined;
    revisionName: string | null | undefined;
  },
  { rejectValue: string }
>(
  "econumList/fetch",
  async (
    { projectName, blockName, netverName, revisionName },
    { rejectWithValue }
  ) => {
    if (!projectName || !blockName || !netverName || !revisionName) {
      return [];
    }
    try {
      const data = await fetchEconumListAPI(
        projectName,
        blockName,
        netverName,
        revisionName
      );
      return Array.isArray(data) ? data : [];
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return rejectWithValue(message);
    }
  }
);

const econumListReducer = (
  state: EconumList = [],
  action: { type: string; payload?: EconumList }
) => {
  switch (action.type) {
    case "econumList/set":
    case "econumList/fetch/fulfilled":
      return action.payload || state;
    default:
      return state;
  }
};

export default econumListReducer;
