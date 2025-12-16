'use client'

import { useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type RowSpanParams,
  type CellStyle,
  type RowDragEndEvent,
  type RowDragEnterEvent,
  type IRowNode,
  type ICellRendererParams,
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
    (rowIndex: number): boolean => {
      if (rowIndex === 0) return true
      if (rowIndex >= rowData.length) return false
      const currentGroup = rowData[rowIndex]?.rowGroup
      const prevGroup = rowData[rowIndex - 1]?.rowGroup
      return prevGroup !== currentGroup
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

      // Only span from the first row of each group
      if (!isFirstOfGroup(rowIndex)) {
        return 1
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
    [rowData, isFirstOfGroup]
  )

  // Handle drag enter - select appropriate rows based on which column drag started from
  const onRowDragEnter = useCallback(
    (event: RowDragEnterEvent<RowData>) => {
      const api = gridRef.current?.api
      if (!api) return

      const draggedNode = event.node
      const data = draggedNode?.data
      if (!data) return

      // Get the column from the event target
      const mouseEvent = event.event as MouseEvent
      const target = mouseEvent?.target as HTMLElement
      const cell = target?.closest('.ag-cell')
      const colId = cell?.getAttribute('col-id')

      // Clear current selection first
      api.deselectAll()

      if (colId === 'rowGroup') {
        // Drag started from Group column - select all rows in the group
        api.forEachNode((node: IRowNode<RowData>) => {
          if (node.data?.rowGroup === data.rowGroup) {
            node.setSelected(true)
          }
        })
      } else if (colId === 'rowHeader') {
        // Drag started from Row Header column - select only this row
        draggedNode.setSelected(true)
      }
    },
    []
  )

  // Handle row drag end - process multi-row drag
  const onRowDragEnd = useCallback(
    (event: RowDragEndEvent<RowData>) => {
      const api = gridRef.current?.api
      if (!api) return

      const overNode = event.overNode
      if (!overNode) return

      const overData = overNode.data
      if (!overData) return

      // Get all dragged nodes (selected rows for multi-row drag)
      const movingNodes = event.nodes || [event.node]
      if (movingNodes.length === 0) return

      // Get the IDs of rows being moved
      const movingIds = new Set(movingNodes.map((n) => n.data?.id).filter(Boolean))

      // Get current order from grid
      const currentOrder: RowData[] = []
      api.forEachNodeAfterFilterAndSort((node: IRowNode<RowData>) => {
        if (node.data) {
          currentOrder.push(node.data)
        }
      })

      // Find the target index (where we're dropping)
      const overIndex = currentOrder.findIndex((row) => row.id === overData.id)
      if (overIndex === -1) return

      // Separate moving rows from other rows
      const movingRows = currentOrder.filter((row) => movingIds.has(row.id))
      const otherRows = currentOrder.filter((row) => !movingIds.has(row.id))

      // Calculate new insert position in the filtered array
      let insertIndex = 0
      for (let i = 0; i < overIndex; i++) {
        if (!movingIds.has(currentOrder[i].id)) {
          insertIndex++
        }
      }

      // Build new order
      const newOrder = [
        ...otherRows.slice(0, insertIndex),
        ...movingRows,
        ...otherRows.slice(insertIndex),
      ]

      // Dispatch to Redux
      const newRowHeaders = newOrder.map((row) => {
        const original = rowHeaders.find((r) => r.id === row.id)
        return original!
      })
      dispatch(reorderRows(newRowHeaders))

      // Clear selection after drag
      api.deselectAll()
    },
    [rowHeaders, dispatch]
  )

  // Cell renderer for Group column with drag icon
  const GroupCellRenderer = useCallback(
    (params: ICellRendererParams<RowData>) => {
      const rowIndex = params.node?.rowIndex ?? 0
      const value = params.value as string
      const isFirst = isFirstOfGroup(rowIndex)

      // For non-first rows, render empty (the cell is covered by row span)
      if (!isFirst) {
        return null
      }

      return (
        <div className="flex items-center gap-2 w-full h-full">
          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab" />
          <span className="font-semibold">{value}</span>
        </div>
      )
    },
    [isFirstOfGroup]
  )

  // Cell renderer for Row Header column with drag icon
  const RowHeaderCellRenderer = useCallback(
    (params: ICellRendererParams<RowData>) => {
      return (
        <div className="flex items-center gap-2 w-full h-full">
          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab" />
          <span>{params.value}</span>
        </div>
      )
    },
    []
  )

  // Cell style for Group column
  const groupCellStyle = useCallback(
    (params: { node?: { rowIndex?: number | null } }): CellStyle => {
      const rowIndex = params.node?.rowIndex
      const isFirst = rowIndex !== undefined && rowIndex !== null && isFirstOfGroup(rowIndex)
      
      return {
        backgroundColor: 'var(--ag-header-background-color)',
        borderRight: '1px solid var(--ag-border-color)',
        display: 'flex',
        alignItems: 'center',
        // Hide content for non-first rows (they are covered by the span)
        visibility: isFirst ? 'visible' : 'hidden',
      } as CellStyle
    },
    [isFirstOfGroup]
  )

  // Column definitions
  const columnDefs: ColDef<RowData>[] = useMemo(() => {
    // Row header group column (with row span)
    const rowGroupCol: ColDef<RowData> = {
      field: 'rowGroup',
      headerName: 'Group',
      width: 140,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      rowSpan: rowGroupRowSpan,
      cellRenderer: GroupCellRenderer,
      cellStyle: groupCellStyle,
      rowDrag: (params) => {
        // Only allow drag from the first row of the group
        // Use API to get actual displayed row order for accurate check during drag
        const rowIndex = params.node?.rowIndex
        if (rowIndex === undefined || rowIndex === null) return false
        return isFirstOfGroup(rowIndex)
      },
    }

    // Row header column with drag icon (NO row spanning)
    const rowHeaderCol: ColDef<RowData> = {
      field: 'rowHeader',
      headerName: 'Row Header',
      width: 150,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      rowDrag: true,
      cellRenderer: RowHeaderCellRenderer,
      cellStyle: {
        backgroundColor: 'var(--ag-header-background-color)',
        borderRight: '1px solid var(--ag-border-color)',
        display: 'flex',
        alignItems: 'center',
      },
    }

    // Data columns
    const dataColumns: ColDef<RowData>[] = columnHeaders.map((col) => ({
      field: col.id,
      headerName: col.label,
      width: 150,
      editable: true,
    }))

    return [rowGroupCol, rowHeaderCol, ...dataColumns]
  }, [columnHeaders, rowGroupRowSpan, isFirstOfGroup, GroupCellRenderer, RowHeaderCellRenderer, groupCellStyle])

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
        rowDragMultiRow={true}
        rowSelection="multiple"
        suppressRowClickSelection={true}
        getRowId={(params) => params.data.id}
        onRowDragEnter={onRowDragEnter}
        onRowDragEnd={onRowDragEnd}
      />
    </div>
  )
}
