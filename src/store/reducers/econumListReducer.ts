import { createAsyncThunk } from "@reduxjs/toolkit";
import { getEconum } from "@/api/getEconum";

type EconumList = string[];

interface EconumListAction {
  type: string;
  payload?: EconumList;
}

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
      const data = await getEconum(
        projectName,
        blockName,
        netverName,
        revisionName
      );
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return rejectWithValue(message);
    }
  }
);

const econumListReducer = (
  state: EconumList = [],
  action: EconumListAction
): EconumList => {
  switch (action.type) {
    case "econumList/set":
    case "econumList/fetch/fulfilled":
      return action.payload || state;
    default:
      return state;
  }
};

export default econumListReducer;
