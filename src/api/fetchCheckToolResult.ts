/**
 * @file fetchCheckToolResult.ts
 *
 * @purpose
 * FC Check Tool의 HTML 결과를 서버에서 가져옴니다.
 *
 * @structure
 * 1. CheckToolParams: 요청 파라미터 타입
 * 2. fetchCheckToolResult: POST 요청으로 HTML 결과 조회
 *
 * @dependencies
 * - Fetch API
 */

/** Check Tool 요청 파라미터 */
export interface CheckToolParams {
  project: string;
  block: string;
  netver: string;
  revision: string;
  eco_num: string;
}

/** Check Tool API 응답 타입 */
interface CheckToolResponse {
  check_tool_data: {
    html: {
      html_data: string;
    };
  };
}

/**
 * FC Check Tool 결과를 조회합니다.
 *
 * @param params - Check Tool 요청 파라미터
 * @returns HTML 형식의 결과 문자열
 * @throws HTTP 에러 또는 네트워크 에러
 */
export async function fetchCheckToolResult(
  params: CheckToolParams
): Promise<string> {
  const response = await fetch("/api/get_check_tool", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: params.project,
      block: params.block,
      netver: params.netver,
      revision: params.revision,
      econum: params.eco_num,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: CheckToolResponse = await response.json();
  return data.check_tool_data?.html?.html_data || "";
}
