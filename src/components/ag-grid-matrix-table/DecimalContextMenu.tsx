import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MinusIcon, PlusIcon } from "lucide-react";

interface DecimalContextMenuProps {
  groupName: string;
  currentDecimal: number;
  onDecimalChange: (newValue: number) => void;
  position: { x: number; y: number };
  onClose: () => void;
}

export function DecimalContextMenu({
  groupName,
  currentDecimal,
  onDecimalChange,
  position,
  onClose,
}: DecimalContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="px-2 py-1.5 text-sm font-semibold">
        {groupName}
      </div>
      <div className="h-px bg-muted my-1" />
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-xs text-muted-foreground mr-2">Decimal</span>
        <div className="flex items-center gap-0.5 border rounded-md p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => onDecimalChange(currentDecimal - 1)}
            disabled={currentDecimal <= 0}
            title="Decrease decimal places"
          >
            <MinusIcon className="size-3" />
          </Button>
          <span className="text-xs font-medium w-5 text-center">
            {currentDecimal}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => onDecimalChange(currentDecimal + 1)}
            disabled={currentDecimal >= 10}
            title="Increase decimal places"
          >
            <PlusIcon className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
