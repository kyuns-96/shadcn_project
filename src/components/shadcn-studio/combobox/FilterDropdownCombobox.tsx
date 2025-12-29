/**
 * @file FilterDropdownCombobox.tsx
 *
 * @purpose
 * 검색 가능한 드롭다운(Combobox) 컴포넌트입니다.
 * 프로젝트, 블록, 넷버전 등 다양한 필터 선택에 범용적으로 사용됩니다.
 *
 * @structure
 * 1. DropdownConfig: 드롭다운 설정 타입 정의
 * 2. FilterDropdownCombobox: Popover + Command 조합의 검색 가능한 드롭다운 UI
 *
 * @dependencies
 * - @/components/ui/button: 트리거 버튼
 * - @/components/ui/command: 검색 및 목록 표시
 * - @/components/ui/popover: 드롭다운 팝오버
 * - lucide-react: 아이콘
 */

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

/** 드롭다운 구성을 위한 설정 타입 */
export interface DropdownConfig {
  /** 현재 선택된 값 */
  value: string;
  /** placeholder 텍스트 (라벨이 없을 때 사용) */
  placeholder: string;
  /** 드롭다운 라벨 (선택적) */
  label?: string;
  /** 선택 가능한 항목 목록 */
  data: string[];
  /** 값 변경 시 호출되는 콜백 */
  set: (value: string) => void;
}

/** FilterDropdownCombobox의 props 타입 */
interface FilterDropdownComboboxProps {
  /** 드롭다운 설정 배열 (현재는 첫 번째 요소만 사용) */
  dropdownConfigs?: DropdownConfig[];
}

/** 기본 드롭다운 설정 */
const DEFAULT_CONFIG: DropdownConfig = {
  value: "",
  placeholder: "",
  label: "",
  data: [],
  set: () => {},
};

/**
 * 검색 가능한 필터 드롭다운 컴포넌트
 *
 * @param dropdownConfigs - 드롭다운 설정 배열
 */
const FilterDropdownCombobox: FC<FilterDropdownComboboxProps> = ({
  dropdownConfigs = [],
}) => {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);

  const config: DropdownConfig = dropdownConfigs[0] ?? DEFAULT_CONFIG;

  const { value, placeholder, label, data, set: onSelect } = config;
  const displayPlaceholder = placeholder || "Select item";
  const displayLabel = label ?? displayPlaceholder;
  const dropdownItems = data.map((itemValue) => ({ value: itemValue }));

  return (
    <div className="w-auto max-w-xs space-y-2">
      <Label htmlFor={id}>{displayLabel}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
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
              {dropdownItems.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(selectedValue) => {
                    onSelect(selectedValue);
                    setIsOpen(false);
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

export default FilterDropdownCombobox;
