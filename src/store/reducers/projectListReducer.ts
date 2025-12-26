import { createAsyncThunk } from "@reduxjs/toolkit";
import { getProject } from "@/api/getProject";

type ProjectList = string[];

interface ProjectListAction {
  type: string;
  payload?: ProjectList;
}

export const fetchProjectList = createAsyncThunk<
  ProjectList,
  void,
  { rejectValue: string }
>("projectList/fetch", async (_, { rejectWithValue }) => {
  try {
    const data = await getProject();
    return data.project_list;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return rejectWithValue(message);
  }
});

const projectListReducer = (
  state: ProjectList = [],
  action: ProjectListAction
): ProjectList => {
  switch (action.type) {
    case "projectList/set":
    case "projectList/fetch/fulfilled":
      return action.payload || state;
    default:
      return state;
  }
};

export default projectListReducer;
