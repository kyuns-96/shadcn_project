import type { AppDispatch, RootState } from "@/store";
import { removeColumn, updateColumnLabel, setColumnHeaders, addColumn, resetMatrix } from "@/store/matrixSlice";
import { removeDoE, updateDoELabel, addDoE, setDoEs, resetDoERegistry } from "@/store/doeRegistry";
import {
  removeDoeGroup,
  updateDoeGroupLabel,
  addDoeGroup,
  reorderDoeGroups,
  resetPowerMatrix,
} from "@/store/reducers/powerMatrixReducer";
import {
  removeTimingRow,
  updateTimingRowLabel,
  addTimingRow,
  reorderTimingRows,
  resetTimingMatrix,
} from "@/store/reducers/timingMatrixReducer";
import { clearColumnPowerScenario, resetColumnPowerScenarios } from "@/store/reducers/selectedReducer";
import { renameDatasetKey } from "@/store/reducers/datasetReducer";
import { arrayMove } from "@dnd-kit/sortable";

export type AppThunk<ReturnType = void> = (
  dispatch: AppDispatch,
  getState: () => RootState
) => ReturnType;

export interface AddDoEPayload {
  id: string;
  label: string;
  PROJECT_NAME?: string;
  BLOCK?: string;
  NET_VER?: string;
  REVISION?: string;
  ECO_NUM?: string;
  defaultValue?: string;
  _needsDataFetch?: boolean;
}

export const removeDoEFromAll =
  (doeId: string): AppThunk =>
  (dispatch) => {
    dispatch(removeColumn(doeId));
    dispatch(removeDoE(doeId));
    dispatch(removeDoeGroup(doeId));
    dispatch(removeTimingRow(doeId));
    dispatch(clearColumnPowerScenario(doeId));
  };

export const addDoEToAll =
  (payload: AddDoEPayload): AppThunk =>
  (dispatch) => {
    const {
      id,
      label,
      PROJECT_NAME,
      BLOCK,
      NET_VER,
      REVISION,
      ECO_NUM,
      defaultValue = "___LOADING___",
      _needsDataFetch = true,
    } = payload;

    dispatch(addDoE({ id, label, PROJECT_NAME, BLOCK, NET_VER, REVISION, ECO_NUM }));
    dispatch(addColumn({ id, label, defaultValue }));
    dispatch(addDoeGroup({ id, label, defaultValue, _needsDataFetch }));
    dispatch(addTimingRow({ id, label, _needsDataFetch }));
  };

export const updateDoELabelAll =
  (doeId: string, newLabel: string): AppThunk =>
  (dispatch) => {
    dispatch(updateColumnLabel({ columnId: doeId, label: newLabel }));
    dispatch(updateDoELabel({ doeId, label: newLabel }));
    dispatch(updateDoeGroupLabel({ doeId, label: newLabel }));
    dispatch(updateTimingRowLabel({ rowId: doeId, label: newLabel }));
  };

/**
 * Clears all DoE-related state across all slices.
 * Used by Reset button in metadata tables.
 */
export const resetAllDoEs = (): AppThunk => (dispatch) => {
  dispatch(resetDoERegistry());
  dispatch(resetMatrix());
  dispatch(resetPowerMatrix());
  dispatch(resetTimingMatrix());
  dispatch(resetColumnPowerScenarios());
};

export const reorderDoEsAll =
  (activeId: string, overId: string): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    const { allIds, byId } = state.doeRegistry;

    const oldIndex = allIds.indexOf(activeId);
    const newIndex = allIds.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    const newIds = arrayMove([...allIds], oldIndex, newIndex);

    const newDoes = newIds.map(id => byId[id]).filter(Boolean);

    const { columnHeaders } = state.matrix;
    const colMap = new Map(columnHeaders.map(c => [c.id, c]));
    const knownCols = newIds.map(id => colMap.get(id)).filter(Boolean) as typeof columnHeaders;
    const unknownCols = columnHeaders.filter(c => !new Set(newIds).has(c.id));
    const newColumnHeaders = [...knownCols, ...unknownCols];

    dispatch(setDoEs(newDoes));
    dispatch(setColumnHeaders(newColumnHeaders));
    dispatch(reorderDoeGroups(newIds));
    dispatch(reorderTimingRows(newIds));
  };

export const renameDoEAll =
  (doeId: string, newLabelRaw: string): AppThunk<{ success: boolean; error?: string }> =>
  (dispatch, getState) => {
    const newLabel = newLabelRaw.trim();
    if (!newLabel) return { success: false, error: 'Label cannot be empty' };

    const state = getState();
    const { byId } = state.doeRegistry;
    const entry = byId[doeId];
    if (!entry) return { success: false, error: 'DoE not found' };

    const oldLabel = entry.label;
    if (oldLabel === newLabel) return { success: true };

    const isDuplicate = Object.values(byId).some(
      doe => doe.id !== doeId && doe.label === newLabel
    );
    if (isDuplicate) return { success: false, error: `"${newLabel}" already exists` };

    dispatch(renameDatasetKey({ from: oldLabel, to: newLabel }));
    dispatch(updateDoELabel({ doeId, label: newLabel }));
    dispatch(updateColumnLabel({ columnId: doeId, label: newLabel }));
    dispatch(updateDoeGroupLabel({ doeId, label: newLabel }));
    dispatch(updateTimingRowLabel({ rowId: doeId, label: newLabel }));

    return { success: true };
  };
