import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type { AgGridReact } from 'ag-grid-react'
import type { RowDragEndEvent, RowDragMoveEvent, IRowNode } from 'ag-grid-community'
import type { AppDispatch } from '@/store'
import { reorderRows, deleteRows } from '@/store/matrixSlice'
import type { RowData } from '../types'
import type { MatrixState } from '@/store/matrixSlice'

interface UseDragDropProps {
  gridRef: RefObject<AgGridReact<RowData> | null>
  gridContainerRef: RefObject<HTMLDivElement | null>
  rowHeaders: MatrixState['rowHeaders']
  dispatch: AppDispatch
}

export function useDragDrop({ gridRef, gridContainerRef, rowHeaders, dispatch }: UseDragDropProps) {
  const draggingRowIdsRef = useRef<string[]>([])
  const isDraggingRef = useRef<boolean>(false)

  const onRowDragMove = useCallback((event: RowDragMoveEvent<RowData>) => {
    if (!isDraggingRef.current) {
      isDraggingRef.current = true
      const movingNodes = event.nodes || [event.node]
      draggingRowIdsRef.current = movingNodes
        .map((n) => n.data?.id)
        .filter(Boolean) as string[]
    }
  }, [])

  useEffect(() => {
    const handleGlobalMouseUp = (event: MouseEvent) => {
      if (!isDraggingRef.current || draggingRowIdsRef.current.length === 0) {
        return
      }

      const gridContainer = gridContainerRef.current
      if (!gridContainer) return

      const rect = gridContainer.getBoundingClientRect()
      const isOutside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom

      if (isOutside) {
        dispatch(deleteRows(draggingRowIdsRef.current))
        
        const api = gridRef.current?.api
        if (api) {
          api.deselectAll()
          setTimeout(() => {
            api.refreshCells({ columns: ['rowGroup'], force: true })
            api.redrawRows()
          }, 0)
        }
      }

      isDraggingRef.current = false
      draggingRowIdsRef.current = []
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [dispatch, gridRef, gridContainerRef])

  const onRowDragEnd = useCallback((event: RowDragEndEvent<RowData>) => {
    const api = gridRef.current?.api
    if (!api) return

    const movingNodes = event.nodes || [event.node]
    if (movingNodes.length === 0) return

    const movingIds = movingNodes.map((n) => n.data?.id).filter(Boolean) as string[]
    if (movingIds.length === 0) return

    const overNode = event.overNode

    isDraggingRef.current = false
    draggingRowIdsRef.current = []

    if (!overNode) return

    const overData = overNode.data
    if (!overData) return

    const movingIdSet = new Set(movingIds)

    const currentOrder: RowData[] = []
    api.forEachNodeAfterFilterAndSort((node: IRowNode<RowData>) => {
      if (node.data) {
        currentOrder.push(node.data)
      }
    })

    const overIndex = currentOrder.findIndex((row) => row.id === overData.id)
    if (overIndex === -1) return

    const movingRows = currentOrder.filter((row) => movingIdSet.has(row.id))
    const otherRows = currentOrder.filter((row) => !movingIdSet.has(row.id))

    let insertIndex = 0
    for (let i = 0; i < overIndex; i++) {
      if (!movingIdSet.has(currentOrder[i].id)) {
        insertIndex++
      }
    }

    const newOrder = [
      ...otherRows.slice(0, insertIndex),
      ...movingRows,
      ...otherRows.slice(insertIndex),
    ]

    const newRowData: RowData[] = newOrder.map((row) => ({ ...row }))

    const newRowHeaders = newOrder.map((row) => {
      const original = rowHeaders.find((r) => r.id === row.id)
      return original!
    })
    dispatch(reorderRows(newRowHeaders))

    api.deselectAll()

    setTimeout(() => {
      api.setGridOption('rowData', newRowData)
      api.refreshCells({ columns: ['rowGroup'], force: true })
      api.redrawRows()
    }, 0)
  }, [rowHeaders, dispatch, gridRef])

  return { onRowDragMove, onRowDragEnd }
}
