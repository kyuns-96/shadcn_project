/**
 * @file TimingDatasetColumnAddButton.tsx
 *
 * @purpose
 * Timing 페이지 전용 DoE 행 추가 버튼 컴포넌트입니다.
 * 사용자가 선택한 필터 조건을 기반으로 새 DoE 행을 추가합니다.
 * Timing Scenario를 자동으로 추출하여 DoE 메타데이터에 저장합니다.
 *
 * @structure
 * 1. DoE 행 생성 → 데이터 fetch → 시나리오 추출 → 셀 업데이트
 * 2. timing_scenario는 timing page에서만 사용
 *
 * @dependencies
 * - @/store: Redux store 및 hooks
 * - @/store/reducers/timingMatrixReducer: Timing 매트릭스 상태 관리
 * - @/store/reducers/datasetReducer: 데이터셋 API 호출
 * - @/variables/timingScenarioExtractor: Timing Scenario 추출 유틸리티
 * - @/variables/defaultTimingMatrixTemplate: 컬럼 그룹 및 메트릭
 * - @/variables/metricValueExtractor: 메트릭 값 추출
 */

import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addTimingRow,
  updateTimingCell,
} from "@/store/reducers/timingMatrixReducer";
import { addColumn, updateCell } from "@/store/matrixSlice";
import {
  addDoeGroup,
  updatePowerCell,
} from "@/store/reducers/powerMatrixReducer";
import { addDoE, updateDoEMetadata } from "@/store/doeRegistry";
import { setColumnPowerScenario } from "@/store/reducers/selectedReducer";
import { extractAvailableTimingScenarios } from "@/variables/timingScenarioExtractor";
import { extractAvailableScenarios } from "@/variables/powerScenarioExtractor";
import { getDefaultScenario } from "@/variables/defaultPowerScenarioMapping";
import { fetchDataset } from "@/store/reducers/datasetReducer";
import {
  TIMING_COLUMN_GROUPS,
  TIMING_METRICS,
  generateTimingColumnKey,
  getTimingMetricKey,
  EMPTY_VALUE_PLACEHOLDER,
} from "@/variables/defaultTimingMatrixTemplate";
import { extractMetricValue } from "@/variables/metricValueExtractor";

/** DoE ID 생성을 위한 접두사 */
const DOE_ID_PREFIX = "doe";

/**
 * 타임스탬프 기반의 고유한 DoE ID를 생성합니다.
 * @returns 생성된 DoE ID (예: "doe1703849234567")
 */
const generateUniqueDoeId = (): string => {
  return `${DOE_ID_PREFIX}${Date.now()}`;
};

/**
 * Timing 페이지 전용 DoE 행 추가 버튼 컴포넌트
 *
 * 사용자가 클릭하면 현재 선택된 필터 조건을 기반으로
 * 새로운 DoE 행을 Timing 테이블에 추가합니다.
 * QoRComparePage와 PowerPage에도 동시에 추가하여 데이터 동기화를 보장합니다.
 */
