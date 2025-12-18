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
