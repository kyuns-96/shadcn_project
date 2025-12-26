import { useMemo } from 'react'
import type { ColDef, CellStyle, ICellRendererParams, RowSpanParams, CellClassParams, GridApi } from 'ag-grid-community'
import { Spinner } from '@/components/ui/spinner'
import ColumnHeaderWithPopup, { type ColumnMetadata } from '@/components/ColumnHeaderWithPopup'
import type { RowData, TextAlignOption } from '../types'
import type { MatrixState } from '@/store/matrixSlice'

interface UseColumnDefsProps {
  columnHeaders: MatrixState['columnHeaders']
  rowHeaders: MatrixState['rowHeaders']
  rowGroupRowSpan: (params: RowSpanParams<RowData>) => number
  rowGroupCellClass: (params: CellClassParams<RowData>) => string | string[]
  isFirstOfGroupFromApi: (api: GridApi<RowData> | undefined, rowIndex: number, groupName: string) => boolean
  textAlignOption: TextAlignOption
  decimalPlaces: number
}

export function useColumnDefs({
  columnHeaders,
  rowHeaders,
  rowGroupRowSpan,
  rowGroupCellClass,
  isFirstOfGroupFromApi,
  textAlignOption,
  decimalPlaces,
}: UseColumnDefsProps) {
  const groupColumnWidth = useMemo(() => {
    const getMaxLineLength = (text: string) => {
      const lines = text.split('\n')
      return Math.max(...lines.map(line => line.length))
    }
    const maxGroupLength = Math.max(
      'Group'.length,
      ...rowHeaders.map(r => getMaxLineLength(r.rowGroup))
    )
    return Math.max(80, maxGroupLength * 8 + 50)
  }, [rowHeaders])

  const rowHeaderColumnWidth = useMemo(() => {
    const maxHeaderLength = Math.max(
      'Row Header'.length,
      ...rowHeaders.map(r => r.label.length)
    )
    return Math.max(100, maxHeaderLength * 8 + 50)
  }, [rowHeaders])

  const columnDefs: ColDef<RowData>[] = useMemo(() => {
    const rowGroupCol: ColDef<RowData> = {
      field: 'rowGroup',
      headerName: 'Group',
      width: groupColumnWidth,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      rowSpan: rowGroupRowSpan,
      colSpan: (params) => (!params.data?.rowGroup ? 2 : 1),
      cellClass: rowGroupCellClass,
      rowDrag: (params) => {
        if (!params.data?.rowGroup) return true
        const rowIndex = params.node?.rowIndex
        if (rowIndex === undefined || rowIndex === null) return false
        return isFirstOfGroupFromApi(params.api, rowIndex, params.data.rowGroup)
      },
      valueGetter: (params) => {
        if (!params.data?.rowGroup) return params.data?.rowHeader || ''
        return params.data.rowGroup
      },
      cellStyle: (params): CellStyle | null => {
        const hasGroup = !!params.data?.rowGroup
        const rowIndex = params.node?.rowIndex
        
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
          if (prevNode?.data?.rowGroup === params.data?.rowGroup) {
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

    const rowHeaderCol: ColDef<RowData> = {
      field: 'rowHeader',
      headerName: 'Row Header',
      width: rowHeaderColumnWidth,
      pinned: 'left',
      lockPosition: true,
      suppressMovable: true,
      rowDrag: (params) => !!params.data?.rowGroup,
      cellStyle: (params): CellStyle | null => {
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

    const dataColumns: ColDef<RowData>[] = columnHeaders.map((col) => ({
      field: col.id,
      headerName: col.label,
      width: 150,
      editable: true,
      cellStyle: { textAlign: textAlignOption },
      headerComponent: ColumnHeaderWithPopup,
      headerComponentParams: { columnMetadata: col as ColumnMetadata },
      valueFormatter: (params) => {
        const value = params.value
        if (value === null || value === undefined || value === '') return ''
        const valueStr = value.toString()
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
          return <Spinner className="mx-auto" />
        }
        return params.valueFormatted ?? params.value
      },
    }))

    return [rowGroupCol, rowHeaderCol, ...dataColumns]
  }, [
    columnHeaders,
    rowGroupRowSpan,
    rowGroupCellClass,
    isFirstOfGroupFromApi,
    groupColumnWidth,
    rowHeaderColumnWidth,
    textAlignOption,
    decimalPlaces,
  ])

  return columnDefs
}
