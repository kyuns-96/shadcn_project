/**
 * @file SeriesPalette.tsx
 *
 * @purpose
 * Displays a draggable list of available numeric metrics.
 * Users can drag metrics to the chart drop zone to add series.
 *
 * @behavior
 * - Shows all numeric metrics from getNumericMetrics()
 * - Disables dragging when max series limit reached
 * - Uses native HTML5 drag-and-drop (NOT @dnd-kit)
 * - Only sets metricKey in dataTransfer (parent handles color assignment)
 */

import { useMemo } from 'react';
import { getNumericMetrics, formatMetricForDisplay } from './utils/metrics';
import { cn } from '@/lib/utils';

interface SeriesPaletteProps {
  /** Whether max series limit has been reached (disables dragging) */
  isMaxSeriesReached: boolean;
}

export function SeriesPalette({ isMaxSeriesReached }: SeriesPaletteProps) {
  const numericMetrics = useMemo(() => getNumericMetrics(), []);

  return (
    <div className="p-4 space-y-2 border-r bg-card">
      <h3 className="text-sm font-medium">Available Metrics</h3>
      <div className="space-y-1 max-h-[500px] overflow-y-auto">
         {numericMetrics.map((metricKey, index) => (
           <button
             key={metricKey}
             type="button"
             draggable={!isMaxSeriesReached}
             onDragStart={(e) => {
               if (isMaxSeriesReached) {
                 e.preventDefault();
                 return;
               }
               // ONLY set metricKey - parent handles color assignment
               e.dataTransfer.setData('text/plain', metricKey);
               e.dataTransfer.effectAllowed = 'copy';
             }}
             className={cn(
               'px-3 py-2 text-sm rounded-md border bg-card',
               !isMaxSeriesReached && 'cursor-grab hover:bg-accent active:cursor-grabbing',
               isMaxSeriesReached && 'opacity-50 cursor-not-allowed'
             )}
             title={isMaxSeriesReached ? 'Maximum 10 series per window' : 'Drag to chart to add series'}
             data-testid={`series-palette-item-${index}`}
           >
             {formatMetricForDisplay(metricKey)}
           </button>
         ))}
       </div>
    </div>
  );
}
