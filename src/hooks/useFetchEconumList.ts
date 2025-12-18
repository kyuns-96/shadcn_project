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
