import { useEffect, useRef } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { setCurrentPage, type PageType } from "@/store/reducers/pageReducer";
import { restoreFromURL } from "@/store/reducers/selectedReducer";
import {
  setFCSelectedProject,
  setFCSelectedBlock,
  setFCSelectedNetver,
  setFCSelectedRevision,
} from "@/store/reducers/fcCheckToolReducer";
import { updateCell, setColumnHeaders } from "@/store/matrixSlice";
import { fetchDataset } from "@/store/reducers/datasetReducer";
import { getMetric } from "@/variables/getMetric";

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
const VALID_PAGES: PageType[] = ["fc-check-tool", "qor-compare", "timing", "power"];

// Column metadata structure for URL
interface ColumnMeta {
  id: string;
  label: string;
  PROJECT_NAME?: string;
  BLOCK?: string;
  NET_VER?: string;
  REVISION?: string;
  ECO_NUM?: string;
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
  } = useSelector(
    (state: RootState) => ({
      currentPage: state.page.currentPage,
      columnHeaders: state.matrix.columnHeaders,
      fcProject: state.fcCheckTool.selectedProject,
      fcBlock: state.fcCheckTool.selectedBlock,
      fcNetver: state.fcCheckTool.selectedNetver,
      fcRevision: state.fcCheckTool.selectedRevision,
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
          // Store columns first, then fetch data
          const storedColumns = columns.map((col) => ({
            id: col.id,
            label: col.label,
            accessorKey: col.id,
            PROJECT_NAME: col.PROJECT_NAME,
            BLOCK: col.BLOCK,
            NET_VER: col.NET_VER,
            REVISION: col.REVISION,
            ECO_NUM: col.ECO_NUM,
          }));

          dispatch(setColumnHeaders(storedColumns));

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
        const columnMeta: ColumnMeta[] = columnHeaders.map((col) => ({
          id: col.id,
          label: col.label,
          PROJECT_NAME: col.PROJECT_NAME,
          BLOCK: col.BLOCK,
          NET_VER: col.NET_VER,
          REVISION: col.REVISION,
          ECO_NUM: col.ECO_NUM,
        }));
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
  }, [currentPage, columnHeaders, fcProject, fcBlock, fcNetver, fcRevision]);
}

/**
 * Hook to restore column data after template rows are initialized
 */
export function useRestoreColumnData() {
  const dispatch = useDispatch<AppDispatch>();
  const hasRestored = useRef(false);

  const { columnHeaders, rowHeaders } = useSelector(
    (state: RootState) => ({
      columnHeaders: state.matrix.columnHeaders,
      rowHeaders: state.matrix.rowHeaders,
    }),
    shallowEqual
  );

  useEffect(() => {
    // Only restore once, when we have both columns and rows
    if (hasRestored.current || columnHeaders.length === 0 || rowHeaders.length === 0) {
      return;
    }

    // Check if this is a URL restoration (columns exist but cells are empty)
    const needsDataFetch = columnHeaders.some((col) => {
      const hasData = rowHeaders.some((row) => {
        const cellValue = row.data[col.id];
        return cellValue !== undefined && cellValue !== "" && cellValue !== "___LOADING___";
      });
      return !hasData;
    });

    if (!needsDataFetch) {
      hasRestored.current = true;
      return;
    }

    hasRestored.current = true;

    // Fetch data for each column sequentially
    const fetchAllColumns = async () => {
      for (const col of columnHeaders) {
        // Mark cells as loading
        rowHeaders.forEach((row) => {
          dispatch(updateCell({ rowId: row.id, columnId: col.id, value: "___LOADING___" }));
        });

        // Set selection state
        dispatch(
          restoreFromURL({
            selectedProject: col.PROJECT_NAME || null,
            selectedBlock: col.BLOCK || null,
            selectedNetver: col.NET_VER || null,
            selectedRevision: col.REVISION || null,
            selectedEconum: col.ECO_NUM || null,
          })
        );

        // Fetch and update cells
        const action = await dispatch(fetchDataset());
        if (fetchDataset.fulfilled.match(action)) {
          const data = (action.payload?.[col.label] ?? {}) as Record<string, unknown>;
          rowHeaders.forEach((row) => {
            const metricKey = `${row.rowGroup}!${row.label}`;
            let value = getMetric(metricKey, data);
            if (value === undefined) {
              value = "-";
            }
            dispatch(updateCell({ rowId: row.id, columnId: col.id, value }));
          });
        }
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

  if (state.page === "qor-compare" && state.columns && state.columns.length > 0) {
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

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export default useURLSync;
