"use client"

import * as React from "react"
import {
    type ColumnDef,
    type SortingState,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onDataChange: (data: TData[]) => void
    onColumnsChange: (columns: ColumnDef<TData, TValue>[]) => void
}

// Draggable Column Header Component
const DraggableTableHeader = ({
    header,
}: {
    header: any
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: header.column.id })

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
        cursor: 'grab',
        width: header.column.getSize(),
    }

    return (
        <TableHead ref={setNodeRef} style={style} className="relative group">
            <div {...attributes} {...listeners} className="flex items-center gap-2">
                {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                    )}
            </div>
            <div
                onMouseDown={header.getResizeHandler()}
                onTouchStart={header.getResizeHandler()}
                className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none bg-primary/10 hover:bg-primary/50 group-hover:bg-primary/30 ${header.column.getIsResizing() ? 'bg-primary isResizing' : ''
                    }`}
            />
        </TableHead>
    )
}

// Draggable Row Component
const DraggableTableRow = ({
    row,
}: {
    row: any
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: row.original.id })

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1 : 0,
        position: 'relative',
    }

    return (
        <TableRow
            ref={setNodeRef}
            style={style}
            data-state={row.getIsSelected() && "selected"}
            {...attributes}
            {...listeners}
        >
            {row.getVisibleCells().map((cell: any) => (
                <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    )
}

export function DataTable<TData extends { id: string }, TValue>({
    columns,
    data,
    onDataChange,
    onColumnsChange,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])

    const table = useReactTable({
        data,
        columns,
        columnResizeMode: "onChange",
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
        },
    })

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over) return

        if (active.id !== over.id) {
            // Check if it's a column drag
            const activeColumnIndex = columns.findIndex(col => (col as any).accessorKey === active.id || col.id === active.id)
            const overColumnIndex = columns.findIndex(col => (col as any).accessorKey === over.id || col.id === over.id)

            if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
                onColumnsChange(arrayMove(columns, activeColumnIndex, overColumnIndex))
                return
            }

            // Check if it's a row drag
            const activeRowIndex = data.findIndex(item => item.id === active.id)
            const overRowIndex = data.findIndex(item => item.id === over.id)

            if (activeRowIndex !== -1 && overRowIndex !== -1) {
                onDataChange(arrayMove(data, activeRowIndex, overRowIndex))
            }
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <SortableContext
                                key={headerGroup.id}
                                items={headerGroup.headers.map(h => h.column.id)}
                                strategy={horizontalListSortingStrategy}
                            >
                                <TableRow>
                                    {headerGroup.headers.map((header) => (
                                        <DraggableTableHeader key={header.id} header={header} />
                                    ))}
                                </TableRow>
                            </SortableContext>
                        ))}
                    </TableHeader>
                    <TableBody>
                        <SortableContext
                            items={data.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <DraggableTableRow key={row.id} row={row} />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </SortableContext>
                    </TableBody>
                </Table>
            </div>
        </DndContext>
    )
}
