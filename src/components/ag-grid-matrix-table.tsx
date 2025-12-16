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
  type IRowNode,
  type CellClickedEvent,
  type GridApi,
} from 'ag-grid-community'
import { useAppSelector, useAppDispatch } from '@/store'
import { reorderRows } from '@/store/matrixSlice'

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

  // Helper to check if a row is the first of its group using grid API for accurate display order
  const isFirstOfGroupFromApi = useCallback(
    (api: GridApi<RowData> | undefined, rowIndex: number, groupName: string): boolean => {
      if (rowIndex === 0) return true
      if (!api) {
        // Fallback: assume it's the first if API is not available
        return true
      }
      const prevNode = api.getDisplayedRowAtIndex(rowIndex - 1)
      const prevGroup = prevNode?.data?.rowGroup
      return prevGroup !== groupName
    },
    []
  )

  // Calculate row span for row group column
  const rowGroupRowSpan = useCallback(
    (params: RowSpanParams<RowData>): number => {
      const currentRowGroup = params.data?.rowGroup
      if (!currentRowGroup) return 1

      const rowIndex = params.node?.rowIndex
      if (rowIndex === undefined || rowIndex === null) return 1

      const api = params.api
      if (!api) return 1

      // Check if this is the first row of a group using displayed row order
      if (rowIndex > 0) {
        const prevNode = api.getDisplayedRowAtIndex(rowIndex - 1)
        const prevRowGroup = prevNode?.data?.rowGroup
        if (prevRowGroup === currentRowGroup) {
          return 1
        }
      }

      // Count consecutive rows with the same group using displayed row order
      const displayedRowCount = api.getDisplayedRowCount()
      let spanCount = 1
      for (let i = rowIndex + 1; i < displayedRowCount; i++) {
        const nextNode = api.getDisplayedRowAtIndex(i)
        if (nextNode?.data?.rowGroup === currentRowGroup) {
          spanCount++
        } else {
          break
        }
      }
      return spanCount
    },
    []
  )

  // Cell class for row group to show/hide based on span
  const rowGroupCellClass = useCallback(
    (params: CellClassParams<RowData>): string | string[] => {
      const classes = ['ag-row-group-cell']
      const currentRowGroup = params.data?.rowGroup
      const rowIndex = params.node?.rowIndex
      const api = params.api

      if (rowIndex !== undefined && rowIndex !== null && rowIndex > 0) {
        const prevNode = api?.getDisplayedRowAtIndex(rowIndex - 1)
        const prevRowGroup = prevNode?.data?.rowGroup
        if (prevRowGroup === currentRowGroup) {
          classes.push('ag-row-group-hidden')
        }
      }
      return classes
    },
    []
  )

  // Select all rows in a group
  const selectGroupRows = useCallback(
    (groupName: string) => {
      const api = gridRef.current?.api
      if (!api) return

      // Clear current selection
      api.deselectAll()

      // Select all rows in this group
      api.forEachNode((node: IRowNode<RowData>) => {
        if (node.data?.rowGroup === groupName) {
          node.setSelected(true)
        }
      })
    },
    []
  )

  // Select single row
  const selectSingleRow = useCallback(
    (rowId: string) => {
      const api = gridRef.current?.api
      if (!api) return

      // Clear current selection
      api.deselectAll()

      // Select only this row
      api.forEachNode((node: IRowNode<RowData>) => {
        if (node.data?.id === rowId) {
          node.setSelected(true)
        }
      })
    },
    []
  )

  // Handle cell click for selection
  const onCellClicked = useCallback(
    (event: CellClickedEvent<RowData>) => {
      const colId = event.column.getColId()
      const data = event.data

      if (!data) return

      if (colId === 'rowGroup') {
        // Click on Group column - select entire group
        selectGroupRows(data.rowGroup)
      } else if (colId === 'rowHeader') {
        // Click on Row Header column - select single row
        selectSingleRow(data.id)
      }
    },
    [selectGroupRows, selectSingleRow]
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
      let movingNodes = event.nodes || [event.node]
      if (movingNodes.length === 0) return

      // Check if this is a group drag (single row dragged from Group column)
      // If the dragged row is the first of its group and only one row is being dragged,
      // we should move the entire group
      const draggedNode = event.node
      const draggedData = draggedNode.data
      const dragColumnId = event.column?.getColId()
      
      if (dragColumnId === 'rowGroup' && draggedData && movingNodes.length === 1) {
        // This is a group drag - collect all rows in this group
        const groupName = draggedData.rowGroup
        const groupNodes: IRowNode<RowData>[] = []
        api.forEachNode((node: IRowNode<RowData>) => {
          if (node.data?.rowGroup === groupName) {
            groupNodes.push(node)
          }
        })
        movingNodes = groupNodes
      }

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

      // Separate moving rows from other rows, preserving their relative order
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

  // Column definitions
  const columnDefs: ColDef<RowData>[] = useMemo(() => {
    // Row header group column (with row span)
    const rowGroupCol: ColDef<RowData> = {
      field: 'rowGroup',
      headerName: 'Group',
      width: 120,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      rowSpan: rowGroupRowSpan,
      cellClass: rowGroupCellClass,
      rowDrag: (params) => {
        // Only allow drag from the first row of the group
        // Use API to get actual displayed row order for accurate check during drag
        const rowIndex = params.node?.rowIndex
        if (rowIndex === undefined || rowIndex === null) return false
        return isFirstOfGroupFromApi(params.api, rowIndex, params.data?.rowGroup || '')
      },
      cellStyle: (params): CellStyle | null => {
        const rowIndex = params.node?.rowIndex
        if (rowIndex !== undefined && rowIndex !== null && rowIndex > 0) {
          // Use API to get actual displayed row for accurate check during drag
          const api = params.api
          const prevNode = api?.getDisplayedRowAtIndex(rowIndex - 1)
          const prevRowGroup = prevNode?.data?.rowGroup
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
          cursor: 'grab',
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
      rowDrag: true,
      cellStyle: {
        fontWeight: 500,
        backgroundColor: 'var(--ag-header-background-color)',
        borderRight: '1px solid var(--ag-border-color)',
        cursor: 'grab',
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
  }, [columnHeaders, rowGroupRowSpan, rowGroupCellClass, isFirstOfGroupFromApi])

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
        rowDragManaged={false}
        rowDragEntireRow={false}
        rowDragMultiRow={true}
        rowSelection="multiple"
        suppressRowClickSelection={true}
        suppressMoveWhenRowDragging={false}
        getRowId={(params) => params.data.id}
        onRowDragEnd={onRowDragEnd}
        onCellClicked={onCellClicked}
      />
    </div>
  )
}
