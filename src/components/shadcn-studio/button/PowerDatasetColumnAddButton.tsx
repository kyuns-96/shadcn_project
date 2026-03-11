/**
 * @file PowerDatasetColumnAddButton.tsx
 *
 * @purpose
 * Power 페이지 전용 DoE 컬럼 그룹 추가 버튼 컴포넌트입니다.
 * 사용자가 선택한 필터 조건을 기반으로 새 DoE 그룹(4개 컬럼)을 추가합니다.
 * Power Scenario를 자동으로 추출하여 DoE 메타데이터에 저장합니다.
 *
 * @structure
 * 1. DoE 그룹 생성 → 데이터 fetch → 시나리오 추출 → 셀 업데이트
 * 2. 각 DoE는 4개 컬럼 (Internal, Switching, Leakage, Total)을 포함
 *
 * @dependencies
 * - @/store: Redux store 및 hooks
 * - @/store/reducers/powerMatrixReducer: Power 매트릭스 상태 관리
 * - @/store/reducers/datasetReducer: 데이터셋 API 호출
 * - @/variables/metricValueExtractor: 메트릭 값 추출 유틸리티
 * - @/variables/powerScenarioExtractor: Power Scenario 추출 유틸리티
 * - @/variables/defaultPowerScenarioMappingForPower: Power 전용 기본 시나리오 결정
 * - @/variables/defaultPowerMatrixTemplate: Power 컬럼/행 상수
 */

import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOADING_PLACEHOLDER } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  addDoeGroup,
  updatePowerCell,
  updateDoeScenario,
} from "@/store/reducers/powerMatrixReducer";
import { addDoE, updateDoEMetadata } from "@/store/doeRegistry";
import { addColumn, updateCell } from "@/store/matrixSlice";
import { addTimingRow } from "@/store/reducers/timingMatrixReducer";
import { extractMetricValue } from "@/variables/metricValueExtractor";
import { extractAvailableScenarios } from "@/variables/powerScenarioExtractor";
import { getDefaultPowerScenario } from "@/variables/defaultPowerScenarioMappingForPower";
import { fetchDataset } from "@/store/reducers/datasetReducer";
import {
  POWER_COLUMN_NAMES,
  getMetricKey,
} from "@/variables/defaultPowerMatrixTemplate";

/** DoE ID 생성을 위한 접두사 */
const DOE_ID_PREFIX = "doe";

/** 데이터가 없을 때 표시되는 기본값 */
const EMPTY_VALUE_PLACEHOLDER = "-";

/**
 * 타임스탬프 기반의 고유한 DoE ID를 생성합니다.
 * @returns 생성된 DoE ID (예: "doe1703849234567")
 */
const generateUniqueDoeId = (): string => {
  return `${DOE_ID_PREFIX}${Date.now()}`;
};

/**
 * Power 페이지 전용 DoE 컬럼 그룹 추가 버튼 컴포넌트
 *
 * 사용자가 클릭하면 현재 선택된 필터 조건을 기반으로
 * 새로운 DoE 그룹 (4개 컬럼)을 Power 매트릭스 테이블에 추가합니다.
 */
