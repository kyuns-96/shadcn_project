import { useCallback, useEffect, useRef } from "react";
import type {
  CellClickedEvent,
  CellClassParams,
  GridApi,
  IRowNode,
  RowClassParams,
  RowDragEndEvent,
  RowDragMoveEvent,
  RowSpanParams,
} from "ag-grid-community";
import type { RowData } from "./types";
import { deleteRows, reorderRows } from "@/store/matrixSlice";
import type { AppDispatch } from "@/store";

export function useSelectionHandlers(gridRef: React.RefObject<any>) {
  const selectGroupRows = useCallback(
    (groupName: string) => {
      const api = gridRef.current?.api as GridApi<RowData> | undefined;
      if (!api) return;
      api.deselectAll();
      api.forEachNode((node: IRowNode<RowData>) => {
        if (node.data?.rowGroup === groupName) node.setSelected(true);
      });
    },
    [gridRef]
  );

  const selectSingleRow = useCallback(
    (rowId: string) => {
      const api = gridRef.current?.api as GridApi<RowData> | undefined;
      if (!api) return;
      api.deselectAll();
      api.forEachNode((node: IRowNode<RowData>) => {
        if (node.data?.id === rowId) node.setSelected(true);
      });
    },
    [gridRef]
  );

  const onCellClicked = useCallback(
    (event: CellClickedEvent<RowData>) => {
      const colId = event.column.getColId();
      const data = event.data;
      if (!data) return;
      if (colId === "rowGroup") {
        if (!data.rowGroup) selectSingleRow(data.id);
        else selectGroupRows(data.rowGroup);
      } else if (colId === "rowHeader") {
        selectSingleRow(data.id);
      }
    },
    [selectGroupRows, selectSingleRow]
  );

  return { onCellClicked };
}

export function useRowSpanAndClasses() {
  const isFirstOfGroupFromApi = useCallback(
    (
      api: GridApi<RowData> | undefined,
      rowIndex: number,
      groupName: string
    ): boolean => {
      if (rowIndex === 0) return true;
      if (!api) return true;
      const prevNode = api.getDisplayedRowAtIndex(rowIndex - 1);
      const prevGroup = prevNode?.data?.rowGroup;
      return prevGroup !== groupName;
    },
    []
  );

  const rowGroupRowSpan = useCallback(
    (params: RowSpanParams<RowData>): number => {
      const currentRowGroup = params.data?.rowGroup;
      if (!currentRowGroup) return 1;
      const rowIndex = params.node?.rowIndex;
      if (rowIndex === undefined || rowIndex === null) return 1;
      const api = params.api;
      if (!api) return 1;

      if (rowIndex > 0) {
        const prevNode = api.getDisplayedRowAtIndex(rowIndex - 1);
        const prevRowGroup = prevNode?.data?.rowGroup;
        if (prevRowGroup === currentRowGroup) return 1;
      }

      const displayedRowCount = api.getDisplayedRowCount();
      let spanCount = 1;
      for (let i = rowIndex + 1; i < displayedRowCount; i++) {
        const nextNode = api.getDisplayedRowAtIndex(i);
        if (nextNode?.data?.rowGroup === currentRowGroup) spanCount++;
        else break;
      }
      return spanCount;
    },
    []
  );

  const rowGroupCellClass = useCallback(
    (params: CellClassParams<RowData>): string | string[] => {
      const classes = ["ag-row-group-cell"];
      const currentRowGroup = params.data?.rowGroup;
      const rowIndex = params.node?.rowIndex;
      const api = params.api;
      if (rowIndex !== undefined && rowIndex !== null && rowIndex > 0) {
        const prevNode = api?.getDisplayedRowAtIndex(rowIndex - 1);
        const prevRowGroup = prevNode?.data?.rowGroup;
        if (prevRowGroup === currentRowGroup)
          classes.push("ag-row-group-hidden");
      }
      return classes;
    },
    []
  );

  const getRowClass = useCallback(
    (params: RowClassParams<RowData>): string | string[] => {
      const classes: string[] = [];
      const currentRowGroup = params.data?.rowGroup;
      const rowIndex = params.node?.rowIndex;
      const api = params.api;
      if (rowIndex === undefined || rowIndex === null || !api) return classes;

      if (rowIndex === 0) classes.push("ag-row-group-first");
      else {
        const prevNode = api.getDisplayedRowAtIndex(rowIndex - 1);
        const prevRowGroup = prevNode?.data?.rowGroup;
        if (prevRowGroup !== currentRowGroup)
          classes.push("ag-row-group-first");
      }

      const displayedRowCount = api.getDisplayedRowCount();
      if (rowIndex === displayedRowCount - 1) classes.push("ag-row-group-last");
      else {
        const nextNode = api.getDisplayedRowAtIndex(rowIndex + 1);
        const nextRowGroup = nextNode?.data?.rowGroup;
        if (nextRowGroup !== currentRowGroup) classes.push("ag-row-group-last");
      }

      return classes;
    },
    []
  );

  return {
    isFirstOfGroupFromApi,
    rowGroupRowSpan,
    rowGroupCellClass,
    getRowClass,
  };
}

