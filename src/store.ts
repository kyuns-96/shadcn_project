/**
 * @file store.ts
 *
 * @purpose
 * 애플리케이션의 중앙 Redux 스토어를 설정하고 내보냅니다.
 * 모든 상태 관리와 타입들이 여기서 중앙 집중화됩니다.
 *
 * @structure
 * 1. rootReducer: 모든 리듀서를 결합
 * 2. store: 설정된 Redux store
 * 3. 타입 및 훅: AppDispatch, RootState, useAppDispatch, useAppSelector
 *
 * @dependencies
 * - @reduxjs/toolkit: Redux 툴킷
 * - react-redux: React Redux 훅
 * - 각 리듀서 파일들
 */

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";

// Slice 및 Reducer imports
import matrixSlice from "@/store/matrixSlice";
import projectListReducer from "@/store/reducers/projectListReducer";
import blockListReducer from "@/store/reducers/blockListReducer";
import netverListReducer from "@/store/reducers/netverListReducer";
import revisionListReducer from "@/store/reducers/revisionListReducer";
import econumListReducer from "@/store/reducers/econumListReducer";
import selectedReducer from "@/store/reducers/selectedReducer";
import methodListReducer from "@/store/reducers/methodListReducer";
import datasetReducer from "@/store/reducers/datasetReducer";
import pageReducer from "@/store/reducers/pageReducer";
import fcCheckToolReducer from "@/store/reducers/fcCheckToolReducer";

// Type 및 Action exports
export type { SelectedState } from "@/store/reducers/selectedReducer";
export type { PageType } from "@/store/reducers/pageReducer";
export { setCurrentPage } from "@/store/reducers/pageReducer";

/** 모든 리듀서를 결합한 루트 리듀서 */
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
  page: pageReducer,
  fcCheckTool: fcCheckToolReducer,
});

/** 설정된 Redux store */
export const store = configureStore({
  reducer: rootReducer,
});

/** Store dispatch 타입 */
export type AppDispatch = typeof store.dispatch;

/** Store 상태 타입 */
export type RootState = ReturnType<typeof store.getState>;

/** 타입된 dispatch 훅 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** 타입된 selector 훅 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
