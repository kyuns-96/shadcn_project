import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SeriesPalette } from './SeriesPalette';
import { createMockDataTransfer } from '@/test/dragDropUtils';

describe('SeriesPalette', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render list of numeric metrics', () => {
    render(<SeriesPalette isMaxSeriesReached={false} />);
    
    expect(screen.getByText('Available Metrics')).toBeInTheDocument();
    expect(screen.getByText(/Power.*Combinational Total/)).toBeInTheDocument();
  });

  it('should set dataTransfer data on drag start', () => {
    const mockDataTransfer = createMockDataTransfer();
    
    render(<SeriesPalette isMaxSeriesReached={false} />);
    
    const draggableItem = screen.getByText(/Power.*Combinational Total/);
    fireEvent.dragStart(draggableItem, { dataTransfer: mockDataTransfer });
    
    expect(mockDataTransfer.getData('text/plain')).toBe('Power(mW)!combinational_Total');
  });

  it('should show disabled state when max series reached', () => {
    render(<SeriesPalette isMaxSeriesReached={true} />);
    
    const draggableItem = screen.getByText(/Power.*Combinational Total/);
    expect(draggableItem).toHaveClass('opacity-50');
    expect(draggableItem).toHaveClass('cursor-not-allowed');
  });

  it('should prevent drag when max series reached', () => {
    const mockDataTransfer = createMockDataTransfer();
    
    render(<SeriesPalette isMaxSeriesReached={true} />);
    
    const draggableItem = screen.getByText(/Power.*Combinational Total/);
    const dragEvent = new Event('dragstart', { bubbles: true, cancelable: true });
    Object.defineProperty(dragEvent, 'dataTransfer', { value: mockDataTransfer });
    
    draggableItem.dispatchEvent(dragEvent);
    
    expect(dragEvent.defaultPrevented).toBe(true);
    expect(mockDataTransfer.getData('text/plain')).toBe('');
  });
});
