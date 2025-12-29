import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type PageType = "fc-check-tool" | "qor-compare" | "timing" | "power";

interface PageState {
  currentPage: PageType;
}

const initialState: PageState = {
  currentPage: "qor-compare",
};

const pageSlice = createSlice({
  name: "page",
  initialState,
  reducers: {
    setCurrentPage: (state, action: PayloadAction<PageType>) => {
      state.currentPage = action.payload;
    },
  },
});

export const { setCurrentPage } = pageSlice.actions;
export default pageSlice.reducer;
