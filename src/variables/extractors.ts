/**
 * @file extractors.ts
 *
 * @purpose
 * 메트릭 값을 추출하는 핵심 함수들을 정의합니다.
 * - 시나리오 기반 메트릭 추출
 * - Physical Info 메트릭 추출
 * - INPUT_DATE 동적 처리
 * - 메인 메트릭 추출 함수
 *
 * @dependencies
 * - helpers.ts (변환 함수, 플레이스홀더 확인)
 * - metricValueExtractor.ts (매핑 정보)
 */

import {
  applyTransform,
  SCENARIO_PLACEHOLDER,
  INPUT_DATE_PLACEHOLDER,
  hasScenarioPlaceholder,
  hasInputDatePlaceholder,
} from "./helpers";
import {
  METRIC_EXTRACTORS,
  PHYSICAL_INFO_TYPE_MAPPING,
} from "./metricValueExtractor";

/** 데이터셋 타입 정의 */
type DatasetRecord = Record<string, unknown>;

/**
 * Power Scenario 기반의 동적 경로에서 메트릭 값을 추출합니다.
 * 시나리오 이름에 "."이 포함되어 있어도 정상적으로 처리합니다.
 * METRIC_EXTRACTORS에 정의되지 않은 동적 경로도 지원합니다.
 *
 * @param basePath - 기본 경로 (예: "get_ptpxpower.ptpxpower_data")
 * @param scenarioName - 시나리오 이름 (점이 포함될 수 있음, 예: "tt_0.85v_25c")
 * @param metricPath - 시나리오 하위 메트릭 경로 (예: "total_power")
 * @param dataset - 데이터셋 객체
 * @returns 추출된 값 또는 undefined
 *
 * @example
 * const value = extractScenarioMetric(
 *   "get_ptpxpower.ptpxpower_data",
 *   "tt_0.85v_25c",  // 점이 포함된 시나리오 이름
 *   "total_power",
 *   dataset
 * );
 */
