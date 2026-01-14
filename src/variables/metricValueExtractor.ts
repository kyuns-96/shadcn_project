/**
 * @file metricValueExtractor.ts
 *
 * @purpose
 * 메트릭 키별 경로 및 매핑 정보를 정의합니다.
 * 데이터셋에서 메트릭 값을 추출할 때 필요한 모든 매핑 설정을 중앙화합니다.
 *
 * @structure
 * 1. BASE_PATHS: 공통 경로 정의
 * 2. METRIC_EXTRACTORS: "Group!Label" -> "경로.문자열" 형태로 정의
 * 3. PHYSICAL_INFO_TYPE_MAPPING: Physical Info 메트릭 이름과 TYPE 값 매핑
 *
 * @dependencies
 * - extractors.ts (실제 추출 함수)
 * - helpers.ts (변환 함수)
 */

export {
  extractMetricValue,
  extractScenarioMetric,
  extractPhysicalInfoMetric,
} from "./extractors";
export { applyTransform, type MetricTransformer } from "./helpers";

/** 공통 경로 정의 */
const BASE_PATHS = {
  order: "api.order.data",
  product: "api.product.data",
  /** Power 시나리오 데이터 기본 경로 (시나리오 이름이 동적으로 삽입됨) */
  ptpxpower: "get_ptpxpower.ptpxpower_data",
  /** Timing 시나리오 데이터 기본 경로 (시나리오 이름이 동적으로 삽입됨) */
  timingSummary: "get_timing_summary.timing_summary_data",
  /** Physical Info 데이터 기본 경로 (input_date가 동적으로 삽입됨) */
  physical_info: "get_layoutpnrdrcsummary.layoutpnrdrcsummary_data",
  /** Layout Wiring Total 데이터 기본 경로 (input_date가 동적으로 삽입됨) */
  layoutWiringTotal: "get_layoutwiringtotal.layoutwiringtotal_data",
  /** Layout Runtime 데이터 기본 경로 */
  layoutRuntime: "get_layoutruntime.layoutruntime_data",
  /** Layout Data (Cell Usage) 기본 경로 */
  layoutData: "get_layoutcellusage.layoutcellusage_data",
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
export const METRIC_EXTRACTORS: Record<string, string> = {
  // ============================================================
  // Power Page Metrics (10 rows × 4 columns = 40 metrics)
  // Format: "Power(mW)!{RowName}_{ColumnName}"
  // Path: ${BASE_PATHS.ptpxpower}.${SCENARIO}.{row_key}.{column_key}
  //
  // [MODIFY HERE] Update the paths below to match your actual data structure
  // ============================================================
  // Clock Network row
  "Power(mW)!clock_network_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Internal_power.clock_network`,
  "Power(mW)!clock_network_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Switching_power.clock_network`,
  "Power(mW)!clock_network_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Leakage_power.clock_network`,
  "Power(mW)!clock_network_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Total_power.clock_network`,

  // Register row
  "Power(mW)!register_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Internal_power.register`,
  "Power(mW)!register_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Switching_power.register`,
  "Power(mW)!register_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Leakage_power.register`,
  "Power(mW)!register_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Total_power.register`,

  // Combinational row
  "Power(mW)!combinational_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Internal_power.combinational`,
  "Power(mW)!combinational_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Switching_power.combinational`,
  "Power(mW)!combinational_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Leakage_power.combinational`,
  "Power(mW)!combinational_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Total_power.combinational`,

  // Sequential row
  "Power(mW)!sequential_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Internal_power.sequential`,
  "Power(mW)!sequential_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Switching_power.sequential`,
  "Power(mW)!sequential_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Leakage_power.sequential`,
  "Power(mW)!sequential_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Total_power.sequential`,

  // Memory row
  "Power(mW)!memory_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Internal_power.memory`,
  "Power(mW)!memory_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Switching_power.memory`,
  "Power(mW)!memory_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Leakage_power.memory`,
  "Power(mW)!memory_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Total_power.memory`,

  // IO Pad row
  "Power(mW)!io_pad_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Internal_power.io_pad`,
  "Power(mW)!io_pad_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Switching_power.io_pad`,
  "Power(mW)!io_pad_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Leakage_power.io_pad`,
  "Power(mW)!io_pad_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Total_power.io_pad`,

  // Black Box row
  "Power(mW)!black_box_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Internal_power.black_box`,
  "Power(mW)!black_box_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Switching_power.black_box`,
  "Power(mW)!black_box_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Leakage_power.black_box`,
  "Power(mW)!black_box_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Total_power.black_box`,

  // Decap row
  "Power(mW)!decap_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Internal_power.decap`,
  "Power(mW)!decap_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Switching_power.decap`,
  "Power(mW)!decap_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Leakage_power.decap`,
  "Power(mW)!decap_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Total_power.decap`,

  // Power Switch row
  "Power(mW)!power_switch_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Internal_power.power_switch`,
  "Power(mW)!power_switch_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Switching_power.power_switch`,
  "Power(mW)!power_switch_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Leakage_power.power_switch`,
  "Power(mW)!power_switch_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Total_power.power_switch`,

  // Total row (separate metric values, not aggregated)
  "Power(mW)!total_Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Internal_power.Total`,
  "Power(mW)!total_Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Switching_power.Total`,
  "Power(mW)!total_Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Leakage_power.Total`,
  "Power(mW)!total_Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Total_power.Total`,

  // ============================================================
  // Timing Page Metrics (7 groups × 3 metrics = 21 metrics)
  // Format: "Timing!{ColumnGroup}_{Metric}"
  // Path: ${BASE_PATHS.timingSummary}.${SCENARIO}.{column_group}.{metric}
  // ============================================================
  // Setup(r2r) group
  "Timing!setup(r2r)_WNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.setup(r2r).WNS`,
  "Timing!setup(r2r)_TNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.setup(r2r).TNS`,
  "Timing!setup(r2r)_NVP": `${BASE_PATHS.timingSummary}.\${SCENARIO}.setup(r2r).NVP`,

  // Hold(r2r) group
  "Timing!hold(r2r)_WNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.hold(r2r).WNS`,
  "Timing!hold(r2r)_TNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.hold(r2r).TNS`,
  "Timing!hold(r2r)_NVP": `${BASE_PATHS.timingSummary}.\${SCENARIO}.hold(r2r).NVP`,

  // Clock_mttv group
  "Timing!clock_mttv_WNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.clock_mttv.WNS`,
  "Timing!clock_mttv_TNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.clock_mttv.TNS`,
  "Timing!clock_mttv_NVP": `${BASE_PATHS.timingSummary}.\${SCENARIO}.clock_mttv.NVP`,

  // Data_mttv group
  "Timing!data_mttv_WNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.data_mttv.WNS`,
  "Timing!data_mttv_TNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.data_mttv.TNS`,
  "Timing!data_mttv_NVP": `${BASE_PATHS.timingSummary}.\${SCENARIO}.data_mttv.NVP`,

  // Max_cap group
  "Timing!max_cap_WNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.max_cap.WNS`,
  "Timing!max_cap_TNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.max_cap.TNS`,
  "Timing!max_cap_NVP": `${BASE_PATHS.timingSummary}.\${SCENARIO}.max_cap.NVP`,

  // Cpc group
  "Timing!cpc_WNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.cpc.WNS`,
  "Timing!cpc_TNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.cpc.TNS`,
  "Timing!cpc_NVP": `${BASE_PATHS.timingSummary}.\${SCENARIO}.cpc.NVP`,

  // Gnoise group
  "Timing!gnoise_WNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.gnoise.WNS`,
  "Timing!gnoise_TNS": `${BASE_PATHS.timingSummary}.\${SCENARIO}.gnoise.TNS`,
  "Timing!gnoise_NVP": `${BASE_PATHS.timingSummary}.\${SCENARIO}.gnoise.NVP`,

  // ============================================================
  // Physical Info Metrics (4 metrics)
  // Format: "PhysicalInfo!{MetricName}"
  // Path: ${BASE_PATHS.physical_info}.${input_date}.DATA.{TYPE_or_VALUE}
  // Note: Uses dynamic input_date extraction with type-based value lookup
  // ============================================================
  "Physical Info!DRCs": `${BASE_PATHS.physical_info}.\${INPUT_DATE}.DATA`,
  "Physical Info!Short": `${BASE_PATHS.physical_info}.\${INPUT_DATE}.DATA`,
  "Physical Info!Total Wire Length": `${BASE_PATHS.layoutWiringTotal}.\${INPUT_DATE}.DATA.WIRE`,
  "Physical Info!ECO Runtime": `${BASE_PATHS.layoutRuntime}.RUNTIME`,

  // ============================================================
  // Layout Data Metrics - Area(G/C) group (6 metrics)
  // Format: "LayoutData!Area(G/C)_{Entry}"
  // Path: ${BASE_PATHS.layoutData}.{GATE_COUNT_*}
  // ============================================================
  "Area(G/C)!SRAM": `${BASE_PATHS.layoutData}.GATE_COUNT_MEMORY`,
  "Area(G/C)!F/F": `${BASE_PATHS.layoutData}.GATE_COUNT_SEQUENTIAL`,
  "Area(G/C)!Combi": `${BASE_PATHS.layoutData}.GATE_COUNT_COMBINATIONAL`,
  "Area(G/C)!HM": `${BASE_PATHS.layoutData}.GATE_COUNT_HM`,
  "Area(G/C)!IO": `${BASE_PATHS.layoutData}.GATE_COUNT_IO`,
  "Area(G/C)!Total": `${BASE_PATHS.layoutData}.GATE_COUNT_TOTAL`,

  // ============================================================
  // Layout Data Metrics - Area(um^2) group (6 metrics)
  // Format: "LayoutData!Area(um^2)_{Entry}"
  // Path: ${BASE_PATHS.layoutData}.{AREA_*} (references GATE_COUNT_*)
  // ============================================================
  "Area(um^2)!SRAM": `${BASE_PATHS.layoutData}.AREA_MEMORY`,
  "Area(um^2)!F/F": `${BASE_PATHS.layoutData}.AREA_SEQUENTIAL`,
  "Area(um^2)!Combi": `${BASE_PATHS.layoutData}.AREA_COMBINATIONAL`,
  "Area(um^2)!HM": `${BASE_PATHS.layoutData}.AREA_HM`,
  "Area(um^2)!IO": `${BASE_PATHS.layoutData}.AREA_IO`,
  "Area(um^2)!Total": `${BASE_PATHS.layoutData}.AREA_TOTAL`,

  // ============================================================
  // Layout Data Metrics - VTH_RATIO(Area) group (6 metrics)
  // Format: "LayoutData!VTH_RATIO(Area)_{Entry}"
  // Path: ${BASE_PATHS.layoutData}.VTH_RATIO_{ENTRY}
  // ============================================================
  "VTH_RATIO(Area)!LVT": `${BASE_PATHS.layoutData}.VTH_RATIO_LVT`,
  "VTH_RATIO(Area)!LVT_LLP": `${BASE_PATHS.layoutData}.VTH_RATIO_LVT_LLP`,
  "VTH_RATIO(Area)!HVT": `${BASE_PATHS.layoutData}.VTH_RATIO_HVT`,
  "VTH_RATIO(Area)!HVT_LLP": `${BASE_PATHS.layoutData}.VTH_RATIO_HVT_LLP`,
  "VTH_RATIO(Area)!RVT": `${BASE_PATHS.layoutData}.VTH_RATIO_RVT`,
  "VTH_RATIO(Area)!RVT_LLP": `${BASE_PATHS.layoutData}.VTH_RATIO_RVT_LLP`,

  // ============================================================
  // QOR Compare Page - Power Metrics (4 metrics)
  // Format: "Power(mW)!{Entry}"
  // Path: ${BASE_PATHS.ptpxpower}.${SCENARIO}.{PowerType}.Total
  // ============================================================
  "Power(mW)!Internal": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Internal_power.Total`,
  "Power(mW)!Switching": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Switching_power.Total`,
  "Power(mW)!Leakage": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Leakage_power.Total`,
  "Power(mW)!Total": `${BASE_PATHS.ptpxpower}.\${SCENARIO}.Total_power.Total`,
};

/**
 * Physical Info 메트릭 이름과 실제 데이터의 TYPE 값 매핑
 * 메트릭 이름 -> 데이터의 TYPE 필드 값
 *
 * @example
 * "DRCs" -> "@@@@@@@ TOTAL VIOLATIONS"
 * "Short" -> "Shorts"
 */
export const PHYSICAL_INFO_TYPE_MAPPING: Record<string, string> = {
  DRCs: "@@@@@@@ TOTAL VIOLATIONS",
  Short: "Short",
};
