import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@/test/testUtils';
import { GraphFAB } from './GraphFAB';

describe('GraphFAB', () => {

  it('renders FAB button', () => {
    renderWithProviders(<GraphFAB />);
    expect(screen.getByTestId('graph-fab')).toBeInTheDocument();
  });
  
  it('dispatches addGraphWindow on click', () => {
    const { store } = renderWithProviders(<GraphFAB />);
    expect(store.getState().graph.windows.length).toBe(0);
    
    fireEvent.click(screen.getByTestId('graph-fab'));
    
    expect(store.getState().graph.windows.length).toBe(1);
  });
  
  it('shows badge with window count', () => {
    const { store } = renderWithProviders(<GraphFAB />);
    fireEvent.click(screen.getByTestId('graph-fab'));
    const badge = screen.queryByText('1');
    expect(badge).toBeInTheDocument();
  });
  
  it('disables at max 10 windows', () => {
    const windows = Array.from({ length: 10 }, (_, i) => ({
      id: `gw_${i}`,
      chartType: 'line' as const,
      xAxis: { type: 'doeMetadata' as const, key: 'label' },
      yAxis: { type: 'metric' as const, key: 'Power(mW)!combinational_Total' },
      series: [],
      xRange: { min: 'auto' as const, max: 'auto' as const },
      yRange: { min: 'auto' as const, max: 'auto' as const },
    }));
    
    renderWithProviders(<GraphFAB />, {
      preloadedState: { graph: { windows, nextWindowId: 10, nextSeriesIdByWindow: {}, maxZIndex: 10 } }
    });
    
    expect(screen.getByTestId('graph-fab')).toBeDisabled();
  });
});
