import { addRow } from "@/store/matrixSlice";
import type { AppDispatch } from "@/store";

interface Row {
  id: string;
  label: string;
  rowGroup: string;
  data: Record<string, any>;
}

export const Template00 = {
  columnHeaders: [
    { id: "col-1", label: "Column 1", accessorKey: "col-1" },
    { id: "col-2", label: "Column 2", accessorKey: "col-2" },
    { id: "col-3", label: "Column 3", accessorKey: "col-3" },
  ],
  rowHeaders: [
    {
      id: "row-1",
      label: "Row 1-1",
      rowGroup: "Group A\nSubtitle A",
      data: { "col-1": "___LOADING___", "col-2": "R1C2", "col-3": "R1C3" },
    },
    {
      id: "row-2",
      label: "Row 1-2",
      rowGroup: "Group A\nSubtitle A",
      data: { "col-1": "R2C1", "col-2": "___LOADING___", "col-3": "R2C3" },
    },
    {
      id: "row-3",
      label: "Row 1-3",
      rowGroup: "Group A\nSubtitle A",
      data: { "col-1": "R3C1", "col-2": "R3C2", "col-3": "___LOADING___" },
    },
    {
      id: "row-4",
      label: "Row 2-1",
      rowGroup: "Group B\nLine 2\nLine 3",
      data: { "col-1": "R4C1", "col-2": "R4C2", "col-3": "R4C3" },
    },
    {
      id: "row-5",
      label: "Row 2-2",
      rowGroup: "Group B\nLine 2\nLine 3",
      data: { "col-1": "R5C1", "col-2": "R5C2", "col-3": "R5C3" },
    },
    {
      id: "row-6",
      label: "Row 3-1",
      rowGroup: "Group C",
      data: { "col-1": "R6C1", "col-2": "R6C2", "col-3": "R6C3" },
    },
  ],
};

export const addTemplate00Rows = (dispatch: AppDispatch) => {
  Template00.rowHeaders.forEach((row: Row) => {
    dispatch(addRow(row));
  });
};
