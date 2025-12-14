'use client'

import React, { useId, useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent, DropAnimation } from '@dnd-kit/core'
import {
  arrayMove,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  SortableContext,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { GripVerticalIcon } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { moveRow, setColumnHeaders } from '@/store/matrixSlice'

// --- Types ---
type MatrixData = {
  id: string
  label: string
  [key: string]: any
}

// --- Context ---
const RowDragContext = React.createContext<any>(null)

// --- Component ---

export default function MatrixDataTable() {
  const dispatch = useAppDispatch()
  const { columnHeaders, rowHeaders } = useAppSelector(state => state.matrix)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<any>(null)

  // Local column order state for real-time reordering
  const [columnOrder, setColumnOrder] = useState<string[]>([])

  // Sync initial/external column order
  useEffect(() => {
    // Determine the full order including static columns
    // We assume static columns are always present at the start for now
    // If columnHeaders change, we reset/resync
    const fullOrder = ['drag-handle', 'row-label', ...columnHeaders.map(c => c.id)]
    setColumnOrder(fullOrder)
  }, [columnHeaders])

  // Construct columns
  const columns: ColumnDef<MatrixData>[] = [
    {
      id: 'drag-handle',
      header: '',
      cell: () => <RowDragHandle />,
      size: 40,
    },
    {
      id: 'row-label',
      header: 'Row Header',
      cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
      size: 150,
    },
    ...columnHeaders.map(col => ({
      id: col.id,
      header: col.label,
      accessorKey: col.id,
      cell: ({ row }: any) => <div>{row.original.data[col.id]}</div>
    }))
  ]

  const table = useReactTable({
    data: rowHeaders,
    columns,
    state: {
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
  })

  // Dnd Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, {})
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    const isColumn = columnHeaders.find(col => col.id === active.id)
    const isRow = rowHeaders.find(row => row.id === active.id)

    if (isColumn) {
      setActiveItem({ type: 'column', id: active.id })
    } else if (isRow) {
      setActiveItem({ type: 'row', id: active.id })
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const isColumn = columnHeaders.some(c => c.id === active.id)
    const overIsColumn = columnHeaders.some(c => c.id === over.id) || over.id === 'row-label' || over.id === 'drag-handle'

    if (isColumn && overIsColumn && columnOrder.includes(active.id as string) && columnOrder.includes(over.id as string)) {
      setColumnOrder(oldOrder => {
        const oldIndex = oldOrder.indexOf(active.id as string)
        const newIndex = oldOrder.indexOf(over.id as string)

        // Pin static columns: drag-handle (0) and row-label (1)
        if (newIndex < 2) return oldOrder;

        return arrayMove(oldOrder, oldIndex, newIndex)
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveItem(null)

    if (!over) return

    // If it was a column drag, sync the final local order to Redux
    const isColumn = columnHeaders.some(c => c.id === active.id)
    if (isColumn) {
      // Filter out static columns to get just the data column IDs in order
      const newDataColumnIds = columnOrder.slice(2)

      // Reorder the original columnHeaders array to match this ID list
      const newColumnHeaders = newDataColumnIds.map(id => columnHeaders.find(c => c.id === id)).filter(Boolean) as typeof columnHeaders

      dispatch(setColumnHeaders(newColumnHeaders))
      return
    }

    if (active.id !== over.id) {
      const isRow = rowHeaders.some(row => row.id === active.id)
      if (isRow) {
        dispatch(moveRow({ activeId: active.id as string, overId: over.id as string }))
      }
    }
  }

  const dropAnimationConfig: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  }

  const rowIds = rowHeaders.map(r => r.id)

  return (
    <DndContext
      id={useId()}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver} // Added
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                  {headerGroup.headers.map(header => {
                    // Render static headers as non-draggable
                    if (header.column.id === 'drag-handle' || header.column.id === 'row-label') {
                      return (
                        <TableHead key={header.id} className={header.column.id === 'drag-handle' ? 'w-10' : ''}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    }
                    return (
                      <DraggableColumnHeader key={header.id} header={header} />
                    )
                  })}
                </SortableContext>
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
              {table.getRowModel().rows.map(row => (
                <DraggableRow key={row.id} row={row} />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </div>

      <DragOverlay dropAnimation={dropAnimationConfig}>
        {activeId ? (
          activeItem?.type === 'column' ? (
            <div className="flex flex-col bg-background border rounded shadow-md opacity-90 overflow-hidden min-w-[150px]">
              <div className="flex h-12 items-center px-4 py-2 border-b bg-muted/50 text-left align-middle font-medium text-muted-foreground">
                <span className="font-medium text-sm">
                  {columnHeaders.find(c => c.id === activeId)?.label}
                </span>
              </div>
              <div className="flex flex-col">
                {table.getRowModel().rows.map(row => {
                  const cellData = row.original.data[activeId as string];
                  return (
                    <div key={row.id} className="flex h-16 items-center px-4 border-b last:border-0 align-middle">
                      <div className="text-sm">{cellData}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : activeItem?.type === 'row' ? (
            <div className="bg-background border rounded shadow-md opacity-90">
              {(() => {
                const row = table.getRowModel().rows.find(r => r.original.id === activeId)
                if (!row) return null

                return (
                  <Table>
                    <TableBody>
                      <TableRow className="bg-muted/50 border-none">
                        {row.getVisibleCells().map(cell => (
                          <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                )
              })()}
            </div>
          ) : null
        ) : null}
      </DragOverlay>

    </DndContext>
  )
}

// --- Sub Components ---

const DraggableColumnHeader = ({ header }: { header: any }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.column.id,
  })

  const style: CSSProperties = {
    // If we are strictly resorting DOM, we might not need transform?
    // dnd-kit still provides transform for the active item and the "flight" path.
    // For other items, `SortableContext` + `strategy` usually handles transforms if we are optimistic.
    // But since we are physically moving them with `columnOrder`, `dnd-kit`'s default sortable strategy
    // might double-apply transform if not careful.
    // Actually, if we update `items` prop of SortableContext, dnd-kit accounts for the new index.
    // It should be fine.
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: 'relative',
    cursor: isDragging ? 'grabbing' : 'grab',
    whiteSpace: 'nowrap'
  }

  return (
    <TableHead ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="flex items-center space-x-2 select-none">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </div>
    </TableHead>
  )
}

const DraggableRow = ({ row }: { row: any }) => {
  const { transform, transition, setNodeRef, isDragging, attributes, listeners } = useSortable({
    id: row.original.id,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <RowDragContext.Provider value={{ attributes, listeners }}>
      <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-muted/50" : ""}>
        {row.getVisibleCells().map((cell: any) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </RowDragContext.Provider>
  )
}

const RowDragHandle = () => {
  const { attributes, listeners } = React.useContext(RowDragContext) || {}

  return (
    <Button variant="ghost" size="icon" className="cursor-grab hover:bg-muted" {...attributes} {...listeners}>
      <GripVerticalIcon className="size-4 text-muted-foreground" />
    </Button>
  )
}
