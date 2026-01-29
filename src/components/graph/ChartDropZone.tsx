/**
 * @file ChartDropZone.tsx
 *
 * @purpose
 * Drop target wrapper for GraphChart.
 * Accepts dragged metrics and calls parent callback.
 *
 * @behavior
 * - Wraps chart area as drop target
 * - Shows visual highlight on dragOver
 * - Calls onDropMetricKey callback (does NOT dispatch Redux directly)
 * - Parent (FloatingGraphWindow) handles color assignment and Redux dispatch
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ChartDropZoneProps {
  /** Callback when metric is dropped (parent handles Redux dispatch) */
  onDropMetricKey: (metricKey: string) => void;
  /** Chart content to wrap */
  children: React.ReactNode;
}

export function ChartDropZone({ onDropMetricKey, children }: ChartDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const metricKey = e.dataTransfer.getData('text/plain');
    if (metricKey) {
      onDropMetricKey(metricKey);
    }
  };

  return (
    <div
      data-testid="chart-drop-zone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative transition-all flex-1 min-h-0',
        isDragOver && 'ring-2 ring-primary ring-inset'
      )}
    >
      {children}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/5 pointer-events-none flex items-center justify-center">
          <div className="text-sm font-medium text-primary">Drop to add series</div>
        </div>
      )}
    </div>
  );
}
