import { createAsyncThunk } from "@reduxjs/toolkit";
import { getRevision } from "@/api/getRevision";

type RevisionList = string[];

interface RevisionListAction {
  type: string;
  payload?: RevisionList;
}

export const fetchRevisionList = createAsyncThunk<
  RevisionList,
  {
    projectName: string | null | undefined;
    blockName: string | null | undefined;
    netverName: string | null | undefined;
  },
  { rejectValue: string }
>(
  "revisionList/fetch",
  async ({ projectName, blockName, netverName }, { rejectWithValue }) => {
    if (!projectName || !blockName || !netverName) {
      return [];
    }
    try {
      const data = await getRevision(projectName, blockName, netverName);
      return Array.isArray(data) ? data : [];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return rejectWithValue(message);
    }
  }
);

const revisionListReducer = (
  state: RevisionList = [],
  action: RevisionListAction
): RevisionList => {
  switch (action.type) {
    case "revisionList/set":
    case "revisionList/fetch/fulfilled":
      return action.payload || state;
    default:
      return state;
  }
};

export default revisionListReducer;
