/**
 * @file getEconum.ts
 *
 * @purpose
 * 특정 필터 조건에 해당하는 ECO 번호 목록을 서버에서 가져옴니다.
 *
 * @structure
 * 1. fetchEconumList: POST 요청으로 ECO 번호 목록 조회
 *
 * @dependencies
 * - Fetch API
 */

/** ECO 번호 API 응답 타입 */
interface EconumListResponse {
  econum_list: string[];
}

/**
 * ECO 번호 목록을 조회합니다.
 *
 * @param projectName - 프로젝트 이름
 * @param blockName - 블록 이름
 * @param netverName - 넷버전 이름
 * @param revisionName - 리비전 이름
 * @returns ECO 번호 목록 배열
 * @throws HTTP 에러 또는 네트워크 에러
 */
export async function fetchEconumList(
  projectName: string,
  blockName: string,
  netverName: string,
  revisionName: string
): Promise<string[]> {
  const response = await fetch("/api/get_econum_list", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: projectName,
      block: blockName,
      netver: netverName,
      revision: revisionName,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: EconumListResponse = await response.json();
  return data.econum_list || [];
}

// 기존 함수명과의 호환성을 위한 alias
export const getEconum = fetchEconumList;
