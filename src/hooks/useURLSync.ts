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
import { setDoEs, updateDoEMetadata } from "@/store/doeRegistry";
import {
  updatePowerCell,
  markDoeFetched,
} from "@/store/reducers/powerMatrixReducer";
import {
  setTimingRows,
  updateTimingCell,
  type TimingRow,
} from "@/store/reducers/timingMatrixReducer";
import { fetchDataset } from "@/store/reducers/datasetReducer";
import { extractMetricValue } from "@/variables/metricValueExtractor";
import { extractAvailableScenarios } from "@/variables/powerScenarioExtractor";
import { getDefaultScenario } from "@/variables/defaultPowerScenarioMapping";
import { extractAvailableTimingScenarios } from "@/variables/timingScenarioExtractor";
import {
  TIMING_COLUMN_GROUPS,
  TIMING_METRICS,
  generateTimingColumnKey,
  getTimingMetricKey,
  EMPTY_VALUE_PLACEHOLDER,
} from "@/variables/defaultTimingMatrixTemplate";

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
  // Timing Page params
  TIMING_ROWS: "timing_rows", // Compressed timing row metadata
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

// Timing row metadata structure for URL
interface TimingRowMeta {
  id: string;
  label: string;
  PROJECT_NAME?: string;
  BLOCK?: string;
  NET_VER?: string;
  REVISION?: string;
  ECO_NUM?: string;
  TIMING_SCENARIO?: string;
  AVAILABLE_TIMING_SCENARIOS?: string[];
}

// Property shorthand mapping for compression
const COMPRESS_MAP: Record<string, string> = {
  id: "i",
  label: "l",
  PROJECT_NAME: "p",
  BLOCK: "b",
  NET_VER: "n",
  REVISION: "r",
  ECO_NUM: "e",
  POWER_SCENARIO: "s",
  AVAILABLE_SCENARIOS: "a",
  TIMING_SCENARIO: "t",
  AVAILABLE_TIMING_SCENARIOS: "at",
};

// Reverse mapping for decompression
const DECOMPRESS_MAP: Record<string, string> = Object.entries(
  COMPRESS_MAP
).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {} as Record<string, string>
);

/**
 * Compress object by shortening property names
 */
function compressObject(obj: Record<string, unknown>): Record<string, unknown> {
  const compressed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const shortKey = COMPRESS_MAP[key] || key;
    compressed[shortKey] = value;
  }
  return compressed;
}

/**
 * Decompress object by restoring original property names
 */
function decompressObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const decompressed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const originalKey = DECOMPRESS_MAP[key] || key;
    decompressed[originalKey] = value;
  }
  return decompressed;
}

/**
 * Encode column headers to a compact URL-safe string with compression
 */
function encodeColumns(columns: ColumnMeta[]): string {
  if (columns.length === 0) return "";
  try {
    const compressed = columns.map((col) =>
      compressObject(col as unknown as Record<string, unknown>)
    );
    return btoa(encodeURIComponent(JSON.stringify(compressed)));
  } catch {
    return "";
  }
}

/**
 * Decode columns from URL parameter with decompression
 */
function decodeColumns(encoded: string): ColumnMeta[] {
  if (!encoded) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(encoded)));
    return parsed.map(
      (obj: Record<string, unknown>) =>
        decompressObject(obj) as unknown as ColumnMeta
    );
  } catch {
    return [];
  }
}

/**
 * Encode timing rows to a compact URL-safe string with compression
 */
function encodeTimingRows(rows: TimingRowMeta[]): string {
  if (rows.length === 0) return "";
  try {
    const compressed = rows.map((row) =>
      compressObject(row as unknown as Record<string, unknown>)
    );
    return btoa(encodeURIComponent(JSON.stringify(compressed)));
  } catch {
    return "";
  }
}

/**
 * Decode timing rows from URL parameter with decompression
 */
function decodeTimingRows(encoded: string): TimingRowMeta[] {
  if (!encoded) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(encoded)));
    return parsed.map(
      (obj: Record<string, unknown>) =>
        decompressObject(obj) as unknown as TimingRowMeta
    );
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
 * Custom hook for PowerPage to fetch data for DoE groups with _needsDataFetch flag.
 * Only fetches data for DoE groups that have _needsDataFetch flag (from QoRComparePage addition)
 */
