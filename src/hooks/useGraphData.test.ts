/**
 * @file useGraphData.test.ts
 * @purpose Tests for useGraphData hook - data extraction for chart rendering
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { createElement, type ReactNode } from 'react';
import { useGraphData } from './useGraphData';
import graphReducer from '@/store/reducers/graphSlice';
import matrixReducer from '@/store/matrixSlice';
import doeRegistryReducer from '@/store/doeRegistry';
import datasetReducer from '@/store/reducers/datasetReducer';
import selectedReducer from '@/store/reducers/selectedReducer';
import type { GraphWindow } from '@/store/reducers/graphSlice';

// ============================================
// TEST 1: Returns data points from preloaded state
// ============================================
describe('useGraphData', () => {
  it('returns data points from preloaded state', () => {
    const TEST_STATE_WITH_DATA = {
      graph: {
        windows: [{
          id: 'win1',
          chartType: 'line' as const,
          xAxis: { type: 'doeMetadata' as const, key: 'label' },
          yAxis: { type: 'metric' as const, key: 'Power(mW)!combinational_Total' },
          series: [{ id: 's1', metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true }],
          xRange: { min: 'auto' as const, max: 'auto' as const },
          yRange: { min: 'auto' as const, max: 'auto' as const },
          position: undefined,
          size: undefined,
          zIndex: 1,
        }],
        nextWindowId: 1,
        nextSeriesIdByWindow: { 'win1': 1 },
        maxZIndex: 1,
      },
      matrix: {
        columnHeaders: [{ id: 'col1', label: 'Test Column 1', accessorKey: 'col1' }],
        rowHeaders: [],
      },
      doeRegistry: {
        byId: {
          col1: {
            id: 'col1',
            label: 'DOE_LABEL_1',
            POWER_SCENARIO: 'tt_0.85v',
            PROJECT_NAME: 'test_project',
            BLOCK: 'test_block',
          },
        },
        allIds: ['col1'],
      },
      dataset: {
        'DOE_LABEL_1': {
          get_ptpxpower: {
            ptpxpower_data: {
              'tt_0.85v': {
                Total_power: { combinational: 100.5 },
              },
            },
          },
        },
      },
      selected: {
        selectedProject: null,
        selectedBlock: null,
        selectedNetver: null,
        selectedRevision: null,
        selectedEconum: null,
        doeName: '',
        columnPowerScenarios: {},
        revisionMode: 'POST' as const,
        isRestoringColumns: false,
      },
    };

    const store = configureStore({
      reducer: { graph: graphReducer, matrix: matrixReducer, doeRegistry: doeRegistryReducer, dataset: datasetReducer, selected: selectedReducer },
      preloadedState: TEST_STATE_WITH_DATA,
    });

    const window = TEST_STATE_WITH_DATA.graph.windows[0] as GraphWindow;
    
    function Wrapper({ children }: { children: ReactNode }) {
      return createElement(Provider, { store, children });
    }
    
    const { result } = renderHook(() => useGraphData(window), { wrapper: Wrapper });

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      doeId: 'col1',
      doeLabel: 'DOE_LABEL_1',
      seriesId: 's1',
      x: 'DOE_LABEL_1',
      y: 100.5,
      color: '#ff0000',
    });
  });

  // ============================================
  // TEST 2: Handles missing dataset gracefully
  // ============================================
  it('handles missing dataset gracefully', () => {
    const TEST_STATE_NO_DATASET = {
      graph: {
        windows: [{
          id: 'win1',
          chartType: 'line' as const,
          xAxis: { type: 'doeMetadata' as const, key: 'label' },
          yAxis: { type: 'metric' as const, key: 'Power(mW)!combinational_Total' },
          series: [{ id: 's1', metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true }],
          xRange: { min: 'auto' as const, max: 'auto' as const },
          yRange: { min: 'auto' as const, max: 'auto' as const },
          position: undefined,
          size: undefined,
          zIndex: 1,
        }],
        nextWindowId: 1,
        nextSeriesIdByWindow: { 'win1': 1 },
        maxZIndex: 1,
      },
      matrix: {
        columnHeaders: [{ id: 'col1', label: 'Test Column 1', accessorKey: 'col1' }],
        rowHeaders: [],
      },
      doeRegistry: {
        byId: {
          col1: {
            id: 'col1',
            label: 'DOE_LABEL_1',
            POWER_SCENARIO: 'tt_0.85v',
            PROJECT_NAME: 'test_project',
            BLOCK: 'test_block',
          },
        },
        allIds: ['col1'],
      },
      dataset: {}, // Empty dataset
      selected: {
        selectedProject: null,
        selectedBlock: null,
        selectedNetver: null,
        selectedRevision: null,
        selectedEconum: null,
        doeName: '',
        columnPowerScenarios: {},
        revisionMode: 'POST' as const,
        isRestoringColumns: false,
      },
    };

    const store = configureStore({
      reducer: { graph: graphReducer, matrix: matrixReducer, doeRegistry: doeRegistryReducer, dataset: datasetReducer, selected: selectedReducer },
      preloadedState: TEST_STATE_NO_DATASET,
    });

    const window = TEST_STATE_NO_DATASET.graph.windows[0] as GraphWindow;
    
    function Wrapper({ children }: { children: ReactNode }) {
      return createElement(Provider, { store, children });
    }
    
    const { result } = renderHook(() => useGraphData(window), { wrapper: Wrapper });

    expect(result.current).toEqual([]);
  });

  // ============================================
  // TEST 3: Respects series.enabled flag
  // ============================================
  it('respects series.enabled flag', () => {
    const TEST_STATE_DISABLED_SERIES = {
      graph: {
        windows: [{
          id: 'win1',
          chartType: 'line' as const,
          xAxis: { type: 'doeMetadata' as const, key: 'label' },
          yAxis: { type: 'metric' as const, key: 'Power(mW)!combinational_Total' },
          series: [
            { id: 's1', metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true },
            { id: 's2', metricKey: 'Power(mW)!register_Total', color: '#00ff00', enabled: false },
          ],
          xRange: { min: 'auto' as const, max: 'auto' as const },
          yRange: { min: 'auto' as const, max: 'auto' as const },
          position: undefined,
          size: undefined,
          zIndex: 1,
        }],
        nextWindowId: 1,
        nextSeriesIdByWindow: { 'win1': 2 },
        maxZIndex: 1,
      },
      matrix: {
        columnHeaders: [{ id: 'col1', label: 'Test Column 1', accessorKey: 'col1' }],
        rowHeaders: [],
      },
      doeRegistry: {
        byId: {
          col1: {
            id: 'col1',
            label: 'DOE_LABEL_1',
            POWER_SCENARIO: 'tt_0.85v',
            PROJECT_NAME: 'test_project',
            BLOCK: 'test_block',
          },
        },
        allIds: ['col1'],
      },
      dataset: {
        'DOE_LABEL_1': {
          get_ptpxpower: {
            ptpxpower_data: {
              'tt_0.85v': {
                Total_power: { combinational: 100.5, register: 50.2 },
              },
            },
          },
        },
      },
      selected: {
        selectedProject: null,
        selectedBlock: null,
        selectedNetver: null,
        selectedRevision: null,
        selectedEconum: null,
        doeName: '',
        columnPowerScenarios: {},
        revisionMode: 'POST' as const,
        isRestoringColumns: false,
      },
    };

    const store = configureStore({
      reducer: { graph: graphReducer, matrix: matrixReducer, doeRegistry: doeRegistryReducer, dataset: datasetReducer, selected: selectedReducer },
      preloadedState: TEST_STATE_DISABLED_SERIES,
    });

    const window = TEST_STATE_DISABLED_SERIES.graph.windows[0] as GraphWindow;
    
    function Wrapper({ children }: { children: ReactNode }) {
      return createElement(Provider, { store, children });
    }
    
    const { result } = renderHook(() => useGraphData(window), { wrapper: Wrapper });

    // Only enabled series (s1) should be in output
    expect(result.current).toHaveLength(1);
    expect(result.current[0].seriesId).toBe('s1');
    expect(result.current[0].y).toBe(100.5);
  });

  // ============================================
  // TEST 4: Handles missing POWER_SCENARIO
  // ============================================
  it('handles missing POWER_SCENARIO', () => {
    const TEST_STATE_NO_SCENARIO = {
      graph: {
        windows: [{
          id: 'win1',
          chartType: 'line' as const,
          xAxis: { type: 'doeMetadata' as const, key: 'label' },
          yAxis: { type: 'metric' as const, key: 'Power(mW)!combinational_Total' },
          series: [{ id: 's1', metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true }],
          xRange: { min: 'auto' as const, max: 'auto' as const },
          yRange: { min: 'auto' as const, max: 'auto' as const },
          position: undefined,
          size: undefined,
          zIndex: 1,
        }],
        nextWindowId: 1,
        nextSeriesIdByWindow: { 'win1': 1 },
        maxZIndex: 1,
      },
      matrix: {
        columnHeaders: [{ id: 'col1', label: 'Test Column 1', accessorKey: 'col1' }],
        rowHeaders: [],
      },
      doeRegistry: {
        byId: {
          col1: {
            id: 'col1',
            label: 'DOE_LABEL_1',
            // NO POWER_SCENARIO
            PROJECT_NAME: 'test_project',
            BLOCK: 'test_block',
          },
        },
        allIds: ['col1'],
      },
      dataset: {
        'DOE_LABEL_1': {
          get_ptpxpower: {
            ptpxpower_data: {
              'tt_0.85v': {
                Total_power: { combinational: 100.5 },
              },
            },
          },
        },
      },
      selected: {
        selectedProject: null,
        selectedBlock: null,
        selectedNetver: null,
        selectedRevision: null,
        selectedEconum: null,
        doeName: '',
        columnPowerScenarios: {},
        revisionMode: 'POST' as const,
        isRestoringColumns: false,
      },
    };

    const store = configureStore({
      reducer: { graph: graphReducer, matrix: matrixReducer, doeRegistry: doeRegistryReducer, dataset: datasetReducer, selected: selectedReducer },
      preloadedState: TEST_STATE_NO_SCENARIO,
    });

    const window = TEST_STATE_NO_SCENARIO.graph.windows[0] as GraphWindow;
    
    function Wrapper({ children }: { children: ReactNode }) {
      return createElement(Provider, { store, children });
    }
    
    const { result } = renderHook(() => useGraphData(window), { wrapper: Wrapper });

    // Should skip columns without scenario for Power metrics
    // extractMetricValue will return undefined without scenario
    expect(result.current).toEqual([]);
  });
});
