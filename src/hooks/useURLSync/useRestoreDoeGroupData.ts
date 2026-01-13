/**
 * @file useURLSync/useRestoreDoeGroupData.ts
 *
 * @purpose
 * Power 페이지의 DoE 그룹 데이터 복원 훅
 * _needsDataFetch 플래그가 있는 DoE 그룹의 데이터를 fetch
 */

import { useEffect, useRef } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import {
  restoreFromURL,
  setDoeName,
  setColumnPowerScenario,
} from "@/store/reducers/selectedReducer";
import { updateDoEMetadata } from "@/store/doeRegistry";
import {
  updatePowerCell,
  markDoeFetched,
} from "@/store/reducers/powerMatrixReducer";
import { fetchDataset } from "@/store/reducers/datasetReducer";
import { extractMetricValue } from "@/variables/metricValueExtractor";
import { extractAvailableScenarios } from "@/variables/powerScenarioExtractor";
import { getDefaultScenario } from "@/variables/defaultPowerScenarioMapping";

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
              const metricKey = `Power(mW)!${(row as { rowKey?: string }).rowKey}_${colName}`;
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
