/**
 * @file defaultPowerScenarioMapping.ts
 *
 * @purpose
 * 프로젝트 이름에 따른 기본 Power Scenario를 결정하는 매핑 파일입니다.
 * 사용자가 컬럼을 추가할 때 초기 시나리오 선택에 사용됩니다.
 *
 * @structure
 * 1. PROJECT_SCENARIO_MAP: 프로젝트별 기본 시나리오 매핑
 * 2. getDefaultScenario: 프로젝트 이름과 가용 시나리오로 기본값 결정
 *
 * @dependencies
 * - 없음 (순수 유틸리티 함수)
 */

/**
 * 프로젝트 이름별 기본 시나리오 매핑
 *
 * 키: 프로젝트 이름 (대소문자 구분)
 * 값: 해당 프로젝트의 기본 시나리오 이름
 *
 * @example
 * "ProjectA" -> "tt_0p85v_25c"
 * "ProjectB" -> "ff_0p99v_m40c"
 */
const PROJECT_SCENARIO_MAP: Record<string, string> = {
  // 예시 매핑 - 실제 프로젝트에 맞게 수정 필요
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
  // \"mission*.tt_*\" 패턴: mission + 임의 문자(0개 이상) + . (실제 dot) + tt_ + 임의 문자(0개 이상)\n  return /^mission.*\.tt_.*/i.test(scenario);
};

/**
 * 프로젝트 이름과 가용 시나리오 목록을 기반으로 기본 시나리오를 결정합니다.
 *
 * 우선순위:
 * 1. PROJECT_SCENARIO_MAP에서 프로젝트에 매핑된 시나리오 (가용 목록에 있는 경우)
 * 2. "mission*.tt_*" 패턴을 만족하는 첫 번째 시나리오
 * 3. "input_data"가 아닌 다른 시나리오 중 첫 번째
 * 4. 빈 문자열 (가용 시나리오가 없는 경우)
 *
 * @param projectName - 프로젝트 이름 (null일 수 있음)
 * @param availableScenarios - 해당 컬럼에서 사용 가능한 시나리오 목록
 * @returns 선택된 기본 시나리오 이름
 *
 * @example
 * const scenario = getDefaultScenario("ProjectA", ["tt_0p85v_25c", "ff_0p99v_m40c"]);
 * // Returns: "tt_0p85v_25c" (if mapped and available)
 *
 * const scenario = getDefaultScenario("UnknownProject", ["mission_tt_0p85v", "input_data"]);
 * // Returns: "mission_tt_0p85v" (matches mission*.tt_* pattern)
 *
 * const scenario = getDefaultScenario("UnknownProject", ["input_data", "scenario1"]);
 * // Returns: "scenario1" (first scenario except input_data)
 */
export const getDefaultScenario = (
  projectName: string | null | undefined,
  availableScenarios: string[] = []
): string => {
  // 가용 시나리오가 없으면 빈 문자열 반환
  if (!availableScenarios || availableScenarios.length === 0) {
    return "";
  }

  // 우선순위 1: 프로젝트 이름이 있고 매핑이 존재하는 경우
  if (projectName && PROJECT_SCENARIO_MAP[projectName]) {
    const mappedScenario = PROJECT_SCENARIO_MAP[projectName];

    // 매핑된 시나리오가 가용 목록에 있는지 확인
    if (availableScenarios.includes(mappedScenario)) {
      return mappedScenario;
    }

    // 매핑된 시나리오가 없으면 경고 로그
    console.warn(
      `[defaultPowerScenarioMapping] Mapped scenario "${mappedScenario}" ` +
        `for project "${projectName}" not found in available scenarios. ` +
        `Falling back to priority 2.`
    );
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
 * 프로젝트-시나리오 매핑을 추가합니다.
 * (런타임에 동적으로 매핑을 추가해야 할 경우 사용)
 *
 * @param projectName - 프로젝트 이름
 * @param scenarioName - 기본 시나리오 이름
 */
export const addProjectScenarioMapping = (
  projectName: string,
  scenarioName: string
): void => {
  PROJECT_SCENARIO_MAP[projectName] = scenarioName;
};

/**
 * 현재 프로젝트-시나리오 매핑을 반환합니다.
 * (디버깅 또는 설정 UI용)
 *
 * @returns 현재 매핑 객체의 복사본
 */
export const getProjectScenarioMappings = (): Record<string, string> => {
  return { ...PROJECT_SCENARIO_MAP };
};
