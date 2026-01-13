/**
 * @file useURLSync/index.ts
 *
 * @purpose
 * URL 동기화 관련 훅 및 유틸리티의 진입점
 * 모든 훅을 re-export하여 기존 import 경로 유지
 *
 * @structure
 * 1. useURLSync: 메인 URL 동기화 훅
 * 2. useRestoreColumnData: QOR Compare 페이지 데이터 복원
 * 3. useRestoreDoeGroupData: Power 페이지 데이터 복원
 * 4. useRestoreTimingRowData: Timing 페이지 데이터 복원
 * 5. generateShareableURL: URL 생성 헬퍼 함수
 */

import { useEffect, useRef } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { setCurrentPage, type PageType } from "@/store/reducers/pageReducer";
import { restoreColumnsFromURL } from "@/store/matrixSlice";
import { setDoEs } from "@/store/doeRegistry";
import {
  setFCSelectedProject,
  setFCSelectedBlock,
  setFCSelectedNetver,
  setFCSelectedRevision,
} from "@/store/reducers/fcCheckToolReducer";
import {
  setTimingRows,
  type TimingRow,
} from "@/store/reducers/timingMatrixReducer";

import {
  URL_PARAMS,
  VALID_PAGES,
  type ColumnMeta,
  type TimingRowMeta,
} from "./types";
import {
  encodeColumns,
  decodeColumns,
  encodeTimingRows,
  decodeTimingRows,
} from "./utils";

// Re-export hooks from separate files
export { useRestoreColumnData } from "./useRestoreColumnData";
export { useRestoreDoeGroupData } from "./useRestoreDoeGroupData";
export { useRestoreTimingRowData } from "./useRestoreTimingRowData";

// Re-export types
export type { ColumnMeta, TimingRowMeta } from "./types";

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
    // Timing Page state
    timingRows,
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
      timingRows: state.timingMatrix.rows,
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
    } else if (effectivePage === "timing") {
      // Restore Timing Page rows
      const timingRowsParam = params.get(URL_PARAMS.TIMING_ROWS);
      if (timingRowsParam) {
        const rows = decodeTimingRows(timingRowsParam);
        if (rows.length > 0) {
          isRestoringFromURL.current = true;

          // Restore timing rows with _needsDataFetch flag
          const storedRows: TimingRow[] = rows.map((row) => ({
            id: row.id,
            label: row.label,
            data: {},
            _needsDataFetch: true,
          }));

          dispatch(setTimingRows(storedRows));

          // Also restore DoE metadata to doeRegistry
          const doeMetadata = rows.map((row) => ({
            id: row.id,
            label: row.label,
            PROJECT_NAME: row.PROJECT_NAME,
            BLOCK: row.BLOCK,
            NET_VER: row.NET_VER,
            REVISION: row.REVISION,
            ECO_NUM: row.ECO_NUM,
            TIMING_SCENARIO: row.TIMING_SCENARIO,
            AVAILABLE_TIMING_SCENARIOS: row.AVAILABLE_TIMING_SCENARIOS,
          }));
          dispatch(setDoEs(doeMetadata));

          // Delay data fetch to allow initialization
          setTimeout(() => {
            isRestoringFromURL.current = false;
          }, 500);
        }
      }
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
    } else if (currentPage === "timing") {
      // Save Timing Page rows (only if there are any)
      if (timingRows.length > 0) {
        const rowMeta: TimingRowMeta[] = timingRows.map((row) => {
          const metadata = doeRegistry.byId[row.id];
          return {
            id: row.id,
            label: row.label,
            PROJECT_NAME: metadata?.PROJECT_NAME,
            BLOCK: metadata?.BLOCK,
            NET_VER: metadata?.NET_VER,
            REVISION: metadata?.REVISION,
            ECO_NUM: metadata?.ECO_NUM,
            TIMING_SCENARIO: metadata?.TIMING_SCENARIO,
            AVAILABLE_TIMING_SCENARIOS: metadata?.AVAILABLE_TIMING_SCENARIOS,
          };
        });
        const encoded = encodeTimingRows(rowMeta);
        if (encoded) {
          params.set(URL_PARAMS.TIMING_ROWS, encoded);
        }
      }
    }

    // Update URL without triggering a page reload
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newURL);
  }, [
    currentPage,
    columnHeaders,
    timingRows,
    doeRegistry,
    fcProject,
    fcBlock,
    fcNetver,
    fcRevision,
  ]);
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
