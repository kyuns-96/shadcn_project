'use client'

import type { CSSProperties } from 'react'
import { useState, useId, useEffect } from 'react'

import { ChevronDownIcon, ChevronUpIcon, GripVerticalIcon, LayersIcon, ChevronRightIcon, X } from 'lucide-react'

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import { arrayMove, horizontalListSortingStrategy, verticalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Cell, ColumnDef, Header, SortingState, GroupingState, ExpandedState } from '@tanstack/react-table'
import { flexRender, getCoreRowModel, getSortedRowModel, getGroupedRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useAppSelector } from '@/store'

type Employee = {
  employeeId: number
  firstName: string
  lastName: string
  jobTitle: string
  department: string
  dob: string
  hireDate: string
  salary: number
  [key: string]: any
}

const data: Employee[] = [
  {
    employeeId: 1,
    firstName: 'John',
    lastName: 'Doe',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    dob: '1990-01-01',
    hireDate: '2020-01-15',
    salary: 80000
  },
  {
    employeeId: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    jobTitle: 'Product Manager',
    department: 'Product',
    dob: '1985-05-20',
    hireDate: '2019-03-10',
    salary: 95000
  },
  {
    employeeId: 3,
    firstName: 'Alice',
    lastName: 'Johnson',
    jobTitle: 'UX Designer',
    department: 'Design',
    dob: '1992-07-30',
    hireDate: '2021-06-01',
    salary: 70000
  },
  {
    employeeId: 4,
    firstName: 'Bob',
    lastName: 'Brown',
    jobTitle: 'Data Analyst',
    department: 'Analytics',
    dob: '1988-11-15',
    hireDate: '2018-09-20',
    salary: 75000
  },
  {
    employeeId: 5,
    firstName: 'Charlie',
    lastName: 'Davis',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    dob: '1991-03-12',
    hireDate: '2021-02-10',
    salary: 85000
  },
  {
    employeeId: 6,
    firstName: 'Diana',
    lastName: 'Evans',
    jobTitle: 'Product Owner',
    department: 'Product',
    dob: '1987-08-25',
    hireDate: '2019-11-05',
    salary: 100000
  }
]

const initialColumns: ColumnDef<Employee>[] = [
  {
    id: 'drag',
    header: '',
    accessorKey: 'drag',
    cell: () => null, // The cell content is handled by DragAlongCell with dragHandleProps
    size: 5,
    minSize: 5,
    maxSize: 5,
    enableSorting: false,
    enableResizing: false,
    enableGrouping: false,
    meta: {
    }
  },
]

interface DraggableColumnDataTableDemoProps {
  data?: Employee[]
}

