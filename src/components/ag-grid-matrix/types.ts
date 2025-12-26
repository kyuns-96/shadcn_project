import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from 'lucide-react'

export interface RowData {
  id: string
  rowGroup: string
  rowHeader: string
  [key: string]: string
}

export type RowHeightOption = 'compact' | 'normal' | 'comfortable'

export type TextAlignOption = 'left' | 'center' | 'right'

export interface RowHeightConfig {
  label: string
  height: number
}

export interface TextAlignConfig {
  label: string
  icon: typeof AlignLeftIcon | typeof AlignCenterIcon | typeof AlignRightIcon
}
