/**
 * @file ColumnMetadataTable.tsx
 *
 * @purpose
 * 현재 추가된 컬럼들의 메타데이터를 테이블 형태로 표시하고,
 * Power Scenario 선택 및 컬럼 삭제 기능을 제공합니다.
 *
 * - lucide-react: 아이콘
 */

"use client";

import { useCallback, useState } from "react";
import { CopyIcon, CheckIcon, RotateCcw } from "lucide-react";
import {
  Table,
  TableBody,
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
import { type DropdownConfig } from "@/components/shadcn-studio/combobox/FilterDropdownCombobox";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateCell } from "@/store/matrixSlice";
import { updateDoEMetadata, selectEnrichedDoeGroups } from "@/store/doeRegistry";
import { removeDoEFromAll, resetAllDoEs, reorderDoEsAll } from "@/store/doeThunks";
import {
  setColumnPowerScenario,
  clearColumnPowerScenario,
} from "@/store/reducers/selectedReducer";
import { extractMetricValue } from "@/variables/metricValueExtractor";
import { DoeSortableContext } from "./DoeSortableContext";
import { ColumnMetadataTableRow } from "./ColumnMetadataTableRow";
/** 데이터가 없을 때 표시되는 기본값 */
const EMPTY_VALUE_PLACEHOLDER = "-";

/**
 * 컬럼 메타데이터 테이블 컴포넌트
 */
const ColumnMetadataTable = () => {
  const dispatch = useAppDispatch();
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Redux에서 컬럼 및 행 헤더, Power Scenario 선택 상태, 데이터셋 조회
  const { rowHeaders } = useAppSelector((state) => state.matrix);
  const columnPowerScenarios = useAppSelector(
    (state) => state.selected.columnPowerScenarios
  );
  const dataset = useAppSelector((state) => state.dataset.data);

  // [WHY] doeRegistry의 모든 DoE를 columnHeaders로 사용
  // 이렇게 하면 PowerPage에서 추가한 DoE도 QoRComparePage의 ColumnMetadataTable에 표시됨
  const enrichedColumnHeaders = useAppSelector(selectEnrichedDoeGroups);

  /** Power Scenario 변경 핸들러 */
  const handleScenarioChange = useCallback(
    (columnId: string, columnLabel: string, newScenario: string) => {
      // 1. doeRegistry 메타데이터 업데이트 (모든 참조처에 자동 반영)
      dispatch(
        updateDoEMetadata({
          doeId: columnId,
          POWER_SCENARIO: newScenario,
        })
      );

      // 2. Redux selected 상태에도 업데이트 (역사적 호환성용)
      dispatch(setColumnPowerScenario({ columnId, scenario: newScenario }));

      // 3. 해당 컬럼의 데이터셋 가져오기
      const datasetPayload = (dataset?.[columnLabel] ?? {}) as Record<
        string,
        unknown
      >;

      // 4. 각 행의 셀 값 다시 추출
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

  /** 컬럼 삭제 핸들러 */
  const handleDeleteColumn = useCallback(
    (columnId: string) => {
      dispatch(removeDoEFromAll(columnId));
      dispatch(clearColumnPowerScenario(columnId));
    },
    [dispatch]
  );

  const handleDragEnd = useCallback(
    (activeId: string, overId: string) => {
      dispatch(reorderDoEsAll(activeId, overId));
    },
    [dispatch]
  );

  /** 각 컬럼의 Power Scenario 드롭다운 설정 생성 */
  const getScenarioDropdownConfig = useCallback(
    (column: (typeof enrichedColumnHeaders)[0]): DropdownConfig => {
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

  /** 테이블 데이터를 TSV 형식으로 복사 (엑셀용) */
  const handleCopyTable = useCallback(async () => {
    // 헤더 행
    const headers = [
      "Label",
      "PROJECT",
      "BLOCK",
      "NET_VER",
      "REVISION",
      "ECO_NUM",
      "Power Scenario",
    ];
    const headerLine = headers.join("\t");

    // 데이터 행들
    const dataLines = enrichedColumnHeaders.map((column) =>
      [
        column.label,
        column.PROJECT_NAME || "-",
        column.BLOCK || "-",
        column.NET_VER || "-",
        column.REVISION || "-",
        column.ECO_NUM || "-",
        columnPowerScenarios[column.id] || column.POWER_SCENARIO || "-",
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
   }, [enrichedColumnHeaders, columnPowerScenarios]);

   const isEmpty = enrichedColumnHeaders.length === 0;

   return (
     <div className="space-y-3">
       <div className="flex justify-end gap-2">
         {/* Reset Button with AlertDialog */}
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
                 This will remove all {enrichedColumnHeaders.length} DoE(s). This action cannot be undone.
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
         {/* Copy Button */}
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
                 <TableHead className="w-[40px]"></TableHead>
                 <TableHead className="w-[65px]">Label</TableHead>
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
               <DoeSortableContext
                 items={enrichedColumnHeaders.map((c) => c.id)}
                 onDragEnd={handleDragEnd}
               >
                 {enrichedColumnHeaders.map((column) => (
                   <ColumnMetadataTableRow
                     key={column.id}
                     column={column}
                     getScenarioDropdownConfig={getScenarioDropdownConfig}
                     handleDeleteColumn={handleDeleteColumn}
                   />
                 ))}
               </DoeSortableContext>
             </TableBody>
           </Table>
         </div>
       )}
    </div>
  );
};

export default ColumnMetadataTable;
