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
