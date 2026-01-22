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

import { useCallback, useState } from "react";
import { Trash2Icon, CopyIcon, CheckIcon, RotateCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import FilterDropdownCombobox, {
  type DropdownConfig,
} from "@/components/shadcn-studio/combobox/FilterDropdownCombobox";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateDoEMetadata } from "@/store/doeRegistry";
import { removeDoEFromAll, resetAllDoEs } from "@/store/doeThunks";
import { updateTimingCell } from "@/store/reducers/timingMatrixReducer";
import { extractMetricValue } from "@/variables/metricValueExtractor";
import {
  TIMING_COLUMN_GROUPS,
  TIMING_METRICS,
  generateTimingColumnKey,
  getTimingMetricKey,
  EMPTY_VALUE_PLACEHOLDER,
} from "@/variables/defaultTimingMatrixTemplate";

/**
 * Timing 페이지 전용 DoE 메타데이터 테이블 컴포넌트
 *
 * 현재 추가된 모든 DoE의 메타데이터를 표시하고,
 * 각 DoE의 Timing Scenario를 선택하거나 삭제할 수 있습니다.
 */
const TimingColumnMetadataTable = () => {
  const dispatch = useAppDispatch();
  const [isCopied, setIsCopied] = useState<boolean>(false);

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
      dispatch(removeDoEFromAll(doeId));
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
      "Timing Scenario",
    ];
    const headerLine = headers.join("\t");

    // 데이터 행들
    const dataLines = timingDoeEntries.map((doeEntry) =>
      [
        doeEntry.label,
        doeEntry.PROJECT_NAME || "-",
        doeEntry.BLOCK || "-",
        doeEntry.NET_VER || "-",
        doeEntry.REVISION || "-",
        doeEntry.ECO_NUM || "-",
        doeEntry.TIMING_SCENARIO || "-",
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
  }, [timingDoeEntries]);

  const isEmpty = timingDoeEntries.length === 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isEmpty} className="text-destructive hover:text-destructive">
              <RotateCcw className="h-4 w-4" />
              <span className="ml-2">Reset</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset All DoEs?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all {timingDoeEntries.length} DoE(s). This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={() => dispatch(resetAllDoEs())}
              >
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
      {isEmpty ? (
        <div className="text-center py-8 text-muted-foreground">
          추가된 데이터가 없습니다.
        </div>
      ) : (
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
                <TableHead className="w-[277px]">Timing Scenario</TableHead>
                <TableHead className="w-[60px] text-center">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timingDoeEntries.map((doeEntry) => (
                <TableRow key={doeEntry.id}>
                  <TableCell className="font-medium w-[100px]">
                    {doeEntry.label}
                  </TableCell>
                  <TableCell className="w-[80px]">
                    {doeEntry.PROJECT_NAME || "-"}
                  </TableCell>
                  <TableCell className="w-[95px]">
                    {doeEntry.BLOCK || "-"}
                  </TableCell>
                  <TableCell className="w-[120px]">
                    {doeEntry.NET_VER || "-"}
                  </TableCell>
                  <TableCell className="w-[170px] truncate">
                    {doeEntry.REVISION || "-"}
                  </TableCell>
                  <TableCell className="w-[105px]">
                    {doeEntry.ECO_NUM || "-"}
                  </TableCell>
                  <TableCell>
                    {(doeEntry.AVAILABLE_TIMING_SCENARIOS?.length ?? 0) > 0 ? (
                      <div className="w-[250px] [&_div]:w-full [&_button]:w-full">
                        <FilterDropdownCombobox
                          dropdownConfigs={[getScenarioDropdownConfig(doeEntry)]}
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
                      onClick={() => handleDeleteDoe(doeEntry.id)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TimingColumnMetadataTable;
