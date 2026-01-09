import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { arrayMove } from "@dnd-kit/sortable";

export interface ColumnHeader {
  id: string;
  label: string;
  accessorKey: string;
  _needsDataFetch?: boolean; // Flag for URL restoration
  [key: string]: unknown;
}

export interface RowHeader {
  id: string;
  label: string;
  rowGroup: string; // Row header group for row spanning
  data: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MatrixState {
  columnHeaders: ColumnHeader[];
  rowHeaders: RowHeader[];
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
      // Initialize data for new columns in existing rows
      const columnIds = new Set(action.payload.map((col) => col.id));
      state.rowHeaders.forEach((row) => {
        columnIds.forEach((colId) => {
          if (!(colId in row.data)) {
            row.data[colId] = "";
          }
        });
      });
    },
    // [WHY] Restore columns from URL with _needsDataFetch flag
    // This action is called during URL restoration to set up columns that need their data fetched
    restoreColumnsFromURL: (
      state,
      action: PayloadAction<MatrixState["columnHeaders"]>
    ) => {
      // [WHY] Mark columns as needing data fetch so useRestoreColumnData knows to fetch them
      state.columnHeaders = action.payload.map((col) => ({
        ...col,
        _needsDataFetch: true,
      }));
      // [WHY] Initialize data for new columns in existing rows with loading placeholder
      // Note: If rowHeaders is empty at this point (template not initialized yet),
      // the addRow reducer will handle initializing the column data for new rows
      const columnIds = action.payload.map((col) => col.id);
      state.rowHeaders.forEach((row) => {
        columnIds.forEach((colId) => {
          if (!(colId in row.data)) {
            row.data[colId] = "___LOADING___";
          }
        });
      });
    },
    // Mark a column as having fetched data
    markColumnFetched: (state, action: PayloadAction<string>) => {
      const col = state.columnHeaders.find((c) => c.id === action.payload);
      if (col) {
        col._needsDataFetch = false;
      }
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

      // [WHY] Initialize data with empty values or loading placeholder for all existing columns
      // This is critical for URL restoration: when rows are added after columns are restored from URL,
      // the columns with _needsDataFetch flag should have loading placeholder to indicate pending data
      const rowData =
        data ||
        state.columnHeaders.reduce((acc, col) => {
          // [WHY] Use loading placeholder for columns awaiting data fetch from URL restoration
          acc[col.id] = col._needsDataFetch ? "___LOADING___" : "";
          return acc;
        }, {} as Record<string, any>);

      // [WHY] Merge provided data with any missing column initializations
      // This ensures columns restored from URL are properly initialized even if partial data is provided
      if (data) {
        state.columnHeaders.forEach((col) => {
          if (!(col.id in rowData)) {
            rowData[col.id] = col._needsDataFetch ? "___LOADING___" : "";
          }
        });
      }

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
        _needsDataFetch?: boolean;
        meta?: {
          PROJECT_NAME?: string;
          BLOCK?: string;
          NET_VER?: string;
          REVISION?: string;
          ECO_NUM?: string;
          POWER_SCENARIO?: string;
          AVAILABLE_SCENARIOS?: string[];
        };
      }>
    ) => {
      const { label, defaultValue = "", _needsDataFetch } = action.payload;
      const id = action.payload.id || `col-${Date.now()}`;
      const accessorKey = action.payload.accessorKey || id;
      const meta = action.payload.meta || {};

      // [WHY] Add new column header without metadata in the header object
      // Metadata is now managed in doeRegistry, not here
      // But we keep _needsDataFetch flag for data fetching logic
      state.columnHeaders.push({
        id,
        label,
        accessorKey,
        _needsDataFetch,
        ...meta,
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
    removeColumn: (state, action: PayloadAction<string>) => {
      const columnId = action.payload;
      // Remove from column headers
      state.columnHeaders = state.columnHeaders.filter(
        (col) => col.id !== columnId
      );
      // Remove column data from all rows
      state.rowHeaders.forEach((row) => {
        delete row.data[columnId];
      });
    },
    updateColumnScenario: (
      _state,
      _action: PayloadAction<{
        columnId: string;
        scenario: string;
        availableScenarios?: string[];
      }>
    ) => {
      // [WHY] Deprecated - scenarios now managed in doeRegistry
      // This is kept for backwards compatibility but no longer used
    },
  },
});

export const {
  setColumnHeaders,
  restoreColumnsFromURL,
  markColumnFetched,
  setRowHeaders,
  moveColumn,
  moveRow,
  moveGroup,
  reorderRows,
  addRow,
  addColumn,
  updateCell,
  deleteRows,
  removeColumn,
  updateColumnScenario,
} = matrixSlice.actions;
export default matrixSlice.reducer;
