/**
 * @file useURLSync/useRestoreDoeGroupData.ts
 *
 * @purpose
 * Power 페이지의 DoE 그룹 데이터 복원 훅
 * _needsDataFetch 플래그가 있는 DoE 그룹의 데이터를 fetch
 */

import { useEffect, useRef } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useAppSelector } from "@/store";
import type { RootState, AppDispatch } from "@/store";
import { setColumnPowerScenario } from "@/store/reducers/selectedReducer";
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

  const { dataset, currentPage } = useAppSelector(
    (state: RootState) => ({
      dataset: state.dataset.data,
      currentPage: state.page.currentPage,
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

    // [WHY] Check if doeRegistry has metadata for ALL groups that need fetching
    // If not, URL restoration is still in progress - wait for next render cycle
    const allMetadataReady = groupsToFetch.every(
      (group) => doeRegistry.byId[group.id] !== undefined
    );
    if (!allMetadataReady) {
      // [WHY] doeRegistry not ready yet - useEffect will re-run when doeRegistry updates
      return;
    }

    isFetching.current = true;

    // [WHY] Capture current rowHeaders snapshot to avoid stale closure issues
    // during async operations
    const currentRowHeaders = [...rowHeaders];

    // Fetch data for each DoE group sequentially
    const fetchAllGroups = async () => {
       for (const group of groupsToFetch) {
         // [WHY] Mark group as being processed immediately to prevent duplicate fetches
         fetchedGroupsRef.current.add(group.id);

         // Get metadata from doeRegistry
         const metadata = doeRegistry.byId[group.id];
         if (!metadata) {
           // Skip if metadata not found
           continue;
         }

         // [WHY] Check cache first - if data exists, skip API call
         const cachedData = dataset[group.label];
         const hasCachedData = cachedData && Object.keys(cachedData).length > 0;

         let datasetPayload: Record<string, unknown>;

         if (hasCachedData) {
           // Use cached data
           datasetPayload = cachedData;
          } else {
            // Set selection state for this DoE group

             const action = await dispatch(fetchDataset({
              project: (metadata.PROJECT_NAME as string) ?? '',
              block: (metadata.BLOCK as string) ?? '',
              netver: (metadata.NET_VER as string) ?? '',
              revision: (metadata.REVISION as string) ?? '',
              econum: (metadata.ECO_NUM as string) ?? undefined,
              doeName: group.label,
              revisionMode: 'POST',
              currentPage: currentPage,
            }));

            if (fetchDataset.fulfilled.match(action)) {
             datasetPayload = (action.payload?.[group.label] ??
               {}) as Record<string, unknown>;
           } else {
             // Fetch failed, skip scenario extraction and cell updates
             dispatch(markDoeFetched(group.id));
             continue;
           }
         }

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
             const metricKey = `Power(mW)!${
               (row as { rowKey?: string }).rowKey
             }_${colName}`;
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

          // Mark this group as fetched
          dispatch(markDoeFetched(group.id));
        }

       isFetching.current = false;
    };

     fetchAllGroups();
    }, [dispatch, doeGroups, rowHeaders, doeRegistry, dataset, currentPage]);
}
