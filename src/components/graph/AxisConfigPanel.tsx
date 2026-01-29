/**
 * @file AxisConfigPanel.tsx
 *
 * @purpose
 * Axis configuration panel for graph windows.
 * Provides X-axis and Y-axis dropdown selectors with Quick Add button.
 *
 * @structure
 * - X-axis dropdown: DoE Metadata + Numeric Metrics (categorized)
 * - Y-axis dropdown: Numeric Metrics only
 * - Quick Add button: Adds series using current Y-axis metric
 */

import { useMemo, useState } from 'react';
import { ChevronsUpDown, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import type { AxisConfig } from '@/store/reducers/graphSlice';
import {
  DOE_METADATA_KEYS,
  getNumericMetrics,
  formatMetricForDisplay,
} from './utils/metrics';

interface AxisConfigPanelProps {
  /** Current X-axis configuration */
  xAxis: AxisConfig;
  /** Current Y-axis configuration (always type: 'metric') */
  yAxis: AxisConfig;
  /** Called when X-axis selection changes */
  onXAxisChange: (axis: AxisConfig) => void;
  /** Called when Y-axis selection changes */
  onYAxisChange: (axis: AxisConfig) => void;
  /** Called when Quick Add (+) button is clicked (adds series with yAxis.key) */
  onQuickAddSeries: () => void;
  /** Whether Quick Add is disabled (max series reached) */
  isQuickAddDisabled: boolean;
}

export function AxisConfigPanel({
  xAxis,
  yAxis,
  onXAxisChange,
  onYAxisChange,
  onQuickAddSeries,
  isQuickAddDisabled,
}: AxisConfigPanelProps) {
  const [xOpen, setXOpen] = useState(false);
  const [yOpen, setYOpen] = useState(false);

  const numericMetrics = useMemo(() => getNumericMetrics(), []);

  // Display value for X-axis (show key, format if metric)
  const xDisplayValue = xAxis.key
    ? xAxis.type === 'metric'
      ? formatMetricForDisplay(xAxis.key)
      : xAxis.key
    : 'Select X-Axis...';

  // Display value for Y-axis (always metric, so always format)
  const yDisplayValue = yAxis.key
    ? formatMetricForDisplay(yAxis.key)
    : 'Select Y-Axis...';

  return (
    <div className="flex items-center gap-4 p-4 border-b">
      {/* X-Axis Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">X-Axis:</span>
        <Popover open={xOpen} onOpenChange={setXOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-label="X-Axis"
              aria-expanded={xOpen}
              className="w-[250px] justify-between"
            >
              <span className="truncate">{xDisplayValue}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="DoE Metadata">
                  {DOE_METADATA_KEYS.map((key) => (
                    <CommandItem
                      key={key}
                      value={key}
                      onSelect={() => {
                        onXAxisChange({ type: 'doeMetadata', key });
                        setXOpen(false);
                      }}
                    >
                      {key}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Metrics">
                  {numericMetrics.map((key) => (
                    <CommandItem
                      key={key}
                      value={key}
                      onSelect={() => {
                        onXAxisChange({ type: 'metric', key });
                        setXOpen(false);
                      }}
                    >
                      {formatMetricForDisplay(key)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Y-Axis Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Y-Axis:</span>
        <Popover open={yOpen} onOpenChange={setYOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-label="Y-Axis"
              aria-expanded={yOpen}
              className="w-[250px] justify-between"
            >
              <span className="truncate">{yDisplayValue}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search metrics..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Metrics">
                  {numericMetrics.map((key) => (
                    <CommandItem
                      key={key}
                      value={key}
                      onSelect={() => {
                        onYAxisChange({ type: 'metric', key });
                        setYOpen(false);
                      }}
                    >
                      {formatMetricForDisplay(key)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick Add Button */}
      <Button
        size="icon"
        variant="outline"
        onClick={onQuickAddSeries}
        disabled={isQuickAddDisabled}
        aria-label="Quick Add Series"
        title="Add series with current Y-axis metric"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
