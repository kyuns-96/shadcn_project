import type { AppDispatch, RootState } from "@/store";
import { removeColumn, updateColumnLabel, addColumn } from "@/store/matrixSlice";
import { removeDoE, updateDoELabel, addDoE } from "@/store/doeRegistry";
import {
  removeDoeGroup,
  updateDoeGroupLabel,
  addDoeGroup,
} from "@/store/reducers/powerMatrixReducer";
import {
  removeTimingRow,
  updateTimingRowLabel,
  addTimingRow,
} from "@/store/reducers/timingMatrixReducer";
import { clearColumnPowerScenario } from "@/store/reducers/selectedReducer";

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
