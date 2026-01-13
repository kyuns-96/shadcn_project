/**
 * @file useURLSync/useRestoreTimingRowData.ts
 *
 * @purpose
 * Timing 페이지의 행 데이터 복원 훅
 * _needsDataFetch 플래그가 있는 행의 데이터를 fetch
 */

import { useEffect, useRef } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { restoreFromURL, setDoeName } from "@/store/reducers/selectedReducer";
import { updateDoEMetadata } from "@/store/doeRegistry";
import {
  markTimingRowFetched,
  updateTimingCell,
} from "@/store/reducers/timingMatrixReducer";
import { fetchDataset } from "@/store/reducers/datasetReducer";
import { extractMetricValue } from "@/variables/metricValueExtractor";
import { extractAvailableTimingScenarios } from "@/variables/timingScenarioExtractor";
import {
  TIMING_COLUMN_GROUPS,
  TIMING_METRICS,
  generateTimingColumnKey,
  getTimingMetricKey,
  EMPTY_VALUE_PLACEHOLDER,
} from "@/variables/defaultTimingMatrixTemplate";

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

        // [WHY] Read metadata from row object directly (like useRestoreColumnData does)
        // This avoids timing issues with doeRegistry not being ready yet
        // Fallback to doeRegistry for backwards compatibility
        const metadata = doeRegistry.byId[row.id] || {};

        const PROJECT_NAME = (row.PROJECT_NAME ?? metadata.PROJECT_NAME) as
          | string
          | null;
        const BLOCK = (row.BLOCK ?? metadata.BLOCK) as string | null;
        const NET_VER = (row.NET_VER ?? metadata.NET_VER) as string | null;
        const REVISION = (row.REVISION ?? metadata.REVISION) as string | null;
        const ECO_NUM = (row.ECO_NUM ?? metadata.ECO_NUM) as string | null;
        const TIMING_SCENARIO = (row.TIMING_SCENARIO ??
          metadata.TIMING_SCENARIO) as string | undefined;

        // [WHY] Skip if no PROJECT_NAME - can't fetch without it
        if (!PROJECT_NAME) {
          continue;
        }

        // Set selection state for this DoE row
        dispatch(
          restoreFromURL({
            selectedProject: PROJECT_NAME ?? null,
            selectedBlock: BLOCK ?? null,
            selectedNetver: NET_VER ?? null,
            selectedRevision: REVISION ?? null,
            selectedEconum: ECO_NUM ?? null,
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
          // Prefer "total" scenario as default, fallback to first available
          let scenarioName = TIMING_SCENARIO;
          if (!scenarioName) {
            const availableTimingScenarios =
              extractAvailableTimingScenarios(datasetPayload);
            scenarioName = availableTimingScenarios.includes("total")
              ? "total"
              : availableTimingScenarios.length > 0
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
        dispatch(markTimingRowFetched(row.id));
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
