import { CheckIcon, CopyIcon, ChevronDownIcon, Rows3Icon, PlusIcon, MinusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ROW_HEIGHT_CONFIG, TEXT_ALIGN_CONFIG } from './config'
import type { RowHeightOption, TextAlignOption } from './types'

interface GridToolbarProps {
  // Row height
  rowHeightOption: RowHeightOption
  rowHeightPopoverOpen: boolean
  setRowHeightPopoverOpen: (open: boolean) => void
  onRowHeightChange: (option: RowHeightOption) => void
  // Text alignment
  textAlignOption: TextAlignOption
  textAlignPopoverOpen: boolean
  setTextAlignPopoverOpen: (open: boolean) => void
  onTextAlignChange: (option: TextAlignOption) => void
  // Decimal places
  decimalPlaces: number
  onDecimalIncrease: () => void
  onDecimalDecrease: () => void
  // Copy
  copied: boolean
  onCopy: () => void
}

export function GridToolbar({
  rowHeightOption,
  rowHeightPopoverOpen,
  setRowHeightPopoverOpen,
  onRowHeightChange,
  textAlignOption,
  textAlignPopoverOpen,
  setTextAlignPopoverOpen,
  onTextAlignChange,
  decimalPlaces,
  onDecimalIncrease,
  onDecimalDecrease,
  copied,
  onCopy,
}: GridToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Row Height Control */}
      <Popover open={rowHeightPopoverOpen} onOpenChange={setRowHeightPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Rows3Icon className="size-4" />
            <span className="text-xs">{ROW_HEIGHT_CONFIG[rowHeightOption].label}</span>
            <ChevronDownIcon className="size-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start">
          <div className="flex flex-col">
            {(Object.keys(ROW_HEIGHT_CONFIG) as RowHeightOption[]).map((option) => (
              <button
                key={option}
                onClick={() => onRowHeightChange(option)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
                  rowHeightOption === option
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <div
                  className={cn(
                    'flex flex-col gap-0.5',
                    option === 'compact' && 'scale-75',
                    option === 'comfortable' && 'scale-110'
                  )}
                >
                  <div className="w-4 h-0.5 bg-current rounded" />
                  <div className="w-4 h-0.5 bg-current rounded" />
                  <div className="w-4 h-0.5 bg-current rounded" />
                </div>
                <span>{ROW_HEIGHT_CONFIG[option].label}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Text Alignment Control */}
      <Popover open={textAlignPopoverOpen} onOpenChange={setTextAlignPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {(() => {
              const IconComponent = TEXT_ALIGN_CONFIG[textAlignOption].icon
              return <IconComponent className="size-4" />
            })()}
            <span className="text-xs">{TEXT_ALIGN_CONFIG[textAlignOption].label}</span>
            <ChevronDownIcon className="size-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start">
          <div className="flex flex-col">
            {(Object.keys(TEXT_ALIGN_CONFIG) as TextAlignOption[]).map((option) => {
              const IconComponent = TEXT_ALIGN_CONFIG[option].icon
              return (
                <button
                  key={option}
                  onClick={() => onTextAlignChange(option)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left',
                    textAlignOption === option
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <IconComponent className="size-4" />
                  <span>{TEXT_ALIGN_CONFIG[option].label}</span>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Decimal Places Control */}
      <div className="flex items-center gap-1 border rounded-md px-2 py-1">
        <span className="text-xs text-muted-foreground mr-1">Decimal</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onDecimalDecrease}
          disabled={decimalPlaces <= 0}
          title="Decrease decimal places"
        >
          <MinusIcon className="size-3" />
        </Button>
        <span className="text-xs w-4 text-center font-medium">{decimalPlaces}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onDecimalIncrease}
          disabled={decimalPlaces >= 10}
          title="Increase decimal places"
        >
          <PlusIcon className="size-3" />
        </Button>
      </div>

      {/* Copy Button */}
      <Button
        variant="outline"
        size="sm"
        className="relative gap-2 disabled:opacity-100"
        onClick={onCopy}
        disabled={copied}
      >
        <span className={cn('transition-all', copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}>
          <CheckIcon className="size-4 stroke-green-600 dark:stroke-green-400" />
        </span>
        <span className={cn('absolute left-3 transition-all', copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100')}>
          <CopyIcon className="size-4" />
        </span>
        <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
      </Button>
    </div>
  )
}
