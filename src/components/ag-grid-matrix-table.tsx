'use client'

import { useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type RowSpanParams,
  type CellClassParams,
  type CellStyle,
  type RowDragEndEvent,
} from 'ag-grid-community'
import { useAppSelector, useAppDispatch } from '@/store'
import { reorderRows } from '@/store/matrixSlice'
import { GripVertical } from 'lucide-react'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

// Types
interface RowData {
  id: string
  rowGroup: string
  rowHeader: string
  [key: string]: string
}

// Shared ref to track if group drag was initiated
const dragModeRef = { current: 'row' as 'row' | 'group' }

// Custom drag handle component for individual rows
const RowDragHandleRenderer = () => {
  return (
    <div
      className="flex items-center justify-center h-full cursor-grab"
      onMouseDown={() => {
        dragModeRef.current = 'row'
      }}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
    </div>
  )
}

// Custom group drag handle component
const GroupDragHandleRenderer = (props: { value: string; isFirstOfGroup: boolean }) => {
  if (!props.isFirstOfGroup) {
    return null
  }
  return (
    <div
      className="flex items-center justify-center h-full gap-1 cursor-grab font-semibold"
      onMouseDown={() => {
        dragModeRef.current = 'group'
      }}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
      <span>{props.value}</span>
    </div>
  )
}