export function useRowDragHandlers(
  gridRef: React.RefObject<any>,
  gridContainerRef: React.RefObject<HTMLDivElement | null>,
  rowHeaders: Array<{ id: string }>,
  dispatch: AppDispatch
) {
  const draggingRowIdsRef = useRef<string[]>([]);
  const isDraggingRef = useRef<boolean>(false);

  const onRowDragMove = useCallback((event: RowDragMoveEvent<RowData>) => {
    if (!isDraggingRef.current) {
      isDraggingRef.current = true;
      const movingNodes = event.nodes || [event.node];
      draggingRowIdsRef.current = movingNodes
        .map((n) => n.data?.id)
        .filter(Boolean) as string[];
    }
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = (event: MouseEvent) => {
      if (!isDraggingRef.current || draggingRowIdsRef.current.length === 0)
        return;
      const gridContainer = gridContainerRef.current;
      if (!gridContainer) return;
      const rect = gridContainer.getBoundingClientRect();
      const isOutside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;
      if (isOutside) {
        dispatch(deleteRows(draggingRowIdsRef.current));
        const api = gridRef.current?.api as GridApi<RowData> | undefined;
        if (api) {
          api.deselectAll();
          setTimeout(() => {
            api.refreshCells({ columns: ["rowGroup"], force: true });
            api.redrawRows();
          }, 0);
        }
      }
      isDraggingRef.current = false;
      draggingRowIdsRef.current = [];
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [dispatch, gridContainerRef, gridRef]);

  const onRowDragEnd = useCallback(
    (event: RowDragEndEvent<RowData>) => {
      const api = gridRef.current?.api as GridApi<RowData> | undefined;
      if (!api) return;
      const movingNodes = event.nodes || [event.node];
      if (movingNodes.length === 0) return;
      const movingIds = movingNodes
        .map((n) => n.data?.id)
        .filter(Boolean) as string[];
      if (movingIds.length === 0) return;

      const overNode = event.overNode;
      isDraggingRef.current = false;
      draggingRowIdsRef.current = [];
      if (!overNode) return;

      const overData = overNode.data;
      if (!overData) return;

      const movingIdSet = new Set(movingIds);
      const currentOrder: RowData[] = [];
      api.forEachNodeAfterFilterAndSort((node: IRowNode<RowData>) => {
        if (node.data) currentOrder.push(node.data);
      });

      const overIndex = currentOrder.findIndex((row) => row.id === overData.id);
      if (overIndex === -1) return;

      const movingRows = currentOrder.filter((row) => movingIdSet.has(row.id));
      const otherRows = currentOrder.filter((row) => !movingIdSet.has(row.id));

      let insertIndex = 0;
      for (let i = 0; i < overIndex; i++) {
        if (!movingIdSet.has(currentOrder[i].id)) insertIndex++;
      }

      const newOrder = [
        ...otherRows.slice(0, insertIndex),
        ...movingRows,
        ...otherRows.slice(insertIndex),
      ];

      const newRowHeaders = newOrder.map((row) => {
        const original = rowHeaders.find((r) => r.id === row.id);
        return original!;
      });

      dispatch(reorderRows(newRowHeaders as any));
      api.deselectAll();

      setTimeout(() => {
        api.setGridOption(
          "rowData",
          newOrder.map((r) => ({ ...r }))
        );
        api.refreshCells({ columns: ["rowGroup"], force: true });
        api.redrawRows();
      }, 0);
    },
    [dispatch, gridRef, rowHeaders]
  );

  return { onRowDragMove, onRowDragEnd };
}
