import { useMemo, useCallback, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type RowClassParams,
} from 'ag-grid-community'
import { useAppSelector, useAppDispatch } from '@/store'
import { ROW_HEIGHT_CONFIG } from './config'
import { GridToolbar } from './GridToolbar'
import {
  useRowSpan,
  useSelection,
  useDragDrop,
  useClipboard,
  useColumnDefs,
} from './hooks'
import type { RowData, RowHeightOption, TextAlignOption } from './types'

ModuleRegistry.registerModules([AllCommunityModule])

export default function AgGridMatrixTable() {
  const dispatch = useAppDispatch()
  const gridRef = useRef<AgGridReact<RowData>>(null)
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const { columnHeaders, rowHeaders } = useAppSelector((state) => state.matrix)

  // UI State
  const [rowHeightOption, setRowHeightOption] = useState<RowHeightOption>('normal')
  const [rowHeightPopoverOpen, setRowHeightPopoverOpen] = useState(false)
  const [textAlignOption, setTextAlignOption] = useState<TextAlignOption>('right')
  const [textAlignPopoverOpen, setTextAlignPopoverOpen] = useState(false)
  const [decimalPlaces, setDecimalPlaces] = useState(2)

  const currentRowHeight = ROW_HEIGHT_CONFIG[rowHeightOption].height

  // Hooks
  const { isFirstOfGroupFromApi, rowGroupRowSpan, rowGroupCellClass } = useRowSpan()
  const { onCellClicked } = useSelection(gridRef)
  const { onRowDragMove, onRowDragEnd } = useDragDrop({
    gridRef,
    gridContainerRef,
    rowHeaders,
    dispatch,
  })
  const { copied, handleCopyToClipboard } = useClipboard({
    gridRef,
    columnHeaders,
    rowHeaders,
  })

  // Handlers
  const handleRowHeightChange = useCallback((option: RowHeightOption) => {
    setRowHeightOption(option)
    setRowHeightPopoverOpen(false)
    const api = gridRef.current?.api
    if (api) {
      api.setGridOption('rowHeight', ROW_HEIGHT_CONFIG[option].height)
      api.resetRowHeights()
      api.redrawRows()
    }
  }, [])

  const handleTextAlignChange = useCallback((option: TextAlignOption) => {
    setTextAlignOption(option)
    setTextAlignPopoverOpen(false)
    gridRef.current?.api?.refreshCells({ force: true })
  }, [])

  const handleDecimalIncrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.min(prev + 1, 10))
    gridRef.current?.api?.refreshCells({ force: true })
  }, [])

  const handleDecimalDecrease = useCallback(() => {
    setDecimalPlaces((prev) => Math.max(prev - 1, 0))
    gridRef.current?.api?.refreshCells({ force: true })
  }, [])

  // Row data
  const rowData: RowData[] = useMemo(() => {
    return rowHeaders.map((row) => ({
      id: row.id,
      rowGroup: row.rowGroup,
      rowHeader: row.label,
      ...row.data,
    }))
  }, [rowHeaders])

  // Column definitions
  const columnDefs = useColumnDefs({
    columnHeaders,
    rowHeaders,
    rowGroupRowSpan,
    rowGroupCellClass,
    isFirstOfGroupFromApi,
    textAlignOption,
    decimalPlaces,
  })

  // Row class for group borders
  const getRowClass = useCallback((params: RowClassParams<RowData>): string | string[] => {
    const classes: string[] = []
    const currentRowGroup = params.data?.rowGroup
    const rowIndex = params.node?.rowIndex
    const api = params.api

    if (rowIndex === undefined || rowIndex === null || !api) return classes

    if (rowIndex === 0) {
      classes.push('ag-row-group-first')
    } else {
      const prevNode = api.getDisplayedRowAtIndex(rowIndex - 1)
      if (prevNode?.data?.rowGroup !== currentRowGroup) {
        classes.push('ag-row-group-first')
      }
    }

    const displayedRowCount = api.getDisplayedRowCount()
    if (rowIndex === displayedRowCount - 1) {
      classes.push('ag-row-group-last')
    } else {
      const nextNode = api.getDisplayedRowAtIndex(rowIndex + 1)
      if (nextNode?.data?.rowGroup !== currentRowGroup) {
        classes.push('ag-row-group-last')
      }
    }

    return classes
  }, [])

  const defaultColDef: ColDef<RowData> = useMemo(() => ({
    resizable: true,
    sortable: false,
    headerClass: 'ag-header-cell-center',
  }), [])

  return (
    <div className="flex flex-col gap-2">
      <GridToolbar
        rowHeightOption={rowHeightOption}
        rowHeightPopoverOpen={rowHeightPopoverOpen}
        setRowHeightPopoverOpen={setRowHeightPopoverOpen}
        onRowHeightChange={handleRowHeightChange}
        textAlignOption={textAlignOption}
        textAlignPopoverOpen={textAlignPopoverOpen}
        setTextAlignPopoverOpen={setTextAlignPopoverOpen}
        onTextAlignChange={handleTextAlignChange}
        decimalPlaces={decimalPlaces}
        onDecimalIncrease={handleDecimalIncrease}
        onDecimalDecrease={handleDecimalDecrease}
        copied={copied}
        onCopy={handleCopyToClipboard}
      />
      <div
        ref={gridContainerRef}
        className="ag-theme-quartz"
        style={{ height: 'calc(90vh - 100px)', width: '100%' }}
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
