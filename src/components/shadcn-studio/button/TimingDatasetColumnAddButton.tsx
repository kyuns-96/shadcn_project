/**
 * @file TimingDatasetColumnAddButton.tsx
 *
 * @purpose
 * Timing 페이지 전용 DoE 그룹 추가 버튼 컴포넌트입니다.
 * 사용자가 선택한 필터 조건을 기반으로 새 DoE 그룹을 추가합니다.
 * Timing Scenario를 자동으로 추출하여 DoE 메타데이터에 저장합니다.
 *
 * @structure
 * 1. DoE 그룹 생성 → 데이터 fetch → 시나리오 추출
 * 2. timing_scenario는 timing page에서만 사용
 *
 * @dependencies
 * - @/store: Redux store 및 hooks
 * - @/store/reducers/timingMatrixReducer: Timing 매트릭스 상태 관리
 * - @/store/reducers/datasetReducer: 데이터셋 API 호출
 * - @/variables/timingScenarioExtractor: Timing Scenario 추출 유틸리티
 */

import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import { addDoeGroup } from "@/store/reducers/timingMatrixReducer";
import { addDoE, updateDoEMetadata } from "@/store/doeRegistry";
import { extractAvailableTimingScenarios } from "@/variables/timingScenarioExtractor";
import { fetchDataset } from "@/store/reducers/datasetReducer";

/** DoE ID 생성을 위한 접두사 */
const DOE_ID_PREFIX = "doe";

/** 데이터 로딩 중 표시되는 placeholder 값 */
const LOADING_PLACEHOLDER = "___LOADING___";

/**
 * 타임스탬프 기반의 고유한 DoE ID를 생성합니다.
 * @returns 생성된 DoE ID (예: "doe1703849234567")
 */
const generateUniqueDoeId = (): string => {
  return `${DOE_ID_PREFIX}${Date.now()}`;
};

/**
 * Timing 페이지 전용 DoE 그룹 추가 버튼 컴포넌트
 *
 * 사용자가 클릭하면 현재 선택된 필터 조건을 기반으로
 * 새로운 DoE 그룹을 Timing 매트릭스 테이블에 추가합니다.
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
   * 새 DoE 그룹을 추가하고 시나리오 정보를 로드합니다.
   *
   * 처리 순서:
   * 1. 고유한 DoE ID 생성
   * 2. doeRegistry에 DoE 추가
   * 3. Timing 매트릭스에 로딩 상태의 DoE 그룹 추가
   * 4. API에서 데이터셋 조회
   * 5. Timing Scenario 목록 추출 및 저장
   */
  const handleAddDoeGroup = () => {
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

    // 2. timingMatrix에 로딩 상태의 새 DoE 그룹 추가
    dispatch(
      addDoeGroup({
        id: doeId,
        label: doeLabel,
        defaultValue: LOADING_PLACEHOLDER,
      })
    );

    // 3. 데이터셋 fetch 후 각 시나리오 정보 업데이트
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
      }
    });
  };

  return (
    <div className="w-auto space-y-2">
      <div className="h-5" />
      <Button
        className="group w-full h-9"
        onClick={handleAddDoeGroup}
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
