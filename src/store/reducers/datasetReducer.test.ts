import { describe, it, expect, vi } from 'vitest';
import datasetReducer, { 
  fetchDataset, 
  type FetchDatasetParams,
  type DatasetState,
  selectDatasetLoading,
  selectDatasetError,
  selectAnyDatasetLoading,
} from './datasetReducer';

vi.mock('../../api/fetchDataset', () => ({
  fetchDataset: vi.fn(),
}));
vi.mock('../../api/fetchFunctionList', () => ({
  fetchFunctionList: vi.fn(),
}));

describe('datasetReducer', () => {
  describe('FetchDatasetParams type', () => {
    it('exports FetchDatasetParams interface with required fields', () => {
      const params: FetchDatasetParams = {
        project: 'testProj',
        block: 'testBlock',
        netver: 'testNv',
        revision: 'testRev',
        econum: 'testEco',
        doeName: 'testDoe',
        revisionMode: 'PRE',
        currentPage: 'timing',
      };
      expect(params.project).toBe('testProj');
      expect(params.revisionMode).toBe('PRE');
    });

    it('allows optional econum field', () => {
      const params: FetchDatasetParams = {
        project: 'testProj',
        block: 'testBlock',
        netver: 'testNv',
        revision: 'testRev',
        doeName: 'testDoe',
        revisionMode: 'POST',
        currentPage: 'power',
      };
      expect(params.econum).toBeUndefined();
    });
  });

  describe('fetchDataset thunk signature', () => {
    it('is a function that accepts FetchDatasetParams', () => {
      const params: FetchDatasetParams = {
        project: 'proj',
        block: 'blk',
        netver: 'nv',
        revision: 'rev',
        doeName: 'doe',
        revisionMode: 'POST',
        currentPage: 'timing',
      };
      
      expect(fetchDataset).toBeTypeOf('function');
      expect(() => fetchDataset(params)).not.toThrow();
    });
  });

  describe('reducer fulfilled action', () => {
    it('merges payload with existing state on fulfilled', () => {
      const initialState: DatasetState = { 
        data: { existingDoe: { data: 'old' } },
        loading: {},
        error: {},
      };
      const fulfilledAction = {
        type: fetchDataset.fulfilled.type,
        payload: { newDoe: { endpoint1: { data: 'new' } } },
        meta: { arg: { doeName: 'newDoe' } as FetchDatasetParams },
      };
      
      const newState = datasetReducer(initialState, fulfilledAction);
      expect(newState.data).toEqual({
        existingDoe: { data: 'old' },
        newDoe: { endpoint1: { data: 'new' } },
      });
      expect(newState.loading['newDoe']).toBe(false);
    });

    it('preserves existing keys when adding new ones', () => {
      const initialState: DatasetState = { 
        data: {
          doe1: { endpoint1: 'data1' },
          doe2: { endpoint2: 'data2' },
        },
        loading: {},
        error: {},
      };
      const fulfilledAction = {
        type: fetchDataset.fulfilled.type,
        payload: { doe3: { endpoint3: 'data3' } },
        meta: { arg: { doeName: 'doe3' } as FetchDatasetParams },
      };
      
      const newState = datasetReducer(initialState, fulfilledAction);
      expect(newState.data.doe1).toEqual({ endpoint1: 'data1' });
      expect(newState.data.doe2).toEqual({ endpoint2: 'data2' });
      expect(newState.data.doe3).toEqual({ endpoint3: 'data3' });
    });

    it('overwrites existing doe data with same key', () => {
      const initialState: DatasetState = { 
        data: { testDoe: { endpoint1: 'old' } },
        loading: {},
        error: {},
      };
      const fulfilledAction = {
        type: fetchDataset.fulfilled.type,
        payload: { testDoe: { endpoint1: 'new', endpoint2: 'added' } },
        meta: { arg: { doeName: 'testDoe' } as FetchDatasetParams },
      };
      
      const newState = datasetReducer(initialState, fulfilledAction);
      expect(newState.data.testDoe).toEqual({ endpoint1: 'new', endpoint2: 'added' });
    });

    it('handles empty initial state', () => {
      const fulfilledAction = {
        type: fetchDataset.fulfilled.type,
        payload: { doe1: { endpoint: 'data' } },
        meta: { arg: { doeName: 'doe1' } as FetchDatasetParams },
      };
      
      const newState = datasetReducer(undefined, fulfilledAction);
      expect(newState.data).toEqual({ doe1: { endpoint: 'data' } });
    });

    it('handles empty payload', () => {
      const initialState: DatasetState = { 
        data: { existingDoe: { data: 'kept' } },
        loading: {},
        error: {},
      };
      const fulfilledAction = {
        type: fetchDataset.fulfilled.type,
        payload: {},
        meta: { arg: { doeName: 'testDoe' } as FetchDatasetParams },
      };
      
      const newState = datasetReducer(initialState, fulfilledAction);
      expect(newState.data).toEqual({ existingDoe: { data: 'kept' } });
    });
  });

  describe('reducer state structure', () => {
    it('initializes with empty object', () => {
      const state = datasetReducer(undefined, { type: 'unknown' });
      expect(state).toEqual({ data: {}, loading: {}, error: {} });
    });

    it('maintains state on unknown action', () => {
      const initialState: DatasetState = { 
        data: { test: { data: 'value' } },
        loading: {},
        error: {},
      };
      const state = datasetReducer(initialState, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('pending handler', () => {
    it('sets loading to true and clears error', () => {
      const initialState: DatasetState = {
        data: {},
        loading: {},
        error: { testDoe: 'previous error' },
      };
      const pendingAction = {
        type: fetchDataset.pending.type,
        meta: { 
          arg: { 
            doeName: 'testDoe',
            project: 'proj',
            block: 'blk',
            netver: 'nv',
            revision: 'rev',
            revisionMode: 'POST' as const,
            currentPage: 'timing',
          } 
        },
      };

      const newState = datasetReducer(initialState, pendingAction);
      expect(newState.loading['testDoe']).toBe(true);
      expect(newState.error['testDoe']).toBeNull();
    });
  });

  describe('rejected handler', () => {
    it('sets loading to false and stores error message', () => {
      const initialState: DatasetState = {
        data: {},
        loading: { testDoe: true },
        error: {},
      };
      const rejectedAction = {
        type: fetchDataset.rejected.type,
        payload: 'Failed to fetch dataset',
        meta: { 
          arg: { 
            doeName: 'testDoe',
            project: 'proj',
            block: 'blk',
            netver: 'nv',
            revision: 'rev',
            revisionMode: 'POST' as const,
            currentPage: 'timing',
          } 
        },
      };

      const newState = datasetReducer(initialState, rejectedAction);
      expect(newState.loading['testDoe']).toBe(false);
      expect(newState.error['testDoe']).toBe('Failed to fetch dataset');
    });

    it('uses default error message when payload is undefined', () => {
      const initialState: DatasetState = {
        data: {},
        loading: { testDoe: true },
        error: {},
      };
      const rejectedAction = {
        type: fetchDataset.rejected.type,
        payload: undefined,
        meta: { 
          arg: { 
            doeName: 'testDoe',
            project: 'proj',
            block: 'blk',
            netver: 'nv',
            revision: 'rev',
            revisionMode: 'POST' as const,
            currentPage: 'timing',
          } 
        },
      };

      const newState = datasetReducer(initialState, rejectedAction);
      expect(newState.error['testDoe']).toBe('Unknown error');
    });
  });

  describe('selectors', () => {
    type SelectorState = Parameters<typeof selectAnyDatasetLoading>[0];

    const mockState = {
      dataset: {
        data: { doe1: { endpoint: 'data' } },
        loading: { doe1: true, doe2: false },
        error: { doe1: null, doe3: 'Error message' },
      },
    } as unknown as SelectorState;

    it('selectDatasetLoading returns loading state for doeName', () => {
      expect(selectDatasetLoading('doe1')(mockState)).toBe(true);
      expect(selectDatasetLoading('doe2')(mockState)).toBe(false);
      expect(selectDatasetLoading('nonexistent')(mockState)).toBe(false);
    });

    it('selectDatasetError returns error state for doeName', () => {
      expect(selectDatasetError('doe1')(mockState)).toBeNull();
      expect(selectDatasetError('doe3')(mockState)).toBe('Error message');
      expect(selectDatasetError('nonexistent')(mockState)).toBeNull();
    });

    it('selectAnyDatasetLoading returns true if any dataset is loading', () => {
      expect(selectAnyDatasetLoading(mockState)).toBe(true);
      
       const noneLoadingState = {
         dataset: {
           data: {},
           loading: { doe1: false, doe2: false },
           error: {},
         },
       } as unknown as SelectorState;
       expect(selectAnyDatasetLoading(noneLoadingState)).toBe(false);
     });
   });
 });
