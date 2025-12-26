import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from 'lucide-react'
import type { RowHeightOption, TextAlignOption, RowHeightConfig, TextAlignConfig } from './types'

export const ROW_HEIGHT_CONFIG: Record<RowHeightOption, RowHeightConfig> = {
  compact: { label: 'Compact', height: 20 },
  normal: { label: 'Normal', height: 28 },
  comfortable: { label: 'Comfortable', height: 36 },
}

export const TEXT_ALIGN_CONFIG: Record<TextAlignOption, TextAlignConfig> = {
  left: { label: 'Left', icon: AlignLeftIcon },
  center: { label: 'Center', icon: AlignCenterIcon },
  right: { label: 'Right', icon: AlignRightIcon },
}
