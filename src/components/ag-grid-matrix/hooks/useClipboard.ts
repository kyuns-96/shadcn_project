import { useCallback, useState, type RefObject } from 'react'
import type { AgGridReact } from 'ag-grid-react'
import type { RowData } from '../types'
import type { MatrixState } from '@/store/matrixSlice'

interface UseClipboardProps {
  gridRef: RefObject<AgGridReact<RowData> | null>
  columnHeaders: MatrixState['columnHeaders']
  rowHeaders: MatrixState['rowHeaders']
}

export function useClipboard({ gridRef, columnHeaders, rowHeaders }: UseClipboardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyToClipboard = useCallback(async () => {
    try {
      const api = gridRef.current?.api
      if (!api) return

      const allColumns = api.getAllDisplayedColumns()
      const dataColumnOrder = allColumns
        .map((col) => col.getColId())
        .filter((colId) => colId !== 'rowGroup' && colId !== 'rowHeader')

      const headers = [
        'Group',
        'Row Header',
        ...dataColumnOrder.map((colId) => {
          const colHeader = columnHeaders.find((c) => c.id === colId)
          return colHeader?.label ?? colId
        }),
      ]

      const displayedRows: RowData[] = []
      api.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) {
          displayedRows.push(node.data)
        }
      })

      let prevGroup = ''
      const dataRows = displayedRows.map((row) => {
        const originalRow = rowHeaders.find((r) => r.id === row.id)
        if (!originalRow) return ''

        let groupValue = originalRow.rowGroup !== prevGroup ? originalRow.rowGroup : ''
        if (groupValue) {
          groupValue = groupValue.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim()
        }
        prevGroup = originalRow.rowGroup

        const rowValues = [
          groupValue,
          originalRow.label,
          ...dataColumnOrder.map((colId) => originalRow.data[colId] ?? ''),
        ]
        return rowValues.join('\t')
      })

      const tsvContent = [headers.join('\t'), ...dataRows].join('\n')

      await navigator.clipboard.writeText(tsvContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy table data: ', err)
    }
  }, [gridRef, columnHeaders, rowHeaders])

  return { copied, handleCopyToClipboard }
}
