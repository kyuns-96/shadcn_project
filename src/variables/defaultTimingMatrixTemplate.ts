/**
 * @file defaultTimingMatrixTemplate.ts
 *
 * @purpose
 * Timing Page의 기본 매트릭스 템플릿을 정의합니다.
 * 행은 DoE별로 동적 생성되며, 각 컬럼은 타이밍 메트릭입니다.
 * 컬럼 그룹은: setup(r2r), hold(r2r), clock_mttv, data_mttv, max_cap, cpc, gnoise
 * 각 그룹 내 메트릭은: WNS, TNS, NVP
 *
 * @structure
 * 1. TIMING_COLUMN_GROUPS: 컬럼 그룹 정의
 * 2. TIMING_METRICS: 각 그룹 내 메트릭
 * 3. Row는 DoE별로 동적 생성 (addDoeGroup 시)
 *
 * @dependencies
 * - @/store/reducers/timingMatrixReducer: addTimingRow 액션
 * - @/store: AppDispatch 타입
 */

// ============================================================
// [MODIFY HERE] Column Groups and Metrics - Easy to customize
// ============================================================

/**
 * Timing 테이블의 컬럼 그룹 (각 그룹 내에 WNS/TNS/NVP 메트릭)
 */
export const TIMING_COLUMN_GROUPS = [
  "setup(r2r)",
  "hold(r2r)",
  "clock_mttv",
  "data_mttv",
  "max_cap",
  "cpc",
  "gnoise",
] as const;

/**
 * 각 컬럼 그룹 내의 메트릭
 */
export const TIMING_METRICS = ["WNS", "TNS", "NVP"] as const;

// ============================================================
// Type definitions
// ============================================================

export type TimingColumnGroup = (typeof TIMING_COLUMN_GROUPS)[number];
export type TimingMetric = (typeof TIMING_METRICS)[number];

/** 데이터 로딩 중 표시되는 플레이스홀더 */
export const LOADING_PLACEHOLDER = "___LOADING___";

/** 빈 값 플레이스홀더 */
export const EMPTY_VALUE_PLACEHOLDER = "-";

/**
 * 컬럼 ID 생성 헬퍼
 * 형식: ${groupName}_${metric}
 */
export const generateTimingColumnKey = (
  group: TimingColumnGroup,
  metric: TimingMetric
): string => {
  return `${group}_${metric}`;
};

/**
 * Timing 메트릭 키 생성 (metricValueExtractor용)
 * 형식: Timing!${columnGroup}_${metric}
 */
export const getTimingMetricKey = (
  columnGroup: TimingColumnGroup,
  metric: TimingMetric
): string => {
  return `Timing!${columnGroup}_${metric}`;
};
