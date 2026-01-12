/**
 * @file useFetchTimingScenarioList.ts
 *
 * @purpose
 * DoE 데이터셋에서 사용 가능한 Timing Scenario 목록을 fetch하는 커스텀 훅입니다.
 *
 * @usage
 * const { scenarios, loading, error } = useFetchTimingScenarioList(doeLabel, dataset);
 *
 * @dependencies
 * - @/variables/timingScenarioExtractor: timing_scenario 추출 함수
 * - React hooks: useState, useEffect
 */

import { useEffect, useState } from "react";
import { extractAvailableTimingScenarios } from "@/variables/timingScenarioExtractor";

interface UseFetchTimingScenarioListResult {
  scenarios: string[];
  loading: boolean;
  error: string | null;
}

/**
 * DoE 데이터셋에서 사용 가능한 Timing Scenario 목록을 추출합니다.
 *
 * @param doeLabel - DoE 라벨 (예: "DoE-001")
 * @param dataset - DoE 데이터셋 객체 (선택사항, 없으면 로딩으로 간주)
 * @returns { scenarios, loading, error }
 *
 * @example
 * const { scenarios, loading, error } = useFetchTimingScenarioList("DoE-001", datasetPayload);
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * return <select>{scenarios.map(s => <option key={s}>{s}</option>)}</select>;
 */
export const useFetchTimingScenarioList = (
  doeLabel: string,
  dataset?: Record<string, unknown>
): UseFetchTimingScenarioListResult => {
  const [scenarios, setScenarios] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doeLabel || !dataset) {
      setScenarios([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // timing_scenario 추출
      const availableScenarios = extractAvailableTimingScenarios(dataset);
      setScenarios(availableScenarios);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error(
        `[useFetchTimingScenarioList] Error extracting timing scenarios for ${doeLabel}:`,
        err
      );
      setError(errorMessage);
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  }, [doeLabel, dataset]);

  return { scenarios, loading, error };
};
