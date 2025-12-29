/**
 * @file getMethodList.ts
 *
 * @purpose
 * 사용 가능한 메서드 목록을 서버에서 가져옴니다.
 *
 * @structure
 * 1. fetchMethodList: GET 요청으로 메서드 목록 조회
 *
 * @dependencies
 * - Fetch API
 */

/** 메서드 목록 API 응답 타입 */
interface MethodListResponse {
  method_list: string[];
}

/**
 * 메서드 목록을 조회합니다.
 *
 * @returns 메서드 목록 배열
 * @throws HTTP 에러 또는 네트워크 에러
 */
export async function fetchMethodList(): Promise<string[]> {
  const response = await fetch("/api/get_method_list", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: MethodListResponse = await response.json();
  return data.method_list || [];
}

// 기존 함수명과의 호환성을 위한 alias
export const getMethodList = fetchMethodList;
