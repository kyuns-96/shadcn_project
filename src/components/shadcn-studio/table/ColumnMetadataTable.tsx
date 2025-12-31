/**
 * @file ColumnMetadataTable.tsx
 *
 * @purpose
 * 현재 추가된 컬럼들의 메타데이터를 테이블 형태로 표시하고,
 * Power Scenario 선택 및 컬럼 삭제 기능을 제공합니다.
 *
 * @structure
 * 1. 컬럼 메타데이터 테이블 (Label, Project, Block, NetVer, Revision, EcoNum)
 * 2. Power Scenario 드롭다운 (각 컬럼별 선택)
 * 3. 컬럼 삭제 버튼 (휴지통 아이콘)
 *
 * @dependencies
 * - @/components/ui/table: shadcn 테이블 컴포넌트
 * - @/components/shadcn-studio/combobox/FilterDropdownCombobox: 드롭다운
 * - @/store: Redux store 및 hooks
 * - @/store/matrixSlice: 컬럼/셀 상태 관리
 * - @/store/reducers/selectedReducer: Power Scenario 선택 상태
 * - @/variables/metricValueExtractor: 메트릭 값 추출
 * - lucide-react: 아이콘
 */

"use client";

import { useCallback } from "react";
import { Trash2Icon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import FilterDropdownCombobox, {
  type DropdownConfig,
} from "@/components/shadcn-studio/combobox/FilterDropdownCombobox";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  removeColumn,
  updateCell,
  updateColumnScenario,
} from "@/store/matrixSlice";
import {
  setColumnPowerScenario,
  clearColumnPowerScenario,
} from "@/store/reducers/selectedReducer";
import { extractMetricValue } from "@/variables/metricValueExtractor";

/** 데이터가 없을 때 표시되는 기본값 */
const EMPTY_VALUE_PLACEHOLDER = "-";

/**
 * 컬럼 메타데이터 테이블 컴포넌트
 *
 * 현재 추가된 모든 컬럼의 메타데이터를 표시하고,
 * 각 컬럼의 Power Scenario를 선택하거나 컬럼을 삭제할 수 있습니다.
 */
const ColumnMetadataTable = () => {
  const dispatch = useAppDispatch();

  // Redux에서 컬럼 및 행 헤더, Power Scenario 선택 상태, 데이터셋 조회
  const { columnHeaders, rowHeaders } = useAppSelector((state) => state.matrix);
  const columnPowerScenarios = useAppSelector(
    (state) => state.selected.columnPowerScenarios
  );
  const dataset = useAppSelector((state) => state.dataset);

  /**
   * Power Scenario 변경 핸들러
   * 시나리오 변경 시 해당 컬럼의 모든 셀 값을 다시 추출합니다.
   */
  const handleScenarioChange = useCallback(
    (columnId: string, columnLabel: string, newScenario: string) => {
      // 1. Redux 상태 업데이트
      dispatch(setColumnPowerScenario({ columnId, scenario: newScenario }));
      dispatch(updateColumnScenario({ columnId, scenario: newScenario }));

      // 2. 해당 컬럼의 데이터셋 가져오기
      const datasetPayload = (dataset?.[columnLabel] ?? {}) as Record<
        string,
        unknown
      >;

      // 3. 각 행의 셀 값 다시 추출
      rowHeaders.forEach((rowHeader) => {
        const metricKey = `${rowHeader.rowGroup}!${rowHeader.label}`;
        const metricValue =
          extractMetricValue(metricKey, datasetPayload, newScenario) ??
          EMPTY_VALUE_PLACEHOLDER;

        dispatch(
          updateCell({
            rowId: rowHeader.id,
            columnId: columnId,
            value: metricValue,
          })
        );
      });
    },
    [dispatch, dataset, rowHeaders]
  );

  /**
   * 컬럼 삭제 핸들러
   */
  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      // Redux에서 컬럼 제거
      dispatch(removeColumn(columnId));
      // Power Scenario 매핑도 제거
      dispatch(clearColumnPowerScenario(columnId));
    },
    [dispatch]
  );

  /**
   * 각 컬럼의 Power Scenario 드롭다운 설정 생성
   */
  const getScenarioDropdownConfig = useCallback(
    (column: (typeof columnHeaders)[0]): DropdownConfig => {
      const availableScenarios = column.AVAILABLE_SCENARIOS || [];
      const currentScenario =
        columnPowerScenarios[column.id] || column.POWER_SCENARIO || "";

      return {
        value: currentScenario,
        placeholder: "Select Scenario",
        label: "",
        data: availableScenarios,
        set: (value: string) =>
          handleScenarioChange(column.id, column.label, value),
      };
    },
    [columnPowerScenarios, handleScenarioChange]
  );

  // 컬럼이 없으면 안내 메시지 표시
  if (columnHeaders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        추가된 컬럼이 없습니다. "Select Netlist Version"에서 컬럼을 추가해주세요.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Label</TableHead>
            <TableHead className="w-[80px]">Project</TableHead>
            <TableHead className="w-[112px]">Block</TableHead>
            <TableHead className="w-[120px]">Net Version</TableHead>
            <TableHead className="w-[200px] truncate">Revision</TableHead>
            <TableHead className="w-[120px]">Eco Number</TableHead>
            <TableHead className="w-[200px]">Power Scenario</TableHead>
            <TableHead className="w-[60px] text-center">Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {columnHeaders.map((column) => (
            <TableRow key={column.id}>
              <TableCell className="font-medium w-[80px]">{column.label}</TableCell>
              <TableCell className="w-[80px]">{column.PROJECT_NAME || "-"}</TableCell>
              <TableCell className="w-[112px]">{column.BLOCK || "-"}</TableCell>
              <TableCell className="w-[120px]">{column.NET_VER || "-"}</TableCell>
              <TableCell className="w-[200px] truncate">{column.REVISION || "-"}</TableCell>
              <TableCell className="w-[120px]">{column.ECO_NUM || "-"}</TableCell>
              <TableCell>
                {(column.AVAILABLE_SCENARIOS?.length ?? 0) > 0 ? (
                  <div className="w-[180px]">
                    <FilterDropdownCombobox
                      dropdownConfigs={[getScenarioDropdownConfig(column)]}
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    No scenarios
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteColumn(column.id)}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ColumnMetadataTable;
