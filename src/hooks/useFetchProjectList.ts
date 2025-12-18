/*
  Hook to fetch the list of all available projects.

  This hook dispatches an action to retrieve project data from the backend.
  when the component mounts. it does not require any parameters.
*/
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { fetchProjectList } from "@/store/reducers/projectListReducer";

export function useFetchProjectList() {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(fetchProjectList());
  }, [dispatch]);
}
