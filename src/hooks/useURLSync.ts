import { useEffect, useRef } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import type { RootState } from "@/store";
import { setCurrentPage, type PageType } from "@/store/reducers/pageReducer";
import { restoreFromURL } from "@/store/reducers/selectedReducer";

// URL parameter keys
const URL_PARAMS = {
  PAGE: "page",
  PROJECT: "project",
  BLOCK: "block",
  NETVER: "netver",
  REVISION: "revision",
  ECONUM: "econum",
} as const;

// Valid page types for validation
const VALID_PAGES: PageType[] = ["fc-check-tool", "qor-compare", "timing", "power"];

/**
 * Custom hook to synchronize URL query parameters with Redux state.
 * - On initial load: reads URL params and restores state
 * - On state change: updates URL params
 */
export function useURLSync() {
  const dispatch = useDispatch();
  const isInitialized = useRef(false);
  const isRestoringFromURL = useRef(false);

  // Get current state from Redux
  const { currentPage, selectedProject, selectedBlock, selectedNetver, selectedRevision, selectedEconum } =
    useSelector(
      (state: RootState) => ({
        currentPage: state.page.currentPage,
        selectedProject: state.selected.selectedProject,
        selectedBlock: state.selected.selectedBlock,
        selectedNetver: state.selected.selectedNetver,
        selectedRevision: state.selected.selectedRevision,
        selectedEconum: state.selected.selectedEconum,
      }),
      shallowEqual
    );

  // Initialize from URL on first mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const params = new URLSearchParams(window.location.search);

    // Restore page
    const pageParam = params.get(URL_PARAMS.PAGE) as PageType | null;
    if (pageParam && VALID_PAGES.includes(pageParam)) {
      dispatch(setCurrentPage(pageParam));
    }

    // Restore selection state
    const project = params.get(URL_PARAMS.PROJECT);
    const block = params.get(URL_PARAMS.BLOCK);
    const netver = params.get(URL_PARAMS.NETVER);
    const revision = params.get(URL_PARAMS.REVISION);
    const econum = params.get(URL_PARAMS.ECONUM);

    // Only restore if at least one param exists
    if (project || block || netver || revision || econum) {
      isRestoringFromURL.current = true;
      dispatch(
        restoreFromURL({
          selectedProject: project,
          selectedBlock: block,
          selectedNetver: netver,
          selectedRevision: revision,
          selectedEconum: econum,
        })
      );
      // Reset flag after a short delay to allow state to settle
      setTimeout(() => {
        isRestoringFromURL.current = false;
      }, 100);
    }
  }, [dispatch]);

  // Update URL when state changes
  useEffect(() => {
    // Skip URL update during initial restoration
    if (!isInitialized.current || isRestoringFromURL.current) return;

    const params = new URLSearchParams();

    // Always include page
    params.set(URL_PARAMS.PAGE, currentPage);

    // Include selection params only if they have values
    if (selectedProject) params.set(URL_PARAMS.PROJECT, selectedProject);
    if (selectedBlock) params.set(URL_PARAMS.BLOCK, selectedBlock);
    if (selectedNetver) params.set(URL_PARAMS.NETVER, selectedNetver);
    if (selectedRevision) params.set(URL_PARAMS.REVISION, selectedRevision);
    if (selectedEconum) params.set(URL_PARAMS.ECONUM, selectedEconum);

    // Update URL without triggering a page reload
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newURL);
  }, [currentPage, selectedProject, selectedBlock, selectedNetver, selectedRevision, selectedEconum]);
}

/**
 * Helper function to generate a shareable URL with current state
 */
export function generateShareableURL(state: {
  page: PageType;
  project?: string | null;
  block?: string | null;
  netver?: string | null;
  revision?: string | null;
  econum?: string | null;
}): string {
  const params = new URLSearchParams();

  params.set(URL_PARAMS.PAGE, state.page);
  if (state.project) params.set(URL_PARAMS.PROJECT, state.project);
  if (state.block) params.set(URL_PARAMS.BLOCK, state.block);
  if (state.netver) params.set(URL_PARAMS.NETVER, state.netver);
  if (state.revision) params.set(URL_PARAMS.REVISION, state.revision);
  if (state.econum) params.set(URL_PARAMS.ECONUM, state.econum);

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export default useURLSync;
