/**
 * @file fetchDataset.ts
 *
 * @purpose
 * 데이터셋을 서버에서 조회하는 API 함수입니다.
 * 지정된 필터 조건과 함수 경로로 데이터를 가져옵니다.
 *
 * @structure
 * 1. fetchDataset: POST 요청으로 데이터셋 조회
 *
 * @dependencies
 * - Fetch API
 */

/** 데이터셋 조회 파라미터 */
interface DatasetParams {
  project: string;
  block: string;
  netver: string;
  revision: string;
  econum: string;
}

/**
 * 데이터셋을 조회합니다.
 *
 * @param project - 프로젝트 이름
 * @param block - 블록 이름
 * @param netver - 넷버전 이름
 * @param revision - 리비전 이름
 * @param econum - ECO 번호
 * @param apiEndpoint - API 엔드포인트 경로
 * @returns 데이터셋 데이터
 * @throws HTTP 에러 또는 네트워크 에러
 */
export async function fetchDataset(
  project: string,
  block: string,
  netver: string,
  revision: string,
  econum: string,
  apiEndpoint: string
): Promise<unknown> {
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project,
      block,
      netver,
      revision,
      econum,
    } as DatasetParams),
  });

  if (!response.ok) {
    throw new Error(`Error fetching dataset: ${response.statusText}`);
  }

  return response.json();
}
