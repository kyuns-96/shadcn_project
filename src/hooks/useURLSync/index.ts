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
import { restoreColumnsFromURL, addColumn } from "@/store/matrixSlice";
import { setDoEs } from "@/store/doeRegistry";
import {
  setFCSelectedProject,
  setFCSelectedBlock,
  setFCSelectedNetver,
  setFCSelectedRevision,
} from "@/store/reducers/fcCheckToolReducer";
import {
  setTimingRows,
  addTimingRow,
  type TimingRow,
} from "@/store/reducers/timingMatrixReducer";
import {
  addDoeGroup,
  restoreDoeGroupsFromURL,
} from "@/store/reducers/powerMatrixReducer";
import { setRevisionMode } from "@/store/reducers/selectedReducer";

import {
  URL_PARAMS,
  VALID_PAGES,
  type ColumnMeta,
  type TimingRowMeta,
  type PowerDoeMeta,
} from "./types";
import {
  encodeColumns,
  decodeColumns,
  encodeTimingRows,
  decodeTimingRows,
  encodePowerDoes,
  decodePowerDoes,
} from "./utils";

// Re-export hooks from separate files
export { useRestoreColumnData } from "./useRestoreColumnData";
export { useRestoreDoeGroupData } from "./useRestoreDoeGroupData";
export { useRestoreTimingRowData } from "./useRestoreTimingRowData";

