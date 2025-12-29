/**
 * @file useFilterDropdownConfigs.ts
 *
 * @purpose
 * QOR Compare 페이지에서 사용되는 필터 드롭다운 구성을 제공하는 커스텀 훅입니다.
 * 프로젝트, 블록, 넷버전, 리비전, ECO 번호 선택을 위한
 * 계층적 드롭다운 데이터를 관리합니다.
 *
 * @structure
 * 1. Redux에서 현재 선택 상태 및 목록 데이터 조회
 * 2. 각 드롭다운의 데이터 fetch 훅 호출
 * 3. DropdownConfig 배열 생성 및 반환
 *
 * @dependencies
 * - react-redux: Redux 상태 접근
 * - @/store/reducers/selectedReducer: 선택 상태 관리
 * - @/hooks/useFetch*List: 각 드롭다운 데이터 fetch
 */

import { useMemo } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import type { RootState } from "@/store";

import { useFetchProjectList } from "@/hooks/useFetchProjectList";
import useFetchBlockList from "@/hooks/useFetchBlockList";
import useFetchNetverList from "@/hooks/useFetchNetverList";
import useFetchRevisionList from "@/hooks/useFetchRevisionList";
import useFetchEconumList from "@/hooks/useFetchEconumList";

import type { DropdownConfig } from "@/components/shadcn-studio/combobox/FilterDropdownCombobox";
import {
  setSelectedProject,
  setSelectedBlock,
  setSelectedNetver,
  setSelectedRevision,
  setSelectedEconum,
} from "@/store/reducers/selectedReducer";

/**
 * 필터 드롭다운 구성을 생성하고 반환하는 커스텀 훅
 *
 * @returns 필터 드롭다운 구성 배열
 */
export default function useFilterDropdownConfigs(): DropdownConfig[] {
  const dispatch = useDispatch();

  // Redux에서 현재 선택된 값들 조회
  const {
    selectedProject,
    selectedBlock,
    selectedNetver,
    selectedRevision,
    selectedEconum,
  } = useSelector(
    (state: RootState) => ({
      selectedProject: state.selected.selectedProject ?? "",
      selectedBlock: state.selected.selectedBlock ?? "",
      selectedNetver: state.selected.selectedNetver ?? "",
      selectedRevision: state.selected.selectedRevision ?? "",
      selectedEconum: state.selected.selectedEconum ?? "",
    }),
    shallowEqual
  );

  // 각 필터 변경 핸들러
  const handleProjectChange = (value: string) => {
    dispatch(setSelectedProject(value));
  };

  const handleBlockChange = (value: string) => {
    dispatch(setSelectedBlock(value));
  };

  const handleNetverChange = (value: string) => {
    dispatch(setSelectedNetver(value));
  };

  const handleRevisionChange = (value: string) => {
    dispatch(setSelectedRevision(value));
  };

  const handleEconumChange = (value: string) => {
    dispatch(setSelectedEconum(value));
  };

  const { projectList, blockList, netverList, revisionList, econumList } =
    useSelector(
      (state: RootState) => ({
        projectList: state.projectList,
        blockList: state.blockList,
        netverList: state.netverList,
        revisionList: state.revisionList,
        econumList: state.econumList,
      }),
      shallowEqual
    );

  // Fetch data based on selections
  useFetchProjectList();
  useFetchBlockList(selectedProject);
  useFetchNetverList(selectedProject, selectedBlock);
  useFetchRevisionList(selectedProject, selectedBlock, selectedNetver);
  useFetchEconumList(
    selectedProject,
    selectedBlock,
    selectedNetver,
    selectedRevision
  );

  // 드롭다운 설정 배열 생성
  const filterDropdownConfigs = useMemo<DropdownConfig[]>(
    () => [
      {
        value: selectedProject,
        placeholder: "PROJECT_NAME",
        data: (Array.isArray(projectList) ? projectList : []) as string[],
        set: handleProjectChange,
      },
      {
        value: selectedBlock,
        placeholder: "BLOCK",
        data: (Array.isArray(blockList) ? blockList : []) as string[],
        set: handleBlockChange,
      },
      {
        value: selectedNetver,
        placeholder: "NET_VER",
        data: (Array.isArray(netverList) ? netverList : []) as string[],
        set: handleNetverChange,
      },
      {
        value: selectedRevision,
        placeholder: "REVISION",
        data: (Array.isArray(revisionList) ? revisionList : []) as string[],
        set: handleRevisionChange,
      },
      {
        value: selectedEconum,
        placeholder: "ECO_NUM",
        data: (Array.isArray(econumList) ? econumList : []) as string[],
        set: handleEconumChange,
      },
    ],
    [
      selectedProject,
      selectedBlock,
      selectedNetver,
      selectedRevision,
      selectedEconum,
      projectList,
      blockList,
      netverList,
      revisionList,
      econumList,
    ]
  );

  return filterDropdownConfigs;
}
