/**
 * @file QORComparePage.tsx
 *
 * @purpose
 * QOR(Quality of Results) 비교 페이지입니다.
 * 필터 드롭다운, DoE 입력, 데이터 추가 버튼과
 * 매트릭스 테이블로 구성됩니다.
 *
 * @structure
 * 1. 필터 드롭다운 영역: 프로젝트/블록/넷버전 등 선택
 * 2. DoE 입력 및 추가 버튼
 * 3. AG Grid 매트릭스 테이블
 *
 * @dependencies
 * - @/components/ag-grid-matrix-table: 테이블 컴포넌트
 * - @/components/shadcn-studio/*: UI 컴포넌트들
 * - @/variables/useFilterDropdownConfigs: 필터 설정
 * - @/variables/defaultMatrixTemplate: 기본 템플릿
 * - @/hooks/useURLSync: URL 상태 복원
 */

import AgGridMatrixTable from "@/components/ag-grid-matrix-table";
import DatasetColumnAddButton from "@/components/shadcn-studio/button/DatasetColumnAddButton";
import useFilterDropdownConfigs from "@/variables/useFilterDropdownConfigs";
import FilterDropdownCombobox from "@/components/shadcn-studio/combobox/FilterDropdownCombobox";
import DoeNameInput from "@/components/shadcn-studio/input/DoeNameInput";
import { useEffect, useRef, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { initializeDefaultMatrixRows } from "@/variables/defaultMatrixTemplate";
import { useRestoreColumnData } from "@/hooks/useURLSync";
import AccordionOutline from "@/components/shadcn-studio/accordion/accordion-09";

const QORComparePage = () => {
  const filterDropdownConfigs = useFilterDropdownConfigs();
  const dispatch = useAppDispatch();
  const rowHeaders = useAppSelector((state) => state.matrix.rowHeaders);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only initialize template rows if the store is empty and not yet initialized
    // This prevents re-initializing when navigating back from another page
    if (!isInitialized.current && rowHeaders.length === 0) {
      initializeDefaultMatrixRows(dispatch);
      isInitialized.current = true;
    }
  }, [dispatch, rowHeaders.length]);

  // Restore column data from URL when template rows are ready
  useRestoreColumnData();

  const accordionItems = useMemo(
    () => [
      {
        title: "Select Netlist Version",
        value: "item-1",
        content: (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-fit">
                {filterDropdownConfigs.map((config, index) => (
                  <FilterDropdownCombobox
                    key={index}
                    dropdownConfigs={[config]}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 items-end">
              <DoeNameInput />
              <DatasetColumnAddButton />
            </div>
          </div>
        ),
      },
      {
        title: "Table Information",
        value: "item-2",
        content: (
          <div className="flex-1 flex flex-col overflow-hidden min-h-[400px]">
            <AgGridMatrixTable />
          </div>
        ),
      },
    ],
    [filterDropdownConfigs]
  );

  return (
    <div className="flex flex-col h-full">
      <AccordionOutline
        items={accordionItems}
        defaultValue={["item-1", "item-2"]}
        className="flex flex-col h-full gap-2"
      />
    </div>
  );
};

export default QORComparePage;