const DraggableColumnDataTableDemo = ({ data: initialData = [] }: DraggableColumnDataTableDemoProps) => {
  const [tableData, setTableData] = useState<Employee[]>(initialData)
  const [sorting, setSorting] = useState<SortingState>([])
  // We need to initialize columnOrder with static columns first, but it will need to be updated when dynamic columns are added.
  // Ideally, we should derive the full list of columns first, then set order.
  const dynamicColumnsState = useAppSelector(state => state.sidebar.columns)

  const allColumns = [
    ...initialColumns,
    ...dynamicColumnsState.map(col => ({
      id: col.id,
      header: col.header,
      accessorKey: col.id,
      cell: ({ row }: any) => <div>{row.getValue(col.id)}</div>
    }))
  ]

  const [columnOrder, setColumnOrder] = useState<string[]>(allColumns.map(column => column.id as string))
  const [grouping, setGrouping] = useState<GroupingState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // Sync columnOrder when new columns are added
  useEffect(() => {
    setColumnOrder(allColumns.map(column => column.id as string))
  }, [dynamicColumnsState.length])

  const table = useReactTable({
    data: tableData,
    columns: allColumns,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    state: {
      sorting,
      columnOrder,
      grouping,
      expanded,
    },
    onColumnOrderChange: setColumnOrder,
    enableSortingRemoval: false,
    enableGrouping: true,
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active && over && active.id !== over.id) {
      // Column Reordering
      if (columnOrder.includes(active.id as string) && columnOrder.includes(over.id as string)) {
        setColumnOrder(columnOrder => {
          const oldIndex = columnOrder.indexOf(active.id as string)
          const newIndex = columnOrder.indexOf(over.id as string)
          return arrayMove(columnOrder, oldIndex, newIndex)
        })
      }
      // Row Reordering (Only allowed if not grouped)
      else if (grouping.length === 0) {
        setTableData(currentData => {
          const oldIndex = currentData.findIndex(item => item.employeeId === active.id)
          const newIndex = currentData.findIndex(item => item.employeeId === over.id)

          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(currentData, oldIndex, newIndex)
          }
          return currentData
        })
      }
    }
  }

  const toggleGrouping = (columnId: string) => {
    setGrouping(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId)
      }
      return [...prev, columnId]
    })
  }

  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))

  return (
    <div className='w-full space-y-4'>
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
        <LayersIcon className="text-muted-foreground size-4" />
        <span className="text-muted-foreground text-sm font-medium">Group by:</span>
        <div className="flex flex-wrap gap-2">
          {grouping.map(groupId => {
            const column = table.getColumn(groupId)
            return (
              <Badge key={groupId} variant="secondary" className="gap-1">
                {column?.columnDef.header as string}
                <button
                  onClick={() => toggleGrouping(groupId)}
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )
          })}

          <div className="flex gap-1">
            {table.getAllColumns()
              .filter(column => column.getCanGroup() && !grouping.includes(column.id) && column.id !== 'drag')
              .map(column => (
                <Button
                  key={column.id}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => toggleGrouping(column.id)}
                >
                  + {column.columnDef.header as string || column.id}
                </Button>
              ))
            }
          </div>
        </div>
      </div>

      <div className='rounded-md border'>
        <DndContext
          id={useId()}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className='bg-muted/50 [&>th]:border-t-0'>
                  <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                    {headerGroup.headers.map(header => (
                      <DraggableTableHeader key={header.id} header={header} />
                    ))}
                  </SortableContext>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {/* If grouped, we don't use SortableContext for rows to disable dragging */}
              {grouping.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <GroupableRow key={row.id} row={row} columnOrder={columnOrder} />
                ))
              ) : (
                <SortableContext items={tableData.map(d => d.employeeId)} strategy={verticalListSortingStrategy}>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map(row => (
                      <DraggableRow key={row.original.employeeId} row={row} columnOrder={columnOrder} />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={allColumns.length} className='h-24 text-center'>
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
      <p className='text-muted-foreground text-center text-sm'>
        {grouping.length > 0 ? "Row dragging disabled while grouped" : "Data table with draggable columns and rows"}
      </p>
    </div>
  )
}

const GroupableRow = ({ row, columnOrder }: { row: any, columnOrder: string[] }) => {
  if (row.getIsGrouped()) {
    return (
      <TableRow>
        <TableCell colSpan={columnOrder.length} className="bg-muted/50 p-0 font-medium text-foreground">
          <Button
            variant="ghost"
            onClick={row.getToggleExpandedHandler()}
            className="flex h-10 w-full items-center justify-start rounded-none pl-2 hover:bg-transparent"
            style={{ paddingLeft: `${row.depth * 2}rem` }}
          >
            {row.getIsExpanded() ? (
              <ChevronDownIcon className="mr-2 size-4" />
            ) : (
              <ChevronRightIcon className="mr-2 size-4" />
            )}
            <span className="mr-2">
              {row.groupingValue as React.ReactNode}
            </span>
            <span className="text-muted-foreground font-normal">({row.subRows.length})</span>
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow data-state={row.getIsSelected() && 'selected'}>
      {row.getVisibleCells().map((cell: any) => {
        // Check if this cell is in the drag column
        const isDragColumn = cell.column.id === 'drag';

        return (
          <TableCell
            key={cell.id}
            className={isDragColumn ? 'sticky left-0 z-20 bg-background' : ''}
          >
            {cell.getIsGrouped() ? (
              // If it's a grouped cell, we don't render it again as it's in the header
              null
            ) : cell.getIsAggregated() ? (
              // If aggregated, render aggregation (not implemented here, but good to have placeholder)
              flexRender(
                cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
                cell.getContext()
              )
            ) : cell.getIsPlaceholder() ? (
              null
            ) : (
              // Add indentation to the first non-drag column if inside a group
              <div className="flex items-center">
                {cell.column.id === 'firstName' && (
                  <span style={{ paddingLeft: `${row.depth * 2}rem` }} />
                )}
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            )}
          </TableCell>
        )
      })}
    </TableRow>
  )
}

const DraggableRow = ({ row, columnOrder }: { row: any, columnOrder: string[] }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.original.employeeId
  })

  const style: CSSProperties = {
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
      data-state={row.getIsSelected() && 'selected'}
      className="group"
    >
      {row.getVisibleCells().map((cell: any) => (
        <SortableContext key={cell.id} items={columnOrder} strategy={horizontalListSortingStrategy}>
          <DragAlongCell
            key={cell.id}
            cell={cell}
            dragHandleProps={cell.column.id === 'drag' ? { ...attributes, ...listeners } : undefined}
          />
        </SortableContext>
      ))}
    </TableRow>
  )
}

