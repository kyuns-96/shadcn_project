import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ChartDropZone } from './ChartDropZone';
import { createMockDataTransfer } from '@/test/dragDropUtils';

describe('ChartDropZone', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render children', () => {
    render(
      <ChartDropZone onDropMetricKey={vi.fn()}>
        <div>Chart content</div>
      </ChartDropZone>
    );
    
    expect(screen.getByText('Chart content')).toBeInTheDocument();
  });

  it('should call onDropMetricKey when metric is dropped', () => {
    const mockOnDrop = vi.fn();
    const mockDataTransfer = createMockDataTransfer({ 'text/plain': 'Power(mW)!combinational_Total' });
    
    render(
      <ChartDropZone onDropMetricKey={mockOnDrop}>
        <div>Chart content</div>
      </ChartDropZone>
    );
    
    const dropZone = screen.getByTestId('chart-drop-zone');
    fireEvent.dragOver(dropZone, { dataTransfer: mockDataTransfer });
    fireEvent.drop(dropZone, { dataTransfer: mockDataTransfer });
    
    expect(mockOnDrop).toHaveBeenCalledWith('Power(mW)!combinational_Total');
  });

  it('should show visual highlight on dragOver', () => {
    const mockDataTransfer = createMockDataTransfer();
    
    render(
      <ChartDropZone onDropMetricKey={vi.fn()}>
        <div>Chart content</div>
      </ChartDropZone>
    );
    
    const dropZone = screen.getByTestId('chart-drop-zone');
    fireEvent.dragOver(dropZone, { dataTransfer: mockDataTransfer });
    
    expect(dropZone).toHaveClass('ring-2');
    expect(dropZone).toHaveClass('ring-primary');
  });

  it('should remove highlight on dragLeave', () => {
    const mockDataTransfer = createMockDataTransfer();
    
    render(
      <ChartDropZone onDropMetricKey={vi.fn()}>
        <div>Chart content</div>
      </ChartDropZone>
    );
    
    const dropZone = screen.getByTestId('chart-drop-zone');
    fireEvent.dragOver(dropZone, { dataTransfer: mockDataTransfer });
    expect(dropZone).toHaveClass('ring-2');
    
    fireEvent.dragLeave(dropZone);
    expect(dropZone).not.toHaveClass('ring-2');
  });

  it('should not call onDropMetricKey if no data in dataTransfer', () => {
    const mockOnDrop = vi.fn();
    const mockDataTransfer = createMockDataTransfer();
    
    render(
      <ChartDropZone onDropMetricKey={mockOnDrop}>
        <div>Chart content</div>
      </ChartDropZone>
    );
    
    const dropZone = screen.getByTestId('chart-drop-zone');
    fireEvent.drop(dropZone, { dataTransfer: mockDataTransfer });
    
    expect(mockOnDrop).not.toHaveBeenCalled();
  });
});