export function useRestoreDoeGroupData() {
  const dispatch = useDispatch<AppDispatch>();
  const isFetching = useRef(false);
  // [WHY] Track which DoE groups we've already processed to prevent re-fetching on re-renders
  const fetchedGroupsRef = useRef<Set<string>>(new Set());

  const { doeGroups, rowHeaders } = useSelector(
    (state: RootState) => ({
      doeGroups: state.powerMatrix.doeGroups,
      rowHeaders: state.powerMatrix.rowHeaders,
    }),
    shallowEqual
  );

  const { doeRegistry } = useSelector(
    (state: RootState) => ({
      doeRegistry: state.doeRegistry,
    }),
    shallowEqual
  );

  useEffect(() => {
    // [WHY] Prevent concurrent fetches to avoid race conditions
    if (isFetching.current) return;

    // [WHY] Wait for template rows to be initialized before attempting to fetch
    // This ensures rowHeaders are available when we update cells
    if (rowHeaders.length === 0) return;

    // [WHY] Filter DoE groups that need fetch AND haven't been processed yet
    // Using both _needsDataFetch flag and ref to handle React strict mode double-renders
    const groupsToFetch = doeGroups.filter(
      (group) =>
        group._needsDataFetch === true &&
        !fetchedGroupsRef.current.has(group.id)
    );

    if (groupsToFetch.length === 0) return;

    isFetching.current = true;

    // [WHY] Capture current rowHeaders snapshot to avoid stale closure issues
    // during async operations
    const currentRowHeaders = [...rowHeaders];

    // Fetch data for each DoE group sequentially
    const fetchAllGroups = async () => {
      for (const group of groupsToFetch) {
        // [WHY] Mark group as being processed immediately to prevent duplicate fetches
        fetchedGroupsRef.current.add(group.id);

        // [WHY] Set doeName - fetchDataset uses this as the key for storing results
        dispatch(setDoeName(group.label));

        // Get metadata from doeRegistry
        const metadata = doeRegistry.byId[group.id];
        if (!metadata) {
          // Skip if metadata not found
          continue;
        }

        // Set selection state for this DoE group
        dispatch(
          restoreFromURL({
            selectedProject: (metadata.PROJECT_NAME as string) ?? null,
            selectedBlock: (metadata.BLOCK as string) ?? null,
            selectedNetver: (metadata.NET_VER as string) ?? null,
            selectedRevision: (metadata.REVISION as string) ?? null,
            selectedEconum: (metadata.ECO_NUM as string) ?? null,
          })
        );

        // [WHY] Small delay to ensure Redux state is updated before fetch
        // This prevents race condition where fetchDataset reads stale selection state
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Fetch and update cells
        const action = await dispatch(fetchDataset());

        if (fetchDataset.fulfilled.match(action)) {
          const datasetPayload = (action.payload?.[group.label] ??
            {}) as Record<string, unknown>;

          // [WHY] If POWER_SCENARIO is missing (DoE added from QoRComparePage),
          // extract available scenarios and set default scenario
          let scenarioName = metadata.POWER_SCENARIO;
          if (!scenarioName) {
            const availableScenarios =
              extractAvailableScenarios(datasetPayload);
            scenarioName = getDefaultScenario(
              metadata.PROJECT_NAME as string,
              availableScenarios
            );

            // Update doeRegistry with the scenario information
            dispatch(
              updateDoEMetadata({
                doeId: group.id,
                POWER_SCENARIO: scenarioName,
                AVAILABLE_SCENARIOS: availableScenarios,
              })
            );

            // Also update selected state
            dispatch(
              setColumnPowerScenario({
                columnId: group.id,
                scenario: scenarioName,
              })
            );
          }

          // The 4 power metric columns: Internal, Switching, Leakage, Total
          const columnNames = ["Internal", "Switching", "Leakage", "Total"];

          // [WHY] Use captured snapshot of rowHeaders to ensure consistent updates
          currentRowHeaders.forEach((row) => {
            columnNames.forEach((colName) => {
              const columnId = `${group.id}_${colName}`;
              // [WHY] PowerPage uses specific metric key format: "Power(mW)!{rowKey}_{columnName}"
              // row.rowKey is the actual key used in the data (e.g., "clock_network")
              // NOT row.label which is the display name (e.g., "Clock Network")
              const metricKey = `Power(mW)!${(row as any).rowKey}_${colName}`;
              let value = extractMetricValue(
                metricKey,
                datasetPayload,
                scenarioName
              );
              if (value === undefined) {
                value = "-";
              }
              dispatch(
                updatePowerCell({
                  rowId: row.id,
                  columnId: columnId,
                  value,
                })
              );
            });
          });
        }

        // Mark this group as fetched
        dispatch(markDoeFetched(group.id));
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

    fetchAllGroups();
  }, [dispatch, doeGroups, rowHeaders, doeRegistry]);
}

/**
 * Custom hook for TimingPage to fetch data for timing rows with _needsDataFetch flag.
 * Only fetches data for rows that have _needsDataFetch flag (from URL restoration)
 */
export function useRestoreTimingRowData() {
  const dispatch = useDispatch<AppDispatch>();
  const isFetching = useRef(false);
  // [WHY] Track which rows we've already processed to prevent re-fetching on re-renders
  const fetchedRowsRef = useRef<Set<string>>(new Set());

  const { rows: timingRows } = useSelector(
    (state: RootState) => ({
      rows: state.timingMatrix.rows,
    }),
    shallowEqual
  );

  const { doeRegistry } = useSelector(
    (state: RootState) => ({
      doeRegistry: state.doeRegistry,
    }),
    shallowEqual
  );

  useEffect(() => {
    // [WHY] Prevent concurrent fetches to avoid race conditions
    if (isFetching.current) return;

    // [WHY] Filter rows that need fetch AND haven't been processed yet
    // Using both _needsDataFetch flag and ref to handle React strict mode double-renders
    const rowsToFetch = timingRows.filter(
      (row) =>
        row._needsDataFetch === true && !fetchedRowsRef.current.has(row.id)
    );

    if (rowsToFetch.length === 0) return;

    isFetching.current = true;

    // Fetch data for each timing row sequentially
    const fetchAllRows = async () => {
      for (const row of rowsToFetch) {
        // [WHY] Mark row as being processed immediately to prevent duplicate fetches
        fetchedRowsRef.current.add(row.id);

        // [WHY] Set doeName - fetchDataset uses this as the key for storing results
        dispatch(setDoeName(row.label));

        // Get metadata from doeRegistry
        const metadata = doeRegistry.byId[row.id];
        if (!metadata) {
          // Skip if metadata not found
          continue;
        }

        // Set selection state for this DoE row
        dispatch(
          restoreFromURL({
            selectedProject: (metadata.PROJECT_NAME as string) ?? null,
            selectedBlock: (metadata.BLOCK as string) ?? null,
            selectedNetver: (metadata.NET_VER as string) ?? null,
            selectedRevision: (metadata.REVISION as string) ?? null,
            selectedEconum: (metadata.ECO_NUM as string) ?? null,
          })
        );

        // [WHY] Small delay to ensure Redux state is updated before fetch
        // This prevents race condition where fetchDataset reads stale selection state
        await new Promise((resolve) => setTimeout(resolve, 50));

        // Fetch and update cells
        const action = await dispatch(fetchDataset());

        if (fetchDataset.fulfilled.match(action)) {
          const datasetPayload = (action.payload?.[row.label] ?? {}) as Record<
            string,
            unknown
          >;

          // [WHY] If TIMING_SCENARIO is missing, extract available scenarios and set default
          let scenarioName = metadata.TIMING_SCENARIO;
          if (!scenarioName) {
            const availableTimingScenarios =
              extractAvailableTimingScenarios(datasetPayload);
            scenarioName =
              availableTimingScenarios.length > 0
                ? availableTimingScenarios[0]
                : undefined;

            // Update doeRegistry with the scenario information
            dispatch(
              updateDoEMetadata({
                doeId: row.id,
                TIMING_SCENARIO: scenarioName,
                AVAILABLE_TIMING_SCENARIOS: availableTimingScenarios,
              })
            );
          }

          // Update all timing cells for this row
          if (scenarioName) {
            TIMING_COLUMN_GROUPS.forEach((columnGroup) => {
              TIMING_METRICS.forEach((metric) => {
                const columnId = generateTimingColumnKey(columnGroup, metric);
                const metricKey = getTimingMetricKey(columnGroup, metric);
                let value = extractMetricValue(
                  metricKey,
                  datasetPayload,
                  scenarioName
                );
                if (value === undefined) {
                  value = EMPTY_VALUE_PLACEHOLDER;
                }
                dispatch(
                  updateTimingCell({
                    rowId: row.id,
                    columnId,
                    value,
                  })
                );
              });
            });
          }
        }

        // Mark this row as fetched
        dispatch(
          setTimingRows(
            timingRows.map((r) =>
              r.id === row.id ? { ...r, _needsDataFetch: false } : r
            )
          )
        );
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

    fetchAllRows();
  }, [dispatch, timingRows, doeRegistry]);
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
