import { useMemo } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import type { RootState } from "@/store";

import { useFetchProjectList } from "@/hooks/useFetchProjectList";
import useFetchBlockList from "@/hooks/useFetchBlockList";
import useFetchNetverList from "@/hooks/useFetchNetverList";
import useFetchRevisionList from "@/hooks/useFetchRevisionList";
import useFetchEconumList from "@/hooks/useFetchEconumList";

import type { DropdownConfig } from "@/components/shadcn-studio/combobox/combobox-01";
import {
  setSelectedProject as setProjectAction,
  setSelectedBlock as setBlockAction,
  setSelectedNetver as setNetverAction,
  setSelectedRevision as setRevisionAction,
  setSelectedEconum as setEconumAction,
} from "@/store/reducers/selectedReducer";

export default function useDropdownConfigs(): DropdownConfig[] {
  const dispatch = useDispatch();
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

  const setSelectedProject = (value: string) => {
    dispatch(setProjectAction(value));
  };

  const setSelectedBlock = (value: string) => {
    dispatch(setBlockAction(value));
  };

  const setSelectedNetver = (value: string) => {
    dispatch(setNetverAction(value));
  };

  const setSelectedRevision = (value: string) => {
    dispatch(setRevisionAction(value));
  };

  const setSelectedEconum = (value: string) => {
    dispatch(setEconumAction(value));
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

  // build config objects for each dropdown
  const dropdownConfigs = useMemo<DropdownConfig[]>(
    () => [
      {
        value: selectedProject,
        placeholder: "PROJECT_NAME",
        data: (Array.isArray(projectList) ? projectList : []) as string[],
        set: (v: string) => setSelectedProject(v),
      },
      {
        value: selectedBlock,
        placeholder: "BLOCK",
        data: (Array.isArray(blockList) ? blockList : []) as string[],
        set: (v: string) => setSelectedBlock(v),
      },
      {
        value: selectedNetver,
        placeholder: "NET_VER",
        data: (Array.isArray(netverList) ? netverList : []) as string[],
        set: (v: string) => setSelectedNetver(v),
      },
      {
        value: selectedRevision,
        placeholder: "REVISION",
        data: (Array.isArray(revisionList) ? revisionList : []) as string[],
        set: (v: string) => setSelectedRevision(v),
      },
      {
        value: selectedEconum,
        placeholder: "ECO_NUM",
        data: (Array.isArray(econumList) ? econumList : []) as string[],
        set: (v: string) => setSelectedEconum(v),
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
  return dropdownConfigs;
}
