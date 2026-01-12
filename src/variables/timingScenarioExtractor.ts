/**
 * @file timingScenarioExtractor.ts
 *
 * @purpose
 * 데이터셋에서 Timing Scenario 정보를 추출하는 유틸리티 함수입니다.
 * get_timing_summary.timing_summary_data 경로에서 사용 가능한 시나리오 목록을 가져옵니다.
 *
 * @structure
 * 1. extractAvailableTimingScenarios: 데이터셋에서 시나리오 이름 목록 추출
 * 2. getTimingScenarioData: 특정 시나리오의 데이터 반환
 * 3. isTimingScenarioAvailable: 특정 시나리오 존재 여부 확인
 *
 * @dependencies
 * - 없음 (순수 유틸리티 함수)
 */

/** 데이터셋 타입 정의 */
type DatasetRecord = Record<string, unknown>;

/** timing_summary 데이터 경로 상수 */
const TIMING_SUMMARY_PATH = {
  ROOT: "get_timing_summary",
  DATA: "timing_summary_data",
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
 * 데이터셋에서 사용 가능한 Timing Scenario 목록을 추출합니다.
 *
 * @param dataset - 데이터셋 객체 (doeName 아래의 데이터)
 * @returns 시나리오 이름 배열 (없으면 빈 배열)
 *
 * @example
 * const scenarios = extractAvailableTimingScenarios(datasetPayload);
 * // Returns: ["scenario1", "scenario2", "scenario3"]
 */
export const extractAvailableTimingScenarios = (
  dataset: DatasetRecord = {}
): string[] => {
  try {
    const timingSummaryData = getNestedValue(dataset, [
      TIMING_SUMMARY_PATH.ROOT,
      TIMING_SUMMARY_PATH.DATA,
    ]);

    if (!timingSummaryData) {
      console.warn(
        "[timingScenarioExtractor] timing_summary_data not found in dataset"
      );
      return [];
    }

    const scenarios = Object.keys(timingSummaryData);

    if (scenarios.length === 0) {
      console.warn("[timingScenarioExtractor] No scenarios found in dataset");
    }

    return scenarios;
  } catch (error) {
    console.error(
      "[timingScenarioExtractor] Error extracting scenarios:",
      error
    );
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
 * const scenarioData = getTimingScenarioData(datasetPayload, "scenario1");
 */
export const getTimingScenarioData = (
  dataset: DatasetRecord = {},
  scenarioName: string
): Record<string, unknown> | undefined => {
  if (!scenarioName) {
    return undefined;
  }

  try {
    return getNestedValue(dataset, [
      TIMING_SUMMARY_PATH.ROOT,
      TIMING_SUMMARY_PATH.DATA,
      scenarioName,
    ]);
  } catch (error) {
    console.error(
      `[timingScenarioExtractor] Error getting scenario data for "${scenarioName}":`,
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
export const isTimingScenarioAvailable = (
  dataset: DatasetRecord = {},
  scenarioName: string
): boolean => {
  const availableScenarios = extractAvailableTimingScenarios(dataset);
  return availableScenarios.includes(scenarioName);
};
