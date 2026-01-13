/**
 * @file ag-grid-matrix-table-timing/Toolbar.tsx
 *
 * @purpose
 * Timing 전용 AG Grid 테이블의 툴바 컴포넌트입니다.
 * 행 높이, 텍스트 정렬, 소수점 자리수 조정, 클립보드 복사 기능을 제공합니다.
 *
 * @dependencies
 * - @/components/ui/*: UI 컴포넌트들
 * - lucide-react: 아이콘
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, Rows3Icon } from "lucide-react";
import { CheckIcon, CopyIcon, PlusIcon, MinusIcon } from "lucide-react";
import {
  ROW_HEIGHT_CONFIG,
  TEXT_ALIGN_CONFIG,
  type RowHeightOption,
  type TextAlignOption,
} from "./constants";

interface TimingToolbarProps {
  rowHeightOption: RowHeightOption;
  onRowHeightChange: (opt: RowHeightOption) => void;
  textAlignOption: TextAlignOption;
  onTextAlignChange: (opt: TextAlignOption) => void;
  decimalPlaces: number;
  onIncreaseDecimal: () => void;
  onDecreaseDecimal: () => void;
  copied: boolean;
  onCopy: () => void;
}

export function TimingToolbar(props: TimingToolbarProps) {
  const {
    rowHeightOption,
    onRowHeightChange,
    textAlignOption,
    onTextAlignChange,
    decimalPlaces,
    onIncreaseDecimal,
    onDecreaseDecimal,
    copied,
    onCopy,
  } = props;

  const [rowHeightPopoverOpen, setRowHeightPopoverOpen] = useState(false);
  const [textAlignPopoverOpen, setTextAlignPopoverOpen] = useState(false);

  const CurrentAlignIcon = TEXT_ALIGN_CONFIG[textAlignOption].icon;

  return (
    <div className="flex items-center gap-2">
      {/* Row Height Selector */}
      <Popover
        open={rowHeightPopoverOpen}
        onOpenChange={setRowHeightPopoverOpen}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Rows3Icon className="size-4" />
            <span className="text-xs">
              {ROW_HEIGHT_CONFIG[rowHeightOption].label}
            </span>
            <ChevronDownIcon className="size-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start">
          <div className="flex flex-col">
            {(Object.keys(ROW_HEIGHT_CONFIG) as RowHeightOption[]).map(
              (option) => (
                <button
                  key={option}
                  onClick={() => {
                    onRowHeightChange(option);
                    setRowHeightPopoverOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                    rowHeightOption === option
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-col gap-0.5",
                      option === "compact" && "scale-75",
                      option === "comfortable" && "scale-110"
                    )}
                  >
                    <div className="w-4 h-0.5 bg-current rounded" />
                    <div className="w-4 h-0.5 bg-current rounded" />
                    <div className="w-4 h-0.5 bg-current rounded" />
                  </div>
                  <span>{ROW_HEIGHT_CONFIG[option].label}</span>
                </button>
              )
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Text Align Selector */}
      <Popover
        open={textAlignPopoverOpen}
        onOpenChange={setTextAlignPopoverOpen}
      >
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CurrentAlignIcon className="size-4" />
            <span className="text-xs">
              {TEXT_ALIGN_CONFIG[textAlignOption].label}
            </span>
            <ChevronDownIcon className="size-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start">
          <div className="flex flex-col">
            {(Object.keys(TEXT_ALIGN_CONFIG) as TextAlignOption[]).map(
              (option) => {
                const IconComponent = TEXT_ALIGN_CONFIG[option].icon;
                return (
                  <button
                    key={option}
                    onClick={() => {
                      onTextAlignChange(option);
                      setTextAlignPopoverOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                      textAlignOption === option
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <IconComponent className="size-4" />
                    <span>{TEXT_ALIGN_CONFIG[option].label}</span>
                  </button>
                );
              }
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Decimal Places Control */}
      <div className="flex items-center gap-1 border rounded-md px-2 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={onDecreaseDecimal}
          disabled={decimalPlaces <= 0}
        >
          <MinusIcon className="size-3" />
        </Button>
        <span className="text-xs min-w-[24px] text-center">
          .{decimalPlaces}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={onIncreaseDecimal}
          disabled={decimalPlaces >= 10}
        >
          <PlusIcon className="size-3" />
        </Button>
      </div>

      {/* Copy to Clipboard Button */}
      <Button variant="outline" size="sm" className="gap-2" onClick={onCopy}>
        {copied ? (
          <>
            <CheckIcon className="size-4 text-green-500" />
            <span className="text-xs">Copied!</span>
          </>
        ) : (
          <>
            <CopyIcon className="size-4" />
            <span className="text-xs">Copy</span>
          </>
        )}
      </Button>
    </div>
  );
}
