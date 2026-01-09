/**
 * @file PowerColumnMetadataTable.tsx
 *
 * @purpose
 * Power 페이지 전용 DoE 그룹 메타데이터 테이블 컴포넌트입니다.
 * 현재 추가된 DoE 그룹들의 메타데이터를 테이블 형태로 표시하고,
 * Power Scenario 선택 및 DoE 삭제 기능을 제공합니다.
 *
 * @structure
 * 1. DoE 그룹 메타데이터 테이블 (Label, Project, Block, NetVer, Revision, EcoNum)
 * 2. Power Scenario 드롭다운 (각 DoE별 선택)
 * 3. DoE 삭제 버튼 (휴지통 아이콘)
 *
 * @dependencies
 * - @/components/ui/table: shadcn 테이블 컴포넌트
 * - @/components/shadcn-studio/combobox/FilterDropdownCombobox: 드롭다운
 * - @/store: Redux store 및 hooks
 * - @/store/reducers/powerMatrixReducer: DoE 그룹/셀 상태 관리
 * - @/variables/metricValueExtractor: 메트릭 값 추출
 * - @/variables/defaultPowerMatrixTemplate: Power 컬럼 상수
 * - lucide-react: 아이콘
 */

"use client";

import { useCallback, useState } from "react";
import { Trash2Icon, CopyIcon, CheckIcon } from "lucide-react";
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
  removeDoeGroup,
  updatePowerCell,
  updateDoeScenario,
} from "@/store/reducers/powerMatrixReducer";
import { updateDoEMetadata, removeDoE } from "@/store/doeRegistry";
import { extractMetricValue } from "@/variables/metricValueExtractor";
import {
  POWER_COLUMN_NAMES,
  getMetricKey,
} from "@/variables/defaultPowerMatrixTemplate";

/** 데이터가 없을 때 표시되는 기본값 */
const EMPTY_VALUE_PLACEHOLDER = "-";

/**
 * Power 페이지 전용 DoE 메타데이터 테이블 컴포넌트
 *
 * 현재 추가된 모든 DoE 그룹의 메타데이터를 표시하고,
 * 각 DoE의 Power Scenario를 선택하거나 삭제할 수 있습니다.
 */
