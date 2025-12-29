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
