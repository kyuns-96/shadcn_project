/**
 * @file metricValueExtractor.ts
 *
 * @purpose
 * 데이터셋에서 특정 메트릭 값을 추출하는 유틸리티 함수입니다.
 * 메트릭 키에 해당하는 경로를 정의하고, 중첩된 객체에서 자동으로 값을 추출합니다.
 * Power Scenario를 지원하여 시나리오별 메트릭 값을 추출할 수 있습니다.
 * 시나리오 이름에 "."이 포함되어 있어도 정상적으로 처리합니다.
 *
 * @structure
 * 1. METRIC_EXTRACTORS: "Group!Label" -> "경로.문자열" 형태로 정의
 * 2. extractScenarioMetric: 시나리오 기반 메트릭 추출 (점 포함 시나리오 지원)
 * 3. extractMetricValue: 메인 추출 함수 (경로 자동 파싱, 시나리오 지원)
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

  // ============================================================
  // Power Page Metrics (10 rows × 4 columns = 40 metrics)
  // Format: "Power(mW)!{RowName}_{ColumnName}"
  // Path: ${BASE_PATHS.ptpxpower}.${SCENARIO}.{row_key}.{column_key}
  //
  // [MODIFY HERE] Update the paths below to match your actual data structure
  // ============================================================

  // Clock Network row
  "Power(mW)!clock_network_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.clock_network.internal`,
  "Power(mW)!clock_network_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.clock_network.switching`,
  "Power(mW)!clock_network_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.clock_network.leakage`,
  "Power(mW)!clock_network_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.clock_network.total`,

  // Register row
  "Power(mW)!register_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.register.internal`,
  "Power(mW)!register_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.register.switching`,
  "Power(mW)!register_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.register.leakage`,
  "Power(mW)!register_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.register.total`,

  // Combinational row
  "Power(mW)!combinational_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.combinational.internal`,
  "Power(mW)!combinational_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.combinational.switching`,
  "Power(mW)!combinational_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.combinational.leakage`,
  "Power(mW)!combinational_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.combinational.total`,

  // Sequential row
  "Power(mW)!sequential_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.sequential.internal`,
  "Power(mW)!sequential_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.sequential.switching`,
  "Power(mW)!sequential_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.sequential.leakage`,
  "Power(mW)!sequential_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.sequential.total`,

  // Memory row
  "Power(mW)!memory_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.memory.internal`,
  "Power(mW)!memory_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.memory.switching`,
  "Power(mW)!memory_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.memory.leakage`,
  "Power(mW)!memory_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.memory.total`,

  // IO Pad row
  "Power(mW)!io_pad_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.io_pad.internal`,
  "Power(mW)!io_pad_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.io_pad.switching`,
  "Power(mW)!io_pad_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.io_pad.leakage`,
  "Power(mW)!io_pad_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.io_pad.total`,

  // Black Box row
  "Power(mW)!black_box_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.black_box.internal`,
  "Power(mW)!black_box_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.black_box.switching`,
  "Power(mW)!black_box_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.black_box.leakage`,
  "Power(mW)!black_box_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.black_box.total`,

  // Decap row
  "Power(mW)!decap_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.decap.internal`,
  "Power(mW)!decap_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.decap.switching`,
  "Power(mW)!decap_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.decap.leakage`,
  "Power(mW)!decap_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.decap.total`,

  // Power Switch row
  "Power(mW)!power_switch_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.power_switch.internal`,
  "Power(mW)!power_switch_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.power_switch.switching`,
  "Power(mW)!power_switch_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.power_switch.leakage`,
  "Power(mW)!power_switch_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.power_switch.total`,

  // Total row (separate metric values, not aggregated)
  "Power(mW)!total_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.total.internal`,
  "Power(mW)!total_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.total.switching`,
  "Power(mW)!total_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.total.leakage`,
  "Power(mW)!total_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.total.total`,
};

/**
 * 메트릭 값 변환 함수 타입
 */
type MetricTransformer = (value: unknown) => unknown;

