/**
 * @file useURLSync/useRestoreColumnData.ts
 *
 * @purpose
 * QOR Compare 페이지의 컬럼 데이터 복원 훅
 * _needsDataFetch 플래그가 있는 컬럼의 데이터를 fetch
 */

import { useEffect, useRef } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import {
  restoreFromURL,
  setDoeName,
  setColumnPowerScenario,
} from "@/store/reducers/selectedReducer";
import { updateCell, markColumnFetched } from "@/store/matrixSlice";
import { updateDoEMetadata } from "@/store/doeRegistry";
import { fetchDataset } from "@/store/reducers/datasetReducer";
import { extractMetricValue } from "@/variables/metricValueExtractor";
import { extractAvailableScenarios } from "@/variables/powerScenarioExtractor";
import { getDefaultScenario } from "@/variables/defaultPowerScenarioMapping";

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

          // [WHY] Get metadata from doeRegistry (more reliable than column metadata)
          // This ensures we get the correct POWER_SCENARIO even when DoE was added from another page
          const metadata = doeRegistry.byId[col.id];

          // [WHY] If POWER_SCENARIO is missing, extract available scenarios and set default
          let scenarioName =
            (metadata?.POWER_SCENARIO as string) ??
            (col.POWER_SCENARIO as string) ??
            "";
          if (!scenarioName) {
            const availableScenarios = extractAvailableScenarios(data);
            const selectedProject =
              (metadata?.PROJECT_NAME as string) ??
              (col.PROJECT_NAME as string) ??
              null;
            scenarioName = getDefaultScenario(
              selectedProject,
              availableScenarios
            );

            // Update doeRegistry with the scenario information
            if (metadata) {
              dispatch(
                updateDoEMetadata({
                  doeId: col.id,
                  POWER_SCENARIO: scenarioName,
                  AVAILABLE_SCENARIOS: availableScenarios,
                })
              );
            }
          }

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
  }, [dispatch, columnHeaders, rowHeaders, doeRegistry]);
}
