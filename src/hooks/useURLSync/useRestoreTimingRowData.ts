/**
 * @file useURLSync/useRestoreTimingRowData.ts
 *
 * @purpose
 * Timing 페이지의 행 데이터 복원 훅
 * _needsDataFetch 플래그가 있는 행의 데이터를 fetch
 */

import { useEffect, useRef } from "react";
import { shallowEqual } from "react-redux";
import type { RootState } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store";
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
  const dispatch = useAppDispatch();
  const isFetching = useRef(false);
  // [WHY] Track which rows we've already processed to prevent re-fetching on re-renders
  const fetchedRowsRef = useRef<Set<string>>(new Set());

  const timingRows = useAppSelector(
    (state: RootState) => state.timingMatrix.rows,
    shallowEqual
  );

  const { doeRegistry, dataset, currentPage } = useAppSelector(
    (state: RootState) => ({
      doeRegistry: state.doeRegistry,
      dataset: state.dataset.data,
      currentPage: state.page.currentPage,
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

         // Check cache first
         const cachedData = dataset[row.label];
         const hasCachedData = cachedData && Object.keys(cachedData).length > 0;

         let datasetPayload: Record<string, unknown>;

          if (hasCachedData) {
            // Use cached data
            datasetPayload = cachedData;
          } else {
             const action = await dispatch(fetchDataset({
              project: PROJECT_NAME ?? '',
              block: BLOCK ?? '',
              netver: NET_VER ?? '',
              revision: REVISION ?? '',
              econum: ECO_NUM ?? undefined,
              doeName: row.label,
              revisionMode: 'POST',
              currentPage: currentPage,
            }));

            if (fetchDataset.fulfilled.match(action)) {
             datasetPayload = (action.payload?.[row.label] ?? {}) as Record<
               string,
               unknown
             >;
           } else {
             datasetPayload = {};
           }
         }

         // Extract scenario and update cells
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

         // Mark this row as fetched
         dispatch(markTimingRowFetched(row.id));
        }

       isFetching.current = false;
    };

     fetchAllRows();
    }, [dispatch, timingRows, doeRegistry, dataset, currentPage]);
}
