import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { useMemo, useRef, useState } from 'react';
import { Minus, Maximize2, Copy, Download, X, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  selectGraphWindowById,
  removeGraphWindow,
  setWindowPosition,
  setWindowSize,
  bringToFront,
  toggleMinimize,
  cloneWindow,
  updateGraphWindow,
  addSeriesToWindow,
  removeSeriesFromWindow,
  toggleSeriesEnabled,
  type GraphWindow,
} from '@/store/reducers/graphSlice';
import { useGraphData } from '@/hooks/useGraphData';
import { GraphChart } from './GraphChart';
import { AxisConfigPanel } from './AxisConfigPanel';
import { RangeControls } from './RangeControls';
import { computeDataDomain } from './utils/computeDataDomain';
import { formatMetricForDisplay } from './utils/metrics';
import { exportToPng } from './utils/exportToPng';
import { SERIES_COLORS, MAX_SERIES_PER_WINDOW } from './constants';
import { Button } from '@/components/ui/button';

interface FloatingGraphWindowProps {
  windowId: string;
  windowIndex: number;
}

function computeInitialPosition(windowIndex: number): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const windowWidth = 800;
  const windowHeight = 600;
  const centerX = (viewportWidth - windowWidth) / 2;
  const centerY = (viewportHeight - windowHeight) / 2;
  const stagger = windowIndex * 30;
  return {
    x: Math.max(0, Math.min(centerX + stagger, viewportWidth - windowWidth)),
    y: Math.max(0, Math.min(centerY + stagger, viewportHeight - windowHeight)),
  };
}

