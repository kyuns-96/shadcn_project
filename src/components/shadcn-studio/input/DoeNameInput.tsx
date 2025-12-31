/**
 * @file DoeNameInput.tsx
 *
 * @purpose
 * DoE(Design of Experiments) 이름을 입력받는 텍스트 입력 컴포넌트입니다.
 * 입력된 값은 Redux store에 저장되어 데이터셋 조회 시 식별자로 사용됩니다.
 *
 * @structure
 * 1. DoeNameInput: 라벨과 입력 필드로 구성된 컴포넌트
 *
 * @dependencies
 * - @/store: Redux hooks
 * - @/store/reducers/selectedReducer: setDoeName 액션
 * - @/components/ui/input: 입력 필드 UI
 * - @/components/ui/label: 라벨 UI
 */

import { useId, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setDoeName } from "@/store/reducers/selectedReducer";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * DoE 이름 입력 컴포넌트
 *
 * 입력값은 Redux store의 selected.doeName에 저장됩니다.
 */
const DoeNameInput = () => {
  const inputId = useId();
  const dispatch = useAppDispatch();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const columnHeaders = useAppSelector((state) => state.matrix.columnHeaders);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    dispatch(setDoeName(value));
    
    // Validate for duplicates (trim for validation only)
    const trimmedValue = value.trim();
    if (trimmedValue && columnHeaders.some(col => col.label === trimmedValue)) {
      setErrorMessage("이미 존재하는 DoE 이름입니다");
    } else {
      setErrorMessage(null);
    }
  };

  return (
    <div className="w-full max-w-xs space-y-2">
      <Label htmlFor={inputId}>DoE Name</Label>
      <Input
        id={inputId}
        type="text"
        placeholder="DoE Name"
        onChange={handleInputChange}
        aria-invalid={!!errorMessage}
      />
      <div className="text-sm text-destructive min-h-[1.25rem]">
        {errorMessage || '\u00A0'}
      </div>
    </div>
  );
};

export default DoeNameInput;
