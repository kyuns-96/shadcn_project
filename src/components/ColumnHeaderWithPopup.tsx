'use client'

import { useState, useRef, useEffect } from 'react'
import type { IHeaderParams } from 'ag-grid-community'
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover'

// Define the column metadata type - extend this interface to add more metadata fields
export interface ColumnMetadata {
  id: string
  label: string
  accessorKey: string
  [key: string]: unknown
}

interface ColumnHeaderWithPopupProps extends IHeaderParams {
  // The column metadata object
  columnMetadata?: ColumnMetadata
  // Optional: Custom content renderer for the popup
  // If not provided, a default placeholder will be shown
  renderMetadataContent?: (metadata: ColumnMetadata) => React.ReactNode
}

export default function ColumnHeaderWithPopup(props: ColumnHeaderWithPopupProps) {
  const { displayName, columnMetadata, renderMetadataContent } = props
  const [isOpen, setIsOpen] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle mouse enter - open popup with a small delay
  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true)
    }, 300) // 300ms delay before showing popup
  }

  // Handle mouse leave - close popup
  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setIsOpen(false)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Default metadata content renderer
  const defaultRenderMetadataContent = (metadata: ColumnMetadata) => (
    <div className="space-y-2">
      <div className="font-semibold text-sm border-b pb-2">{metadata.label}</div>
      <div className="text-xs text-muted-foreground">
        <p><span className="font-medium">ID:</span> {metadata.id}</p>
        <p><span className="font-medium">Accessor Key:</span> {metadata.accessorKey}</p>
        {/* TODO: Add your custom metadata content here */}
        <p className="mt-2 italic text-muted-foreground/70">
          Additional metadata will be displayed here...
        </p>
      </div>
    </div>
  )

  const renderContent = renderMetadataContent || defaultRenderMetadataContent

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div
          ref={headerRef}
          className="w-full h-full flex items-center justify-center cursor-default"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span className="truncate">{displayName}</span>
        </div>
      </PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={8}
        className="w-64 p-3"
        onMouseEnter={() => {
          // Keep popup open when hovering over it
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
          }
        }}
        onMouseLeave={handleMouseLeave}
      >
        {columnMetadata ? (
          renderContent(columnMetadata)
        ) : (
          <div className="text-xs text-muted-foreground italic">
            No metadata available
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