const DraggableTableHeader = ({ header }: { header: Header<Employee, unknown> }) => {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: header.column.id
  })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition,
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <TableHead
            ref={setNodeRef}
            className={`before:bg-border relative h-10 border-t before:absolute before:inset-y-0 before:left-0 before:w-px first:before:bg-transparent ${header.column.id === 'drag' ? 'sticky left-0 z-20 bg-background' : ''
              }`}
            style={style}
            aria-sort={
              header.column.getIsSorted() === 'asc'
                ? 'ascending'
                : header.column.getIsSorted() === 'desc'
                  ? 'descending'
                  : 'none'
            }
          >
            <div className='flex items-center justify-start gap-0.5'>
              <Button
                size='icon'
                variant='ghost'
                className='-ml-2 size-7'
                {...attributes}
                {...listeners}
                aria-label='Drag to reorder'
              >
                <GripVerticalIcon className='opacity-60' aria-hidden='true' />
              </Button>
              <span className='grow truncate'>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </span>
              <Button
                size='icon'
                variant='ghost'
                className='group -mr-1 size-7'
                onClick={header.column.getToggleSortingHandler()}
                onKeyDown={e => {
                  if (header.column.getCanSort() && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    header.column.getToggleSortingHandler()?.(e)
                  }
                }}
                aria-label='Toggle sorting'
              >
                {{
                  asc: <ChevronUpIcon className='shrink-0 opacity-60' size={16} aria-hidden='true' />,
                  desc: <ChevronDownIcon className='shrink-0 opacity-60' size={16} aria-hidden='true' />
                }[header.column.getIsSorted() as string] ?? (
                    <ChevronUpIcon className='shrink-0 opacity-0 group-hover:opacity-60' size={16} aria-hidden='true' />
                  )}
              </Button>
              <div
                onMouseDown={header.getResizeHandler()}
                onTouchStart={header.getResizeHandler()}
                className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none bg-primary/10 hover:bg-primary/50 group-hover:bg-primary/30 ${header.column.getIsResizing() ? 'bg-primary isResizing' : ''
                  } ${!header.column.getCanResize() ? 'hidden' : ''}`}
              />
            </div>
          </TableHead>
        </TooltipTrigger>
        <TooltipContent>
          <p>{(header.column.columnDef.meta as any)?.description || header.column.id}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const DragAlongCell = ({ cell, dragHandleProps }: { cell: Cell<Employee, unknown>, dragHandleProps?: any }) => {
  const { isDragging, setNodeRef, transform, transition } = useSortable({
    id: cell.column.id
  })

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition,
    width: cell.column.getSize(),
    zIndex: isDragging ? 1 : 0
  }

  return (
    <TableCell
      ref={setNodeRef}
      className={`truncate ${cell.column.id === 'drag' ? 'sticky left-0 z-20 bg-background' : ''}`}
      style={style}
    >
      {dragHandleProps && (
        <Button variant="ghost" size="icon" className="mr-2 size-6 cursor-grab" {...dragHandleProps}>
          <GripVerticalIcon className="size-4" />
        </Button>
      )}
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  )
}

export default DraggableColumnDataTableDemo
