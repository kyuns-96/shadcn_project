import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { arrayMove } from "@dnd-kit/sortable";

export interface MatrixState {
  columnHeaders: Array<{
    id: string;
    label: string;
    accessorKey: string;
    [key: string]: any;
  }>;
  rowHeaders: Array<{
    id: string;
    label: string;
    rowGroup: string; // Row header group for row spanning
    data: any;
    [key: string]: any;
  }>;
}

const initialState: MatrixState = {
  columnHeaders: [],
  rowHeaders: [],
};

const matrixSlice = createSlice({
  name: "matrix",
  initialState,
  reducers: {
    setColumnHeaders: (
      state,
      action: PayloadAction<MatrixState["columnHeaders"]>
    ) => {
      state.columnHeaders = action.payload;
    },
    setRowHeaders: (
      state,
      action: PayloadAction<MatrixState["rowHeaders"]>
    ) => {
      state.rowHeaders = action.payload;
    },
    moveColumn: (
      state,
      action: PayloadAction<{ activeId: string; overId: string }>
    ) => {
      const { activeId, overId } = action.payload;
      const oldIndex = state.columnHeaders.findIndex(
        (col) => col.id === activeId
      );
      const newIndex = state.columnHeaders.findIndex(
        (col) => col.id === overId
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        state.columnHeaders = arrayMove(
          state.columnHeaders,
          oldIndex,
          newIndex
        );
      }
    },
    moveRow: (
      state,
      action: PayloadAction<{ activeId: string; overId: string }>
    ) => {
      const { activeId, overId } = action.payload;
      const oldIndex = state.rowHeaders.findIndex((row) => row.id === activeId);
      const newIndex = state.rowHeaders.findIndex((row) => row.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        state.rowHeaders = arrayMove(state.rowHeaders, oldIndex, newIndex);
      }
    },
    moveGroup: (
      state,
      action: PayloadAction<{ groupName: string; targetIndex: number }>
    ) => {
      const { groupName, targetIndex } = action.payload;

      // Find all rows belonging to this group
      const groupRows = state.rowHeaders.filter(
        (row) => row.rowGroup === groupName
      );
      const otherRows = state.rowHeaders.filter(
        (row) => row.rowGroup !== groupName
      );

      if (groupRows.length === 0) return;

      // Insert the group at the target position
      const result = [...otherRows];
      const insertAt = Math.min(Math.max(0, targetIndex), result.length);
      result.splice(insertAt, 0, ...groupRows);

      state.rowHeaders = result;
    },
    reorderRows: (state, action: PayloadAction<MatrixState["rowHeaders"]>) => {
      state.rowHeaders = action.payload;
    },
    addRow: (
      state,
      action: PayloadAction<{
        id?: string;
        label: string;
        rowGroup: string;
        data?: Record<string, any>;
      }>
    ) => {
      const { label, rowGroup, data } = action.payload;
      const id = action.payload.id || `row-${Date.now()}`;

      // Initialize data with empty values for all existing columns if not provided
      const rowData =
        data ||
        state.columnHeaders.reduce((acc, col) => {
          acc[col.id] = "";
          return acc;
        }, {} as Record<string, any>);

      state.rowHeaders.push({
        id,
        label,
        rowGroup,
        data: rowData,
      });
    },
    addColumn: (
      state,
      action: PayloadAction<{
        id?: string;
        label: string;
        accessorKey?: string;
        defaultValue?: any;
        meta?: {
          PROJECT_NAME?: string;
          BLOCK?: string;
          NET_VER?: string;
          REVISION?: string;
          ECO_NUM?: string;
        };
      }>
    ) => {
      const { label, defaultValue = "", meta } = action.payload;
      const id = action.payload.id || `col-${Date.now()}`;
      const accessorKey = action.payload.accessorKey || id;

      // Add the new column header
      state.columnHeaders.push({
        id,
        label,
        accessorKey,
        ...(meta || {}),
      });

      // Add default value for this column to all existing rows
      state.rowHeaders.forEach((row) => {
        row.data[id] = defaultValue;
      });
    },
    updateCell: (
      state,
      action: PayloadAction<{
        rowId: string;
        columnId: string;
        value: any;
      }>
    ) => {
      const { rowId, columnId, value } = action.payload;
      const row = state.rowHeaders.find((r) => r.id === rowId);

      if (row) {
        row.data[columnId] = value;
      }
    },
    deleteRows: (state, action: PayloadAction<string[]>) => {
      const idsToDelete = new Set(action.payload);
      state.rowHeaders = state.rowHeaders.filter(
        (row) => !idsToDelete.has(row.id)
      );
    },
  },
});

export const {
  setColumnHeaders,
  setRowHeaders,
  moveColumn,
  moveRow,
  moveGroup,
  reorderRows,
  addRow,
  addColumn,
  updateCell,
  deleteRows,
} = matrixSlice.actions;
export default matrixSlice.reducer;
