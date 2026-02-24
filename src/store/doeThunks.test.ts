import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import doeRegistryReducer from '@/store/doeRegistry';
import matrixReducer from '@/store/matrixSlice';
import powerMatrixReducer from '@/store/reducers/powerMatrixReducer';
import timingMatrixReducer from '@/store/reducers/timingMatrixReducer';
import datasetReducer from '@/store/reducers/datasetReducer';
import { addDoEToAll, reorderDoEsAll, renameDoEAll } from '@/store/doeThunks';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeStore() {
  return configureStore({
    reducer: {
      doeRegistry: doeRegistryReducer,
      matrix: matrixReducer,
      powerMatrix: powerMatrixReducer,
      timingMatrix: timingMatrixReducer,
      dataset: datasetReducer,
    },
  });
}

function seedStore(store: ReturnType<typeof makeStore>) {
  store.dispatch(addDoEToAll({ id: 'doe1', label: 'Alpha' }));
  store.dispatch(addDoEToAll({ id: 'doe2', label: 'Beta' }));
}

// ── reorderDoEsAll ────────────────────────────────────────────────────────────

describe('reorderDoEsAll', () => {
  it('reorders doeRegistry.allIds when doe2 moved over doe1', () => {
    const store = makeStore();
    seedStore(store);
    store.dispatch(reorderDoEsAll('doe2', 'doe1'));
    expect(store.getState().doeRegistry.allIds).toEqual(['doe2', 'doe1']);
  });

  it('reorders matrix.columnHeaders to match new order', () => {
    const store = makeStore();
    seedStore(store);
    store.dispatch(reorderDoEsAll('doe2', 'doe1'));
    const colIds = store.getState().matrix.columnHeaders.map((c) => c.id);
    expect(colIds).toEqual(['doe2', 'doe1']);
  });

  it('reorders powerMatrix.doeGroups to match new order', () => {
    const store = makeStore();
    seedStore(store);
    store.dispatch(reorderDoEsAll('doe2', 'doe1'));
    const groupIds = store.getState().powerMatrix.doeGroups.map((g) => g.id);
    expect(groupIds).toEqual(['doe2', 'doe1']);
  });

  it('reorders timingMatrix.rows to match new order', () => {
    const store = makeStore();
    seedStore(store);
    store.dispatch(reorderDoEsAll('doe2', 'doe1'));
    const rowIds = store.getState().timingMatrix.rows.map((r) => r.id);
    expect(rowIds).toEqual(['doe2', 'doe1']);
  });

  it('is a no-op when activeId and overId are in the same position', () => {
    const store = makeStore();
    seedStore(store);
    const before = store.getState().doeRegistry.allIds.slice();
    store.dispatch(reorderDoEsAll('doe1', 'doe1'));
    expect(store.getState().doeRegistry.allIds).toEqual(before);
  });

  it('is a no-op when overId does not exist', () => {
    const store = makeStore();
    seedStore(store);
    const before = store.getState().doeRegistry.allIds.slice();
    store.dispatch(reorderDoEsAll('doe1', 'nonexistent'));
    expect(store.getState().doeRegistry.allIds).toEqual(before);
  });
});

// ── renameDoEAll ──────────────────────────────────────────────────────────────

describe('renameDoEAll', () => {
  it('returns { success: false } for empty label', () => {
    const store = makeStore();
    seedStore(store);
    const result = store.dispatch(renameDoEAll('doe1', ''));
    expect(result).toMatchObject({ success: false });
  });

  it('returns { success: false } for whitespace-only label', () => {
    const store = makeStore();
    seedStore(store);
    const result = store.dispatch(renameDoEAll('doe1', '   '));
    expect(result).toMatchObject({ success: false });
  });

  it('returns { success: false } for non-existent doeId', () => {
    const store = makeStore();
    seedStore(store);
    const result = store.dispatch(renameDoEAll('ghost', 'Whatever'));
    expect(result).toMatchObject({ success: false });
  });

  it('returns { success: false } when newLabel duplicates another doe label', () => {
    const store = makeStore();
    seedStore(store);
    // 'Beta' is already the label of doe2
    const result = store.dispatch(renameDoEAll('doe1', 'Beta'));
    expect(result).toMatchObject({ success: false });
  });

  it('returns { success: true } when newLabel equals current label (no-op)', () => {
    const store = makeStore();
    seedStore(store);
    const result = store.dispatch(renameDoEAll('doe1', 'Alpha'));
    expect(result).toMatchObject({ success: true });
    // state must not change
    expect(store.getState().doeRegistry.byId['doe1'].label).toBe('Alpha');
  });

  it('successful rename returns { success: true } and updates doeRegistry label', () => {
    const store = makeStore();
    seedStore(store);
    const result = store.dispatch(renameDoEAll('doe1', 'Gamma'));
    expect(result).toMatchObject({ success: true });
    expect(store.getState().doeRegistry.byId['doe1'].label).toBe('Gamma');
  });

  it('successful rename updates matrix columnHeaders label', () => {
    const store = makeStore();
    seedStore(store);
    store.dispatch(renameDoEAll('doe1', 'Gamma'));
    const col = store.getState().matrix.columnHeaders.find((c) => c.id === 'doe1');
    expect(col?.label).toBe('Gamma');
  });

  it('successful rename updates powerMatrix doeGroup label', () => {
    const store = makeStore();
    seedStore(store);
    store.dispatch(renameDoEAll('doe1', 'Gamma'));
    const group = store.getState().powerMatrix.doeGroups.find((g) => g.id === 'doe1');
    expect(group?.label).toBe('Gamma');
  });

  it('successful rename updates timingMatrix row label', () => {
    const store = makeStore();
    seedStore(store);
    store.dispatch(renameDoEAll('doe1', 'Gamma'));
    const row = store.getState().timingMatrix.rows.find((r) => r.id === 'doe1');
    expect(row?.label).toBe('Gamma');
  });

  it('migrates dataset key from old label to new label', () => {
    const store = makeStore();
    seedStore(store);
    // Seed dataset under the old label 'Alpha' via fulfilled action shape
    store.dispatch({
      type: 'dataset/fetch/fulfilled',
      payload: { Alpha: { metric1: 42 } },
      meta: { arg: { doeName: 'Alpha' } },
    });
    expect(store.getState().dataset.data).toHaveProperty('Alpha');

    store.dispatch(renameDoEAll('doe1', 'Gamma'));

    expect(store.getState().dataset.data).not.toHaveProperty('Alpha');
    expect(store.getState().dataset.data).toHaveProperty('Gamma');
    expect(store.getState().dataset.data['Gamma']).toEqual({ metric1: 42 });
  });
});
