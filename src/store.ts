import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import matrixSlice from "@/store/matrixSlice";
import projectListReducer from "@/store/reducers/projectListReducer";
import blockListReducer from "@/store/reducers/blockListReducer";
import netverListReducer from "@/store/reducers/netverListReducer";
import revisionListReducer from "@/store/reducers/revisionListReducer";
import econumListReducer from "@/store/reducers/econumListReducer";
import selectedReducer from "@/store/reducers/selectedReducer";
import methodListReducer from "@/store/reducers/methodListReducer";
import datasetReducer from "@/store/reducers/datasetReducer";
export type { SelectedState } from "@/store/reducers/selectedReducer";

const rootReducer = combineReducers({
  matrix: matrixSlice,
  projectList: projectListReducer,
  blockList: blockListReducer,
  netverList: netverListReducer,
  revisionList: revisionListReducer,
  econumList: econumListReducer,
  selected: selectedReducer,
  methodList: methodListReducer,
  dataset: datasetReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type AppDispatch = typeof store.dispatch;

export type RootState = ReturnType<typeof store.getState>;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
