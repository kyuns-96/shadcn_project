'use client'

import { useMemo, useCallback, useRef, useState, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type RowSpanParams,
  type CellClassParams,
  type CellStyle,
  type RowDragEndEvent,
  type RowDragMoveEvent,
  type IRowNode,
  type CellClickedEvent,
  type GridApi,
  type RowClassParams,
  type ICellRendererParams,
} from 'ag-grid-community'
import { CheckIcon, CopyIcon, ChevronDownIcon, Rows3Icon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, PlusIcon, MinusIcon } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { reorderRows, deleteRows } from '@/store/matrixSlice'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import ColumnHeaderWithPopup, { type ColumnMetadata } from '@/components/ColumnHeaderWithPopup'
import {Spinner} from "@/components/ui/spinner";
// Row height options
type RowHeightOption = 'compact' | 'normal' | 'comfortable'

const ROW_HEIGHT_CONFIG: Record<RowHeightOption, { label: string; height: number }> = {
  compact: { label: 'Compact', height: 20 },
  normal: { label: 'Normal', height: 28 },
  comfortable: { label: 'Comfortable', height: 36 },
}

// Text alignment options
type TextAlignOption = 'left' | 'center' | 'right'

const TEXT_ALIGN_CONFIG: Record<TextAlignOption, { label: string; icon: typeof AlignLeftIcon }> = {
  left: { label: 'Left', icon: AlignLeftIcon },
  center: { label: 'Center', icon: AlignCenterIcon },
  right: { label: 'Right', icon: AlignRightIcon },
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
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const { columnHeaders, rowHeaders } = useAppSelector((state) => state.matrix)
  const [copied, setCopied] = useState<boolean>(false)
  const [rowHeightOption, setRowHeightOption] = useState<RowHeightOption>('normal')
  const [rowHeightPopoverOpen, setRowHeightPopoverOpen] = useState(false)
  const [textAlignOption, setTextAlignOption] = useState<TextAlignOption>('right')
  const [textAlignPopoverOpen, setTextAlignPopoverOpen] = useState(false)
  const [decimalPlaces, setDecimalPlaces] = useState<number>(2)
  
  // Refs to track dragging state for global mouseup handler
  const draggingRowIdsRef = useRef<string[]>([])
  const isDraggingRef = useRef<boolean>(false)

  // Get current row height value
  const currentRowHeight = ROW_HEIGHT_CONFIG[rowHeightOption].height

  // Handle row height change
  const handleRowHeightChange = useCallback((option: RowHeightOption) => {
    setRowHeightOption(option)
    setRowHeightPopoverOpen(false)
    
    // Update AG Grid row height dynamically
    const api = gridRef.current?.api
    if (api) {
      const newHeight = ROW_HEIGHT_CONFIG[option].height
      api.setGridOption('rowHeight', newHeight)
      api.resetRowHeights()
      api.redrawRows()
    }
  }, [])

  // Handle text alignment change
  const handleTextAlignChange = useCallback((option: TextAlignOption) => {
    setTextAlignOption(option)
    setTextAlignPopoverOpen(false)
    
    // Refresh cells to apply new alignment
    const api = gridRef.current?.api
    if (api) {
      api.refreshCells({ force: true })
    }
  }, [])

  // Handle decimal places increase
  const handleDecimalIncrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.min(prev + 1, 10))
    const api = gridRef.current?.api
    if (api) {
      api.refreshCells({ force: true })
    }
  }, [])

  // Handle decimal places decrease
  const handleDecimalDecrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.max(prev - 1, 0))
    const api = gridRef.current?.api
    if (api) {
      api.refreshCells({ force: true })
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
        // If group is empty, only select this single row
        if (!data.rowGroup) {
          selectSingleRow(data.id)
        } else {
          // Click on Group column - select entire group
          selectGroupRows(data.rowGroup)
        }
      } else if (colId === 'rowHeader') {
        // Click on Row Header column - select single row
        selectSingleRow(data.id)
      }
    },
    [selectGroupRows, selectSingleRow]
  )

  // Get row class for group borders
  const getRowClass = useCallback(
    (params: RowClassParams<RowData>): string | string[] => {
      const classes: string[] = []
      const currentRowGroup = params.data?.rowGroup
      const rowIndex = params.node?.rowIndex
      const api = params.api

      if (rowIndex === undefined || rowIndex === null || !api) return classes

      // Check if this is the first row of a group
      if (rowIndex === 0) {
        classes.push('ag-row-group-first')
      } else {
        const prevNode = api.getDisplayedRowAtIndex(rowIndex - 1)
        const prevRowGroup = prevNode?.data?.rowGroup
        if (prevRowGroup !== currentRowGroup) {
          classes.push('ag-row-group-first')
        }
      }

      // Check if this is the last row of a group
      const displayedRowCount = api.getDisplayedRowCount()
      if (rowIndex === displayedRowCount - 1) {
        classes.push('ag-row-group-last')
      } else {
        const nextNode = api.getDisplayedRowAtIndex(rowIndex + 1)
        const nextRowGroup = nextNode?.data?.rowGroup
        if (nextRowGroup !== currentRowGroup) {
          classes.push('ag-row-group-last')
        }
      }

      return classes
    },
    []
  )

  // Handle row drag move - track dragging state and row IDs
  const onRowDragMove = useCallback((event: RowDragMoveEvent<RowData>) => {
    if (!isDraggingRef.current) {
      isDraggingRef.current = true
      // Store the IDs of rows being dragged
      const movingNodes = event.nodes || [event.node]
      draggingRowIdsRef.current = movingNodes
        .map((n) => n.data?.id)
        .filter(Boolean) as string[]
    }
  }, [])

  // Global mouseup handler to delete rows when released outside
  useEffect(() => {
    const handleGlobalMouseUp = (event: MouseEvent) => {
      if (!isDraggingRef.current || draggingRowIdsRef.current.length === 0) {
        return
      }

      const gridContainer = gridContainerRef.current
      if (!gridContainer) return

      // Check if mouse is outside the grid container
      const rect = gridContainer.getBoundingClientRect()
      const isOutside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom

      if (isOutside) {
        // Delete the rows
        dispatch(deleteRows(draggingRowIdsRef.current))
        
        // Clear selection and refresh grid
        const api = gridRef.current?.api
        if (api) {
          api.deselectAll()
          
          // Force re-render of Group column for row span recalculation
          setTimeout(() => {
            api.refreshCells({
              columns: ['rowGroup'],
              force: true,
            })
            api.redrawRows()
          }, 0)
        }
      }

      // Reset dragging state
      isDraggingRef.current = false
      draggingRowIdsRef.current = []
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [dispatch])

  // Handle row drag end - process row drag or delete if dropped outside
  const onRowDragEnd = useCallback(
    (event: RowDragEndEvent<RowData>) => {
      const api = gridRef.current?.api
      if (!api) return

      // Get all dragged nodes (selected rows for multi-row drag, or single row)
      const movingNodes = event.nodes || [event.node]
      if (movingNodes.length === 0) return

      // Get the IDs of rows being moved
      const movingIds = movingNodes.map((n) => n.data?.id).filter(Boolean) as string[]
      if (movingIds.length === 0) return

      const overNode = event.overNode

      // Reset dragging state
      isDraggingRef.current = false
      draggingRowIdsRef.current = []

      // If dropped outside the grid (no overNode), rows were already deleted by global mouseup
      if (!overNode) {
        return
      }

      const overData = overNode.data
      if (!overData) return

      const movingIdSet = new Set(movingIds)

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
      const movingRows = currentOrder.filter((row) => movingIdSet.has(row.id))
      const otherRows = currentOrder.filter((row) => !movingIdSet.has(row.id))

      // Calculate new insert position in the filtered array
      let insertIndex = 0
      for (let i = 0; i < overIndex; i++) {
        if (!movingIdSet.has(currentOrder[i].id)) {
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
    [rowHeaders, dispatch]
  )

  // Calculate dynamic column widths based on content
  const groupColumnWidth = useMemo(() => {
    // For multi-line group names, find the longest line
    const getMaxLineLength = (text: string) => {
      const lines = text.split('\n')
      return Math.max(...lines.map(line => line.length))
    }
    const maxGroupLength = Math.max(
      'Group'.length,
      ...rowHeaders.map(r => getMaxLineLength(r.rowGroup))
    )
    // ~8px per character + 50px for padding and drag icon
    return Math.max(80, maxGroupLength * 8 + 50)
  }, [rowHeaders])

  const rowHeaderColumnWidth = useMemo(() => {
    const maxHeaderLength = Math.max(
      'Row Header'.length,
      ...rowHeaders.map(r => r.label.length)
    )
    // ~8px per character + 50px for padding and drag icon
    return Math.max(100, maxHeaderLength * 8 + 50)
  }, [rowHeaders])

  // Column definitions
  const columnDefs: ColDef<RowData>[] = useMemo(() => {
    // Row header group column (with row span and col span when group is empty)
    const rowGroupCol: ColDef<RowData> = {
      field: 'rowGroup',
      headerName: 'Group',
      width: groupColumnWidth,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      rowSpan: rowGroupRowSpan,
      colSpan: (params) => {
        // Span 2 columns (Group + Row Header) when group is empty
        if (!params.data?.rowGroup) return 2
        return 1
      },
      cellClass: rowGroupCellClass,
      rowDrag: (params) => {
        // For empty group, always show drag icon
        if (!params.data?.rowGroup) return true
        // For non-empty group, show drag icon only on first row of group (where cell is visible)
        const rowIndex = params.node?.rowIndex
        if (rowIndex === undefined || rowIndex === null) return false
        return isFirstOfGroupFromApi(params.api, rowIndex, params.data.rowGroup)
      },
      valueGetter: (params) => {
        // Show rowHeader value when group is empty (for colspan display)
        if (!params.data?.rowGroup) return params.data?.rowHeader || ''
        return params.data.rowGroup
      },
      cellStyle: (params): CellStyle | null => {
        const rowIndex = params.node?.rowIndex
        const hasGroup = !!params.data?.rowGroup
        
        // When group is empty, show the cell with rowHeader styling
        if (!hasGroup) {
          return {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: '12px',
            backgroundColor: 'var(--ag-header-background-color)',
            fontWeight: '500',
            borderRight: '1px solid var(--ag-border-color)',
            cursor: 'grab',
            whiteSpace: 'pre-line',
          } as CellStyle
        }
        
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
          justifyContent: 'flex-start',
          paddingLeft: '12px',
          backgroundColor: 'var(--ag-header-background-color)',
          fontWeight: '600',
          borderRight: '1px solid var(--ag-border-color)',
          cursor: 'grab',
          whiteSpace: 'pre-line',
        } as CellStyle
      },
    }

    // Row header column
    const rowHeaderCol: ColDef<RowData> = {
      field: 'rowHeader',
      headerName: 'Row Header',
      width: rowHeaderColumnWidth,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      rowDrag: (params) => {
        // Hide drag icon if group is empty (colspan covers this cell)
        if (!params.data?.rowGroup) return false
        return true
      },
      cellStyle: (params): CellStyle | null => {
        // Hide this cell when group is empty (colspan from rowGroup covers it)
        if (!params.data?.rowGroup) {
          return { display: 'none' } as CellStyle
        }
        return {
          fontWeight: 500,
          backgroundColor: 'var(--ag-header-background-color)',
          borderRight: '1px solid var(--ag-border-color)',
          cursor: 'grab',
        } as CellStyle
      },
    }

    // Data columns with custom header component for metadata popup
    const dataColumns: ColDef<RowData>[] = columnHeaders.map((col) => ({
      field: col.id,
      headerName: col.label,
      width: 150,
      editable: true,
      cellStyle: { textAlign: textAlignOption },
      headerComponent: ColumnHeaderWithPopup,
      headerComponentParams: {
        columnMetadata: col as ColumnMetadata,
        // Optional: Provide a custom renderer for metadata content
        // renderMetadataContent: (metadata: ColumnMetadata) => <YourCustomContent metadata={metadata} />
      },
      valueFormatter: (params) => {
        const value = params.value
        if (value === null || value === undefined || value === '') return ''
        const valueStr = value.toString()
        // Only apply decimal formatting if the value contains a decimal point
        if (valueStr.includes('.')) {
          const num = parseFloat(value)
          if (!isNaN(num)) {
            return num.toFixed(decimalPlaces)
          }
        }
        return value
      },
      cellRenderer: (params: ICellRendererParams<RowData>) => {
        if (params.value === "___LOADING___") {
          return <Spinner className="mx-auto" />;
        }  
        // Use valueFormatted if available (from valueFormatter), otherwise use raw value
        return params.valueFormatted ?? params.value;
      },
    }))

    return [rowGroupCol, rowHeaderCol, ...dataColumns]
  }, [columnHeaders, rowGroupRowSpan, rowGroupCellClass, isFirstOfGroupFromApi, groupColumnWidth, rowHeaderColumnWidth, textAlignOption, decimalPlaces])

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
      <div className="flex items-center gap-2">
          {/* Row Height Control */}
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

          {/* Text Alignment Control */}
          <Popover open={textAlignPopoverOpen} onOpenChange={setTextAlignPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {(() => {
                  const IconComponent = TEXT_ALIGN_CONFIG[textAlignOption].icon
                  return <IconComponent className="size-4" />
                })()}
                <span className="text-xs">{TEXT_ALIGN_CONFIG[textAlignOption].label}</span>
                <ChevronDownIcon className="size-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="start">
              <div className="flex flex-col">
                {(Object.keys(TEXT_ALIGN_CONFIG) as TextAlignOption[]).map((option) => {
                  const IconComponent = TEXT_ALIGN_CONFIG[option].icon
                  return (
                    <button
                      key={option}
                      onClick={() => handleTextAlignChange(option)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
                        textAlignOption === option
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      <IconComponent className="size-4" />
                      <span>{TEXT_ALIGN_CONFIG[option].label}</span>
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Decimal Places Control */}
          <div className="flex items-center gap-1 border rounded-md px-2 py-1">
            <span className="text-xs text-muted-foreground mr-1">Decimal</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleDecimalDecrease}
              disabled={decimalPlaces <= 0}
              title="Decrease decimal places"
            >
              <MinusIcon className="size-3" />
            </Button>
            <span className="text-xs w-4 text-center font-medium">{decimalPlaces}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleDecimalIncrease}
              disabled={decimalPlaces >= 10}
              title="Increase decimal places"
            >
              <PlusIcon className="size-3" />
            </Button>
          </div>

          {/* Copy Button */}
          <Button
            variant="outline"
            size="sm"
            className="relative gap-2 disabled:opacity-100"
            onClick={handleCopyToClipboard}
            disabled={copied}
          >
            <span className={cn('transition-all', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
              <CheckIcon className="size-4 stroke-green-600 dark:stroke-green-400" />
            </span>
            <span className={cn('absolute left-3 transition-all', copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}>
              <CopyIcon className="size-4" />
            </span>
            <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
          </Button>
      </div>
      <div 
        ref={gridContainerRef}
        className="ag-theme-quartz"
        style={{ height: 'calc(90vh - 180px)', width: '100%' }}
      >
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
          getRowClass={getRowClass}
          onRowDragMove={onRowDragMove}
          onRowDragEnd={onRowDragEnd}
          onCellClicked={onCellClicked}
        />
      </div>
    </div>
  )
}
