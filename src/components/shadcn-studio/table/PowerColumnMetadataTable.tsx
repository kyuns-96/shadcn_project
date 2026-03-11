 "use client";

import { useCallback, useState, useEffect } from "react";
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
import EnvDataDialog from "@/components/shadcn-studio/dialog/EnvDataDialog";
import { type DropdownConfig } from "@/components/shadcn-studio/combobox/FilterDropdownCombobox";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  updatePowerCell,
  updateDoeScenario,
} from "@/store/reducers/powerMatrixReducer";
import { updateDoEMetadata, selectEnrichedDoeGroups } from "@/store/doeRegistry";
import { removeDoEFromAll, resetAllDoEs, reorderDoEsAll } from "@/store/doeThunks";
import { extractMetricValue } from "@/variables/metricValueExtractor";
import {
  POWER_COLUMN_NAMES,
  getMetricKey,
} from "@/variables/defaultPowerMatrixTemplate";
import { DoeSortableContext } from "./DoeSortableContext";
import { PowerColumnMetadataTableRow } from "./PowerColumnMetadataTableRow";

/** Power 페이지 전용 DoE 메타데이터 테이블 컴포넌트 */
const PowerColumnMetadataTable = () => {
  const dispatch = useAppDispatch();
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [selectedDoeId, setSelectedDoeId] = useState<string>("");

  const { rowHeaders } = useAppSelector((state) => state.powerMatrix);
  const doeRegistry = useAppSelector((state) => state.doeRegistry);
  const enrichedDoeGroups = useAppSelector(selectEnrichedDoeGroups);
  const dataset = useAppSelector((state) => state.dataset.data);

  const selectedDoeGroup = selectedDoeId
    ? doeRegistry.byId[selectedDoeId]
    : undefined;

  const selectedScenario = selectedDoeGroup?.POWER_SCENARIO;

  const envData = selectedDoeGroup
    ? ((dataset?.[selectedDoeGroup.label]?.get_ptpxpower as Record<string, unknown>)
        ?.ptpxpower_data as Record<string, Record<string, unknown>>)?.[
        selectedScenario || ""
      ]?.env as Record<string, unknown> | undefined
    : undefined;

  const handleDoeNameClick = useCallback((doeId: string) => {
    setSelectedDoeId(doeId);
    setIsDialogOpen(true);
  }, []);

  useEffect(() => {
    if (isDialogOpen && selectedDoeId && selectedDoeGroup) {
      const currentScenario = selectedDoeGroup.POWER_SCENARIO;
      if (currentScenario !== selectedScenario) {
        setIsDialogOpen(false);
      }
    }
  }, [isDialogOpen, selectedDoeId, selectedDoeGroup, selectedScenario]);

  /** Power Scenario 변경 핸들러 */
  const handleScenarioChange = useCallback(
    (doeId: string, doeLabel: string, newScenario: string) => {
      // 1. doeRegistry 메타데이터 업데이트 (모든 참조처에 자동 반영)
      dispatch(
        updateDoEMetadata({
          doeId,
          POWER_SCENARIO: newScenario,
        })
      );

      dispatch(updateDoeScenario({ doeId, scenario: newScenario }));

      // 3. 해당 DoE의 데이터셋 가져오기
      const datasetPayload = (dataset?.[doeLabel] ?? {}) as Record<
        string,
        unknown
      >;
      rowHeaders.forEach((rowHeader) => {
        POWER_COLUMN_NAMES.forEach((columnName) => {
          const metricKey = getMetricKey(rowHeader.rowKey, columnName);
          const columnId = `${doeId}_${columnName}`;
          const metricValue =
            extractMetricValue(metricKey, datasetPayload, newScenario) ?? "-";
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
  /** DoE 그룹 삭제 핸들러 */
  const handleDeleteDoeGroup = useCallback(
    (doeId: string) => {
      dispatch(removeDoEFromAll(doeId));
    },
    [dispatch]
  );
  const handleDragEnd = useCallback(
    (activeId: string, overId: string) => {
      dispatch(reorderDoEsAll(activeId, overId));
    },
    [dispatch]
  );
  /** 각 DoE의 Power Scenario 드롭다운 설정 생성 */
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
  /** 테이블 데이터를 TSV 형식으로 복사 (엑셀용) */
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
  const isEmpty = enrichedDoeGroups.length === 0;

  return (
    <div className="space-y-3">
      <EnvDataDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        doeName={selectedDoeGroup?.label || ""}
        scenario={selectedScenario}
        envData={envData}
      />
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
                This will remove all {enrichedDoeGroups.length} DoE(s). This
                action cannot be undone.
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
                <TableHead className="w-[40px]"></TableHead>
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
              <DoeSortableContext
                items={enrichedDoeGroups.map((d) => d.id)}
                onDragEnd={handleDragEnd}
              >
                {enrichedDoeGroups.map((doeGroup) => (
                  <PowerColumnMetadataTableRow
                    key={doeGroup.id}
                    doeGroup={doeGroup}
                    getScenarioDropdownConfig={getScenarioDropdownConfig}
                    handleDeleteDoeGroup={handleDeleteDoeGroup}
                    handleDoeNameClick={handleDoeNameClick}
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

export default PowerColumnMetadataTable;
