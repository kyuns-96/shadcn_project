/**
 * @file PowerPage.tsx
 *
 * @purpose
 * Power 분석 페이지입니다.
 * QORComparePage와 동일한 DoE 입력 기능을 제공하며,
 * 각 DoE당 4개의 컬럼 (Internal, Switching, Leakage, Total)과
 * 10개의 행 (Power 메트릭)으로 구성된 매트릭스 테이블을 표시합니다.
 *
 * @structure
 * 1. 필터 드롭다운 영역: 프로젝트/블록/넷버전 등 선택
 * 2. DoE 입력 및 추가 버튼
 * 3. DoE Power Scenario 관리 테이블
 * 4. AG Grid Power 매트릭스 테이블 (10 rows × 4 columns per DoE)
 *
 * @dependencies
 * - @/components/ag-grid-matrix-table-power: Power 전용 테이블 컴포넌트
 * - @/components/shadcn-studio/*: UI 컴포넌트들
 * - @/variables/useFilterDropdownConfigs: 필터 설정
 * - @/variables/defaultPowerMatrixTemplate: 기본 템플릿
 */

import AgGridPowerTable from "@/components/ag-grid-matrix-table-power";
import PowerDatasetColumnAddButton from "@/components/shadcn-studio/button/PowerDatasetColumnAddButton";
import PowerColumnMetadataTable from "@/components/shadcn-studio/table/PowerColumnMetadataTable";
import useFilterDropdownConfigs from "@/variables/useFilterDropdownConfigs";
import FilterDropdownCombobox from "@/components/shadcn-studio/combobox/FilterDropdownCombobox";
import DoeNameInput from "@/components/shadcn-studio/input/DoeNameInput";
import { useEffect, useRef, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { initializePowerMatrixRows } from "@/variables/defaultPowerMatrixTemplate";
import { useRestoreDoeGroupData } from "@/hooks/useURLSync";
import AccordionOutline from "@/components/shadcn-studio/accordion/accordion-09";

const PowerPage = () => {
  const filterDropdownConfigs = useFilterDropdownConfigs();
  const dispatch = useAppDispatch();
  const rowHeaders = useAppSelector((state) => state.powerMatrix.rowHeaders);
  const isInitialized = useRef(false);

  // Restore DoE groups data when added from QoRComparePage
  useRestoreDoeGroupData();

  useEffect(() => {
    // Only initialize template rows if the store is empty and not yet initialized
    // This prevents re-initializing when navigating back from another page
    if (!isInitialized.current && rowHeaders.length === 0) {
      initializePowerMatrixRows(dispatch);
      isInitialized.current = true;
    }
  }, [dispatch, rowHeaders.length]);

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
              <PowerDatasetColumnAddButton />
            </div>
          </div>
        ),
      },
      {
        title: "DoE Power Scenario",
        value: "item-2",
        content: <PowerColumnMetadataTable />,
      },
      {
        title: "Power Table",
        value: "item-3",
        contentClassName: "px-5 flex flex-col h-[600px]",
        content: <AgGridPowerTable />,
      },
    ],
    [filterDropdownConfigs]
  );

  return (
    <div className="flex flex-col h-full">
      <AccordionOutline
        items={accordionItems}
        defaultValue={["item-1", "item-2", "item-3"]}
        className="flex flex-col h-full gap-2"
      />
    </div>
  );
};

export default PowerPage;
