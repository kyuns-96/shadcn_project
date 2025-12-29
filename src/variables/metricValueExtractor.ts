/**
 * @file metricValueExtractor.ts
 *
 * @purpose
 * 데이터셋에서 특정 메트릭 값을 추출하는 유틸리티 함수입니다.
 * 메트릭 키에 해당하는 경로를 정의하고, 중첩된 객체에서 자동으로 값을 추출합니다.
 *
 * @structure
 * 1. BASE_PATHS: 공통 경로 prefix
 * 2. METRIC_EXTRACTORS: "Group!Label" -> "경로.문자열" 형태로 정의
 * 3. extractMetricValue: 메인 추출 함수 (경로 자동 파싱)
 *
 * @dependencies
 * - 없음 (순수 유틸리티 함수)
 */

/** 데이터셋 타입 정의 */
type DatasetRecord = Record<string, unknown>;

/** 공통 경로 prefix 정의 */
const BASE_PATHS = {
  analytics: "data.analytics.metrics",
  config: "settings.config",
};

/**
 * 메트릭 키별 경로 매핑
 * 형식: "Group!Label" -> "path.to.value"
 *
 * @example
 * "Analytics!PageView": "data.analytics.metrics.pageView"
 * "Config!Timeout": "settings.config.timeout"
 */
const METRIC_EXTRACTORS: Record<string, string> = {
  // 간단한 구조
  "User!Count": "user.count",
  "Sales!Total": "sales.total",

  // Analytics 메트릭들 (BASE_PATHS.analytics 사용)
  "Analytics!PageView": `${BASE_PATHS.analytics}.pageView`,
  "Analytics!SessionCount": `${BASE_PATHS.analytics}.sessionCount`,
  "Analytics!Conversion": `${BASE_PATHS.analytics}.conversion`,

  // Config 메트릭들 (BASE_PATHS.config 사용)
  "Config!Timeout": `${BASE_PATHS.config}.timeout`,
  "Config!RetryCount": `${BASE_PATHS.config}.retryCount`,
};

/**
 * 데이터셋에서 특정 메트릭 값을 추출합니다.
 *
 * @param metricKey - 메트릭 키 (형식: "Group!Label")
 * @param dataset - 데이터셋 객체
 * @returns 추출된 값 또는 undefined
 *
 * @example
 * const value = extractMetricValue("User!Count", dataset);
 * const value = extractMetricValue("Analytics!PageView", dataset);
 */
export const extractMetricValue = (
  metricKey: string,
  dataset: DatasetRecord = {}
): unknown => {
  const path = METRIC_EXTRACTORS[metricKey];
  if (!path) return undefined;

  return path.split(".").reduce((current, key) => {
    if (typeof current === "object" && current !== null) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, dataset as unknown);
};

// 기존 함수명과의 호환성을 위한 alias
export const getMetric = extractMetricValue;
