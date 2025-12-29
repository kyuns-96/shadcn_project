/**
 * @file getProject.ts
 *
 * @purpose
 * 프로젝트 목록을 서버에서 가져오는 API 함수입니다.
 *
 * @structure
 * 1. fetchProjectList: GET 요청으로 프로젝트 목록 조회
 *
 * @dependencies
 * - Fetch API
 */

/** 프로젝트 API 응답 타입 */
interface ProjectListResponse {
  project_list: string[];
}

/**
 * 프로젝트 목록을 서버에서 조회합니다.
 *
 * @returns 프로젝트 목록 데이터
 * @throws HTTP 에러 또는 네트워크 에러
 */
export async function fetchProjectList(): Promise<ProjectListResponse> {
  const response = await fetch("/api/get_project", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 기존 함수명과의 호환성을 위한 alias
export const getProject = fetchProjectList;
