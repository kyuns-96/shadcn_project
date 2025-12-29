/**
 * @file useFetchNetverList.ts
 *
 * @purpose
 * 특정 프로젝트/블록의 넷버전 목록을 자동으로 fetch하는 커스텀 훅입니다.
 *
 * @structure
 * 1. useFetchNetverList: 넷버전 목록 fetch 훅
 *
 * @dependencies
 * - react-redux: useDispatch
 * - @/store: AppDispatch 타입
 * - @/store/reducers/netverListReducer: fetchNetverList 액션
 */

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { fetchNetverList } from "@/store/reducers/netverListReducer";

export default function useFetchNetverList(
  projectName: string | null | undefined,
  blockName: string | null | undefined
) {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (projectName && blockName) {
      dispatch(fetchNetverList({ projectName, blockName }));
    }
  }, [projectName, blockName, dispatch]);
}
