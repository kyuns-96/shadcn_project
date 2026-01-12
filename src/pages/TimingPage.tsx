/**
 * @file TimingPage.tsx
 *
 * @purpose
 * Timing 분석 페이지입니다.
 * PowerPage와 유사한 구조로 DoE 입력 기능을 제공하며,
 * 각 DoE별로 행이 생성되고, 컬럼은 고정된 21개 타이밍 메트릭입니다.
 *
 * @structure
 * 1. 필터 드롭다운 영역: 프로젝트/블록/넷버전 등 선택
 * 2. DoE 입력 및 추가 버튼
 * 3. DoE Timing Scenario 관리 테이블
 * 4. AG Grid Timing 매트릭스 테이블
 *
 * @dependencies
 * - @/components/ag-grid-matrix-table-timing: Timing 전용 테이블 컴포넌트
 * - @/components/TimingColumnMetadataTable: Timing Scenario 선택 UI
 * - @/components/shadcn-studio/*: UI 컴포넌트들
 * - @/variables/useFilterDropdownConfigs: 필터 설정
 */

import AgGridTimingTable from "@/components/ag-grid-matrix-table-timing";
import TimingDatasetColumnAddButton from "@/components/shadcn-studio/button/TimingDatasetColumnAddButton";
import TimingColumnMetadataTable from "@/components/TimingColumnMetadataTable";
import useFilterDropdownConfigs from "@/variables/useFilterDropdownConfigs";
import FilterDropdownCombobox from "@/components/shadcn-studio/combobox/FilterDropdownCombobox";
import DoeNameInput from "@/components/shadcn-studio/input/DoeNameInput";
import { useMemo } from "react";
import AccordionOutline from "@/components/shadcn-studio/accordion/accordion-09";

const TimingPage = () => {
  const filterDropdownConfigs = useFilterDropdownConfigs();

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
              <TimingDatasetColumnAddButton />
            </div>
          </div>
        ),
      },
      {
        title: "DoE Timing Scenario",
        value: "item-2",
        content: <TimingColumnMetadataTable />,
      },
      {
        title: "Timing Table",
        value: "item-3",
        contentClassName: "px-5 flex flex-col h-[600px]",
        content: <AgGridTimingTable />,
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

export default TimingPage;

