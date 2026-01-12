/**
 * @file TimingColumnMetadataTable.tsx
 *
 * @purpose
 * Timing 페이지 전용 DoE 그룹 메타데이터 테이블 컴포넌트입니다.
 * 현재 추가된 DoE 그룹들의 메타데이터를 테이블 형태로 표시하고,
 * Timing Scenario 선택 및 DoE 삭제 기능을 제공합니다.
 *
 * @structure
 * 1. DoE 그룹 메타데이터 테이블 (Label, Project, Block, NetVer, Revision, EcoNum)
 * 2. Timing Scenario 드롭다운 (각 DoE별 선택)
 * 3. DoE 삭제 버튼 (휴지통 아이콘)
 *
 * @dependencies
 * - @/components/ui/table: shadcn 테이블 컴포넌트
 * - @/components/shadcn-studio/combobox/FilterDropdownCombobox: 드롭다운
 * - @/store: Redux store 및 hooks
 * - @/store/doeRegistry: updateDoEMetadata, removeDoE
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
import { updateDoEMetadata, removeDoE } from "@/store/doeRegistry";
import { removeTimingRow, updateTimingCell } from "@/store/reducers/timingMatrixReducer";
import { extractMetricValue } from "@/variables/metricValueExtractor";
import {
  TIMING_COLUMN_GROUPS,
  TIMING_METRICS,
  generateTimingColumnKey,
  getTimingMetricKey,
  EMPTY_VALUE_PLACEHOLDER,
} from "@/variables/defaultTimingMatrixTemplate";

/** 데이터가 없을 때 표시되는 기본값 */
const EMPTY_PLACEHOLDER = "-";

/**
 * Timing 페이지 전용 DoE 메타데이터 테이블 컴포넌트
 *
 * 현재 추가된 모든 DoE의 메타데이터를 표시하고,
 * 각 DoE의 Timing Scenario를 선택하거나 삭제할 수 있습니다.
 */
const TimingColumnMetadataTable = () => {
  const dispatch = useAppDispatch();

  // Redux에서 DoE 레지스트리 조회
  const doeRegistry = useAppSelector((state) => state.doeRegistry);
  const { rows } = useAppSelector((state) => state.timingMatrix);
  const dataset = useAppSelector((state) => state.dataset);

  // timingMatrix의 rows에 해당하는 DoE만 표시 (timing page에서 추가된 것들)
  const timingDoeEntries = rows.map((row) => ({
    ...doeRegistry.byId[row.id],
    id: row.id,
    label: row.label,
  }));

  /**
   * Timing Scenario 변경 핸들러
   * 시나리오 변경 시 해당 DoE 행의 모든 셀 값을 다시 추출합니다.
   */
  const handleScenarioChange = useCallback(
    (doeId: string, doeLabel: string, newScenario: string) => {
      // 1. doeRegistry 메타데이터 업데이트
      dispatch(
        updateDoEMetadata({
          doeId,
          TIMING_SCENARIO: newScenario,
        })
      );

      // 2. 해당 DoE의 데이터셋 가져오기
      const datasetPayload = (dataset?.[doeLabel] ?? {}) as Record<
        string,
        unknown
      >;

      // 3. 모든 컬럼 그룹/메트릭 조합에 대해 값 추출
      TIMING_COLUMN_GROUPS.forEach((columnGroup) => {
        TIMING_METRICS.forEach((metric) => {
          const columnId = generateTimingColumnKey(columnGroup, metric);
          const metricKey = getTimingMetricKey(columnGroup, metric);
          const metricValue =
            extractMetricValue(metricKey, datasetPayload, newScenario) ??
            EMPTY_VALUE_PLACEHOLDER;

          dispatch(
            updateTimingCell({
              rowId: doeId,
              columnId,
              value: metricValue,
            })
          );
        });
      });
    },
    [dispatch, dataset]
  );

  /**
   * DoE 행 삭제 핸들러
   */
  const handleDeleteDoe = useCallback(
    (doeId: string) => {
      // timingMatrix에서 행 삭제
      dispatch(removeTimingRow(doeId));
      // doeRegistry에서도 삭제
      dispatch(removeDoE(doeId));
    },
    [dispatch]
  );

  /**
   * 각 DoE의 Timing Scenario 드롭다운 설정 생성
   */
  const getScenarioDropdownConfig = useCallback(
    (doeEntry: (typeof timingDoeEntries)[0]): DropdownConfig => {
      const availableScenarios = doeEntry.AVAILABLE_TIMING_SCENARIOS || [];
      const currentScenario = doeEntry.TIMING_SCENARIO || "";

      return {
        value: currentScenario,
        placeholder: "Select Scenario",
        label: "",
        data: availableScenarios,
        set: (value: string) =>
          handleScenarioChange(doeEntry.id, doeEntry.label, value),
      };
    },
    [handleScenarioChange]
  );

  // 데이터가 없을 때
  if (timingDoeEntries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No DoE added yet. Use the DoE input form to add one.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead className="w-[150px]">DoE Name</TableHead>
            <TableHead className="w-[120px]">Project</TableHead>
            <TableHead className="w-[100px]">Block</TableHead>
            <TableHead className="w-[100px]">NetVer</TableHead>
            <TableHead className="w-[100px]">Revision</TableHead>
            <TableHead className="w-[100px]">EcoNum</TableHead>
            <TableHead className="w-[200px]">Timing Scenario</TableHead>
            <TableHead className="w-[50px] text-center">Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timingDoeEntries.map((doeEntry) => (
            <TableRow key={doeEntry.id} className="hover:bg-muted/50">
              {/* DoE Name */}
              <TableCell className="font-medium">{doeEntry.label}</TableCell>

              {/* Project Name */}
              <TableCell className="text-sm">
                {doeEntry.PROJECT_NAME || EMPTY_PLACEHOLDER}
              </TableCell>

              {/* Block */}
              <TableCell className="text-sm">
                {doeEntry.BLOCK || EMPTY_PLACEHOLDER}
              </TableCell>

              {/* NetVer */}
              <TableCell className="text-sm">
                {doeEntry.NET_VER || EMPTY_PLACEHOLDER}
              </TableCell>

              {/* Revision */}
              <TableCell className="text-sm">
                {doeEntry.REVISION || EMPTY_PLACEHOLDER}
              </TableCell>

              {/* EcoNum */}
              <TableCell className="text-sm">
                {doeEntry.ECO_NUM || EMPTY_PLACEHOLDER}
              </TableCell>

              {/* Timing Scenario Dropdown */}
              <TableCell>
                {(doeEntry.AVAILABLE_TIMING_SCENARIOS?.length ?? 0) > 0 ? (
                  <div className="w-full">
                    <FilterDropdownCombobox
                      dropdownConfigs={[getScenarioDropdownConfig(doeEntry)]}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {EMPTY_PLACEHOLDER}
                  </span>
                )}
              </TableCell>

              {/* Delete Button */}
              <TableCell className="text-center">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteDoe(doeEntry.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2Icon className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TimingColumnMetadataTable;
