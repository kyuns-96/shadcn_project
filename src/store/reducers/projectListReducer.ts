import { createAsyncThunk } from "@reduxjs/toolkit";
import { getProject } from "@/api/getProject";

type ProjectList = unknown[];

export const fetchProjectList = createAsyncThunk<
  ProjectList,
  void,
  { rejectValue: string }
>("projectList/fetch", async (_, { rejectWithValue }) => {
  try {
    const data = (await getProject()) as { project_list: ProjectList };
    return data.project_list;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const projectListReducer = (
  state: ProjectList = [],
  action: { type: string; payload?: ProjectList }
) => {
  switch (action.type) {
    case "projectList/set":
    case "projectList/fetch/fulfilled":
      return action.payload || state;
    default:
      return state;
  }
};

export default projectListReducer;
