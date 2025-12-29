/**
 * @file useFetchBlockList.ts
 *
 * @purpose
 * 특정 프로젝트의 블록 목록을 자동으로 fetch하는 커스텀 훅입니다.
 * 프로젝트 선택 시 자동으로 API를 호출합니다.
 *
 * @structure
 * 1. useFetchBlockList: 블록 목록 fetch 훅
 *
 * @dependencies
 * - react-redux: useDispatch
 * - @/store: AppDispatch 타입
 * - @/store/reducers/blockListReducer: fetchBlockList 액션
 */

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { fetchBlockList } from "@/store/reducers/blockListReducer";

export default function useFetchBlockList(
  projectName: string | null | undefined
) {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (projectName) {
      dispatch(fetchBlockList(projectName));
    }
  }, [projectName, dispatch]);
}
