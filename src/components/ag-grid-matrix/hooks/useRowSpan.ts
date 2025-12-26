import { useCallback } from 'react'
import type { RowSpanParams, CellClassParams, GridApi } from 'ag-grid-community'
import type { RowData } from '../types'

export function useRowSpan() {
  const isFirstOfGroupFromApi = useCallback(
    (api: GridApi<RowData> | undefined, rowIndex: number, groupName: string): boolean => {
      if (rowIndex === 0) return true
      if (!api) return true
      const prevNode = api.getDisplayedRowAtIndex(rowIndex - 1)
      return prevNode?.data?.rowGroup !== groupName
    },
    []
  )

  const rowGroupRowSpan = useCallback((params: RowSpanParams<RowData>): number => {
    const currentRowGroup = params.data?.rowGroup
    if (!currentRowGroup) return 1

    const rowIndex = params.node?.rowIndex
    if (rowIndex === undefined || rowIndex === null) return 1

    const api = params.api
    if (!api) return 1

    if (rowIndex > 0) {
      const prevNode = api.getDisplayedRowAtIndex(rowIndex - 1)
      if (prevNode?.data?.rowGroup === currentRowGroup) {
        return 1
      }
    }

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
  }, [])

  const rowGroupCellClass = useCallback((params: CellClassParams<RowData>): string | string[] => {
    const classes = ['ag-row-group-cell']
    const currentRowGroup = params.data?.rowGroup
    const rowIndex = params.node?.rowIndex
    const api = params.api

    if (rowIndex !== undefined && rowIndex !== null && rowIndex > 0) {
      const prevNode = api?.getDisplayedRowAtIndex(rowIndex - 1)
      if (prevNode?.data?.rowGroup === currentRowGroup) {
        classes.push('ag-row-group-hidden')
      }
    }
    return classes
  }, [])

  return { isFirstOfGroupFromApi, rowGroupRowSpan, rowGroupCellClass }
}
