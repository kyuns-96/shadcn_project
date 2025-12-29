/**
 * @file useFetchEconumList.ts
 *
 * @purpose
 * 특정 필터 조건의 ECO 번호 목록을 자동으로 fetch하는 커스텀 훅입니다.
 *
 * @structure
 * 1. useFetchEconumList: ECO 번호 목록 fetch 훅
 *
 * @dependencies
 * - react-redux: useDispatch
 * - @/store: AppDispatch 타입
 * - @/store/reducers/econumListReducer: fetchEconumList 액션
 */

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { fetchEconumList } from "@/store/reducers/econumListReducer";

export default function useFetchEconumList(
  projectName: string | null | undefined,
  blockName: string | null | undefined,
  netverName: string | null | undefined,
  revisionName: string | null | undefined
) {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (projectName && blockName && netverName && revisionName) {
      dispatch(
        fetchEconumList({ projectName, blockName, netverName, revisionName })
      );
    }
  }, [projectName, blockName, netverName, revisionName, dispatch]);
}
