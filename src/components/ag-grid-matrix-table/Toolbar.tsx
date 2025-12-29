import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, Rows3Icon, AlignLeftIcon } from "lucide-react";
import { CheckIcon, CopyIcon, PlusIcon, MinusIcon } from "lucide-react";
import {
  ROW_HEIGHT_CONFIG,
  TEXT_ALIGN_CONFIG,
  type RowHeightOption,
  type TextAlignOption,
} from "./constants";

interface ToolbarProps {
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

export function Toolbar(props: ToolbarProps) {
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

  const CurrentAlignIcon: typeof AlignLeftIcon =
    TEXT_ALIGN_CONFIG[textAlignOption].icon;

  return (
    <div className="flex items-center gap-2">
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
                  onClick={() => onRowHeightChange(option)}
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
                    onClick={() => onTextAlignChange(option)}
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

      <div className="flex items-center gap-1 border rounded-md px-2 py-1">
        <span className="text-xs text-muted-foreground mr-1">Decimal</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onDecreaseDecimal}
          disabled={decimalPlaces <= 0}
          title="Decrease decimal places"
        >
          <MinusIcon className="size-3" />
        </Button>
        <span className="text-xs w-4 text-center font-medium">
          {decimalPlaces}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onIncreaseDecimal}
          disabled={decimalPlaces >= 10}
          title="Increase decimal places"
        >
          <PlusIcon className="size-3" />
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="relative gap-2 disabled:opacity-100"
        onClick={onCopy}
        disabled={copied}
      >
        <span
          className={cn(
            "transition-all",
            copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
        >
          <CheckIcon className="size-4 stroke-green-600 dark:stroke-green-400" />
        </span>
        <span
          className={cn(
            "absolute left-3 transition-all",
            copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
          )}
        >
          <CopyIcon className="size-4" />
        </span>
        <span className="text-xs">{copied ? "Copied!" : "Copy"}</span>
      </Button>
    </div>
  );
}
