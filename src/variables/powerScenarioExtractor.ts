/**
 * @file powerScenarioExtractor.ts
 *
 * @purpose
 * 데이터셋에서 Power Scenario 정보를 추출하는 유틸리티 함수입니다.
 * get_ptpxpower.ptpxpower_data 경로에서 사용 가능한 시나리오 목록을 가져옵니다.
 *
 * @structure
 * 1. extractAvailableScenarios: 데이터셋에서 시나리오 이름 목록 추출
 * 2. getScenarioData: 특정 시나리오의 데이터 반환
 *
 * @dependencies
 * - 없음 (순수 유틸리티 함수)
 */

/** 데이터셋 타입 정의 */
type DatasetRecord = Record<string, unknown>;

/** ptpxpower 데이터 경로 상수 */
const PTPXPOWER_PATH = {
  ROOT: "get_ptpxpower",
  DATA: "ptpxpower_data",
} as const;

/**
 * 객체를 안전하게 탐색하는 헬퍼 함수
 *
 * @param obj - 탐색할 객체
 * @param path - 점(.) 구분자로 된 경로 배열
 * @returns 해당 경로의 값 또는 undefined
 */
const getNestedValue = (
  obj: unknown,
  path: string[]
): Record<string, unknown> | undefined => {
  let current = obj;

  for (const key of path) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  if (typeof current === "object" && current !== null) {
    return current as Record<string, unknown>;
  }

  return undefined;
};

/**
 * 데이터셋에서 사용 가능한 Power Scenario 목록을 추출합니다.
 *
 * @param dataset - 데이터셋 객체 (doeName 아래의 데이터)
 * @returns 시나리오 이름 배열 (없으면 빈 배열)
 *
 * @example
 * const scenarios = extractAvailableScenarios(datasetPayload);
 * // Returns: ["scenario1", "scenario2", "scenario3"]
 */
export const extractAvailableScenarios = (
  dataset: DatasetRecord = {}
): string[] => {
  try {
    const ptpxpowerData = getNestedValue(dataset, [
      PTPXPOWER_PATH.ROOT,
      PTPXPOWER_PATH.DATA,
    ]);

    if (!ptpxpowerData) {
      console.warn(
        "[powerScenarioExtractor] ptpxpower_data not found in dataset"
      );
      return [];
    }

    const scenarios = Object.keys(ptpxpowerData);

    if (scenarios.length === 0) {
      console.warn("[powerScenarioExtractor] No scenarios found in dataset");
    }

    return scenarios;
  } catch (error) {
    console.error("[powerScenarioExtractor] Error extracting scenarios:", error);
    return [];
  }
};

/**
 * 특정 시나리오의 데이터를 반환합니다.
 *
 * @param dataset - 데이터셋 객체
 * @param scenarioName - 시나리오 이름
 * @returns 해당 시나리오의 데이터 또는 undefined
 *
 * @example
 * const scenarioData = getScenarioData(datasetPayload, "scenario1");
 */
export const getScenarioData = (
  dataset: DatasetRecord = {},
  scenarioName: string
): Record<string, unknown> | undefined => {
  if (!scenarioName) {
    return undefined;
  }

  try {
    return getNestedValue(dataset, [
      PTPXPOWER_PATH.ROOT,
      PTPXPOWER_PATH.DATA,
      scenarioName,
    ]);
  } catch (error) {
    console.error(
      `[powerScenarioExtractor] Error getting scenario data for "${scenarioName}":`,
      error
    );
    return undefined;
  }
};

/**
 * 주어진 시나리오가 데이터셋에 존재하는지 확인합니다.
 *
 * @param dataset - 데이터셋 객체
 * @param scenarioName - 확인할 시나리오 이름
 * @returns 시나리오 존재 여부
 */
export const isScenarioAvailable = (
  dataset: DatasetRecord = {},
  scenarioName: string
): boolean => {
  const availableScenarios = extractAvailableScenarios(dataset);
  return availableScenarios.includes(scenarioName);
};
