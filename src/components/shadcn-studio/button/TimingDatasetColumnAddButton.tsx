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
import { addTimingRow, updateTimingCell } from "@/store/reducers/timingMatrixReducer";
import { addDoE, updateDoEMetadata } from "@/store/doeRegistry";
import { extractAvailableTimingScenarios } from "@/variables/timingScenarioExtractor";
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

  // Check if button should be disabled (empty or duplicate)
  const trimmedDoeName = doeName.trim();
  const isDuplicate = doeRegistry.allIds.some(
    (id) => doeRegistry.byId[id].label === trimmedDoeName
  );
  const isDisabled = !trimmedDoeName || isDuplicate;

  /**
   * 새 DoE 행을 추가하고 시나리오 정보를 로드합니다.
   *
   * 처리 순서:
   * 1. 고유한 DoE ID 생성
   * 2. doeRegistry에 DoE 추가
   * 3. Timing 테이블에 새 행 추가
   * 4. API에서 데이터셋 조회
   * 5. Timing Scenario 목록 추출 및 저장
   * 6. 기본 시나리오로 셀 데이터 채우기
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
    dispatch(
      addTimingRow({
        id: doeId,
        label: doeLabel,
      })
    );

    // 3. 데이터셋 fetch 후 시나리오 정보 및 셀 데이터 업데이트
    dispatch(fetchDataset()).then((action) => {
      if (fetchDataset.fulfilled.match(action)) {
        const datasetPayload = (action.payload?.[doeName] ?? {}) as Record<
          string,
          unknown
        >;

        // 4. Timing Scenario 목록 추출
        const availableTimingScenarios =
          extractAvailableTimingScenarios(datasetPayload);

        // 5. 가용 시나리오가 있으면 첫 번째를 기본값으로 설정
        const defaultTimingScenario =
          availableTimingScenarios.length > 0
            ? availableTimingScenarios[0]
            : undefined;

        // 6. doeRegistry의 메타데이터 업데이트 (timing 시나리오 정보)
        dispatch(
          updateDoEMetadata({
            doeId,
            TIMING_SCENARIO: defaultTimingScenario,
            AVAILABLE_TIMING_SCENARIOS: availableTimingScenarios,
          })
        );

        // 7. 기본 시나리오가 있으면 모든 셀에 데이터 채우기
        if (defaultTimingScenario) {
          TIMING_COLUMN_GROUPS.forEach((columnGroup) => {
            TIMING_METRICS.forEach((metric) => {
              const columnId = generateTimingColumnKey(columnGroup, metric);
              const metricKey = getTimingMetricKey(columnGroup, metric);
              const metricValue =
                extractMetricValue(metricKey, datasetPayload, defaultTimingScenario) ??
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
        }
      }
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
