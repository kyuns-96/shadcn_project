/**
 * @file getNetver.ts
 *
 * @purpose
 * 특정 프로젝트/블록에 해당하는 넷버전 목록을 서버에서 가져옴니다.
 *
 * @structure
 * 1. fetchNetverList: POST 요청으로 넷버전 목록 조회
 *
 * @dependencies
 * - Fetch API
 */

/** 넷버전 API 응답 타입 */
interface NetverListResponse {
  netver_list: string[];
}

/**
 * 넷버전 목록을 조회합니다.
 *
 * @param projectName - 프로젝트 이름
 * @param blockName - 블록 이름
 * @returns 넷버전 목록 배열
 * @throws HTTP 에러 또는 네트워크 에러
 */
export async function fetchNetverList(
  projectName: string,
  blockName: string
): Promise<string[]> {
  const response = await fetch("/api/get_netver_list", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: projectName,
      block: blockName,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: NetverListResponse = await response.json();
  return data.netver_list || [];
}

// 기존 함수명과의 호환성을 위한 alias
export const getNetver = fetchNetverList;
