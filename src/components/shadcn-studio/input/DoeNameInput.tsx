/**
 * @file DoeNameInput.tsx
 *
 * @purpose
 * DoE(Design of Experiments) 이름을 입력받는 텍스트 입력 컴포넌트입니다.
 * 입력된 값은 Redux store에 저장되어 데이터셋 조회 시 식별자로 사용됩니다.
 * 두 페이지(PowerPage, QoRComparePage)에서 공유되는 DoE 이름 중복을 검사합니다.
 *
 * @structure
 * 1. DoeNameInput: 라벨과 입력 필드로 구성된 컴포넌트
 * 2. 검증: doeRegistry와 각 페이지의 상태에서 중복 확인
 *
 * @dependencies
 * - @/store: Redux hooks
 * - @/store/reducers/selectedReducer: setDoeName 액션
 * - @/store/doeRegistry: 공유 DoE 이름 저장소
 * - @/components/ui/input: 입력 필드 UI
 * - @/components/ui/label: 라벨 UI
 */

import { useId, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setDoeName } from "@/store/reducers/selectedReducer";
import { selectDoEExistsByName } from "@/store/doeRegistry";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * DoE 이름 입력 컴포넌트
 *
 * 입력값은 Redux store의 selected.doeName에 저장됩니다.
 * doeRegistry에서 모든 DoE 이름(PowerPage, QoRComparePage)의 중복을 검사합니다.
 */
const DoeNameInput = () => {
  const inputId = useId();
  const dispatch = useAppDispatch();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const state = useAppSelector((state) => state);
  const columnHeaders = state.matrix.columnHeaders;
  const doeGroups = state.powerMatrix.doeGroups;
  const doeRegistry = state.doeRegistry;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    dispatch(setDoeName(value));

    // Validate for duplicates (trim for validation only)
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      setErrorMessage(null);
      return;
    }

    // 1. doeRegistry에서 확인 (모든 DoE)
    const existsInRegistry = selectDoEExistsByName(
      { doeRegistry },
      trimmedValue
    );
    if (existsInRegistry) {
      setErrorMessage("이미 존재하는 DoE 이름입니다");
      return;
    }

    // 2. QoRComparePage columnHeaders에서 확인
    if (columnHeaders.some((col) => col.label === trimmedValue)) {
      setErrorMessage("이미 존재하는 DoE 이름입니다");
      return;
    }

    // 3. PowerPage doeGroups에서 확인
    if (doeGroups.some((doe) => doe.label === trimmedValue)) {
      setErrorMessage("이미 존재하는 DoE 이름입니다");
      return;
    }

    setErrorMessage(null);
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
        {errorMessage || "\u00A0"}
      </div>
    </div>
  );
};

export default DoeNameInput;
