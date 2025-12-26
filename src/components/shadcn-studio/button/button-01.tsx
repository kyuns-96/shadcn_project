import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import { addColumn, updateCell } from "@/store/matrixSlice";
import { getMetric } from "@/variables/getMetric";
import { fetchDataset } from "@/store/reducers/datasetReducer";

const AddButton = () => {
  const dispatch = useAppDispatch();
  const doeName = useAppSelector((state) => state.selected.doeName);
  const {
    selectedProject,
    selectedBlock,
    selectedNetver,
    selectedRevision,
    selectedEconum,
  } = useAppSelector((state) => state.selected);
  const { rowHeaders } = useAppSelector((state) => state.matrix);

  const handleAdd = () => {
    const id = `col${Date.now()}`;
    const label = doeName || id;
    dispatch(
      addColumn({
        id,
        label,
        defaultValue: "___LOADING___",
        meta: {
          PROJECT_NAME: selectedProject || undefined,
          BLOCK: selectedBlock || undefined,
          NET_VER: selectedNetver || undefined,
          REVISION: selectedRevision || undefined,
          ECO_NUM: selectedEconum || undefined,
        },
      })
    );

    dispatch(fetchDataset()).then((action) => {
      if (fetchDataset.fulfilled.match(action)) {
        console.log("Dataset:", action.payload);
        const data = (action.payload?.[doeName] ?? {}) as any;
        rowHeaders.forEach((row) => {
          const metricKey = `${row.rowGroup}!${row.label}`;
          let value = getMetric(metricKey, data);
          if (value === undefined) {
            value = "-";
          }
          dispatch(updateCell({ rowId: row.id, columnId: id, value }));
        });
      }
    });
  };

  return (
    <div className="w-auto space-y-2">
      <div className="h-5" />
      <Button className="group w-full" onClick={handleAdd}>
        Add
        <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </Button>
    </div>
  );
};

export default AddButton;