const PowerDatasetColumnAddButton = () => {
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
  const { rowHeaders } = useAppSelector((state) => state.powerMatrix);
  const matrixRowHeaders = useAppSelector((state) => state.matrix.rowHeaders);
  const doeRegistry = useAppSelector((state) => state.doeRegistry);
  const currentPage = useAppSelector((state) => state.page.currentPage);

  // Check if button should be disabled (empty or duplicate)
  // [WHY] doeRegistry에서 중복 확인 - 두 페이지의 DoE를 모두 체크
  const trimmedDoeName = doeName.trim();
  const isDuplicate = doeRegistry.allIds.some(
    (id) => doeRegistry.byId[id].label === trimmedDoeName
  );
  const isDisabled = !trimmedDoeName || isDuplicate;

  /**
   * 새 DoE 그룹을 추가하고 데이터를 로드합니다.
   *
   * 처리 순서:
   * 1. 고유한 DoE ID 생성
   * 2. 로딩 상태의 빈 DoE 그룹(4개 컬럼)을 테이블에 추가
   * 3. API에서 데이터셋 조회
   * 4. Power Scenario 목록 추출 및 기본 시나리오 설정
   * 5. 각 행의 4개 컬럼에 해당하는 메트릭 값으로 셀 업데이트
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

    // 2. powerMatrix에 로딩 상태의 새 DoE 그룹 추가 (4개 컬럼 포함, 메타데이터는 registry에서 참조)
    dispatch(
      addDoeGroup({
        id: doeId,
        label: doeLabel,
        defaultValue: LOADING_PLACEHOLDER,
      })
    );

    // [WHY] matrix.columnHeaders에도 추가하여 QoRComparePage에서도 column이 보이도록 함
    // accessorKey와 meta를 함께 전달하여 QoRComparePage에서 데이터 fetch 가능하도록 함
    // [WHY] _needsDataFetch: true - 다른 페이지로 이동 시 useRestoreColumnData가 데이터를 fetch하도록
    dispatch(
      addColumn({
        id: doeId,
        label: doeLabel,
        accessorKey: doeId,
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

    // [WHY] timingMatrix.rows에도 추가하여 TimingPage에서도 DoE가 보이도록 함
    // [WHY] _needsDataFetch: true - 다른 페이지로 이동 시 useRestoreTimingRowData가 데이터를 fetch하도록
    dispatch(
      addTimingRow({
        id: doeId,
        label: doeLabel,
        _needsDataFetch: true,
      })
    );

    // 3. 데이터셋 fetch 후 각 셀에 값 업데이트
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

        // 3. Power Scenario 목록 추출
        const availableScenarios = extractAvailableScenarios(datasetPayload);

        // 4. Power 전용 기본 시나리오 결정
        const defaultScenario = getDefaultPowerScenario(
          selectedProject,
          availableScenarios
        );

        // 5. doeRegistry의 메타데이터 업데이트 (시나리오 정보 및 가용 시나리오 목록)
        // 이 변경이 모든 참조처(PowerPage, QoRComparePage)에 자동 반영됨
        dispatch(
          updateDoEMetadata({
            doeId,
            POWER_SCENARIO: defaultScenario,
            AVAILABLE_SCENARIOS: availableScenarios,
          })
        );

        // 6. powerMatrix의 DoE 시나리오도 업데이트 (역사적 호환성용)
        dispatch(
          updateDoeScenario({
            doeId,
            scenario: defaultScenario,
            availableScenarios,
          })
        );

        // 6. 각 행의 4개 컬럼에 메트릭 값 업데이트 (시나리오 적용)
        rowHeaders.forEach((rowHeader) => {
          // 4개 컬럼 각각에 대해 메트릭 값 추출 및 업데이트
          POWER_COLUMN_NAMES.forEach((columnName) => {
            const metricKey = getMetricKey(rowHeader.rowKey, columnName);
            const columnId = `${doeId}_${columnName}`;
            const metricValue =
              extractMetricValue(metricKey, datasetPayload, defaultScenario) ??
              EMPTY_VALUE_PLACEHOLDER;

            // [WHY] powerMatrix와 matrix 모두에 업데이트하여 양쪽 페이지에서 데이터가 보이도록 함
            dispatch(
              updatePowerCell({
                rowId: rowHeader.id,
                columnId,
                value: metricValue,
              })
            );
          });
        });

        // [WHY] QoRComparePage의 rowHeaders에도 같은 데이터로 업데이트
        // PowerPage와 QoRComparePage의 rowHeaders 구조가 다르므로 (PowerRowKey vs rowGroup)
        // columnId는 그대로 사용하되 rowId만 매칭시킴
        matrixRowHeaders.forEach((matrixRow) => {
          // PowerPage의 rowHeaders와 일치하는 row를 찾음 (label이 같은 것)
          const matchingPowerRow = rowHeaders.find(
            (r) => r.label === matrixRow.label
          );
          if (matchingPowerRow) {
            POWER_COLUMN_NAMES.forEach((columnName) => {
              const metricKey = getMetricKey(
                matchingPowerRow.rowKey,
                columnName
              );
              const columnId = `${doeId}_${columnName}`;
              const metricValue =
                extractMetricValue(
                  metricKey,
                  datasetPayload,
                  defaultScenario
                ) ?? EMPTY_VALUE_PLACEHOLDER;

              dispatch(
                updateCell({
                  rowId: matrixRow.id,
                  columnId,
                  value: metricValue,
                })
              );
            });
          }
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

export default PowerDatasetColumnAddButton;