/**
 * 메트릭 키별 값 변환 함수 매핑
 * 특정 메트릭에 대해 값을 변환할 때 사용 (예: 100 곱하기, 소수점 자리수 조정 등)
 *
 * @example
 * "Power!TotalPower": (v) => typeof v === "number" ? v * 100 : v
 */
const METRIC_TRANSFORMERS: Record<string, MetricTransformer> = {
  // Power 관련 메트릭에 100을 곱함 (예시)
  // "Power!TotalPower": (v) => (typeof v === "number" ? v * 100 : v),
  // "Power!LeakagePower": (v) => (typeof v === "number" ? v * 100 : v),
  // "Power!DynamicPower": (v) => (typeof v === "number" ? v * 100 : v),
};

/**
 * 특정 그룹의 모든 메트릭에 동일한 변환 적용
 * 그룹 이름 (예: "Power")을 키로 사용
 */
const GROUP_TRANSFORMERS: Record<string, MetricTransformer> = {
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
const applyTransform = (metricKey: string, value: unknown): unknown => {
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
const SCENARIO_PLACEHOLDER = "${SCENARIO}";

/**
 * 경로에서 시나리오 플레이스홀더가 있는지 확인합니다.
 */
const hasScenarioPlaceholder = (path: string): boolean => {
  return path.includes(SCENARIO_PLACEHOLDER);
};

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

  console.log("[extractScenarioMetric] Input:", {
    basePath,
    scenarioName,
    metricPath,
  });

  // 1. basePath로 ptpxpower_data까지 탐색 (점으로 split)
  let current: unknown = dataset;
  for (const key of basePath.split(".")) {
    if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[key];
    } else {
      console.warn(
        "[extractScenarioMetric] Failed to navigate basePath at:",
        key
      );
      return undefined;
    }
  }

  // 2. 시나리오 이름으로 직접 접근 (점으로 split하지 않음)
  if (typeof current === "object" && current !== null) {
    current = (current as Record<string, unknown>)[scenarioName];
  } else {
    console.warn("[extractScenarioMetric] ptpxpower_data is not an object");
    return undefined;
  }

  if (current === undefined) {
    console.warn("[extractScenarioMetric] Scenario not found:", scenarioName);
    return undefined;
  }

  // 3. metricPath로 나머지 탐색 (점으로 split)
  if (metricPath) {
    for (const key of metricPath.split(".")) {
      if (typeof current === "object" && current !== null) {
        current = (current as Record<string, unknown>)[key];
      } else {
        console.warn(
          "[extractScenarioMetric] Failed to navigate metricPath at:",
          key
        );
        return undefined;
      }
    }
  }

  console.log("[extractScenarioMetric] Result:", current);
  return current;
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

  console.log("[extractWithScenario] Parsed paths:", {
    basePath,
    scenarioName,
    metricPath,
  });

  // extractScenarioMetric 사용하여 추출
  const rawValue = extractScenarioMetric(
    basePath,
    scenarioName,
    metricPath,
    dataset
  );

  // 변환 적용
  const transformedValue = applyTransform(metricKey, rawValue);
  console.log("[extractWithScenario] Transform applied:", {
    rawValue,
    transformedValue,
  });

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

  // Debug logging
  console.log("[extractMetricValue] Input:", {
    metricKey,
    scenarioName,
    basePath,
    datasetKeys: Object.keys(dataset),
  });

  if (!basePath) {
    console.warn(
      "[extractMetricValue] No path found for metricKey:",
      metricKey
    );
    return undefined;
  }

  // 시나리오 플레이스홀더가 있고 시나리오 이름이 제공된 경우
  // 특별 처리하여 시나리오 이름의 점을 보존
  if (scenarioName && hasScenarioPlaceholder(basePath)) {
    return extractWithScenario(basePath, scenarioName, dataset, metricKey);
  }

  // 일반 경로 처리 (시나리오 플레이스홀더 없음)
  const path = basePath;
  console.log("[extractMetricValue] Using simple path:", path);

  const rawResult = path.split(".").reduce((current, key) => {
    if (typeof current === "object" && current !== null) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, dataset as unknown);

  // 변환 적용
  const result = applyTransform(metricKey, rawResult);
  console.log("[extractMetricValue] Result:", { rawResult, result });
  return result;
};
