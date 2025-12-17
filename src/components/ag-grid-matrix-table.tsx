'use client'

import { useMemo, useCallback, useRef, useState } from 'react'
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
import { CheckIcon, CopyIcon, ChevronDownIcon, Rows3Icon } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { reorderRows } from '@/store/matrixSlice'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import ColumnHeaderWithPopup, { type ColumnMetadata } from '@/components/ColumnHeaderWithPopup'

// Row height options
type RowHeightOption = 'compact' | 'normal' | 'comfortable'

const ROW_HEIGHT_CONFIG: Record<RowHeightOption, { label: string; height: number }> = {
  compact: { label: 'Compact', height: 28 },
  normal: { label: 'Normal', height: 36 },
  comfortable: { label: 'Comfortable', height: 48 },
}

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
  const [copied, setCopied] = useState<boolean>(false)
  const [rowHeightOption, setRowHeightOption] = useState<RowHeightOption>('normal')
  const [rowHeightPopoverOpen, setRowHeightPopoverOpen] = useState(false)

  // Get current row height value
  const currentRowHeight = ROW_HEIGHT_CONFIG[rowHeightOption].height

  // Handle row height change
  const handleRowHeightChange = useCallback((option: RowHeightOption) => {
    setRowHeightOption(option)
    setRowHeightPopoverOpen(false)
    
    // Update AG Grid row height dynamically
    const api = gridRef.current?.api
    if (api) {
      api.resetRowHeights()
    }
  }, [])

  // Copy table data to clipboard in TSV format (for Excel/Confluence)
  const handleCopyToClipboard = useCallback(async () => {
    try {
      const api = gridRef.current?.api
      if (!api) return

      // Get current column order from the grid (preserves column swap/reorder)
      const allColumns = api.getAllDisplayedColumns()
      const dataColumnOrder = allColumns
        .map((col) => col.getColId())
        .filter((colId) => colId !== 'rowGroup' && colId !== 'rowHeader')

      // Build header row: Group, Row Header, then data columns in current display order
      const headers = [
        'Group',
        'Row Header',
        ...dataColumnOrder.map((colId) => {
          const colHeader = columnHeaders.find((c) => c.id === colId)
          return colHeader?.label ?? colId
        }),
      ]

      // Get rows in current display order from the grid
      const displayedRows: RowData[] = []
      api.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) {
          displayedRows.push(node.data)
        }
      })

      // Build data rows with merged cell support for row groups
      let prevGroup = ''
      const dataRows = displayedRows.map((row) => {
        const originalRow = rowHeaders.find((r) => r.id === row.id)
        if (!originalRow) return ''

        // For merged cells: only show group name in first row of each group
        const groupValue = originalRow.rowGroup !== prevGroup ? originalRow.rowGroup : ''
        prevGroup = originalRow.rowGroup

        const rowValues = [
          groupValue,
          originalRow.label,
          ...dataColumnOrder.map((colId) => originalRow.data[colId] ?? ''),
        ]
        return rowValues.join('\t')
      })

      // Combine headers and rows with newlines
      const tsvContent = [headers.join('\t'), ...dataRows].join('\n')

      await navigator.clipboard.writeText(tsvContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy table data: ', err)
    }
  }, [columnHeaders, rowHeaders])

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

  // Cell class for row group
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

      // Check if this is a group drag
      // A group drag occurs when:
      // 1. Only one row is being dragged
      // 2. That row is the first of its group (the only one with a visible Group cell)
      // 3. The drag originated from the rowGroup column
      const draggedNode = event.node
      const draggedData = draggedNode.data
      const draggedRowIndex = draggedNode.rowIndex
      
      // Access column from event (may not exist in type definitions but exists at runtime)
      const dragColumn = (event as unknown as { column?: { getColId: () => string } }).column
      const dragColumnId = dragColumn?.getColId?.()
      
      if (draggedData && movingNodes.length === 1 && draggedRowIndex !== undefined && draggedRowIndex !== null) {
        // Check if the dragged row is the first of its group
        const isFirstOfGroup = isFirstOfGroupFromApi(api, draggedRowIndex, draggedData.rowGroup)
        
        // Determine if this is a group drag:
        // - If we can detect the column, use that
        // - If column is 'rowGroup', it's a group drag
        // - If column is 'rowHeader', it's a single row drag
        // - If column detection fails but the row is first of group and all group rows are selected, it's a group drag
        let isGroupDrag = false
        
        if (dragColumnId === 'rowGroup') {
          isGroupDrag = true
        } else if (dragColumnId === 'rowHeader') {
          isGroupDrag = false
        } else if (isFirstOfGroup) {
          // Column detection failed - check if all group rows are selected
          // If all group rows are selected, treat as group drag
          const selectedNodes = api.getSelectedNodes()
          const groupRowCount = rowData.filter(r => r.rowGroup === draggedData.rowGroup).length
          const selectedGroupRowCount = selectedNodes.filter(n => n.data?.rowGroup === draggedData.rowGroup).length
          
          if (selectedGroupRowCount === groupRowCount && groupRowCount > 0) {
            isGroupDrag = true
          } else if (selectedNodes.length === 0) {
            // No selection - fallback: if first row of group is dragged with no selection,
            // assume it's a group drag (user likely dragged from the visible Group cell)
            isGroupDrag = true
          }
        }
        
        if (isGroupDrag) {
          // Collect all rows in this group
          const groupName = draggedData.rowGroup
          const groupNodes: IRowNode<RowData>[] = []
          api.forEachNode((node: IRowNode<RowData>) => {
            if (node.data?.rowGroup === groupName) {
              groupNodes.push(node)
            }
          })
          movingNodes = groupNodes
        }
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

      // Build the new row data array in the correct order
      const newRowData: RowData[] = newOrder.map((row) => ({ ...row }))

      // Dispatch to Redux
      const newRowHeaders = newOrder.map((row) => {
        const original = rowHeaders.find((r) => r.id === row.id)
        return original!
      })
      dispatch(reorderRows(newRowHeaders))

      // Clear selection after drag
      api.deselectAll()

      // Force AG Grid to apply the new row order and recalculate row spans
      // Use setTimeout to ensure this happens after React's render cycle
      setTimeout(() => {
        // Update row data to trigger re-render
        api.setGridOption('rowData', newRowData)
        
        // Force recalculation of row spans by refreshing the rowGroup column cells
        // This ensures the rowSpan callback is re-evaluated for all cells
        api.refreshCells({
          columns: ['rowGroup'],
          force: true,
        })
        
        // Also redraw all rows to ensure visual consistency
        api.redrawRows()
      }, 0)
    },
    [rowHeaders, rowData, dispatch, isFirstOfGroupFromApi]
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
        const rowIndex = params.node?.rowIndex
        if (rowIndex === undefined || rowIndex === null) return false
        return isFirstOfGroupFromApi(params.api, rowIndex, params.data?.rowGroup || '')
      },
      cellStyle: (params): CellStyle | null => {
        const rowIndex = params.node?.rowIndex
        if (rowIndex !== undefined && rowIndex !== null && rowIndex > 0) {
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

    // Data columns with custom header component for metadata popup
    const dataColumns: ColDef<RowData>[] = columnHeaders.map((col) => ({
      field: col.id,
      headerName: col.label,
      width: 150,
      editable: true,
      cellStyle: { textAlign: 'right' },
      headerComponent: ColumnHeaderWithPopup,
      headerComponentParams: {
        columnMetadata: col as ColumnMetadata,
        // Optional: Provide a custom renderer for metadata content
        // renderMetadataContent: (metadata: ColumnMetadata) => <YourCustomContent metadata={metadata} />
      },
      valueFormatter: (params) => {
        const value = params.value
        if (value === null || value === undefined || value === '') return ''
        const num = parseFloat(value)
        if (!isNaN(num) && value.toString().includes('.')) {
          return num.toFixed(2)
        }
        return value
      },
    }))

    return [rowGroupCol, rowHeaderCol, ...dataColumns]
  }, [columnHeaders, rowGroupRowSpan, rowGroupCellClass, isFirstOfGroupFromApi])

  // Default column definition
  const defaultColDef: ColDef<RowData> = useMemo(
    () => ({
      resizable: true,
      sortable: false,
      headerClass: 'ag-header-cell-center',
    }),
    []
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        {/* Row Height Control - Top Left */}
        <Popover open={rowHeightPopoverOpen} onOpenChange={setRowHeightPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Rows3Icon className="size-4" />
              <span className="text-xs">{ROW_HEIGHT_CONFIG[rowHeightOption].label}</span>
              <ChevronDownIcon className="size-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="start">
            <div className="flex flex-col">
              {(Object.keys(ROW_HEIGHT_CONFIG) as RowHeightOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => handleRowHeightChange(option)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
                    rowHeightOption === option
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <div
                    className={cn(
                      'flex flex-col gap-0.5',
                      option === 'compact' && 'scale-75',
                      option === 'comfortable' && 'scale-110'
                    )}
                  >
                    <div className="w-4 h-0.5 bg-current rounded" />
                    <div className="w-4 h-0.5 bg-current rounded" />
                    <div className="w-4 h-0.5 bg-current rounded" />
                  </div>
                  <span>{ROW_HEIGHT_CONFIG[option].label}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Copy Button - Top Right */}
        <Button
          variant="outline"
          className="relative disabled:opacity-100"
          onClick={handleCopyToClipboard}
          disabled={copied}
        >
          <span className={cn('transition-all', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
            <CheckIcon className="stroke-green-600 dark:stroke-green-400" />
          </span>
          <span className={cn('absolute left-4 transition-all', copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}>
            <CopyIcon />
          </span>
          {copied ? 'Copied!' : 'Copy Table'}
        </Button>
      </div>
      <div className="ag-theme-quartz" style={{ height: 'calc(90vh - 180px)', width: '100%' }}>
        <AgGridReact<RowData>
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={currentRowHeight}
          suppressRowTransform={true}
          animateRows={true}
          rowDragManaged={true}
          rowDragMultiRow={true}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          getRowId={(params) => params.data.id}
          onRowDragEnd={onRowDragEnd}
          onCellClicked={onCellClicked}
        />
      </div>
    </div>
  )
}
