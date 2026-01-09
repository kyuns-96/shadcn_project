import { useEffect, useRef } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { setCurrentPage, type PageType } from "@/store/reducers/pageReducer";
import {
  restoreFromURL,
  setDoeName,
  setColumnPowerScenario,
} from "@/store/reducers/selectedReducer";
import {
  setFCSelectedProject,
  setFCSelectedBlock,
  setFCSelectedNetver,
  setFCSelectedRevision,
} from "@/store/reducers/fcCheckToolReducer";
import {
  updateCell,
  restoreColumnsFromURL,
  markColumnFetched,
} from "@/store/matrixSlice";
import { setDoEs } from "@/store/doeRegistry";
import { fetchDataset } from "@/store/reducers/datasetReducer";
import { extractMetricValue } from "@/variables/metricValueExtractor";

// URL parameter keys
const URL_PARAMS = {
  PAGE: "page",
  // QOR Compare params
  COLUMNS: "columns", // JSON encoded column metadata
  // FC Check Tool params (prefixed with fc_)
  FC_PROJECT: "fc_project",
  FC_BLOCK: "fc_block",
  FC_NETVER: "fc_netver",
  FC_REVISION: "fc_revision",
} as const;

// Valid page types for validation
const VALID_PAGES: PageType[] = [
  "fc-check-tool",
  "qor-compare",
  "timing",
  "power",
];

// Column metadata structure for URL
interface ColumnMeta {
  id: string;
  label: string;
  PROJECT_NAME?: string;
  BLOCK?: string;
  NET_VER?: string;
  REVISION?: string;
  ECO_NUM?: string;
  POWER_SCENARIO?: string;
  AVAILABLE_SCENARIOS?: string[];
}

/**
 * Encode column headers to a compact URL-safe string
 */
function encodeColumns(columns: ColumnMeta[]): string {
  if (columns.length === 0) return "";
  try {
    return btoa(encodeURIComponent(JSON.stringify(columns)));
  } catch {
    return "";
  }
}

/**
 * Decode columns from URL parameter
 */
function decodeColumns(encoded: string): ColumnMeta[] {
  if (!encoded) return [];
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return [];
  }
}

/**
 * Custom hook to synchronize URL query parameters with Redux state.
 * - Handles page-specific state (QOR Compare vs FC Check Tool)
 * - On initial load: reads URL params and restores state
 * - On state change: updates URL params
 */
