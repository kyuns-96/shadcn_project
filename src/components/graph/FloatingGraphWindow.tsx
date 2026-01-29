import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { X } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import {
  selectGraphWindowById,
  removeGraphWindow,
  setWindowPosition,
  setWindowSize,
  bringToFront,
  type GraphWindow,
} from '@/store/reducers/graphSlice';
import { useGraphData } from '@/hooks/useGraphData';
import { GraphChart } from './GraphChart';
import { Button } from '@/components/ui/button';

interface FloatingGraphWindowProps {
  windowId: string;
  windowIndex: number;
}

function computeInitialPosition(windowIndex: number): { x: number; y: number } {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const windowWidth = 600;
  const windowHeight = 400;
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

  if (!windowState) return null;

  const position = windowState.position ?? computeInitialPosition(windowIndex);
  const size = windowState.size ?? { width: 600, height: 400 };
  const zIndex = windowState.zIndex ?? 1;

  const handleClose = () => {
    dispatch(removeGraphWindow(windowId));
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

  const content = (
    <Rnd
      bounds="window"
      position={position}
      size={size}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      dragHandleClassName="window-title-bar"
      minWidth={300}
      minHeight={200}
      style={{ zIndex }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex h-full flex-col rounded-lg border bg-background shadow-lg">
        <div className="window-title-bar flex items-center justify-between border-b px-4 py-2 cursor-move">
          <h3 className="text-sm font-semibold">Graph Window {windowIndex + 1}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleClose}
            type="button"
            aria-label="Close window"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 p-4">
          <GraphChart
            chartType={windowState.chartType}
            dataPoints={dataPoints}
            series={windowState.series}
            xRange={windowState.xRange}
            yRange={windowState.yRange}
          />
        </div>
      </div>
    </Rnd>
  );

  return createPortal(content, document.body);
}