// Re-export types
export type { ColumnMeta, TimingRowMeta, PowerDoeMeta } from "./types";

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
    // Power Page state
    doeGroups,
    // FC Check Tool state
    fcProject,
    fcBlock,
    fcNetver,
    fcRevision,
    doeRegistry,
    revisionMode,
    isRestoringColumns,
  } = useSelector(
    (state: RootState) => ({
      currentPage: state.page.currentPage,
      columnHeaders: state.matrix.columnHeaders,
      timingRows: state.timingMatrix.rows,
      doeGroups: state.powerMatrix.doeGroups,
      fcProject: state.fcCheckTool.selectedProject,
      fcBlock: state.fcCheckTool.selectedBlock,
      fcNetver: state.fcCheckTool.selectedNetver,
      fcRevision: state.fcCheckTool.selectedRevision,
      doeRegistry: state.doeRegistry,
      revisionMode: state.selected.revisionMode,
      isRestoringColumns: state.selected.isRestoringColumns,
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
      const modeParam = params.get(URL_PARAMS.REVISION_MODE);
      if (modeParam === 'PRE' || modeParam === 'POST') {
        dispatch(setRevisionMode(modeParam));
      }

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
            REVISION_MODE: col.REVISION_MODE,
          }));
          dispatch(setDoEs(doeMetadata));

          // [WHY] Also add to timingMatrix for cross-page sync
          // _needsDataFetch: true so TimingPage will fetch data when navigated to
          columns.forEach((col) => {
            dispatch(
              addTimingRow({
                id: col.id,
                label: col.label,
                _needsDataFetch: true,
              })
            );
          });

          // [WHY] Also add to powerMatrix for cross-page sync
          columns.forEach((col) => {
            dispatch(
              addDoeGroup({
                id: col.id,
                label: col.label,
                defaultValue: "___LOADING___",
                _needsDataFetch: true,
              })
            );
          });

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

          // [WHY] Include metadata in storedRows so useRestoreTimingRowData can access it
          // This matches how useRestoreColumnData works - it reads metadata from column object
          const storedRows: TimingRow[] = rows.map((row) => ({
            id: row.id,
            label: row.label,
            data: {},
            _needsDataFetch: true,
            // Include metadata for useRestoreTimingRowData
            PROJECT_NAME: row.PROJECT_NAME,
            BLOCK: row.BLOCK,
            NET_VER: row.NET_VER,
            REVISION: row.REVISION,
            ECO_NUM: row.ECO_NUM,
            TIMING_SCENARIO: row.TIMING_SCENARIO,
            AVAILABLE_TIMING_SCENARIOS: row.AVAILABLE_TIMING_SCENARIOS,
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

          // [WHY] Also add to matrix (QOR Compare) for cross-page sync
          // _needsDataFetch: true so QORComparePage will fetch data when navigated to
          rows.forEach((row) => {
            dispatch(
              addColumn({
                id: row.id,
                label: row.label,
                defaultValue: "___LOADING___",
                _needsDataFetch: true,
                meta: {
                  PROJECT_NAME: row.PROJECT_NAME,
                  BLOCK: row.BLOCK,
                  NET_VER: row.NET_VER,
                  REVISION: row.REVISION,
                  ECO_NUM: row.ECO_NUM,
                },
              })
            );
          });

          // [WHY] Also add to powerMatrix for cross-page sync
          rows.forEach((row) => {
            dispatch(
              addDoeGroup({
                id: row.id,
                label: row.label,
                defaultValue: "___LOADING___",
                _needsDataFetch: true,
              })
            );
          });
          dispatch(setDoEs(doeMetadata));

          // Delay data fetch to allow initialization
          setTimeout(() => {
            isRestoringFromURL.current = false;
          }, 500);
        }
      }
    } else if (effectivePage === "power") {
      // Restore Power Page DoE groups
      const powerDoesParam = params.get(URL_PARAMS.POWER_DOES);
      if (powerDoesParam) {
        const does = decodePowerDoes(powerDoesParam);
        if (does.length > 0) {
          isRestoringFromURL.current = true;

          // Restore DoE groups with _needsDataFetch flag using restoreDoeGroupsFromURL
          const storedDoes = does.map((doe) => ({
            id: doe.id,
            label: doe.label,
          }));

          dispatch(restoreDoeGroupsFromURL(storedDoes));

          // Also restore DoE metadata to doeRegistry
          const doeMetadata = does.map((doe) => ({
            id: doe.id,
            label: doe.label,
            PROJECT_NAME: doe.PROJECT_NAME,
            BLOCK: doe.BLOCK,
            NET_VER: doe.NET_VER,
            REVISION: doe.REVISION,
            ECO_NUM: doe.ECO_NUM,
            POWER_SCENARIO: doe.POWER_SCENARIO,
            AVAILABLE_SCENARIOS: doe.AVAILABLE_SCENARIOS,
          }));
          dispatch(setDoEs(doeMetadata));

          // [WHY] Also add to matrix (QOR Compare) for cross-page sync
          does.forEach((doe) => {
            dispatch(
              addColumn({
                id: doe.id,
                label: doe.label,
                defaultValue: "___LOADING___",
                _needsDataFetch: true,
                meta: {
                  PROJECT_NAME: doe.PROJECT_NAME,
                  BLOCK: doe.BLOCK,
                  NET_VER: doe.NET_VER,
                  REVISION: doe.REVISION,
                  ECO_NUM: doe.ECO_NUM,
                },
              })
            );
          });

          // [WHY] Also add to timingMatrix for cross-page sync
          does.forEach((doe) => {
            dispatch(
              addTimingRow({
                id: doe.id,
                label: doe.label,
                _needsDataFetch: true,
              })
            );
          });

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
      if (!isRestoringColumns) {
        params.set(URL_PARAMS.REVISION_MODE, revisionMode);
      }

      if (columnHeaders.length > 0 && !isRestoringColumns) {
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
            REVISION_MODE: metadata?.REVISION_MODE,
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
    } else if (currentPage === "power") {
      // Save Power Page DoE groups (only if there are any)
      if (doeGroups.length > 0) {
        const doeMeta: PowerDoeMeta[] = doeGroups.map((doe) => {
          const metadata = doeRegistry.byId[doe.id];
          return {
            id: doe.id,
            label: doe.label,
            PROJECT_NAME: metadata?.PROJECT_NAME,
            BLOCK: metadata?.BLOCK,
            NET_VER: metadata?.NET_VER,
            REVISION: metadata?.REVISION,
            ECO_NUM: metadata?.ECO_NUM,
            POWER_SCENARIO: metadata?.POWER_SCENARIO,
            AVAILABLE_SCENARIOS: metadata?.AVAILABLE_SCENARIOS,
          };
        });
        const encoded = encodePowerDoes(doeMeta);
        if (encoded) {
          params.set(URL_PARAMS.POWER_DOES, encoded);
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
    doeGroups,
    doeRegistry,
    fcProject,
    fcBlock,
    fcNetver,
    fcRevision,
    revisionMode,
    isRestoringColumns,
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
