import AgGridMatrixTable from "@/components/ag-grid-matrix-table";
import AddButton from "@/components/shadcn-studio/button/button-01";
import useDropdownConfigs from "@/variables/dropdownConfig";
import Combobox from "@/components/shadcn-studio/combobox/combobox-01";
import DoeNameInput from "@/components/shadcn-studio/input/doeInput";
import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/store";
import { addTemplate00Rows } from "@/variables/Template00";

const QORComparePage = () => {
  const dropdownConfigs = useDropdownConfigs();
  const dispatch = useAppDispatch();
  const template00 = useRef(false);

  useEffect(() => {
    if (!template00.current) {
      addTemplate00Rows(dispatch);
      template00.current = true;
    }
  }, [dispatch]);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {dropdownConfigs.map((config, index) => (
          <Combobox key={index} dropdownConfigs={[config]} />
        ))}
        <DoeNameInput />
        <AddButton />
      </div>
      <AgGridMatrixTable />
    </>
  );
};

export default QORComparePage;
