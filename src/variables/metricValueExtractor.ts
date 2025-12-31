/**
 * @file metricValueExtractor.ts
 *
 * @purpose
 * 데이터셋에서 특정 메트릭 값을 추출하는 유틸리티 함수입니다.
 * 메트릭 키에 해당하는 경로를 정의하고, 중첩된 객체에서 자동으로 값을 추출합니다.
 * Power Scenario를 지원하여 시나리오별 메트릭 값을 추출할 수 있습니다.
 *
 * @structure
 * 1. METRIC_EXTRACTORS: "Group!Label" -> "경로.문자열" 형태로 정의
 * 2. extractMetricValue: 메인 추출 함수 (경로 자동 파싱, 시나리오 지원)
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
  /** Power 시나리오 데이터 기본 경로 (시나리오 이름이 동적으로 삽입됨) */
  ptpxpower: "get_ptpxpower.ptpxpower_data",
};

/**
 * 메트릭 키별 경로 매핑
 * 형식: "Group!Label" -> "path.to.value"
 *
 * Power Scenario 경로의 경우:
 * - ${SCENARIO} 플레이스홀더를 사용하여 동적 시나리오 경로 지원
 * - 예: "get_ptpxpower.ptpxpower_data.${SCENARIO}.metric_name"
 *
 * @example
 * "Order!TotalAmount": "api.order.data.totalAmount"
 * "Power!TotalPower": "get_ptpxpower.ptpxpower_data.${SCENARIO}.total_power"
 */
const METRIC_EXTRACTORS: Record<string, string> = {
  "User!Name": "user.name",
  "User!Email": "user.email",
  "Order!TotalAmount": `${BASE_PATHS.order}.totalAmount`,
  "Order!ItemCount": `${BASE_PATHS.order}.itemCount`,
  "Order!Status": `${BASE_PATHS.order}.status`,
  "Product!Price": `${BASE_PATHS.product}.price`,
  "Product!Stock": `${BASE_PATHS.product}.stock`,
  // Power Scenario 관련 메트릭 예시 (실제 메트릭에 맞게 수정 필요)
  // "Power!TotalPower": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.total_power`,
  // "Power!LeakagePower": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.leakage_power`,
  // "Power!DynamicPower": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.dynamic_power`,
};

/** 시나리오 플레이스홀더 */
const SCENARIO_PLACEHOLDER = "${SCENARIO}";

/**
 * 경로 문자열에서 시나리오 플레이스홀더를 실제 시나리오 이름으로 대체합니다.
 *
 * @param path - 원본 경로 문자열
 * @param scenarioName - 대체할 시나리오 이름
 * @returns 시나리오가 대체된 경로 문자열
 */
const resolvScenarioPath = (path: string, scenarioName?: string): string => {
  if (!scenarioName || !path.includes(SCENARIO_PLACEHOLDER)) {
    return path;
  }
  return path.replace(SCENARIO_PLACEHOLDER, scenarioName);
};

/**
 * 데이터셋에서 특정 메트릭 값을 추출합니다.
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
 * // Power Scenario 메트릭 추출
 * const powerValue = extractMetricValue("Power!TotalPower", dataset, "tt_0p85v_25c");
 */
export const extractMetricValue = (
  metricKey: string,
  dataset: DatasetRecord = {},
  scenarioName?: string
): unknown => {
  const basePath = METRIC_EXTRACTORS[metricKey];
  if (!basePath) return undefined;

  // 시나리오 플레이스홀더 대체
  const path = resolvScenarioPath(basePath, scenarioName);

  return path.split(".").reduce((current, key) => {
    if (typeof current === "object" && current !== null) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, dataset as unknown);
};

/**
 * Power Scenario 기반의 동적 경로에서 메트릭 값을 추출합니다.
 * METRIC_EXTRACTORS에 정의되지 않은 동적 경로도 지원합니다.
 *
 * @param basePath - 기본 경로 (예: "get_ptpxpower.ptpxpower_data")
 * @param scenarioName - 시나리오 이름
 * @param metricPath - 시나리오 하위 메트릭 경로 (예: "total_power")
 * @param dataset - 데이터셋 객체
 * @returns 추출된 값 또는 undefined
 *
 * @example
 * const value = extractScenarioMetric(
 *   "get_ptpxpower.ptpxpower_data",
 *   "tt_0p85v_25c",
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

  const fullPath = `${basePath}.${scenarioName}.${metricPath}`;

  return fullPath.split(".").reduce((current, key) => {
    if (typeof current === "object" && current !== null) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, dataset as unknown);
};
