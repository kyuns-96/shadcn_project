/**
 * @file helpers.ts
 *
 * @purpose
 * 메트릭 값 추출 시 사용되는 유틸리티 함수들을 정의합니다.
 * - 값 변환 함수 적용
 * - 플레이스홀더 확인
 *
 * @dependencies
 * - metricValueExtractor.ts (METRIC_TRANSFORMERS, GROUP_TRANSFORMERS)
 */

/** 메트릭 값 변환 함수 타입 */
export type MetricTransformer = (value: unknown) => unknown;

/**
 * 메트릭 키별 값 변환 함수 매핑
 * 특정 메트릭에 대해 값을 변환할 때 사용 (예: 100 곱하기, 소수점 자리수 조정 등)
 *
 * @example
 * "Power!TotalPower": (v) => typeof v === "number" ? v * 100 : v
 */
export const METRIC_TRANSFORMERS: Record<string, MetricTransformer> = {
  // ECO Runtime은 아무런 변환 없이 그대로 반환
  "Physical Info!ECO Runtime": (v) => v,
  // Power 관련 메트릭에 100을 곱함 (예시)
  // "Power!TotalPower": (v) => (typeof v === "number" ? v * 100 : v),
  // "Power!LeakagePower": (v) => (typeof v === "number" ? v * 100 : v),
  // "Power!DynamicPower": (v) => (typeof v === "number" ? v * 100 : v),
};

/**
 * 특정 그룹의 모든 메트릭에 동일한 변환 적용
 * 그룹 이름 (예: "Power")을 키로 사용
 */
export const GROUP_TRANSFORMERS: Record<string, MetricTransformer> = {
  // Physical Info 그룹: DRCs, Short, Total Wire Length는 정수만 표시
  // ECO Runtime은 METRIC_TRANSFORMERS에서 별도 처리됨
  "Physical Info": (v) => {
    if (typeof v === "number") {
      return Math.floor(v); // 정수로 변환
    }
    return v;
  },
};

/**
 * 메트릭 값에 변환 함수를 적용합니다.
 *
 * @param metricKey - 메트릭 키 (형식: "Group!Label")
 * @param value - 변환할 값
 * @returns 변환된 값
 */
export const applyTransform = (metricKey: string, value: unknown): unknown => {
  // 1. 메트릭별 변환 함수 확인
  if (METRIC_TRANSFORMERS[metricKey]) {
    const transformed = METRIC_TRANSFORMERS[metricKey](value);
    return transformed;
  }

  // 2. 그룹별 변환 함수 확인 (metricKey에서 그룹 추출: "Group!Label" -> "Group")
  const groupName = metricKey.split("!")[0];
  if (groupName && GROUP_TRANSFORMERS[groupName]) {
    const transformed = GROUP_TRANSFORMERS[groupName](value);
    return transformed;
  }

  // 변환 없이 원본 반환
  return value;
};

/**
 * 메트릭 키별 셀 포맷팅 전략
 * "skip-decimal": decimal 포맷팅 스킵, 문자열로 그대로 표시
 * "number": 숫자 포맷팅 적용 (decimal 포맷팅)
 * "string-only": 문자열만 사용 (parseFloat 스킵)
 */
export const METRIC_CELL_FORMAT_STRATEGY: Record<
  string,
  "skip-decimal" | "number" | "string-only"
> = {
  // ECO Runtime: 시간 형식이므로 문자열만 사용 (parseFloat 스킵)
  "Physical Info!ECO Runtime": "string-only",
  // 다른 메트릭별 포맷팅 전략 추가 시 여기에 작성
};

/**
 * 그룹별 기본 포맷팅 전략
 */
export const GROUP_FORMAT_STRATEGY: Record<
  string,
  "skip-decimal" | "number" | "string-only"
> = {
  "Physical Info": "skip-decimal",
  "Formality": "string-only",
  // 다른 그룹 추가 시 여기에 작성
};

/**
 * 메트릭의 포맷팅 전략을 반환합니다.
 * 1. 메트릭별 설정 확인
 * 2. 그룹별 기본값 확인
 * 3. 기본값: 숫자 포맷팅
 */
export const getMetricFormatStrategy = (
  metricKey: string
): "skip-decimal" | "number" | "string-only" => {
  // 메트릭별 설정 확인
  if (METRIC_CELL_FORMAT_STRATEGY[metricKey]) {
    return METRIC_CELL_FORMAT_STRATEGY[metricKey];
  }

  // 그룹별 기본값
  const groupName = metricKey.split("!")[0];
  if (GROUP_FORMAT_STRATEGY[groupName]) {
    return GROUP_FORMAT_STRATEGY[groupName];
  }

  // 기본값: 숫자 포맷팅
  return "number";
};

/** 시나리오 플레이스홀더 */
export const SCENARIO_PLACEHOLDER = "${SCENARIO}";

/** Input Date 플레이스홀더 */
export const INPUT_DATE_PLACEHOLDER = "${INPUT_DATE}";

/**
 * 경로에서 시나리오 플레이스홀더가 있는지 확인합니다.
 */
export const hasScenarioPlaceholder = (path: string): boolean => {
  return path.includes(SCENARIO_PLACEHOLDER);
};

/**
 * 경로에서 Input Date 플레이스홀더가 있는지 확인합니다.
 */
export const hasInputDatePlaceholder = (path: string): boolean => {
  return path.includes(INPUT_DATE_PLACEHOLDER);
};
