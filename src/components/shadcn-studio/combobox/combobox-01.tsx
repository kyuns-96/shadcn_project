"use client";

import { useId, useState } from "react";
import type { FC } from "react";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";


export type DropdownConfig = {
  value: string;
  placeholder: string;
  label?: string;
  data: string[];
  set: (value: string) => void;
};

type ComboboxProps = {
  dropdownConfigs?: DropdownConfig[];
};

const Combobox: FC<ComboboxProps> = ({
  dropdownConfigs = [] as DropdownConfig[],
}) => {
  const id = useId();
  const [open, setOpen] = useState(false);

  type Item = { value: string };

  const config: DropdownConfig = dropdownConfigs[0] ?? {
    value: "",
    placeholder: "",
    label: "",
    data: [] as string[],
    set: () => {},
  };

  const { value, placeholder, label, data, set } = config;
  const displayPlaceholder = placeholder || "Select item";
  const displayLabel = label ?? displayPlaceholder;
  const items: Item[] = data.map((v) => ({ value: v }));
  return (
    <div className="w-auto max-w-xs space-y-2">
      <Label htmlFor="{id}">{displayLabel}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-[3px]"
          >
            {value ? (
              <span className="flex min-w-0 item-center gap-2">
                <span className="truncate">{value}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Select item...</span>
            )}
            <ChevronsUpDownIcon
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="boarder-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search item..." />
            <CommandList>
              <CommandEmpty>No item found.</CommandEmpty>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    set(currentValue);
                    setOpen(false);
                  }}
                >
                  {item.value}
                  {value === item.value && (
                    <CheckIcon size={16} className="ml-auto" />
                  )}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default Combobox;
