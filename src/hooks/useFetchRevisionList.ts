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
