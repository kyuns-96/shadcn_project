/**
 * @file getRevision.ts
 *
 * @purpose
 * 특정 프로젝트/블록/넷버전에 해당하는 리비전 목록을 서버에서 가져옴니다.
 *
 * @structure
 * 1. fetchRevisionList: POST 요청으로 리비전 목록 조회
 *
 * @dependencies
 * - Fetch API
 */

/** 리비전 API 응답 타입 */
interface RevisionListResponse {
  revision_list: string[];
}

/**
 * 리비전 목록을 조회합니다.
 *
 * @param projectName - 프로젝트 이름
 * @param blockName - 블록 이름
 * @param netverName - 넷버전 이름
 * @returns 리비전 목록 배열
 * @throws HTTP 에러 또는 네트워크 에러
 */
export async function fetchRevisionList(
  projectName: string,
  blockName: string,
  netverName: string
): Promise<string[]> {
  const response = await fetch("/api/get_revision_list", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: projectName,
      block: blockName,
      netver: netverName,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: RevisionListResponse = await response.json();
  return data.revision_list || [];
}

// 기존 함수명과의 호환성을 위한 alias
export const getRevision = fetchRevisionList;
