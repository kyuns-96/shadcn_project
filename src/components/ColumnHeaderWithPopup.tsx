"use client";

import { useRef } from "react";
import type { IHeaderParams } from "ag-grid-community";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the column metadata type - extend this interface to add more metadata fields
export interface ColumnMetadata {
  id: string;
  label: string;
  accessorKey: string;
  PROJECT_NAME?: string;
  BLOCK?: string;
  NET_VER?: string;
  REVISION?: string;
  ECO_NUM?: string;
  [key: string]: unknown;
}

interface ColumnHeaderWithPopupProps extends IHeaderParams {
  // The column metadata object
  columnMetadata?: ColumnMetadata;
  // Optional: Custom content renderer for the popup
  // If not provided, a default placeholder will be shown
  renderMetadataContent?: (metadata: ColumnMetadata) => React.ReactNode;
}

export default function ColumnHeaderWithPopup(
  props: ColumnHeaderWithPopupProps
) {
  const { displayName, columnMetadata } = props;
  const headerRef = useRef<HTMLDivElement>(null);

  // Default metadata content renderer
  const defaultRenderMetadataContent = (metadata: ColumnMetadata) => {
    const metadataFields = [
      { key: "PROJECT_NAME", label: "Project" },
      { key: "BLOCK", label: "Block" },
      { key: "NET_VER", label: "Net Version" },
      { key: "REVISION", label: "Revision" },
      { key: "ECO_NUM", label: "Eco Number" },
    ];

    const hasMetadata = metadataFields.some((field) => metadata[field.key]);

    return (
      <div className="space-y-2 max-w-xs">
        <div className="font-semibold text-sm border-b pb-2">
          {metadata.label}
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          {metadataFields.map((field) => {
            const value = metadata[field.key];
            if (!value) return null;
            return (
              <div key={field.key} className="flex justify-between gap-2">
                <span className="font-medium">{field.label}:</span>
                <span className="text-right break-words">{String(value)}</span>
              </div>
            );
          })}
          {!hasMetadata && (
            <p className="italic text-muted-foreground/70">
              No metadata available
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderContent = (columnMetadata?.renderMetadataContent ||
    defaultRenderMetadataContent) as (
    metadata: ColumnMetadata
  ) => React.ReactNode;

  if (!columnMetadata) {
    return (
      <div
        ref={headerRef}
        className="w-full h-full flex items-center justify-center cursor-default"
      >
        <span className="truncate">{displayName}</span>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={headerRef}
            className="w-full h-full flex items-center justify-center cursor-default"
          >
            <span className="truncate">{displayName}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="max-w-sm">
          {renderContent(columnMetadata)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
