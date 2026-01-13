/**
 * @file defaultPowerScenarioMappingForPower.ts
 *
 * @purpose
 * Power Page 전용 프로젝트 이름에 따른 기본 Power Scenario를 결정하는 매핑 파일입니다.
 * QOR Compare Page의 시나리오 매핑과 독립적으로 관리됩니다.
 * 사용자가 Power Page에서 컬럼을 추가할 때 초기 시나리오 선택에 사용됩니다.
 *
 * @structure
 * 1. POWER_PROJECT_SCENARIO_MAP: 프로젝트별 기본 시나리오 매핑
 * 2. getDefaultPowerScenario: 프로젝트 이름과 가용 시나리오로 기본값 결정
 *
 * @dependencies
 * - 없음 (순수 유틸리티 함수)
 */

// ============================================================
// [MODIFY HERE] Project to Scenario Mapping for Power Page
// ============================================================

/**
 * Power Page 전용 프로젝트 이름별 기본 시나리오 매핑
 *
 * 키: 프로젝트 이름 (대소문자 구분)
 * 값: 해당 프로젝트의 기본 시나리오 이름
 *
 * @example
 * "ProjectA" -> "tt_0p85v_25c"
 * "ProjectB" -> "ff_0p99v_m40c"
 */
const POWER_PROJECT_SCENARIO_MAP: Record<string, string> = {
  // ============================================================
  // [MODIFY HERE] Add your project-to-scenario mappings below
  // ============================================================
  // "ProjectA": "tt_0p85v_25c",
  // "ProjectB": "ff_0p99v_m40c",
  // "ProjectC": "ss_0p75v_125c",
};

/**
 * "mission*.tt_*" 패턴을 만족하는 시나리오를 찾습니다.
 * 패턴: mission{임의} . tt_{임의}
 * (. 은 실제 dot 문자입니다)
 *
 * @param scenario - 확인할 시나리오 이름
 * @returns 패턴을 만족하면 true
 *
 * @example
 * matchesMissionPattern(\"mission.tt_0p85v\") // true
 * matchesMissionPattern(\"mission1.tt_25c\") // true
 * matchesMissionPattern(\"tt_0p85v_25c\") // false
 */
const matchesMissionPattern = (scenario: string): boolean => {
  // \"mission*.tt_*\" 패턴: mission + 임의 문자(0개 이상) + . (실제 dot) + tt_ + 임의 문자(0개 이상)
  return /^mission.*\.tt_.*/i.test(scenario);
};

/**
 * Power Page에서 프로젝트 이름과 가용 시나리오 목록을 기반으로 기본 시나리오를 결정합니다.
 *
 * 우선순위:
 * 1. POWER_PROJECT_SCENARIO_MAP에서 프로젝트에 매핑된 시나리오 (가용 목록에 있는 경우)
 * 2. "mission*.tt_*" 패턴을 만족하는 첫 번째 시나리오
 * 3. "input_data"가 아닌 다른 시나리오 중 첫 번째
 * 4. 빈 문자열 (가용 시나리오가 없는 경우)
 *
 * @param projectName - 프로젝트 이름 (null일 수 있음)
 * @param availableScenarios - 해당 컬럼에서 사용 가능한 시나리오 목록
 * @returns 선택된 기본 시나리오 이름
 *
 * @example
 * const scenario = getDefaultPowerScenario("ProjectA", ["tt_0p85v_25c", "ff_0p99v_m40c"]);
 * // Returns: "tt_0p85v_25c" (if mapped and available)
 *
 * const scenario = getDefaultPowerScenario("UnknownProject", ["mission_tt_0p85v", "input_data"]);
 * // Returns: "mission_tt_0p85v" (matches mission*.tt_* pattern)
 *
 * const scenario = getDefaultPowerScenario("UnknownProject", ["input_data", "scenario1"]);
 * // Returns: "scenario1" (first scenario except input_data)
 */
export const getDefaultPowerScenario = (
  projectName: string | null | undefined,
  availableScenarios: string[]
): string => {
  // 가용 시나리오가 없으면 빈 문자열 반환
  if (!availableScenarios || availableScenarios.length === 0) {
    return "";
  }

  // 우선순위 1: 프로젝트에 매핑된 시나리오가 있고, 가용 목록에 포함되어 있으면 반환
  if (projectName && POWER_PROJECT_SCENARIO_MAP[projectName]) {
    const mappedScenario = POWER_PROJECT_SCENARIO_MAP[projectName];
    if (availableScenarios.includes(mappedScenario)) {
      return mappedScenario;
    }
  }

  // 우선순위 2: "mission*.tt_*" 패턴을 만족하는 첫 번째 시나리오
  const missionScenario = availableScenarios.find(matchesMissionPattern);
  if (missionScenario) {
    return missionScenario;
  }

  // 우선순위 3: "input_data"가 아닌 다른 시나리오 중 첫 번째
  const nonInputDataScenario = availableScenarios.find(
    (s) => s !== "input_data"
  );
  if (nonInputDataScenario) {
    return nonInputDataScenario;
  }

  // 우선순위 4: 다른 방법이 없으면 첫 번째 시나리오 사용 (예: "input_data"만 있는 경우)
  return availableScenarios[0];
};

/**
 * 프로젝트에 매핑된 시나리오가 있는지 확인합니다.
 *
 * @param projectName - 확인할 프로젝트 이름
 * @returns 매핑이 있으면 true, 없으면 false
 */
export const hasPowerScenarioMapping = (
  projectName: string | null | undefined
): boolean => {
  if (!projectName) return false;
  return projectName in POWER_PROJECT_SCENARIO_MAP;
};

/**
 * 현재 설정된 모든 프로젝트-시나리오 매핑을 반환합니다.
 * 디버깅 또는 관리 UI에서 사용할 수 있습니다.
 *
 * @returns 프로젝트-시나리오 매핑 객체의 복사본
 */
export const getAllPowerScenarioMappings = (): Record<string, string> => {
  return { ...POWER_PROJECT_SCENARIO_MAP };
};
