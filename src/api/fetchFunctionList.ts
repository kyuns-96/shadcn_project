/**
 * @file fetchFunctionList.ts
 *
 * @purpose
 * 사용 가능한 API 함수 목록을 서버에서 가져옴니다.
 *
 * @structure
 * 1. fetchFunctionList: GET 요청으로 함수 목록 조회
 *
 * @dependencies
 * - Fetch API
 */

/**
 * API 함수 목록을 조회합니다.
 *
 * @returns 함수 목록 데이터
 * @throws HTTP 에러 또는 네트워크 에러
 */
export async function fetchFunctionList(): Promise<unknown> {
  const response = await fetch("/api/get_all_function", {
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
