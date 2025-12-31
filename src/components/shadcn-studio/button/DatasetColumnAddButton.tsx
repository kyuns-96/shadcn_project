/**
 * @file DatasetColumnAddButton.tsx
 *
 * @purpose
 * 매트릭스 테이블에 새로운 데이터셋 컬럼을 추가하는 버튼 컴포넌트입니다.
 * 사용자가 선택한 필터 조건(프로젝트, 블록, 넷버전 등)을 기반으로
 * 서버에서 데이터를 가져와 테이블에 새 컬럼으로 표시합니다.
 * Power Scenario를 자동으로 추출하여 컬럼 메타데이터에 저장합니다.
 *
 * @structure
 * 1. useSelectedFilters: Redux에서 현재 선택된 필터 조건들을 조회
 * 2. handleAddDatasetColumn: 컬럼 생성 → 데이터 fetch → 시나리오 추출 → 셀 업데이트 순서로 처리
 * 3. DatasetColumnAddButton: 렌더링 담당 (버튼 UI)
 *
 * @dependencies
 * - @/store: Redux store 및 hooks (useAppDispatch, useAppSelector)
 * - @/store/matrixSlice: 매트릭스 테이블 상태 관리 (addColumn, updateCell)
 * - @/store/reducers/datasetReducer: 데이터셋 API 호출 (fetchDataset)
 * - @/store/reducers/selectedReducer: Power Scenario 선택 상태
 * - @/variables/metricValueExtractor: 메트릭 키로 값을 추출하는 유틸리티
 * - @/variables/powerScenarioExtractor: Power Scenario 추출 유틸리티
 * - @/variables/defaultPowerScenarioMapping: 기본 시나리오 결정 유틸리티
 * - lucide-react: 아이콘 컴포넌트
 */

import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import { addColumn, updateCell, updateColumnScenario } from "@/store/matrixSlice";
import { setColumnPowerScenario } from "@/store/reducers/selectedReducer";
import { extractMetricValue } from "@/variables/metricValueExtractor";
import { extractAvailableScenarios } from "@/variables/powerScenarioExtractor";
import { getDefaultScenario } from "@/variables/defaultPowerScenarioMapping";
import { fetchDataset } from "@/store/reducers/datasetReducer";

/** 새 컬럼 ID 생성을 위한 접두사 */
const COLUMN_ID_PREFIX = "col";

/** 데이터 로딩 중 표시되는 placeholder 값 */
const LOADING_PLACEHOLDER = "___LOADING___";

/** 데이터가 없을 때 표시되는 기본값 */
const EMPTY_VALUE_PLACEHOLDER = "-";

/**
 * 타임스탬프 기반의 고유한 컬럼 ID를 생성합니다.
 * @returns 생성된 컬럼 ID (예: "col1703849234567")
 */
const generateUniqueColumnId = (): string => {
  return `${COLUMN_ID_PREFIX}${Date.now()}`;
};

/**
 * 데이터셋 컬럼 추가 버튼 컴포넌트
 *
 * 사용자가 클릭하면 현재 선택된 필터 조건을 기반으로
 * 새로운 컬럼을 매트릭스 테이블에 추가합니다.
 */
const DatasetColumnAddButton = () => {
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
  const { rowHeaders, columnHeaders } = useAppSelector((state) => state.matrix);

  // Check if button should be disabled (empty or duplicate)
  const trimmedDoeName = doeName.trim();
  const isDuplicate = columnHeaders.some((col) => col.label === trimmedDoeName);
  const isDisabled = !trimmedDoeName || isDuplicate;

  /**
   * 새 데이터셋 컬럼을 추가하고 데이터를 로드합니다.
   *
   * 처리 순서:
   * 1. 고유한 컬럼 ID 생성
   * 2. 로딩 상태의 빈 컬럼을 테이블에 추가
   * 3. API에서 데이터셋 조회
   * 4. Power Scenario 목록 추출 및 기본 시나리오 설정
   * 5. 각 행에 해당하는 메트릭 값으로 셀 업데이트
   */
  const handleAddDatasetColumn = () => {
    const columnId = generateUniqueColumnId();
    const columnLabel = doeName || columnId;

    // 1. 로딩 상태의 새 컬럼 추가 (시나리오 정보는 fetch 후 업데이트)
    dispatch(
      addColumn({
        id: columnId,
        label: columnLabel,
        defaultValue: LOADING_PLACEHOLDER,
        meta: {
          PROJECT_NAME: selectedProject || undefined,
          BLOCK: selectedBlock || undefined,
          NET_VER: selectedNetver || undefined,
          REVISION: selectedRevision || undefined,
          ECO_NUM: selectedEconum || undefined,
        },
      })
    );

    // 2. 데이터셋 fetch 후 각 셀에 값 업데이트
    dispatch(fetchDataset()).then((action) => {
      if (fetchDataset.fulfilled.match(action)) {
        const datasetPayload = (action.payload?.[doeName] ?? {}) as Record<
          string,
          unknown
        >;

        console.log("[DatasetColumnAddButton] fetchDataset fulfilled:", {
          doeName,
          datasetKeys: Object.keys(datasetPayload),
          datasetPayload,
        });

        // 3. Power Scenario 목록 추출
        const availableScenarios = extractAvailableScenarios(datasetPayload);
        console.log("[DatasetColumnAddButton] Available scenarios:", availableScenarios);

        // 4. 기본 시나리오 결정
        const defaultScenario = getDefaultScenario(
          selectedProject,
          availableScenarios
        );
        console.log("[DatasetColumnAddButton] Default scenario:", defaultScenario);

        // 5. 컬럼 메타데이터 업데이트 (시나리오 정보 및 가용 시나리오 목록)
        dispatch(
          updateColumnScenario({
            columnId,
            scenario: defaultScenario,
            availableScenarios,
          })
        );

        // 6. Redux selected 상태에 시나리오 매핑 저장
        dispatch(
          setColumnPowerScenario({
            columnId,
            scenario: defaultScenario,
          })
        );

        // 7. 컬럼의 AVAILABLE_SCENARIOS 업데이트를 위해 addColumn을 다시 호출하는 대신
        //    직접 상태를 업데이트 (columnHeaders에서 해당 컬럼 찾아서 업데이트)
        //    → 이는 updateColumnScenario와 함께 처리됨

        // 8. 각 행의 셀에 메트릭 값 업데이트 (시나리오 적용)
        rowHeaders.forEach((rowHeader) => {
          const metricKey = `${rowHeader.rowGroup}!${rowHeader.label}`;
          const metricValue =
            extractMetricValue(metricKey, datasetPayload, defaultScenario) ??
            EMPTY_VALUE_PLACEHOLDER;

          console.log("[DatasetColumnAddButton] updateCell:", {
            rowId: rowHeader.id,
            columnId,
            metricKey,
            metricValue,
            defaultScenario,
          });

          dispatch(
            updateCell({
              rowId: rowHeader.id,
              columnId: columnId,
              value: metricValue,
            })
          );
        });
      }
    });
  };

  return (
    <div className="w-auto space-y-2">
      <div className="h-5" />
      <Button
        className="group w-full h-9"
        onClick={handleAddDatasetColumn}
        disabled={isDisabled}
      >
        Add
        <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </Button>
      <div className="min-h-[1.25rem]" />
    </div>
  );
};

export default DatasetColumnAddButton;
