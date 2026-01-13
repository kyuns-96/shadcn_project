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
  // Power 그룹의 모든 메트릭: W -> mW 변환 (1000 곱함) 후 소수점 3자리로 포맷
  "Power(mW)": (v) => {
    if (typeof v === "number") {
      const mW = v * 1000; // W to mW
      return Number(mW.toFixed(3)); // 소수점 3자리
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
    return METRIC_TRANSFORMERS[metricKey](value);
  }

  // 2. 그룹별 변환 함수 확인 (metricKey에서 그룹 추출: "Group!Label" -> "Group")
  const groupName = metricKey.split("!")[0];
  if (groupName && GROUP_TRANSFORMERS[groupName]) {
    return GROUP_TRANSFORMERS[groupName](value);
  }

  // 변환 없이 원본 반환
  return value;
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
