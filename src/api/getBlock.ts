/**
 * @file getBlock.ts
 *
 * @purpose
 * 특정 프로젝트에 속한 블록 목록을 서버에서 가져오는 API 함수입니다.
 *
 * @structure
 * 1. fetchBlockList: POST 요청으로 블록 목록 조회
 *
 * @dependencies
 * - Fetch API
 */

/** 블록 API 응답 타입 */
interface BlockListResponse {
  block_list: string[];
}

/**
 * 특정 프로젝트의 블록 목록을 조회합니다.
 *
 * @param projectName - 프로젝트 이름
 * @returns 블록 목록 배열
 * @throws HTTP 에러 또는 네트워크 에러
 */
export async function fetchBlockList(projectName: string): Promise<string[]> {
  const response = await fetch("/api/get_block_list", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ project: projectName }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: BlockListResponse = await response.json();
  return data.block_list || [];
}

// 기존 함수명과의 호환성을 위한 alias
export const getBlock = fetchBlockList;