export function FloatingGraphWindow({ windowId, windowIndex }: FloatingGraphWindowProps) {
  const dispatch = useAppDispatch();
  const windowState = useAppSelector(selectGraphWindowById(windowId));
  
  const dummyWindow: GraphWindow = {
    id: '',
    chartType: 'line',
    xAxis: { type: 'doeMetadata', key: 'label' },
    yAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
    series: [],
    xRange: { min: 'auto', max: 'auto' },
    yRange: { min: 'auto', max: 'auto' },
  };
  
  const dataPoints = useGraphData(windowState ?? dummyWindow);

  const [showRangeControls, setShowRangeControls] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const dataDomain = useMemo(
    () => computeDataDomain(dataPoints, windowState ?? dummyWindow, (windowState ?? dummyWindow).chartType),
    [dataPoints, windowState]
  );

  if (!windowState) return null;

  const position = windowState.position ?? computeInitialPosition(windowIndex);
  const size = windowState.size ?? { width: 800, height: 600 };
  const zIndex = windowState.zIndex ?? 1;
  const isMinimized = windowState.isMinimized ?? false;

  const handleClose = () => {
    dispatch(removeGraphWindow(windowId));
  };

  const handleMinimize = () => {
    dispatch(toggleMinimize(windowId));
  };

  const handleClone = () => {
    dispatch(cloneWindow(windowId));
  };

   const handleExport = () => {
     if (isMinimized || !chartRef.current) return;
     const now = new Date();
     const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
     const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
     const filename = `graph-window-${windowIndex + 1}-${dateStr}-${timeStr}.png`;
     exportToPng(chartRef, filename);
   };

  const handleXAxisChange = (axis: typeof windowState.xAxis) => {
    dispatch(updateGraphWindow({ 
      id: windowId, 
      changes: { xAxis: axis, xRange: { min: 'auto', max: 'auto' } } 
    }));
  };

  const handleYAxisChange = (axis: typeof windowState.yAxis) => {
    dispatch(updateGraphWindow({ id: windowId, changes: { yAxis: axis } }));
  };

   const handleQuickAddSeries = () => {
     if (windowState.series.length >= MAX_SERIES_PER_WINDOW) {
       console.warn('Max 10 series per window');
       return;
     }
     const color = SERIES_COLORS[windowState.series.length % SERIES_COLORS.length];
     dispatch(addSeriesToWindow({ 
       windowId, 
       series: { metricKey: windowState.yAxis.key, color, enabled: true } 
     }));
   };

   const handleXRangeChange = (range: typeof windowState.xRange) => {
    dispatch(updateGraphWindow({ id: windowId, changes: { xRange: range } }));
  };

  const handleYRangeChange = (range: typeof windowState.yRange) => {
    dispatch(updateGraphWindow({ id: windowId, changes: { yRange: range } }));
  };

  const handleDragStop = (_e: any, d: { x: number; y: number }) => {
    dispatch(setWindowPosition({ id: windowId, position: { x: d.x, y: d.y } }));
  };

  const handleResizeStop = (
    _e: any,
    _dir: any,
    ref: HTMLElement,
    _delta: any,
    pos: { x: number; y: number }
  ) => {
    dispatch(setWindowSize({ id: windowId, size: { width: ref.offsetWidth, height: ref.offsetHeight } }));
    dispatch(setWindowPosition({ id: windowId, position: { x: pos.x, y: pos.y } }));
  };

  const handleMouseDown = () => {
    dispatch(bringToFront(windowId));
  };

  const effectiveSize = isMinimized 
    ? { width: size.width, height: 40 }
    : size;
  const effectiveMinHeight = isMinimized ? 40 : 300;
  const enableResizing = isMinimized ? false : undefined;

  const content = (
    <Rnd
      bounds="window"
      position={position}
      size={effectiveSize}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      dragHandleClassName="window-title-bar"
      minWidth={400}
      minHeight={effectiveMinHeight}
      enableResizing={enableResizing}
      style={{ zIndex }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex h-full flex-col rounded-lg border bg-background shadow-lg" data-testid="floating-graph-window">
         <div className="window-title-bar flex items-center justify-between border-b px-4 py-2 cursor-move" data-testid="window-title-bar">
           <h3 className="text-sm font-semibold">Graph Window {windowIndex + 1}</h3>
           <div className="flex gap-1">
             <Button
               variant="ghost"
               size="icon"
               className="h-6 w-6"
               onClick={handleMinimize}
               type="button"
               aria-label={isMinimized ? 'Restore window' : 'Minimize window'}
               data-testid="minimize-button"
             >
               {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
             </Button>
             <Button
               variant="ghost"
               size="icon"
               className="h-6 w-6"
               onClick={handleClone}
               type="button"
               aria-label="Clone window"
               data-testid="clone-button"
             >
               <Copy className="h-4 w-4" />
             </Button>
             <Button
               variant="ghost"
               size="icon"
               className="h-6 w-6"
               onClick={handleExport}
               disabled={isMinimized}
               type="button"
               aria-label="Export as PNG"
               data-testid="export-button"
             >
               <Download className="h-4 w-4" />
             </Button>
             <Button
               variant="ghost"
               size="icon"
               className="h-6 w-6"
               onClick={handleClose}
               type="button"
               aria-label="Close window"
               data-testid="close-button"
             >
               <X className="h-4 w-4" />
             </Button>
           </div>
         </div>

         {!isMinimized && (
           <div className="flex flex-1 overflow-hidden">
             <div className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b p-2 space-y-2">
                <AxisConfigPanel
                  xAxis={windowState.xAxis}
                  yAxis={windowState.yAxis}
                  onXAxisChange={handleXAxisChange}
                  onYAxisChange={handleYAxisChange}
                  onQuickAddSeries={handleQuickAddSeries}
                  isQuickAddDisabled={windowState.series.length >= MAX_SERIES_PER_WINDOW}
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRangeControls(!showRangeControls)}
                    type="button"
                  >
                    {showRangeControls ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                    {showRangeControls ? 'Hide' : 'Show'} Range Controls
                  </Button>
                </div>
                {showRangeControls && (
                  <RangeControls
                    xRange={windowState.xRange}
                    yRange={windowState.yRange}
                    xAxisType={windowState.xAxis.type}
                    chartType={windowState.chartType}
                    dataDomain={dataDomain}
                    onXRangeChange={handleXRangeChange}
                    onYRangeChange={handleYRangeChange}
                  />
                )}
              </div>

                <div ref={chartRef} className="flex-1 p-4 overflow-auto flex flex-col min-h-0">
                  <GraphChart
                    chartType={windowState.chartType}
                    dataPoints={dataPoints}
                    series={windowState.series}
                    xRange={windowState.xRange}
                    yRange={windowState.yRange}
                  />
                </div>

              <div className="border-t p-2">
                <h4 className="text-sm font-medium mb-2">Active Series ({windowState.series.length}/{MAX_SERIES_PER_WINDOW})</h4>
                 {windowState.series.length === 0 ? (
                   <p className="text-sm text-muted-foreground">Use the Quick Add button above to add series</p>
                 ) : (
                   <div className="space-y-1">
                     {windowState.series.map((series) => (
                       <div key={series.id} className="flex items-center gap-2" data-testid={`series-item-${series.id}`}>
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: series.color }} 
                          aria-hidden="true" 
                        />
                        <span className="text-sm flex-1 truncate">{formatMetricForDisplay(series.metricKey)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => dispatch(toggleSeriesEnabled({ windowId, seriesId: series.id }))}
                          type="button"
                          aria-label={series.enabled ? `Hide ${formatMetricForDisplay(series.metricKey)}` : `Show ${formatMetricForDisplay(series.metricKey)}`}
                        >
                          {series.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => dispatch(removeSeriesFromWindow({ windowId, seriesId: series.id }))}
                          type="button"
                          aria-label={`Remove ${formatMetricForDisplay(series.metricKey)}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Rnd>
  );

  return createPortal(content, document.body);
}
