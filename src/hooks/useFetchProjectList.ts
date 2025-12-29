/**
 * @file useFetchProjectList.ts
 *
 * @purpose
 * 프로젝트 목록을 자동으로 fetch하는 커스텀 훅입니다.
 * 컴포넌트 마운트 시 자동으로 API를 호출합니다.
 *
 * @structure
 * 1. useFetchProjectList: 프로젝트 목록 fetch 훅
 *
 * @dependencies
 * - react-redux: useDispatch
 * - @/store: AppDispatch 타입
 * - @/store/reducers/projectListReducer: fetchProjectList 액션
 */

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { fetchProjectList } from "@/store/reducers/projectListReducer";

export function useFetchProjectList() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(fetchProjectList());
  }, [dispatch]);
}
