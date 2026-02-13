import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { FloatingGraphWindow } from './FloatingGraphWindow';
import { renderWithProviders } from '@/test/testUtils';
import type { GraphWindow } from '@/store/reducers/graphSlice';

vi.mock('react-rnd', () => ({
  Rnd: ({
    children,
    onDragStop,
    onResizeStop,
    onMouseDown,
    position,
    size,
  }: {
    children?: ReactNode;
    onDragStop?: (e: unknown, data: { x: number; y: number }) => void;
    onResizeStop?: (
      e: unknown,
      dir: unknown,
      ref: { offsetWidth: number; offsetHeight: number },
      delta: unknown,
      position: { x: number; y: number }
    ) => void;
    onMouseDown?: () => void;
    position?: unknown;
    size?: unknown;
  }) => (
    <div
      data-testid="mock-rnd"
      data-position={JSON.stringify(position)}
      data-size={JSON.stringify(size)}
      onClick={onMouseDown}
    >
      <button
        data-testid="trigger-drag-stop"
        onClick={() => onDragStop?.(null, { x: 150, y: 250 })}
      />
      <button
        data-testid="trigger-resize-stop"
        onClick={() =>
          onResizeStop?.(
            null,
            'bottomRight',
            { offsetWidth: 700, offsetHeight: 500 },
            {},
            { x: 100, y: 100 }
          )
        }
      />
      {children}
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('FloatingGraphWindow', () => {
  const mockWindow: GraphWindow = {
    id: 'gw_0',
    chartType: 'line',
    xAxis: { type: 'doeMetadata', key: 'label' },
    yAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
    series: [
      { id: 's_0', metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true },
    ],
    xRange: { min: 'auto', max: 'auto' },
    yRange: { min: 'auto', max: 'auto' },
    zIndex: 1,
  };

  const preloadedState = {
    graph: {
      windows: [mockWindow],
      nextWindowId: 1,
      nextSeriesIdByWindow: { gw_0: 1 },
      maxZIndex: 1,
    },
    matrix: {
      columnHeaders: [],
      rowHeaders: [],
    },
    doeRegistry: {
      byId: {},
      allIds: [],
    },
    dataset: {
      data: {},
      loading: {},
      error: {},
    },
    selected: {
      selectedProject: null,
      selectedBlock: null,
      selectedNetver: null,
      selectedRevision: null,
      selectedEconum: null,
      doeName: '',
      columnPowerScenarios: {},
      revisionMode: 'POST' as const,
      isRestoringColumns: false,
    },
  };

  it('renders window with title', () => {
    renderWithProviders(<FloatingGraphWindow windowId="gw_0" windowIndex={0} />, {
      preloadedState,
    });

    expect(screen.getByText('Graph Window 1')).toBeInTheDocument();
  });

  it('renders close button', () => {
    renderWithProviders(<FloatingGraphWindow windowId="gw_0" windowIndex={0} />, {
      preloadedState,
    });

    const closeButton = screen.getByLabelText('Close window');
    expect(closeButton).toBeInTheDocument();
  });

  it('dispatches removeGraphWindow on close', () => {
    const { store } = renderWithProviders(
      <FloatingGraphWindow windowId="gw_0" windowIndex={0} />,
      { preloadedState }
    );

    const closeButton = screen.getByLabelText('Close window');
    fireEvent.click(closeButton);

    const state = store.getState();
    expect(state.graph.windows.length).toBe(0);
  });

  it('dispatches setWindowPosition on drag stop', () => {
    const { store } = renderWithProviders(
      <FloatingGraphWindow windowId="gw_0" windowIndex={0} />,
      { preloadedState }
    );

    fireEvent.click(screen.getByTestId('trigger-drag-stop'));

    const state = store.getState();

    const padding = 16;
    const rawMaxY = Math.max(0, window.innerHeight - 600);
    const usePaddingY = rawMaxY >= padding * 2 ? padding : 0;
    const expectedY = Math.min(rawMaxY - usePaddingY, Math.max(usePaddingY, 250));

    expect(state.graph.windows[0].position).toEqual({ x: 150, y: expectedY });
  });

  it('dispatches setWindowSize on resize stop', () => {
    const { store } = renderWithProviders(
      <FloatingGraphWindow windowId="gw_0" windowIndex={0} />,
      { preloadedState }
    );

    fireEvent.click(screen.getByTestId('trigger-resize-stop'));

    const state = store.getState();
    expect(state.graph.windows[0].size).toEqual({ width: 700, height: 500 });
    expect(state.graph.windows[0].position).toEqual({ x: 100, y: 100 });
  });

  it('dispatches bringToFront on mouse down', () => {
    const { store } = renderWithProviders(
      <FloatingGraphWindow windowId="gw_0" windowIndex={0} />,
      { preloadedState }
    );

    const initialZIndex = store.getState().graph.windows[0].zIndex;

    fireEvent.click(screen.getByTestId('mock-rnd'));

    const state = store.getState();
    expect(state.graph.windows[0].zIndex).toBeGreaterThan(initialZIndex!);
  });

  it('returns null when window not found', () => {
    const { container } = renderWithProviders(
      <FloatingGraphWindow windowId="nonexistent" windowIndex={0} />,
      { preloadedState }
    );

    expect(container.firstChild).toBeNull();
  });

  it('uses computed initial position when position is undefined', () => {
    const windowWithoutPosition: GraphWindow = {
      ...mockWindow,
      position: undefined,
    };

    const stateWithoutPosition = {
      ...preloadedState,
      graph: {
        ...preloadedState.graph,
        windows: [windowWithoutPosition],
      },
    };

    renderWithProviders(<FloatingGraphWindow windowId="gw_0" windowIndex={0} />, {
      preloadedState: stateWithoutPosition,
    });

    const rnd = screen.getByTestId('mock-rnd');
    const position = JSON.parse(rnd.getAttribute('data-position') || '{}');
    expect(position.x).toBeGreaterThanOrEqual(0);
    expect(position.y).toBeGreaterThanOrEqual(0);
  });

  it('uses default size when size is undefined', () => {
    const windowWithoutSize: GraphWindow = {
      ...mockWindow,
      size: undefined,
    };

    const stateWithoutSize = {
      ...preloadedState,
      graph: {
        ...preloadedState.graph,
        windows: [windowWithoutSize],
      },
    };

    renderWithProviders(<FloatingGraphWindow windowId="gw_0" windowIndex={0} />, {
      preloadedState: stateWithoutSize,
    });

    const rnd = screen.getByTestId('mock-rnd');
    const size = JSON.parse(rnd.getAttribute('data-size') || '{}');
    expect(size).toEqual({ width: 800, height: 600 });
  });
});
