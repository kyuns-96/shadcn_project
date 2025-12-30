/**
 * @file metricValueExtractor.ts
 *
 * @purpose
 * 데이터셋에서 특정 메트릭 값을 추출하는 유틸리티 함수입니다.
 * 메트릭 키에 해당하는 경로를 정의하고, 중첩된 객체에서 자동으로 값을 추출합니다.
 *
 * @structure
 * 1. METRIC_EXTRACTORS: "Group!Label" -> "경로.문자열" 형태로 정의
 * 2. extractMetricValue: 메인 추출 함수 (경로 자동 파싱)
 *
 * @dependencies
 * - 없음 (순수 유틸리티 함수)
 */

/** 데이터셋 타입 정의 */
type DatasetRecord = Record<string, unknown>;

/** 공통 경로 정의 */
const BASE_PATHS = {
  order: "api.order.data",
  product: "api.product.data",
};

/**
 * 메트릭 키별 경로 매핑
 * 형식: "Group!Label" -> "path.to.value"
 *
 * @example
 * "Order!TotalAmount": "api.order.data.totalAmount"
 */
const METRIC_EXTRACTORS: Record<string, string> = {
  "User!Name": "user.name",
  "User!Email": "user.email",
  "Order!TotalAmount": `${BASE_PATHS.order}.totalAmount`,
  "Order!ItemCount": `${BASE_PATHS.order}.itemCount`,
  "Order!Status": `${BASE_PATHS.order}.status`,
  "Product!Price": `${BASE_PATHS.product}.price`,
  "Product!Stock": `${BASE_PATHS.product}.stock`,
};

/**
 * 데이터셋에서 특정 메트릭 값을 추출합니다.
 *
 * @param metricKey - 메트릭 키 (형식: "Group!Label")
 * @param dataset - 데이터셋 객체
 * @returns 추출된 값 또는 undefined
 *
 * @example
 * const value = extractMetricValue("User!Name", dataset);
 * const value = extractMetricValue("Order!TotalAmount", dataset);
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
