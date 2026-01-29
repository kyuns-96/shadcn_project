import { useState, useEffect, useDeferredValue, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { ChartType, RangeConfig } from '@/store/reducers/graphSlice';
import type { DataDomain } from './utils/computeDataDomain';

interface RangeControlsProps {
  xRange: RangeConfig;
  yRange: RangeConfig;
  xAxisType: 'doeMetadata' | 'metric';
  chartType: ChartType;
  dataDomain: DataDomain;
  onXRangeChange: (range: RangeConfig) => void;
  onYRangeChange: (range: RangeConfig) => void;
}

export function RangeControls({
  xRange,
  yRange,
  xAxisType,
  chartType,
  dataDomain,
  onXRangeChange,
  onYRangeChange,
}: RangeControlsProps) {
  const [localXRange, setLocalXRange] = useState(xRange);
  const [localYRange, setLocalYRange] = useState(yRange);
  
  const lastValidXRange = useRef(xRange);
  const lastValidYRange = useRef(yRange);
  
  const deferredXRange = useDeferredValue(localXRange);
  const deferredYRange = useDeferredValue(localYRange);

  useEffect(() => {
    setLocalXRange(xRange);
    lastValidXRange.current = xRange;
  }, [xRange]);

  useEffect(() => {
    setLocalYRange(yRange);
    lastValidYRange.current = yRange;
  }, [yRange]);

  useEffect(() => {
    const isXValid = localXRange.min === 'auto' || localXRange.max === 'auto' ||
      (typeof localXRange.min === 'number' && typeof localXRange.max === 'number' && localXRange.min <= localXRange.max);
    
    if (isXValid && JSON.stringify(deferredXRange) !== JSON.stringify(lastValidXRange.current)) {
      onXRangeChange(deferredXRange);
      lastValidXRange.current = deferredXRange;
    }
  }, [deferredXRange, localXRange.min, localXRange.max, onXRangeChange]);

  useEffect(() => {
    const isYValid = localYRange.min === 'auto' || localYRange.max === 'auto' ||
      (typeof localYRange.min === 'number' && typeof localYRange.max === 'number' && localYRange.min <= localYRange.max);
    
    if (isYValid && JSON.stringify(deferredYRange) !== JSON.stringify(lastValidYRange.current)) {
      onYRangeChange(deferredYRange);
      lastValidYRange.current = deferredYRange;
    }
  }, [deferredYRange, localYRange.min, localYRange.max, onYRangeChange]);

  if (!dataDomain.hasData) {
    return (
      <div className="p-4 opacity-50">
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    );
  }

  const isXInvalid = typeof localXRange.min === 'number' && 
                     typeof localXRange.max === 'number' && 
                     localXRange.min > localXRange.max;
  
  const isYInvalid = typeof localYRange.min === 'number' && 
                     typeof localYRange.max === 'number' && 
                     localYRange.min > localYRange.max;

  const effectiveXMin = localXRange.min === 'auto' ? (dataDomain.x?.min ?? 0) : localXRange.min;
  const effectiveXMax = localXRange.max === 'auto' ? (dataDomain.x?.max ?? 100) : localXRange.max;
  const effectiveYMin = localYRange.min === 'auto' ? (dataDomain.y?.min ?? 0) : localYRange.min;
  const effectiveYMax = localYRange.max === 'auto' ? (dataDomain.y?.max ?? 100) : localYRange.max;

  const showXControls = xAxisType === 'metric' && chartType !== 'histogram' && dataDomain.x !== null;
  const yLabel = chartType === 'histogram' ? 'Value' : 'Y';

  return (
    <div className="p-4 space-y-4 border-t">
      {showXControls && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="x-min" className="w-16">X Min</Label>
            <Input
              id="x-min"
              aria-label="X minimum"
              type="number"
              value={localXRange.min === 'auto' ? '' : localXRange.min}
              placeholder={`auto (${dataDomain.x?.min.toFixed(1)})`}
              onChange={(e) => {
                const value = e.target.value === '' ? 'auto' : parseFloat(e.target.value);
                if (e.target.value !== '' && isNaN(value as number)) return;
                setLocalXRange({ ...localXRange, min: value });
              }}
              aria-invalid={isXInvalid}
              className={cn('w-32', isXInvalid && 'border-destructive')}
            />
            <Label htmlFor="x-max" className="w-16">X Max</Label>
            <Input
              id="x-max"
              aria-label="X maximum"
              type="number"
              value={localXRange.max === 'auto' ? '' : localXRange.max}
              placeholder={`auto (${dataDomain.x?.max.toFixed(1)})`}
              onChange={(e) => {
                const value = e.target.value === '' ? 'auto' : parseFloat(e.target.value);
                if (e.target.value !== '' && isNaN(value as number)) return;
                setLocalXRange({ ...localXRange, max: value });
              }}
              aria-invalid={isXInvalid}
              className={cn('w-32', isXInvalid && 'border-destructive')}
            />
          </div>
          <div data-testid="x-range-slider">
            <Slider
              value={[effectiveXMin, effectiveXMax]}
              min={dataDomain.x?.min ?? 0}
              max={dataDomain.x?.max ?? 100}
              step={0.1}
              disabled={isXInvalid}
              onValueChange={(values) => {
                if (!isXInvalid) {
                  setLocalXRange({ min: values[0], max: values[1] });
                }
              }}
              className={cn(isXInvalid && 'opacity-50 pointer-events-none')}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="y-min" className="w-16">{yLabel} Min</Label>
          <Input
            id="y-min"
            aria-label={chartType === 'histogram' ? 'Value minimum' : 'Y minimum'}
            type="number"
            value={localYRange.min === 'auto' ? '' : localYRange.min}
            placeholder={`auto (${dataDomain.y?.min.toFixed(1)})`}
            onChange={(e) => {
              const value = e.target.value === '' ? 'auto' : parseFloat(e.target.value);
              if (e.target.value !== '' && isNaN(value as number)) return;
              setLocalYRange({ ...localYRange, min: value });
            }}
            aria-invalid={isYInvalid}
            className={cn('w-32', isYInvalid && 'border-destructive')}
          />
          <Label htmlFor="y-max" className="w-16">{yLabel} Max</Label>
          <Input
            id="y-max"
            aria-label={chartType === 'histogram' ? 'Value maximum' : 'Y maximum'}
            type="number"
            value={localYRange.max === 'auto' ? '' : localYRange.max}
            placeholder={`auto (${dataDomain.y?.max.toFixed(1)})`}
            onChange={(e) => {
              const value = e.target.value === '' ? 'auto' : parseFloat(e.target.value);
              if (e.target.value !== '' && isNaN(value as number)) return;
              setLocalYRange({ ...localYRange, max: value });
            }}
            aria-invalid={isYInvalid}
            className={cn('w-32', isYInvalid && 'border-destructive')}
          />
        </div>
        <div data-testid={chartType === 'histogram' ? 'value-range-slider' : 'y-range-slider'}>
          <Slider
            value={[effectiveYMin, effectiveYMax]}
            min={dataDomain.y?.min ?? 0}
            max={dataDomain.y?.max ?? 100}
            step={0.1}
            disabled={isYInvalid}
            onValueChange={(values) => {
              if (!isYInvalid) {
                setLocalYRange({ min: values[0], max: values[1] });
              }
            }}
            className={cn(isYInvalid && 'opacity-50 pointer-events-none')}
          />
        </div>
      </div>
    </div>
  );
}
