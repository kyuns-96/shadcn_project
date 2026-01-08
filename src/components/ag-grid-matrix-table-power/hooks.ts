/**
 * @file ag-grid-matrix-table-power/hooks.ts
 *
 * @purpose
 * Power 전용 AG Grid 테이블의 커스텀 훅들을 정의합니다.
 * 행 선택, 드래그 핸들러 등의 기능을 제공합니다.
 *
 * @dependencies
 * - ag-grid-community: AG Grid 타입들
 * - @/store: Redux 관련 타입들
 */

import { useCallback } from "react";
import type { CellClickedEvent, GridApi, IRowNode } from "ag-grid-community";
import type { PowerRowData } from "./types";

/**
 * 셀 선택 관련 훅
 */
export function useSelectionHandlers(gridRef: React.RefObject<any>) {
  const selectSingleRow = useCallback(
    (rowId: string) => {
      const api = gridRef.current?.api as GridApi<PowerRowData> | undefined;
      if (!api) return;
      api.deselectAll();
      api.forEachNode((node: IRowNode<PowerRowData>) => {
        if (node.data?.id === rowId) node.setSelected(true);
      });
    },
    [gridRef]
  );

  const onCellClicked = useCallback(
    (event: CellClickedEvent<PowerRowData>) => {
      const colId = event.column.getColId();
      const data = event.data;
      if (!data) return;
      if (colId === "rowHeader") {
        selectSingleRow(data.id);
      }
    },
    [selectSingleRow]
  );

  return { onCellClicked };
}

/**
 * 행 클래스 관련 훅
 */
export function useRowClasses() {
  const getRowClass = useCallback(() => {
    return "power-table-row";
  }, []);

  return { getRowClass };
}
