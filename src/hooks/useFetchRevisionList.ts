/**
 * @file useFetchRevisionList.ts
 *
 * @purpose
 * 특정 필터 조건의 리비전 목록을 자동으로 fetch하는 커스텀 훅입니다.
 *
 * @structure
 * 1. useFetchRevisionList: 리비전 목록 fetch 훅
 *
 * @dependencies
 * - react-redux: useDispatch
 * - @/store: AppDispatch 타입
 * - @/store/reducers/revisionListReducer: fetchRevisionList 액션
 */

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { fetchRevisionList } from "@/store/reducers/revisionListReducer";

export default function useFetchRevisionList(
  projectName: string | null | undefined,
  blockName: string | null | undefined,
  netverName: string | null | undefined
) {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (projectName && blockName && netverName) {
      dispatch(fetchRevisionList({ projectName, blockName, netverName }));
    }
  }, [projectName, blockName, netverName, dispatch]);
}
