import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { arrayMove } from '@dnd-kit/sortable'

export interface MatrixState {
  columnHeaders: Array<{
    id: string
    label: string
    accessorKey: string
    [key: string]: any
  }>
  rowHeaders: Array<{
    id: string
    label: string
    rowGroup: string  // Row header group for row spanning
    data: any
    [key: string]: any
  }>
}

const initialState: MatrixState = {
  columnHeaders: [
    { id: 'col-1', label: 'Column 1', accessorKey: 'col-1' },
    { id: 'col-2', label: 'Column 2', accessorKey: 'col-2' },
    { id: 'col-3', label: 'Column 3', accessorKey: 'col-3' },
  ],
  rowHeaders: [
    { id: 'row-1', label: 'Row 1-1', rowGroup: 'Group A', data: { 'col-1': 'R1C1', 'col-2': 'R1C2', 'col-3': 'R1C3' } },
    { id: 'row-2', label: 'Row 1-2', rowGroup: 'Group A', data: { 'col-1': 'R2C1', 'col-2': 'R2C2', 'col-3': 'R2C3' } },
    { id: 'row-3', label: 'Row 1-3', rowGroup: 'Group A', data: { 'col-1': 'R3C1', 'col-2': 'R3C2', 'col-3': 'R3C3' } },
    { id: 'row-4', label: 'Row 2-1', rowGroup: 'Group B', data: { 'col-1': 'R4C1', 'col-2': 'R4C2', 'col-3': 'R4C3' } },
    { id: 'row-5', label: 'Row 2-2', rowGroup: 'Group B', data: { 'col-1': 'R5C1', 'col-2': 'R5C2', 'col-3': 'R5C3' } },
    { id: 'row-6', label: 'Row 3-1', rowGroup: 'Group C', data: { 'col-1': 'R6C1', 'col-2': 'R6C2', 'col-3': 'R6C3' } },
  ]
}

const matrixSlice = createSlice({
  name: 'matrix',
  initialState,
  reducers: {
    setColumnHeaders: (state, action: PayloadAction<MatrixState['columnHeaders']>) => {
      state.columnHeaders = action.payload
    },
    setRowHeaders: (state, action: PayloadAction<MatrixState['rowHeaders']>) => {
      state.rowHeaders = action.payload
    },
    moveColumn: (state, action: PayloadAction<{ activeId: string; overId: string }>) => {
      const { activeId, overId } = action.payload
      const oldIndex = state.columnHeaders.findIndex(col => col.id === activeId)
      const newIndex = state.columnHeaders.findIndex(col => col.id === overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        state.columnHeaders = arrayMove(state.columnHeaders, oldIndex, newIndex)
      }
    },
    moveRow: (state, action: PayloadAction<{ activeId: string; overId: string }>) => {
      const { activeId, overId } = action.payload
      const oldIndex = state.rowHeaders.findIndex(row => row.id === activeId)
      const newIndex = state.rowHeaders.findIndex(row => row.id === overId)

      if (oldIndex !== -1 && newIndex !== -1) {
        state.rowHeaders = arrayMove(state.rowHeaders, oldIndex, newIndex)
      }
    }
  }
})

export const { setColumnHeaders, setRowHeaders, moveColumn, moveRow } = matrixSlice.actions
export default matrixSlice.reducer