export default function AgGridMatrixTable() {
  const dispatch = useAppDispatch()
  const gridRef = useRef<AgGridReact<RowData>>(null)
  const { columnHeaders, rowHeaders } = useAppSelector((state) => state.matrix)

  // Transform data for AG Grid with flattened structure
  const rowData: RowData[] = useMemo(() => {
    return rowHeaders.map((row) => ({
      id: row.id,
      rowGroup: row.rowGroup,
      rowHeader: row.label,
      ...row.data,
    }))
  }, [rowHeaders])

  // Helper to check if a row is the first of its group
  const isFirstOfGroup = useCallback(
    (rowIndex: number, groupName: string): boolean => {
      if (rowIndex === 0) return true
      const prevGroup = rowData[rowIndex - 1]?.rowGroup
      return prevGroup !== groupName
    },
    [rowData]
  )

  // Get all rows in a group
  const getGroupRows = useCallback(
    (groupName: string): RowData[] => {
      return rowData.filter((row) => row.rowGroup === groupName)
    },
    [rowData]
  )

  // Calculate row span for row group column
  const rowGroupRowSpan = useCallback(
    (params: RowSpanParams<RowData>): number => {
      const currentRowGroup = params.data?.rowGroup
      if (!currentRowGroup) return 1

      const rowIndex = params.node?.rowIndex
      if (rowIndex === undefined || rowIndex === null) return 1

      // Check if this is the first row of a group
      if (rowIndex > 0) {
        const prevRowGroup = rowData[rowIndex - 1]?.rowGroup
        if (prevRowGroup === currentRowGroup) {
          return 1
        }
      }

      // Count consecutive rows with the same group
      let spanCount = 1
      for (let i = rowIndex + 1; i < rowData.length; i++) {
        if (rowData[i]?.rowGroup === currentRowGroup) {
          spanCount++
        } else {
          break
        }
      }
      return spanCount
    },
    [rowData]
  )

  // Cell class for row group to show/hide based on span
  const rowGroupCellClass = useCallback(
    (params: CellClassParams<RowData>): string | string[] => {
      const classes = ['ag-row-group-cell']
      const currentRowGroup = params.data?.rowGroup
      const rowIndex = params.node?.rowIndex

      if (rowIndex !== undefined && rowIndex !== null && rowIndex > 0) {
        const prevRowGroup = rowData[rowIndex - 1]?.rowGroup
        if (prevRowGroup === currentRowGroup) {
          classes.push('ag-row-group-hidden')
        }
      }
      return classes
    },
    [rowData]
  )

  // Handle row drag end for individual rows
  const onRowDragEnd = useCallback(
    (event: RowDragEndEvent<RowData>) => {
      const movingNode = event.node
      const overNode = event.overNode

      if (!movingNode || !overNode || movingNode === overNode) return

      const movingData = movingNode.data
      const overData = overNode.data

      if (!movingData || !overData) return

      // Check if we're dragging a group (from group column)
      if (dragModeRef.current === 'group') {
        // Moving entire group
        const groupName = movingData.rowGroup
        const groupRows = getGroupRows(groupName)

        // Find target position
        const targetGroup = overData.rowGroup
        let newRowData: RowData[]

        if (targetGroup === groupName) {
          // Dropped on same group, no change
          dragModeRef.current = 'row'
          return
        }

        // Remove group rows from current position and insert at new position
        const otherRows = rowData.filter((row) => row.rowGroup !== groupName)
        const overIndex = otherRows.findIndex((row) => row.id === overData.id)

        if (overIndex === -1) {
          newRowData = [...otherRows, ...groupRows]
        } else {
          newRowData = [
            ...otherRows.slice(0, overIndex),
            ...groupRows,
            ...otherRows.slice(overIndex),
          ]
        }

        // Dispatch to Redux
        const newRowHeaders = newRowData.map((row) => {
          const original = rowHeaders.find((r) => r.id === row.id)
          return original!
        })
        dispatch(reorderRows(newRowHeaders))
        dragModeRef.current = 'row'
      } else {
        // Moving individual row
        const fromIndex = rowData.findIndex((row) => row.id === movingData.id)
        const toIndex = rowData.findIndex((row) => row.id === overData.id)

        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return

        // Create new order
        const newRowData = [...rowData]
        const [removed] = newRowData.splice(fromIndex, 1)
        newRowData.splice(toIndex, 0, removed)

        // Dispatch to Redux
        const newRowHeaders = newRowData.map((row) => {
          const original = rowHeaders.find((r) => r.id === row.id)
          return original!
        })
        dispatch(reorderRows(newRowHeaders))
      }
    },
    [rowData, rowHeaders, dispatch, getGroupRows]
  )

  // Column definitions
  const columnDefs: ColDef<RowData>[] = useMemo(() => {
    // Row drag handle column for individual rows
    const rowDragCol: ColDef<RowData> = {
      headerName: '',
      width: 50,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      rowDrag: true,
      cellRenderer: RowDragHandleRenderer,
      cellStyle: {
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    }

    // Row header group column (with row span and group drag)
    const rowGroupCol: ColDef<RowData> = {
      field: 'rowGroup',
      headerName: 'Group',
      width: 140,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      rowSpan: rowGroupRowSpan,
      cellClass: rowGroupCellClass,
      rowDrag: (params) => {
        // Only allow drag from the first row of the group
        const rowIndex = params.node?.rowIndex
        if (rowIndex === undefined || rowIndex === null) return false
        return isFirstOfGroup(rowIndex, params.data?.rowGroup || '')
      },
      cellRenderer: (params: { value: string; node: { rowIndex: number } }) => {
        const rowIndex = params.node?.rowIndex ?? 0
        const isFirst = isFirstOfGroup(rowIndex, params.value)
        return <GroupDragHandleRenderer value={params.value} isFirstOfGroup={isFirst} />
      },
      cellStyle: (params): CellStyle | null => {
        const rowIndex = params.node?.rowIndex
        if (rowIndex !== undefined && rowIndex !== null && rowIndex > 0) {
          const prevRowGroup = rowData[rowIndex - 1]?.rowGroup
          if (prevRowGroup === params.data?.rowGroup) {
            return { display: 'none' } as CellStyle
          }
        }
        return {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--ag-header-background-color)',
          fontWeight: '600',
          borderRight: '1px solid var(--ag-border-color)',
          padding: 0,
        } as CellStyle
      },
    }

    // Row header column
    const rowHeaderCol: ColDef<RowData> = {
      field: 'rowHeader',
      headerName: 'Row Header',
      width: 150,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      cellStyle: {
        fontWeight: 500,
        backgroundColor: 'var(--ag-header-background-color)',
        borderRight: '1px solid var(--ag-border-color)',
      },
    }

    // Data columns
    const dataColumns: ColDef<RowData>[] = columnHeaders.map((col) => ({
      field: col.id,
      headerName: col.label,
      width: 150,
      editable: true,
    }))

    return [rowDragCol, rowGroupCol, rowHeaderCol, ...dataColumns]
  }, [columnHeaders, rowGroupRowSpan, rowGroupCellClass, rowData, isFirstOfGroup])

  // Default column definition
  const defaultColDef: ColDef<RowData> = useMemo(
    () => ({
      resizable: true,
      sortable: false,
    }),
    []
  )

  return (
    <div className="ag-theme-quartz" style={{ height: '500px', width: '100%' }}>
      <AgGridReact<RowData>
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        suppressRowTransform={true}
        animateRows={true}
        rowDragManaged={true}
        rowDragEntireRow={false}
        rowDragMultiRow={false}
        getRowId={(params) => params.data.id}
        onRowDragEnd={onRowDragEnd}
      />
    </div>
  )
}
