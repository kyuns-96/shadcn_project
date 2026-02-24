import { describe, it, expect } from 'vitest';
import datasetReducer, { renameDatasetKey, type DatasetState } from './datasetReducer';

describe('renameDatasetKey', () => {
  // ── no-op cases ──────────────────────────────────────────────────────────

  it('is a no-op when from === to', () => {
    const state: DatasetState = {
      data: { doe1: { k1: 'v1' } },
      loading: { doe1: true },
      error: { doe1: null },
    };
    const next = datasetReducer(state, renameDatasetKey({ from: 'doe1', to: 'doe1' }));
    expect(next).toEqual(state);
  });

  it('does not crash and leaves state unchanged when from key is absent from data', () => {
    const state: DatasetState = {
      data: { doe1: { k1: 'v1' } },
      loading: {},
      error: {},
    };
    const next = datasetReducer(state, renameDatasetKey({ from: 'nonexistent', to: 'doe2' }));
    expect(next).toEqual(state);
  });

  // ── basic migration ───────────────────────────────────────────────────────

  it('moves data from `from` to `to` when `to` does not exist', () => {
    const state: DatasetState = {
      data: { doe1: { k1: 'v1', k2: 'v2' } },
      loading: {},
      error: {},
    };
    const next = datasetReducer(state, renameDatasetKey({ from: 'doe1', to: 'doe2' }));
    expect(next.data).not.toHaveProperty('doe1');
    expect(next.data['doe2']).toEqual({ k1: 'v1', k2: 'v2' });
  });

  // ── merge policy — dest wins ──────────────────────────────────────────────

  it('merges data with dest winning when both from and to exist in data', () => {
    const state: DatasetState = {
      data: {
        doe1: { k1: 'src', k2: 'src' },
        doe2: { k1: 'dest' },
      },
      loading: {},
      error: {},
    };
    // dest wins: k1 keeps 'dest', k2 is promoted from source
    const next = datasetReducer(state, renameDatasetKey({ from: 'doe1', to: 'doe2' }));
    expect(next.data).not.toHaveProperty('doe1');
    expect(next.data['doe2']).toEqual({ k1: 'dest', k2: 'src' });
  });

  // ── loading migration ─────────────────────────────────────────────────────

  it('copies loading[from] to loading[to] when to is not already present', () => {
    const state: DatasetState = {
      data: { doe1: {} },
      loading: { doe1: true },
      error: {},
    };
    const next = datasetReducer(state, renameDatasetKey({ from: 'doe1', to: 'doe2' }));
    expect(next.loading).not.toHaveProperty('doe1');
    expect(next.loading['doe2']).toBe(true);
  });

  it('keeps existing loading[to] when to already has a loading entry (dest wins)', () => {
    const state: DatasetState = {
      data: { doe1: {} },
      loading: { doe1: true, doe2: false },
      error: {},
    };
    const next = datasetReducer(state, renameDatasetKey({ from: 'doe1', to: 'doe2' }));
    expect(next.loading).not.toHaveProperty('doe1');
    // doe2 keeps its own false value — dest wins
    expect(next.loading['doe2']).toBe(false);
  });

  // ── error migration ───────────────────────────────────────────────────────

  it('copies error[from] to error[to] when to is not already present', () => {
    const state: DatasetState = {
      data: { doe1: {} },
      loading: {},
      error: { doe1: 'some error' },
    };
    const next = datasetReducer(state, renameDatasetKey({ from: 'doe1', to: 'doe2' }));
    expect(next.error).not.toHaveProperty('doe1');
    expect(next.error['doe2']).toBe('some error');
  });

  it('keeps existing error[to] when to already has an error entry (dest wins)', () => {
    const state: DatasetState = {
      data: { doe1: {} },
      loading: {},
      error: { doe1: 'from-error', doe2: 'dest-error' },
    };
    const next = datasetReducer(state, renameDatasetKey({ from: 'doe1', to: 'doe2' }));
    expect(next.error).not.toHaveProperty('doe1');
    expect(next.error['doe2']).toBe('dest-error');
  });

  // ── from key deletion ─────────────────────────────────────────────────────

  it('deletes data[from], loading[from], and error[from] after migration', () => {
    const state: DatasetState = {
      data: { doe1: { x: 1 } },
      loading: { doe1: false },
      error: { doe1: null },
    };
    const next = datasetReducer(state, renameDatasetKey({ from: 'doe1', to: 'doe2' }));
    expect(next.data).not.toHaveProperty('doe1');
    expect(next.loading).not.toHaveProperty('doe1');
    expect(next.error).not.toHaveProperty('doe1');
  });

  // ── to key absent from loading/error ─────────────────────────────────────

  it('assigns loading[from] to loading[to] when to is absent', () => {
    const state: DatasetState = {
      data: { alpha: { row: 1 } },
      loading: { alpha: false },
      error: {},
    };
    const next = datasetReducer(state, renameDatasetKey({ from: 'alpha', to: 'beta' }));
    expect(next.loading['beta']).toBe(false);
    expect(next.error).not.toHaveProperty('beta');
  });

  it('assigns error[from] to error[to] when to is absent in error', () => {
    const state: DatasetState = {
      data: { alpha: {} },
      loading: {},
      error: { alpha: 'load fail' },
    };
    const next = datasetReducer(state, renameDatasetKey({ from: 'alpha', to: 'beta' }));
    expect(next.error['beta']).toBe('load fail');
  });
});