export const extractScenarioMetric = (
  basePath: string,
  scenarioName: string,
  metricPath: string,
  dataset: DatasetRecord = {}
): unknown => {
  if (!scenarioName) return undefined;

  // 1. basePath로 ptpxpower_data까지 탐색 (점으로 split)
  let current: unknown = dataset;

  for (const key of basePath.split(".")) {
    if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  // 2. 시나리오 이름으로 직접 접근 (점으로 split하지 않음)
  if (typeof current === "object" && current !== null) {
    current = (current as Record<string, unknown>)[scenarioName];
  } else {
    return undefined;
  }

  if (current === undefined) {
    return undefined;
  }

  // 3. metricPath로 나머지 탐색 (점으로 split)
  if (metricPath) {
    for (const key of metricPath.split(".")) {
      if (typeof current === "object" && current !== null) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
  }

  return current;
};

/**
 * Physical Info 메트릭 값을 추출합니다.
 * 가장 최근의 input_date를 찾아서 TYPE에 해당하는 VALUE를 반환합니다.
 *
 * @param basePath - 기본 경로 (예: "get_layoutpnrdrcsummary")
 * @param metricName - 메트릭 이름 (예: "DRCs", "Short", "Total Wire Length", "ECO Runtime")
 * @param dataset - 데이터셋 객체
 * @returns 추출된 값 또는 undefined
 *
 * @example
 * // 데이터 구조:
 * // {
 * //   get_layoutpnrdrcsummary: {
 * //     "2024-01-15": {
 * //       DATA: [
 * //         { TYPE: "@@@@@@ TOTAL VIOLATIONS", VALUE: 229 },
 * //         { TYPE: "Shorts", VALUE: 2 }
 * //       ]
 * //     },
 * //     "2024-01-14": { ... }
 * //   }
 * // }
 * const value = extractPhysicalInfoMetric(
 *   "get_layoutpnrdrcsummary",
 *   "DRCs",
 *   dataset
 * ); // 결과: 229 (가장 최근 날짜의 "@@@@@@ TOTAL VIOLATIONS" 값)
 */
export const extractPhysicalInfoMetric = (
  basePath: string,
  metricName: string,
  dataset: DatasetRecord = {}
): unknown => {
  // 1. basePath로 physical info 데이터까지 탐색
  let current: unknown = dataset;

  for (const key of basePath.split(".")) {
    if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  // 2. 모든 input_date 키를 찾기
  if (typeof current !== "object" || current === null) {
    return undefined;
  }

  const allDates = Object.keys(current as Record<string, unknown>)
    .filter((key) => {
      const value = (current as Record<string, unknown>)[key];
      // DATA 배열을 가지고 있는 것만 필터링
      return (
        typeof value === "object" &&
        value !== null &&
        "DATA" in (value as Record<string, unknown>)
      );
    })
    .sort()
    .reverse(); // 내림차순으로 정렬하여 가장 최근 날짜가 첫번째

  if (allDates.length === 0) {
    return undefined;
  }

  // 3. 가장 최근의 input_date 사용
  const latestDate = allDates[0];
  const dataNode = (current as Record<string, unknown>)[latestDate];

  if (typeof dataNode !== "object" || dataNode === null) {
    return undefined;
  }

  const dataArray = (dataNode as Record<string, unknown>).DATA;

  if (!Array.isArray(dataArray)) {
    return undefined;
  }

  // 4. PHYSICAL_INFO_TYPE_MAPPING에서 실제 TYPE 값 조회
  const actualType = PHYSICAL_INFO_TYPE_MAPPING[metricName];

  if (!actualType) {
    return undefined;
  }

  // 5. DATA 배열에서 TYPE이 actualType인 항목 찾기
  const dataItem = dataArray.find((item) => {
    return (
      typeof item === "object" &&
      item !== null &&
      (item as Record<string, unknown>).TYPE === actualType
    );
  });

  if (!dataItem || typeof dataItem !== "object") {
    return undefined;
  }

  // 6. 해당 항목의 VALUE 반환
  const value = (dataItem as Record<string, unknown>).VALUE;

  return value;
};

/**
 * INPUT_DATE 플레이스홀더를 가장 최근 날짜로 치환하여 경로에서 값을 추출합니다.
 *
 * @param path - 플레이스홀더가 포함된 경로 (예: "get_layoutwiringtotal.layoutwiringtotal_data.${INPUT_DATE}.DATA.WIRE")
 * @param basePath - BASE_PATH (${INPUT_DATE} 이전의 경로 부분)
 * @param dataset - 데이터셋 객체
 * @param metricKey - 메트릭 키 (변환 적용을 위해 필요)
 * @returns 추출된 값 또는 undefined
 *
 * @example
 * // 데이터 구조:
 * // {
 * //   get_layoutwiringtotal: {
 * //     layoutwiringtotal_data: {
 * //       "2024-01-15": { DATA: { WIRE: 1000.5 } },
 * //       "2024-01-14": { DATA: { WIRE: 999.3 } }
 * //     }
 * //   }
 * // }
 * const value = extractWithInputDate(
 *   "get_layoutwiringtotal.layoutwiringtotal_data.${INPUT_DATE}.DATA.WIRE",
 *   "get_layoutwiringtotal.layoutwiringtotal_data",
 *   dataset,
 *   "PhysicalInfo!Total Wire Length"
 * ); // 결과: 1000.5 (가장 최근 날짜의 WIRE 값)
 */
const extractWithInputDate = (
  path: string,
  basePath: string,
  dataset: DatasetRecord,
  metricKey: string
): unknown => {
  // 1. basePath로 데이터까지 탐색
  let current: unknown = dataset;

  for (const key of basePath.split(".")) {
    if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  // 2. 모든 input_date 키를 찾기 (가장 최근 날짜 선택)
  if (typeof current !== "object" || current === null) {
    console.log(
      `[extractWithInputDate] ${metricKey}: current is null at basePath "${basePath}"`
    );
    return undefined;
  }

  const allDates = Object.keys(current as Record<string, unknown>)
    .sort()
    .reverse(); // 내림차순으로 정렬하여 가장 최근 날짜가 첫번째

  if (allDates.length === 0) {
    return undefined;
  }

  const latestDate = allDates[0];

  // 3. 경로에서 ${INPUT_DATE}를 latestDate로 치환
  const resolvedPath = path.replace(INPUT_DATE_PLACEHOLDER, latestDate);

  // 4. 치환된 경로로 값 추출 (배열 인덱스 처리)
  const pathKeys = resolvedPath.split(".");
  let curr: unknown = dataset;

  for (let i = 0; i < pathKeys.length; i++) {
    let key = pathKeys[i];

    // 배열 인덱스 처리 (예: "DATA[0]" -> "DATA" + index 0)
    const arrayMatch = key.match(/^([^\[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      const arrayIndex = parseInt(arrayMatch[2], 10);

      if (typeof curr === "object" && curr !== null) {
        const arrayValue = (curr as Record<string, unknown>)[arrayKey];

        if (Array.isArray(arrayValue) && arrayValue[arrayIndex] !== undefined) {
          curr = arrayValue[arrayIndex];
        } else {
          curr = undefined;
          break;
        }
      } else {
        curr = undefined;
        break;
      }
    } else {
      // 일반 키 접근
      if (typeof curr === "object" && curr !== null) {
        const nextValue = (curr as Record<string, unknown>)[key];
        curr = nextValue;
      } else {
        curr = undefined;
        break;
      }
    }
  }

  const rawResult = curr;

  // 5. 변환 적용
  const transformedResult = applyTransform(metricKey, rawResult);

  return transformedResult;
};

/**
 * 시나리오 플레이스홀더가 있는 경로에서 값을 추출합니다.
 * 시나리오 이름에 "."이 포함되어 있어도 정상적으로 처리합니다.
 *
 * @param path - 플레이스홀더가 포함된 경로 (예: "get_ptpxpower.ptpxpower_data.${SCENARIO}.metric")
 * @param scenarioName - 시나리오 이름 (점이 포함될 수 있음)
 * @param dataset - 데이터셋 객체
 * @param metricKey - 메트릭 키 (변환 적용을 위해 필요)
 * @returns 추출된 값 또는 undefined
 */
const extractWithScenario = (
  path: string,
  scenarioName: string,
  dataset: DatasetRecord,
  metricKey: string
): unknown => {
  // 경로를 ${SCENARIO}를 기준으로 분리
  const [beforeScenario, afterScenario] = path.split(SCENARIO_PLACEHOLDER);

  // beforeScenario에서 마지막 점 제거 (예: "get_ptpxpower.ptpxpower_data." -> "get_ptpxpower.ptpxpower_data")
  const basePath = beforeScenario.endsWith(".")
    ? beforeScenario.slice(0, -1)
    : beforeScenario;

  // afterScenario에서 첫 번째 점 제거 (예: ".metric" -> "metric")
  const metricPath = afterScenario.startsWith(".")
    ? afterScenario.slice(1)
    : afterScenario;

  // extractScenarioMetric 사용하여 추출
  const rawValue = extractScenarioMetric(
    basePath,
    scenarioName,
    metricPath,
    dataset
  );

  // 변환 적용
  const transformedValue = applyTransform(metricKey, rawValue);

  return transformedValue;
};

/**
 * 데이터셋에서 특정 메트릭 값을 추출합니다.
 * 시나리오 이름에 "."이 포함되어 있어도 정상적으로 처리합니다.
 *
 * @param metricKey - 메트릭 키 (형식: "Group!Label")
 * @param dataset - 데이터셋 객체
 * @param scenarioName - Power Scenario 이름 (선택적, ${SCENARIO} 플레이스홀더 대체용)
 * @returns 추출된 값 또는 undefined
 *
 * @example
 * // 일반 메트릭 추출
 * const value = extractMetricValue("User!Name", dataset);
 *
 * // Power Scenario 메트릭 추출 (시나리오 이름에 점 포함 가능)
 * const powerValue = extractMetricValue("Power!TotalPower", dataset, "tt_0.85v_25c");
 */
export const extractMetricValue = (
  metricKey: string,
  dataset: DatasetRecord = {},
  scenarioName?: string
): unknown => {
  const basePath = METRIC_EXTRACTORS[metricKey];

  if (!basePath) {
    return undefined;
  }

  // INPUT_DATE 플레이스홀더가 있는 경우
  if (hasInputDatePlaceholder(basePath)) {
    // 1. Physical Info 메트릭 처리 (extractPhysicalInfoMetric 사용)
    // 경로가 ".DATA"로 끝나는 경우 (배열 처리)
    if (basePath.endsWith(".DATA")) {
      // 메트릭 키에서 메트릭 이름 추출 (예: "PhysicalInfo!DRCs" -> "DRCs")
      const metricName = metricKey.split("!")[1];
      if (!metricName) {
        return undefined;
      }

      // basePath에서 ${INPUT_DATE}.DATA 부분 제거하여 basePath만 추출
      // 예: "get_layoutpnrdrcsummary.${INPUT_DATE}.DATA" -> "get_layoutpnrdrcsummary"
      const cleanBasePath = basePath
        .split(INPUT_DATE_PLACEHOLDER)[0]
        .replace(/\.$/, ""); // 뒤의 점 제거

      const rawValue = extractPhysicalInfoMetric(
        cleanBasePath,
        metricName,
        dataset
      );

      // 변환 적용
      const transformedValue = applyTransform(metricKey, rawValue);
      return transformedValue;
    }

    // 2. 일반 INPUT_DATE 처리 (extractWithInputDate 사용)
    // 경로가 계층적 구조인 경우 (예: .DATA.WIRE)
    const pathBeforeInputDate = basePath.split(INPUT_DATE_PLACEHOLDER)[0];
    const cleanBasePath = pathBeforeInputDate.endsWith(".")
      ? pathBeforeInputDate.slice(0, -1)
      : pathBeforeInputDate;

    return extractWithInputDate(basePath, cleanBasePath, dataset, metricKey);
  }

  // 시나리오 플레이스홀더가 있고 시나리오 이름이 제공된 경우
  // 특별 처리하여 시나리오 이름의 점을 보존
  if (scenarioName && hasScenarioPlaceholder(basePath)) {
    return extractWithScenario(basePath, scenarioName, dataset, metricKey);
  }

  // 일반 경로 처리 (시나리오 플레이스홀더 없음)
  const path = basePath;

  if (metricKey === "Physical Info!ECO Runtime") {
    console.log(`[extractMetricValue] 일반 경로 처리 시작`);
    console.log(`  basePath:`, basePath);
    console.log(`  path:`, path);
    console.log(`  dataset:`, dataset);
  }

  const pathKeys = path.split(".");
  let current: unknown = dataset;

  for (let i = 0; i < pathKeys.length; i++) {
    let key = pathKeys[i];

    if (metricKey === "Physical Info!ECO Runtime") {
      console.log(`  [step ${i}] key:`, key, "current:", current);
    }

    // 배열 인덱스 처리 (예: "DATA[0]" -> "DATA" + index 0)
    const arrayMatch = key.match(/^([^\[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrayKey = arrayMatch[1];
      const arrayIndex = parseInt(arrayMatch[2], 10);

      if (typeof current === "object" && current !== null) {
        const arrayValue = (current as Record<string, unknown>)[arrayKey];

        if (Array.isArray(arrayValue) && arrayValue[arrayIndex] !== undefined) {
          current = arrayValue[arrayIndex];
        } else {
          current = undefined;
          break;
        }
      } else {
        current = undefined;
        break;
      }
    } else {
      // 일반 키 접근
      if (typeof current === "object" && current !== null) {
        const nextValue = (current as Record<string, unknown>)[key];
        current = nextValue;
      } else {
        current = undefined;
        break;
      }
    }
  }

  const rawResult = current;

  // 변환 적용
  const transformedResult = applyTransform(metricKey, rawResult);

  // ECO Runtime 디버깅
  if (metricKey === "Physical Info!ECO Runtime") {
    console.log(`[extractMetricValue] 일반 경로 처리 완료`);
    console.log(`  rawResult:`, rawResult);
    console.log(`  transformedResult:`, transformedResult);
  }

  return transformedResult;
};
