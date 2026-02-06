/**
 * @file useURLSync/useRestoreColumnData.ts
 *
 * @purpose
 * QOR Compare 페이지의 컬럼 데이터 복원 훅
 * _needsDataFetch 플래그가 있는 컬럼의 데이터를 fetch
 */

import { useEffect, useRef } from "react";
import { shallowEqual } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/store";
import type { RootState } from "@/store";
import {
  setColumnPowerScenario,
  setRevisionMode,
  setIsRestoringColumns,
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
  const dispatch = useAppDispatch();
  const isFetching = useRef(false);
  // [WHY] Track which columns we've already processed to prevent re-fetching on re-renders
  const fetchedColumnsRef = useRef<Set<string>>(new Set());

  const { columnHeaders, rowHeaders } = useAppSelector(
    (state: RootState) => ({
      columnHeaders: state.matrix.columnHeaders,
      rowHeaders: state.matrix.rowHeaders,
    }),
    shallowEqual
  );

  const { doeRegistry, revisionMode, currentPage } = useAppSelector(
    (state: RootState) => ({
      doeRegistry: state.doeRegistry,
      revisionMode: state.selected.revisionMode,
      currentPage: state.page.currentPage,
    }),
    shallowEqual
  );

  const dataset = useAppSelector((state) => state.dataset.data);

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
      const globalMode = revisionMode;
      
      dispatch(setIsRestoringColumns(true));

       try {
         for (const col of columnsToFetch) {
           fetchedColumnsRef.current.add(col.id);

           // [WHY] Check if data is already cached in dataset before fetching
           const cachedData = dataset[col.label];
           const hasCachedData = cachedData && Object.keys(cachedData).length > 0;

           let data: Record<string, unknown>;

           if (hasCachedData) {
             // [WHY] Use cached data to avoid redundant API call
             data = cachedData;
            } else {
              // [WHY] Fetch data from API if not cached
              const metadata = doeRegistry.byId[col.id];
              const columnMode = (metadata?.REVISION_MODE as 'PRE' | 'POST') ?? 
                                 (col.REVISION_MODE as 'PRE' | 'POST') ?? 
                                 'POST';

              const action = await dispatch(fetchDataset({
                project: (col.PROJECT_NAME as string) ?? '',
                block: (col.BLOCK as string) ?? '',
                netver: (col.NET_VER as string) ?? '',
                revision: (col.REVISION as string) ?? '',
                econum: (col.ECO_NUM as string) ?? undefined,
                doeName: col.label,
                revisionMode: columnMode,
                currentPage: currentPage,
              }));
              if (fetchDataset.fulfilled.match(action)) {
               data = (action.payload?.[col.label] ?? {}) as Record<string, unknown>;
             } else {
               data = {};
             }
           }

           // [WHY] Extract scenario and update cells for both cache hit and miss paths
           let scenarioName =
             (doeRegistry.byId[col.id]?.POWER_SCENARIO as string) ??
             (col.POWER_SCENARIO as string) ??
             "";
           if (!scenarioName) {
             const availableScenarios = extractAvailableScenarios(data);
             const selectedProject =
               (doeRegistry.byId[col.id]?.PROJECT_NAME as string) ??
               (col.PROJECT_NAME as string) ??
               null;
             scenarioName = getDefaultScenario(
               selectedProject,
               availableScenarios
             );

             if (doeRegistry.byId[col.id]) {
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

           // [WHY] columnMode needed for metric extraction - use from metadata or fallback to POST
           const metadata = doeRegistry.byId[col.id];
           const columnMode = (metadata?.REVISION_MODE as 'PRE' | 'POST') ?? 
                              (col.REVISION_MODE as 'PRE' | 'POST') ?? 
                              'POST';

           currentRowHeaders.forEach((row) => {
             const metricKey = `${row.rowGroup}!${row.label}`;
             let value = extractMetricValue(metricKey, data, scenarioName, columnMode);
             if (value === undefined) {
               value = "-";
             }
             dispatch(updateCell({ rowId: row.id, columnId: col.id, value }));
           });

            dispatch(markColumnFetched(col.id));
          }
       } finally {
        dispatch(setRevisionMode(globalMode));
        dispatch(setIsRestoringColumns(false));
        isFetching.current = false;
      }
    };

    fetchAllColumns();
  }, [dispatch, columnHeaders, rowHeaders, doeRegistry, revisionMode, dataset]);
}
