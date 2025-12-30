/**
 * @file metricValueExtractor.ts
 *
 * @purpose
 * 데이터셋에서 특정 메트릭 값을 추출하는 유틸리티 함수입니다.
 * 행 그룹과 라벨을 기반으로 해당하는 데이터 값을 반환합니다.
 *
 * @structure
 * 1. METRIC_EXTRACTORS: 메트릭 키별 값 추출 함수 맵
 * 2. extractMetricValue: 메인 추출 함수
 *
 * @dependencies
 * - 없음 (순수 유틸리티 함수)
 */

/** 데이터셋 타입 정의 */
type DatasetRecord = Record<string, unknown>;

/** 메트릭 추출 함수 타입 */
type MetricExtractor = (dataset: DatasetRecord) => unknown;

/**
 * 메트릭 키별 값 추출 함수 맵
 * 형식: "Group!Header" -> 추출 함수
 */
const METRIC_EXTRACTORS: Record<string, MetricExtractor> = {
  /* 예시: "Group!Header": (dataset) => dataset["group"]?.headerMetric */
  "User!Count": (dataset) =>
    (dataset["user"] as Record<string, unknown> | undefined)?.count,
  "Sales!Total": (dataset) =>
    (dataset["sales"] as Record<string, unknown> | undefined)?.total,
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
 */
export const extractMetricValue = (
  metricKey: string,
  dataset: DatasetRecord = {}
): unknown => {
  const extractor = METRIC_EXTRACTORS[metricKey];
  return extractor ? extractor(dataset) : undefined;
};
