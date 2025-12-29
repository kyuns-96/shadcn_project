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
}

/** 데이터 로딩 중 표시되는 플레이스홀더 */
const LOADING_PLACEHOLDER = "___LOADING___";

/** 기본 매트릭스 템플릿 정의 */
export const DEFAULT_MATRIX_TEMPLATE = {
  /** 기본 열 헤더 */
  columnHeaders: [
    { id: "col-1", label: "Column 1", accessorKey: "col-1" },
    { id: "col-2", label: "Column 2", accessorKey: "col-2" },
    { id: "col-3", label: "Column 3", accessorKey: "col-3" },
  ],

  /** 기본 행 헤더 (그룹별 정렬) */
  rowHeaders: [
    {
      id: "row-1",
      label: "Row 1-1",
      rowGroup: "Group A\nSubtitle A",
      data: { "col-1": LOADING_PLACEHOLDER, "col-2": "R1C2", "col-3": "R1C3" },
    },
    {
      id: "row-2",
      label: "Row 1-2",
      rowGroup: "Group A\nSubtitle A",
      data: { "col-1": "R2C1", "col-2": LOADING_PLACEHOLDER, "col-3": "R2C3" },
    },
    {
      id: "row-3",
      label: "Row 1-3",
      rowGroup: "Group A\nSubtitle A",
      data: { "col-1": "R3C1", "col-2": "R3C2", "col-3": LOADING_PLACEHOLDER },
    },
    {
      id: "row-4",
      label: "Row 2-1",
      rowGroup: "Group B\nLine 2\nLine 3",
      data: { "col-1": "R4C1", "col-2": "R4C2", "col-3": "R4C3" },
    },
    {
      id: "row-5",
      label: "Row 2-2",
      rowGroup: "Group B\nLine 2\nLine 3",
      data: { "col-1": "R5C1", "col-2": "R5C2", "col-3": "R5C3" },
    },
    {
      id: "row-6",
      label: "Row 3-1",
      rowGroup: "Group C",
      data: { "col-1": "R6C1", "col-2": "R6C2", "col-3": "R6C3" },
    },
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
