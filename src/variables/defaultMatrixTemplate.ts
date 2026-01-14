/**
 * @file defaultMatrixTemplate.ts
 *
 * @purpose
 * QOR Compare 페이지의 기본 매트릭스 템플릿을 정의합니다.
 * 초기 테이블 구조(행, 열, 그룹)를 설정하는 데 사용됩니다.
 *
 * @structure
 * 1. DEFAULT_MATRIX_TEMPLATE: 기본 열/행 헤더 정의
 * 2. initializeDefaultMatrixRows: Redux store에 기본 행 추가
 *
 * @dependencies
 * - @/store/matrixSlice: addRow 액션
 * - @/store: AppDispatch 타입
 */

import { addRow } from "@/store/matrixSlice";
import type { AppDispatch } from "@/store";

/** 매트릭스 행 데이터 타입 */
interface MatrixRowDefinition {
  id: string;
  label: string;
  rowGroup: string;
  data: Record<string, string>;
  metric?: string;
}

/**
 * 매트릭스 행 객체를 생성하는 헬퍼 함수
 *
 * @param id - 행 ID
 * @param label - 행 레이블
 * @param rowGroup - 행 그룹명
 * @returns 매트릭스 행 정의 객체
 */
function createMatrixRow(
  id: string,
  label: string,
  rowGroup: string
): MatrixRowDefinition {
  return { id, label, rowGroup, data: {}, metric: `${rowGroup}!${label}` };
}

/** 기본 매트릭스 템플릿 정의 */
export const DEFAULT_MATRIX_TEMPLATE = {
  /** 기본 열 헤더 */
  columnHeaders: [],

  /** 기본 행 헤더 (그룹별 정렬) */
  rowHeaders: [
    // Area(G/C) group (6 metrics)
    createMatrixRow("row-1", "SRAM", "Area(G/C)"),
    createMatrixRow("row-2", "F/F", "Area(G/C)"),
    createMatrixRow("row-3", "Combi", "Area(G/C)"),
    createMatrixRow("row-4", "HM", "Area(G/C)"),
    createMatrixRow("row-5", "IO", "Area(G/C)"),
    createMatrixRow("row-6", "Total", "Area(G/C)"),
    // VTH_RATIO(Area) group (6 metrics) - LVT -> RVT -> HVT 순
    createMatrixRow("row-7", "LVT", "VTH_RATIO(Area)"),
    createMatrixRow("row-8", "LVT_LLP", "VTH_RATIO(Area)"),
    createMatrixRow("row-9", "RVT", "VTH_RATIO(Area)"),
    createMatrixRow("row-10", "RVT_LLP", "VTH_RATIO(Area)"),
    createMatrixRow("row-11", "HVT", "VTH_RATIO(Area)"),
    createMatrixRow("row-12", "HVT_LLP", "VTH_RATIO(Area)"),
    // Power(mW) group (4 metrics)
    createMatrixRow("row-13", "Internal", "Power(mW)"),
    createMatrixRow("row-14", "Switching", "Power(mW)"),
    createMatrixRow("row-15", "Leakage", "Power(mW)"),
    createMatrixRow("row-16", "Total", "Power(mW)"),
    // Physical Info group (4 metrics)
    createMatrixRow("row-17", "DRCs", "Physical Info"),
    createMatrixRow("row-18", "Short", "Physical Info"),
    createMatrixRow("row-19", "Total Wire Length", "Physical Info"),
    createMatrixRow("row-20", "ECO Runtime", "Physical Info"),
  ] as MatrixRowDefinition[],
};

/**
 * Redux store에 기본 매트릭스 행들을 초기화합니다.
 *
 * @param dispatch - Redux dispatch 함수
 */
export const initializeDefaultMatrixRows = (dispatch: AppDispatch): void => {
  DEFAULT_MATRIX_TEMPLATE.rowHeaders.forEach((row) => {
    dispatch(addRow(row));
  });
};
