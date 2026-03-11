import { describe, expect, it, vi } from 'vitest';

import blockListReducer, { fetchBlockList } from './blockListReducer';
import projectListReducer, { fetchProjectList } from './projectListReducer';
import revisionListReducer, { fetchRevisionList } from './revisionListReducer';

vi.mock('../../api/fetchBlockList', () => ({
  fetchBlockList: vi.fn(),
}));

vi.mock('../../api/fetchProjectList', () => ({
  fetchProjectList: vi.fn(),
}));

vi.mock('../../api/fetchRevisionList', () => ({
  fetchRevisionList: vi.fn(),
}));

describe('list reducers', () => {
  it('initializes project list with items, status, and error', () => {
    expect(projectListReducer(undefined, { type: 'unknown' })).toEqual({
      items: [],
      status: 'idle',
      error: null,
    });
  });

  it('stores project list payload on fulfilled', () => {
    const state = projectListReducer(
      undefined,
      fetchProjectList.fulfilled(['proj-a', 'proj-b'], '', undefined)
    );

    expect(state).toEqual({
      items: ['proj-a', 'proj-b'],
      status: 'idle',
      error: null,
    });
  });

  it('sets project list status to failed on rejected', () => {
    const state = projectListReducer(
      undefined,
      fetchProjectList.rejected(new Error('fail'), '', undefined, 'fail')
    );

    expect(state.status).toBe('failed');
    expect(state.error).toBe('fail');
  });

  it('sets block list status to loading on pending', () => {
    const state = blockListReducer(
      undefined,
      fetchBlockList.pending('', 'project-a')
    );

    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('sets block list status to failed on rejected', () => {
    const state = blockListReducer(
      undefined,
      fetchBlockList.rejected(new Error('fail'), '', 'project-a', 'fail')
    );

    expect(state.status).toBe('failed');
    expect(state.error).toBe('fail');
  });

  it('sets revision list status to failed on rejected', () => {
    const arg = {
      projectName: 'project-a',
      blockName: 'block-a',
      netverName: 'netver-a',
    };
    const state = revisionListReducer(
      undefined,
      fetchRevisionList.rejected(new Error('fail'), '', arg, 'fail')
    );

    expect(state.status).toBe('failed');
    expect(state.error).toBe('fail');
  });
});