export function useURLSync() {
  const dispatch = useDispatch<AppDispatch>();
  const isInitialized = useRef(false);
  const isRestoringFromURL = useRef(false);

  // Get current state from Redux
  const {
    currentPage,
    // QOR Compare state
    columnHeaders,
    // FC Check Tool state
    fcProject,
    fcBlock,
    fcNetver,
    fcRevision,
    doeRegistry,
  } = useSelector(
    (state: RootState) => ({
      currentPage: state.page.currentPage,
      columnHeaders: state.matrix.columnHeaders,
      fcProject: state.fcCheckTool.selectedProject,
      fcBlock: state.fcCheckTool.selectedBlock,
      fcNetver: state.fcCheckTool.selectedNetver,
      fcRevision: state.fcCheckTool.selectedRevision,
      doeRegistry: state.doeRegistry,
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

    const effectivePage = pageParam || "qor-compare";

    // Restore page-specific state
    if (effectivePage === "qor-compare") {
      // Restore QOR Compare columns
      const columnsParam = params.get(URL_PARAMS.COLUMNS);
      if (columnsParam) {
        const columns = decodeColumns(columnsParam);
        if (columns.length > 0) {
          isRestoringFromURL.current = true;

          // We need to wait for rowHeaders to be initialized before fetching data
          // Store columns first with _needsDataFetch flag, then fetch data
          const storedColumns = columns.map((col) => ({
            id: col.id,
            label: col.label,
            accessorKey: col.id,
            PROJECT_NAME: col.PROJECT_NAME,
            BLOCK: col.BLOCK,
            NET_VER: col.NET_VER,
            REVISION: col.REVISION,
            ECO_NUM: col.ECO_NUM,
            POWER_SCENARIO: col.POWER_SCENARIO,
            AVAILABLE_SCENARIOS: col.AVAILABLE_SCENARIOS,
          }));

          dispatch(restoreColumnsFromURL(storedColumns));

          // [WHY] Also restore DoE metadata to doeRegistry
          // This ensures metadata is available across both pages
          const doeMetadata = columns.map((col) => ({
            id: col.id,
            label: col.label,
            PROJECT_NAME: col.PROJECT_NAME,
            BLOCK: col.BLOCK,
            NET_VER: col.NET_VER,
            REVISION: col.REVISION,
            ECO_NUM: col.ECO_NUM,
            POWER_SCENARIO: col.POWER_SCENARIO,
            AVAILABLE_SCENARIOS: col.AVAILABLE_SCENARIOS,
          }));
          dispatch(setDoEs(doeMetadata));

          // Delay data fetch to allow template rows to initialize
          setTimeout(() => {
            isRestoringFromURL.current = false;
          }, 500);
        }
      }
    } else if (effectivePage === "fc-check-tool") {
      // Restore FC Check Tool state
      const fcProjectParam = params.get(URL_PARAMS.FC_PROJECT);
      const fcBlockParam = params.get(URL_PARAMS.FC_BLOCK);
      const fcNetverParam = params.get(URL_PARAMS.FC_NETVER);
      const fcRevisionParam = params.get(URL_PARAMS.FC_REVISION);

      isRestoringFromURL.current = true;

      if (fcProjectParam) dispatch(setFCSelectedProject(fcProjectParam));
      if (fcBlockParam) dispatch(setFCSelectedBlock(fcBlockParam));
      if (fcNetverParam) dispatch(setFCSelectedNetver(fcNetverParam));
      if (fcRevisionParam) dispatch(setFCSelectedRevision(fcRevisionParam));

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

    // Page-specific parameters
    if (currentPage === "qor-compare") {
      // Save QOR Compare columns (only if there are any)
      if (columnHeaders.length > 0) {
        const columnMeta: ColumnMeta[] = columnHeaders.map((col) => {
          const metadata = doeRegistry.byId[col.id];
          return {
            id: col.id,
            label: col.label,
            PROJECT_NAME: metadata?.PROJECT_NAME,
            BLOCK: metadata?.BLOCK,
            NET_VER: metadata?.NET_VER,
            REVISION: metadata?.REVISION,
            ECO_NUM: metadata?.ECO_NUM,
            POWER_SCENARIO: metadata?.POWER_SCENARIO,
            AVAILABLE_SCENARIOS: metadata?.AVAILABLE_SCENARIOS,
          };
        });
        const encoded = encodeColumns(columnMeta);
        if (encoded) {
          params.set(URL_PARAMS.COLUMNS, encoded);
        }
      }
    } else if (currentPage === "fc-check-tool") {
      // Save FC Check Tool state
      if (fcProject) params.set(URL_PARAMS.FC_PROJECT, fcProject);
      if (fcBlock) params.set(URL_PARAMS.FC_BLOCK, fcBlock);
      if (fcNetver) params.set(URL_PARAMS.FC_NETVER, fcNetver);
      if (fcRevision) params.set(URL_PARAMS.FC_REVISION, fcRevision);
    }

    // Update URL without triggering a page reload
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newURL);
  }, [currentPage, columnHeaders, doeRegistry, fcProject, fcBlock, fcNetver, fcRevision]);
}

/**
 * Hook to restore column data after template rows are initialized
 * Only fetches data for columns that have _needsDataFetch flag (from URL restoration)
 */
export function useRestoreColumnData() {
  const dispatch = useDispatch<AppDispatch>();
  const isFetching = useRef(false);
  // [WHY] Track which columns we've already processed to prevent re-fetching on re-renders
  const fetchedColumnsRef = useRef<Set<string>>(new Set());

  const { columnHeaders, rowHeaders } = useSelector(
    (state: RootState) => ({
      columnHeaders: state.matrix.columnHeaders,
      rowHeaders: state.matrix.rowHeaders,
    }),
    shallowEqual
  );

  useEffect(() => {
    // [WHY] Prevent concurrent fetches to avoid race conditions
    if (isFetching.current) return;

    // [WHY] Wait for template rows to be initialized before attempting to fetch
    // This ensures rowHeaders are available when we update cells
    if (rowHeaders.length === 0) return;

    // [WHY] Filter columns that need fetch AND haven't been processed yet
    // Using both _needsDataFetch flag and ref to handle React strict mode double-renders
    const columnsToFetch = columnHeaders.filter(
      (col) =>
        col._needsDataFetch === true && !fetchedColumnsRef.current.has(col.id)
    );

    if (columnsToFetch.length === 0) return;

    isFetching.current = true;

    // [WHY] Capture current rowHeaders snapshot to avoid stale closure issues
    // during async operations
    const currentRowHeaders = [...rowHeaders];

    // Fetch data for each column sequentially
    const fetchAllColumns = async () => {
      for (const col of columnsToFetch) {
        // [WHY] Mark column as being processed immediately to prevent duplicate fetches
        fetchedColumnsRef.current.add(col.id);

        // [WHY] Set doeName first - fetchDataset uses this as the key for storing results
        // Without this, data would be stored under empty string key
        dispatch(setDoeName(col.label));

        // Set selection state for this column
        dispatch(
          restoreFromURL({
            selectedProject: (col.PROJECT_NAME as string) ?? null,
            selectedBlock: (col.BLOCK as string) ?? null,
            selectedNetver: (col.NET_VER as string) ?? null,
            selectedRevision: (col.REVISION as string) ?? null,
            selectedEconum: (col.ECO_NUM as string) ?? null,
          })
        );

        // [WHY] Small delay to ensure Redux state is updated before fetch
        // This prevents race condition where fetchDataset reads stale selection state
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Fetch and update cells
        const action = await dispatch(fetchDataset());
        if (fetchDataset.fulfilled.match(action)) {
          const data = (action.payload?.[col.label] ?? {}) as Record<
            string,
            unknown
          >;

          // Restore Power Scenario selection if it exists
          const scenarioName = (col.POWER_SCENARIO as string) ?? "";
          if (scenarioName) {
            dispatch(
              setColumnPowerScenario({
                columnId: col.id,
                scenario: scenarioName,
              })
            );
          }

          // [WHY] Use captured snapshot of rowHeaders to ensure consistent updates
          currentRowHeaders.forEach((row) => {
            const metricKey = `${row.rowGroup}!${row.label}`;
            // Pass scenario name for proper metric extraction
            let value = extractMetricValue(metricKey, data, scenarioName);
            if (value === undefined) {
              value = "-";
            }
            dispatch(updateCell({ rowId: row.id, columnId: col.id, value }));
          });
        }

        // Mark this column as fetched in Redux
        dispatch(markColumnFetched(col.id));
      }

      // Clear selection after restoration
      dispatch(
        restoreFromURL({
          selectedProject: null,
          selectedBlock: null,
          selectedNetver: null,
          selectedRevision: null,
          selectedEconum: null,
        })
      );

      // [WHY] Clear doeName after restoration to reset UI state
      dispatch(setDoeName(""));

      isFetching.current = false;
    };

    fetchAllColumns();
  }, [dispatch, columnHeaders, rowHeaders]);
}

/**
 * Helper function to generate a shareable URL with current state
 */
export function generateShareableURL(state: {
  page: PageType;
  columns?: ColumnMeta[];
  fcProject?: string;
  fcBlock?: string;
  fcNetver?: string;
  fcRevision?: string;
}): string {
  const params = new URLSearchParams();

  params.set(URL_PARAMS.PAGE, state.page);

  if (
    state.page === "qor-compare" &&
    state.columns &&
    state.columns.length > 0
  ) {
    const encoded = encodeColumns(state.columns);
    if (encoded) {
      params.set(URL_PARAMS.COLUMNS, encoded);
    }
  } else if (state.page === "fc-check-tool") {
    if (state.fcProject) params.set(URL_PARAMS.FC_PROJECT, state.fcProject);
    if (state.fcBlock) params.set(URL_PARAMS.FC_BLOCK, state.fcBlock);
    if (state.fcNetver) params.set(URL_PARAMS.FC_NETVER, state.fcNetver);
    if (state.fcRevision) params.set(URL_PARAMS.FC_REVISION, state.fcRevision);
  }

  return `${window.location.origin}${
    window.location.pathname
  }?${params.toString()}`;
}

export default useURLSync;
