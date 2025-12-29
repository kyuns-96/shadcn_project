/**
 * @file ag-grid-matrix-table/constants.ts
 *
 * @purpose
 * AG Grid 매트릭스 테이블의 상수 및 설정값을 정의합니다.
 *
 * @structure
 * 1. ROW_HEIGHT_CONFIG: 행 높이 옵션 설정
 * 2. TEXT_ALIGN_CONFIG: 텍스트 정렬 옵션 설정
 *
 * @dependencies
 * - lucide-react: 아이콘
 */

import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from "lucide-react";

export type RowHeightOption = "compact" | "normal" | "comfortable";

export const ROW_HEIGHT_CONFIG: Record<
  RowHeightOption,
  { label: string; height: number }
> = {
  compact: { label: "Compact", height: 20 },
  normal: { label: "Normal", height: 28 },
  comfortable: { label: "Comfortable", height: 36 },
};

export type TextAlignOption = "left" | "center" | "right";

export const TEXT_ALIGN_CONFIG: Record<
  TextAlignOption,
  { label: string; icon: typeof AlignLeftIcon }
> = {
  left: { label: "Left", icon: AlignLeftIcon },
  center: { label: "Center", icon: AlignCenterIcon },
  right: { label: "Right", icon: AlignRightIcon },
};
