'use client'

import { useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type RowSpanParams,
  type CellClassParams,
  type CellStyle,
} from 'ag-grid-community'
import { useAppSelector } from '@/store'

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
          // Not the first row of the group, no span
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
          // Hide content for non-first rows of the group
          classes.push('ag-row-group-hidden')
        }
      }
      return classes
    },
    [rowData]
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

    // Data columns (draggable)
    const dataColumns: ColDef<RowData>[] = columnHeaders.map((col) => ({
      field: col.id,
      headerName: col.label,
      width: 150,
      editable: true,
    }))

    return [rowGroupCol, rowHeaderCol, ...dataColumns]
  }, [columnHeaders, rowGroupRowSpan, rowGroupCellClass, rowData])

  // Default column definition
  const defaultColDef: ColDef<RowData> = useMemo(
    () => ({
      resizable: true,
      sortable: false,
    }),
    []
  )

  return (
    <div
      className="ag-theme-quartz"
      style={{ height: '500px', width: '100%' }}
    >
      <AgGridReact<RowData>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        suppressRowTransform={true}
        animateRows={false}
        getRowId={(params) => params.data.id}
      />
    </div>
  )
}