const PowerColumnMetadataTable = () => {
  const dispatch = useAppDispatch();
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Redux에서 DoE 그룹 및 행 헤더, 데이터셋 조회
  const { doeGroups, rowHeaders } = useAppSelector(
    (state) => state.powerMatrix
  );
  const doeRegistry = useAppSelector((state) => state.doeRegistry);
  const dataset = useAppSelector((state) => state.dataset);

  // doeRegistry에서 메타데이터를 가져와서 enriched doeGroups 생성
  const enrichedDoeGroups = doeGroups.map((doe) => ({
    ...doe,
    ...doeRegistry.byId[doe.id],
  }));

  /**
   * Power Scenario 변경 핸들러
   * 시나리오 변경 시 해당 DoE 그룹의 모든 셀 값을 다시 추출합니다.
   */
  const handleScenarioChange = useCallback(
    (doeId: string, doeLabel: string, newScenario: string) => {
      console.log("[PowerColumnMetadataTable] handleScenarioChange:", {
        doeId,
        doeLabel,
        newScenario,
      });

      // 1. doeRegistry 메타데이터 업데이트 (모든 참조처에 자동 반영)
      dispatch(
        updateDoEMetadata({
          doeId,
          POWER_SCENARIO: newScenario,
        })
      );

      // 2. powerMatrix 상태도 업데이트 (역사적 호환성용)
      dispatch(updateDoeScenario({ doeId, scenario: newScenario }));

      // 3. 해당 DoE의 데이터셋 가져오기
      const datasetPayload = (dataset?.[doeLabel] ?? {}) as Record<
        string,
        unknown
      >;

      console.log("[PowerColumnMetadataTable] Dataset for DoE:", {
        doeLabel,
        datasetKeys: Object.keys(datasetPayload),
      });

      // 4. 각 행의 4개 컬럼 셀 값 다시 추출
      rowHeaders.forEach((rowHeader) => {
        POWER_COLUMN_NAMES.forEach((columnName) => {
          const metricKey = getMetricKey(rowHeader.rowKey, columnName);
          const columnId = `${doeId}_${columnName}`;
          const metricValue =
            extractMetricValue(metricKey, datasetPayload, newScenario) ??
            EMPTY_VALUE_PLACEHOLDER;

          console.log("[PowerColumnMetadataTable] updatePowerCell:", {
            rowId: rowHeader.id,
            columnId,
            metricKey,
            metricValue,
          });

          dispatch(
            updatePowerCell({
              rowId: rowHeader.id,
              columnId,
              value: metricValue,
            })
          );
        });
      });
    },
    [dispatch, dataset, rowHeaders]
  );

  /**
   * DoE 그룹 삭제 핸들러
   */
  const handleDeleteDoeGroup = useCallback(
    (doeId: string) => {
      // powerMatrix에서 삭제
      dispatch(removeDoeGroup(doeId));
      // doeRegistry에서도 삭제 (모든 참조처에서 제거됨)
      dispatch(removeDoE(doeId));
    },
    [dispatch]
  );

  /**
   * 각 DoE의 Power Scenario 드롭다운 설정 생성
   */
  const getScenarioDropdownConfig = useCallback(
    (doeGroup: (typeof enrichedDoeGroups)[0]): DropdownConfig => {
      const availableScenarios = doeGroup.AVAILABLE_SCENARIOS || [];
      const currentScenario = doeGroup.POWER_SCENARIO || "";

      return {
        value: currentScenario,
        placeholder: "Select Scenario",
        label: "",
        data: availableScenarios,
        set: (value: string) =>
          handleScenarioChange(doeGroup.id, doeGroup.label, value),
      };
    },
    [handleScenarioChange]
  );

  /**
   * 테이블 데이터를 TSV 형식으로 복사 (엑셀용)
   */
  const handleCopyTable = useCallback(async () => {
    // 헤더 행
    const headers = [
      "DoE Name",
      "PROJECT",
      "BLOCK",
      "NET_VER",
      "REVISION",
      "ECO_NUM",
      "Power Scenario",
    ];
    const headerLine = headers.join("\t");

    // 데이터 행들
    const dataLines = enrichedDoeGroups.map((doeGroup) =>
      [
        doeGroup.label,
        doeGroup.PROJECT_NAME || "-",
        doeGroup.BLOCK || "-",
        doeGroup.NET_VER || "-",
        doeGroup.REVISION || "-",
        doeGroup.ECO_NUM || "-",
        doeGroup.POWER_SCENARIO || "-",
      ].join("\t")
    );

    // 전체 텍스트 (헤더 + 데이터)
    const tsvText = [headerLine, ...dataLines].join("\n");

    try {
      await navigator.clipboard.writeText(tsvText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy table data:", error);
    }
  }, [enrichedDoeGroups]);

  // DoE가 없으면 안내 메시지 표시
  if (enrichedDoeGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        추가된 DoE가 없습니다. "Select Netlist Version"에서 DoE를 추가해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyTable}
          className="relative disabled:opacity-100"
          disabled={isCopied}
        >
          <span
            className={`transition-all ${
              isCopied ? "scale-100 opacity-100" : "scale-0 opacity-0"
            }`}
          >
            <CheckIcon className="h-4 w-4 stroke-green-600 dark:stroke-green-400" />
          </span>
          <span
            className={`absolute left-3 transition-all ${
              isCopied ? "scale-0 opacity-0" : "scale-100 opacity-100"
            }`}
          >
            <CopyIcon className="h-4 w-4" />
          </span>
          <span className="ml-2">{isCopied ? "Copied!" : "Copy"}</span>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">DoE Name</TableHead>
              <TableHead className="w-[80px]">PROJECT</TableHead>
              <TableHead className="w-[95px]">BLOCK</TableHead>
              <TableHead className="w-[120px]">NET_VER</TableHead>
              <TableHead className="w-[170px] truncate">REVISION</TableHead>
              <TableHead className="w-[105px]">ECO_NUM</TableHead>
              <TableHead className="w-[277px]">Power Scenario</TableHead>
              <TableHead className="w-[60px] text-center">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedDoeGroups.map((doeGroup) => (
              <TableRow key={doeGroup.id}>
                <TableCell className="font-medium w-[100px]">
                  {doeGroup.label}
                </TableCell>
                <TableCell className="w-[80px]">
                  {doeGroup.PROJECT_NAME || "-"}
                </TableCell>
                <TableCell className="w-[95px]">
                  {doeGroup.BLOCK || "-"}
                </TableCell>
                <TableCell className="w-[120px]">
                  {doeGroup.NET_VER || "-"}
                </TableCell>
                <TableCell className="w-[170px] truncate">
                  {doeGroup.REVISION || "-"}
                </TableCell>
                <TableCell className="w-[105px]">
                  {doeGroup.ECO_NUM || "-"}
                </TableCell>
                <TableCell>
                  {(doeGroup.AVAILABLE_SCENARIOS?.length ?? 0) > 0 ? (
                    <div className="w-[250px] [&_div]:w-full [&_button]:w-full">
                      <FilterDropdownCombobox
                        dropdownConfigs={[getScenarioDropdownConfig(doeGroup)]}
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
                    onClick={() => handleDeleteDoeGroup(doeGroup.id)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PowerColumnMetadataTable;