const TimingDatasetColumnAddButton = () => {
  const dispatch = useAppDispatch();

  // Redux에서 현재 선택된 필터 조건들 조회
  const doeName = useAppSelector((state) => state.selected.doeName);
  const {
    selectedProject,
    selectedBlock,
    selectedNetver,
    selectedRevision,
    selectedEconum,
  } = useAppSelector((state) => state.selected);
  const doeRegistry = useAppSelector((state) => state.doeRegistry);
  const { rowHeaders: matrixRowHeaders } = useAppSelector(
    (state) => state.matrix
  );
  const { rowHeaders: powerRowHeaders } = useAppSelector(
    (state) => state.powerMatrix
  );
  const currentPage = useAppSelector((state) => state.page.currentPage);

  // Check if button should be disabled (empty or duplicate)
  const trimmedDoeName = doeName.trim();
  const isDuplicate = doeRegistry.allIds.some(
    (id) => doeRegistry.byId[id].label === trimmedDoeName
  );
  const isDisabled = !trimmedDoeName || isDuplicate;

  /** 데이터 로딩 중 표시되는 placeholder 값 */
  const LOADING_PLACEHOLDER = "___LOADING___";

  /**
   * 새 DoE 행을 추가하고 시나리오 정보를 로드합니다.
   *
   * 처리 순서:
   * 1. 고유한 DoE ID 생성
   * 2. doeRegistry에 DoE 추가
   * 3. Timing 테이블에 새 행 추가
   * 4. QoRComparePage matrix에 컬럼 추가 (_needsDataFetch: true)
   * 5. PowerPage powerMatrix에 DoE 그룹 추가 (_needsDataFetch: true)
   * 6. API에서 데이터셋 조회
   * 7. Timing/Power Scenario 목록 추출 및 저장
   * 8. 기본 시나리오로 셀 데이터 채우기 (모든 페이지)
   */
  const handleAddDoeRow = () => {
    const doeId = generateUniqueDoeId();
    const doeLabel = doeName || doeId;

    // 1. 먼저 doeRegistry에 DoE를 추가 (메타데이터 포함)
    dispatch(
      addDoE({
        id: doeId,
        label: doeLabel,
        PROJECT_NAME: selectedProject || undefined,
        BLOCK: selectedBlock || undefined,
        NET_VER: selectedNetver || undefined,
        REVISION: selectedRevision || undefined,
        ECO_NUM: selectedEconum || undefined,
      })
    );

    // 2. timingMatrix에 새 DoE 행 추가
    // [WHY] _needsDataFetch: false - 바로 fetchDataset()을 호출하여 데이터를 채우므로
    // useRestoreTimingRowData가 다시 처리할 필요 없음
    dispatch(
      addTimingRow({
        id: doeId,
        label: doeLabel,
        _needsDataFetch: false,
      })
    );

    // 3. QoRComparePage matrix에 컬럼 추가
    // [WHY] _needsDataFetch: true - 다른 페이지로 이동 시 useRestoreColumnData가 데이터를 fetch하도록
    // 현재 페이지(Timing)에서는 바로 데이터를 채우지만, QOR Compare는 나중에 방문 시 fetch 필요
    dispatch(
      addColumn({
        id: doeId,
        label: doeLabel,
        defaultValue: LOADING_PLACEHOLDER,
        _needsDataFetch: true,
        meta: {
          PROJECT_NAME: selectedProject || undefined,
          BLOCK: selectedBlock || undefined,
          NET_VER: selectedNetver || undefined,
          REVISION: selectedRevision || undefined,
          ECO_NUM: selectedEconum || undefined,
        },
      })
    );

    // 4. PowerPage powerMatrix에 DoE 그룹 추가
    // [WHY] _needsDataFetch: true - 다른 페이지로 이동 시 useRestoreDoeGroupData가 데이터를 fetch하도록
    dispatch(
      addDoeGroup({
        id: doeId,
        label: doeLabel,
        defaultValue: LOADING_PLACEHOLDER,
        _needsDataFetch: true,
      })
    );

    // 5. 데이터셋 fetch 후 시나리오 정보 및 셀 데이터 업데이트
    dispatch(fetchDataset({
      project: selectedProject ?? '',
      block: selectedBlock ?? '',
      netver: selectedNetver ?? '',
      revision: selectedRevision ?? '',
      econum: selectedEconum ?? undefined,
      doeName: doeName,
      revisionMode: 'POST',
      currentPage: currentPage,
    })).then((action) => {
      if (fetchDataset.fulfilled.match(action)) {
        const datasetPayload = (action.payload?.[doeName] ?? {}) as Record<
          string,
          unknown
        >;

        // 6. Timing Scenario 목록 추출
        const availableTimingScenarios =
          extractAvailableTimingScenarios(datasetPayload);

        // 7. 가용 시나리오 중 "total"을 기본값으로 설정, 없으면 첫 번째 사용
        const defaultTimingScenario = availableTimingScenarios.includes("total")
          ? "total"
          : availableTimingScenarios.length > 0
          ? availableTimingScenarios[0]
          : undefined;

        // 8. Power Scenario 목록 추출 및 기본 시나리오 결정
        const availablePowerScenarios =
          extractAvailableScenarios(datasetPayload);
        const defaultPowerScenario = getDefaultScenario(
          selectedProject,
          availablePowerScenarios
        );

        // 9. doeRegistry의 메타데이터 업데이트 (timing + power 시나리오 정보)
        dispatch(
          updateDoEMetadata({
            doeId,
            TIMING_SCENARIO: defaultTimingScenario,
            AVAILABLE_TIMING_SCENARIOS: availableTimingScenarios,
            POWER_SCENARIO: defaultPowerScenario,
            AVAILABLE_SCENARIOS: availablePowerScenarios,
          })
        );

        // 10. Redux selected 상태에 Power 시나리오 매핑 저장
        dispatch(
          setColumnPowerScenario({
            columnId: doeId,
            scenario: defaultPowerScenario,
          })
        );

        // 11. TimingPage: 기본 시나리오가 있으면 모든 셀에 데이터 채우기
        if (defaultTimingScenario) {
          TIMING_COLUMN_GROUPS.forEach((columnGroup) => {
            TIMING_METRICS.forEach((metric) => {
              const columnId = generateTimingColumnKey(columnGroup, metric);
              const metricKey = getTimingMetricKey(columnGroup, metric);
              const metricValue =
                extractMetricValue(
                  metricKey,
                  datasetPayload,
                  defaultTimingScenario
                ) ?? EMPTY_VALUE_PLACEHOLDER;

              dispatch(
                updateTimingCell({
                  rowId: doeId,
                  columnId,
                  value: metricValue,
                })
              );
            });
          });
        }

        // 12. QoRComparePage: 각 행의 셀에 메트릭 값 업데이트 (Power 시나리오 적용)
        matrixRowHeaders.forEach((rowHeader) => {
          const metricKey = `${rowHeader.rowGroup}!${rowHeader.label}`;
          const metricValue =
            extractMetricValue(
              metricKey,
              datasetPayload,
              defaultPowerScenario
            ) ?? EMPTY_VALUE_PLACEHOLDER;

          dispatch(
            updateCell({
              rowId: rowHeader.id,
              columnId: doeId,
              value: metricValue,
            })
          );
        });

        // 13. PowerPage: 각 Power 메트릭 셀에 값 업데이트
        const powerColumnNames = ["Internal", "Switching", "Leakage", "Total"];
        powerRowHeaders.forEach((row) => {
          powerColumnNames.forEach((colName) => {
            const columnId = `${doeId}_${colName}`;
            const metricKey = `Power(mW)!${
              (row as { rowKey?: string }).rowKey
            }_${colName}`;
            const metricValue =
              extractMetricValue(
                metricKey,
                datasetPayload,
                defaultPowerScenario
              ) ?? EMPTY_VALUE_PLACEHOLDER;

            dispatch(
              updatePowerCell({
                rowId: row.id,
                columnId: columnId,
                value: metricValue,
              })
            );
          });
        });
      }
    }).catch((error) => {
      console.error("Failed to fetch dataset:", error);
    });
  };

  return (
    <div className="w-auto space-y-2">
      <div className="h-5" />
      <Button
        className="group w-full h-9"
        onClick={handleAddDoeRow}
        disabled={isDisabled}
      >
        Add
        <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </Button>
      <div className="min-h-[1.25rem]" />
    </div>
  );
};

export default TimingDatasetColumnAddButton;
