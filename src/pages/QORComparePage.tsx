import AgGridMatrixTable from "@/components/ag-grid-matrix-table";
import AddButton from "@/components/shadcn-studio/button/button-01";
import useDropdownConfigs from "@/variables/dropdownConfig";
import Combobox from "@/components/shadcn-studio/combobox/combobox-01";
import DoeNameInput from "@/components/shadcn-studio/input/doeInput";
import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { addTemplate00Rows } from "@/variables/Template00";
import { useRestoreColumnData } from "@/hooks/useURLSync";

const QORComparePage = () => {
  const dropdownConfigs = useDropdownConfigs();
  const dispatch = useAppDispatch();
  const rowHeaders = useAppSelector((state) => state.matrix.rowHeaders);
  const columnHeaders = useAppSelector((state) => state.matrix.columnHeaders);
  const initialized = useRef(false);

  useEffect(() => {
    // Only initialize template rows if the store is empty and not yet initialized
    // This prevents re-initializing when navigating back from another page
    if (!initialized.current && rowHeaders.length === 0) {
      addTemplate00Rows(dispatch);
      initialized.current = true;
    }
  }, [dispatch, rowHeaders.length]);

  // Restore column data from URL when template rows are ready
  // This hook will fetch data for columns that were restored from URL
  useRestoreColumnData();

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
