import { useCallback, type RefObject } from 'react'
import type { AgGridReact } from 'ag-grid-react'
import type { CellClickedEvent, IRowNode } from 'ag-grid-community'
import type { RowData } from '../types'

export function useSelection(gridRef: RefObject<AgGridReact<RowData> | null>) {
  const selectGroupRows = useCallback((groupName: string) => {
    const api = gridRef.current?.api
    if (!api) return

    api.deselectAll()
    api.forEachNode((node: IRowNode<RowData>) => {
      if (node.data?.rowGroup === groupName) {
        node.setSelected(true)
      }
    })
  }, [gridRef])

  const selectSingleRow = useCallback((rowId: string) => {
    const api = gridRef.current?.api
    if (!api) return

    api.deselectAll()
    api.forEachNode((node: IRowNode<RowData>) => {
      if (node.data?.id === rowId) {
        node.setSelected(true)
      }
    })
  }, [gridRef])

  const onCellClicked = useCallback((event: CellClickedEvent<RowData>) => {
    const colId = event.column.getColId()
    const data = event.data

    if (!data) return

    if (colId === 'rowGroup') {
      if (!data.rowGroup) {
        selectSingleRow(data.id)
      } else {
        selectGroupRows(data.rowGroup)
      }
    } else if (colId === 'rowHeader') {
      selectSingleRow(data.id)
    }
  }, [selectGroupRows, selectSingleRow])

  return { selectGroupRows, selectSingleRow, onCellClicked }
}
