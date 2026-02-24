import React, { useState, useCallback } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2Icon, GripVerticalIcon, PencilIcon } from "lucide-react";
  import FilterDropdownCombobox, {
  type DropdownConfig,
} from "@/components/shadcn-studio/combobox/FilterDropdownCombobox";
import { useSortableDoERow } from "./DoeSortableContext";
import { useAppDispatch } from "@/store";
import { renameDoEAll } from "@/store/doeThunks";

interface PowerColumnMetadataTableRowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doeGroup: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getScenarioDropdownConfig: (doeGroup: any) => DropdownConfig;
  handleDeleteDoeGroup: (id: string) => void;
  handleDoeNameClick: (id: string) => void;
}

export function PowerColumnMetadataTableRow({
  doeGroup,
  getScenarioDropdownConfig,
  handleDeleteDoeGroup,
  handleDoeNameClick,
}: PowerColumnMetadataTableRowProps) {
  const dispatch = useAppDispatch();
  const { setNodeRef, style, attributes, listeners, isDragging } =
    useSortableDoERow(doeGroup.id);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  const handleRenameStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(doeGroup.id);
    setEditingValue(doeGroup.label);
  }, [doeGroup.id, doeGroup.label]);

  const handleRenameConfirm = useCallback(() => {
    if (editingId && editingValue.trim() !== "") {
      dispatch(renameDoEAll(editingId, editingValue.trim()));
    }
    setEditingId(null);
  }, [dispatch, editingId, editingValue]);

  const handleRenameCancel = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleRenameConfirm();
      } else if (e.key === "Escape") {
        handleRenameCancel();
      }
    },
    [handleRenameConfirm, handleRenameCancel]
  );

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-testid={`doe-row-${doeGroup.id}`}
      className={isDragging ? "opacity-50 bg-muted" : ""}
    >
      <TableCell className="w-[40px] p-0 text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          data-testid={`doe-drag-handle-${doeGroup.id}`}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell className="font-medium w-[100px]">
        {editingId === doeGroup.id ? (
          <input
            autoFocus
            className="w-full bg-transparent border-b border-primary outline-none"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={handleRenameConfirm}
            onKeyDown={handleKeyDown}
            data-testid={`doe-rename-input-${doeGroup.id}`}
          />
        ) : (
          <div className="flex items-center gap-1 group">
            <span
              className="cursor-pointer hover:underline"
              onClick={() => handleDoeNameClick(doeGroup.id)}
              data-testid={`doe-name-${doeGroup.id}`}
            >
              {doeGroup.label}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRenameStart}
            >
              <PencilIcon className="h-3 w-3" />
            </Button>
          </div>
        )}
      </TableCell>
      <TableCell className="w-[80px]">{doeGroup.PROJECT_NAME || "-"}</TableCell>
      <TableCell className="w-[95px]">{doeGroup.BLOCK || "-"}</TableCell>
      <TableCell className="w-[120px]">{doeGroup.NET_VER || "-"}</TableCell>
      <TableCell className="w-[170px] truncate">
        {doeGroup.REVISION || "-"}
      </TableCell>
      <TableCell className="w-[105px]">{doeGroup.ECO_NUM || "-"}</TableCell>
      <TableCell>
        {(doeGroup.AVAILABLE_SCENARIOS?.length ?? 0) > 0 ? (
          <div className="w-[250px] [&_div]:w-full [&_button]:w-full">
            <FilterDropdownCombobox
              dropdownConfigs={[getScenarioDropdownConfig(doeGroup)]}
            />
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">No scenarios</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => handleDeleteDoeGroup(doeGroup.id)}
        >
          <Trash2Icon className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
