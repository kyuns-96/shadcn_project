import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AxisConfigPanel } from './AxisConfigPanel';
import type { AxisConfig } from '@/store/reducers/graphSlice';

afterEach(() => {
  cleanup();
});

describe('AxisConfigPanel', () => {
  const defaultProps = {
    xAxis: { type: 'doeMetadata' as const, key: 'label' },
    yAxis: { type: 'metric' as const, key: 'Power(mW)!combinational_Total' },
    onXAxisChange: vi.fn(),
    onYAxisChange: vi.fn(),
    onQuickAddSeries: vi.fn(),
    isQuickAddDisabled: false,
  };

  it('should render X-axis and Y-axis dropdowns', () => {
    render(<AxisConfigPanel {...defaultProps} />);
    
    expect(screen.getByRole('combobox', { name: /x-axis/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /y-axis/i })).toBeInTheDocument();
  });

  it('should show DoE metadata in X-axis dropdown', () => {
    const { container } = render(<AxisConfigPanel {...defaultProps} />);
    
    const xAxisTrigger = container.querySelector('[aria-label="X-Axis"]') as HTMLElement;
    fireEvent.click(xAxisTrigger);
    
    expect(screen.getByText('label')).toBeInTheDocument();
    expect(screen.getByText('PROJECT_NAME')).toBeInTheDocument();
    expect(screen.getByText('BLOCK')).toBeInTheDocument();
  });

  it('should show metrics in X-axis dropdown', () => {
    const { container } = render(<AxisConfigPanel {...defaultProps} />);
    
    const xAxisTrigger = container.querySelector('[aria-label="X-Axis"]') as HTMLElement;
    fireEvent.click(xAxisTrigger);
    
    expect(screen.getByText(/Power.*Combinational Total/i)).toBeInTheDocument();
  });

  it('should show only metrics in Y-axis dropdown', () => {
    const { container } = render(<AxisConfigPanel {...defaultProps} />);
    
    const yAxisTrigger = container.querySelector('[aria-label="Y-Axis"]') as HTMLElement;
    fireEvent.click(yAxisTrigger);
    
    expect(screen.getByText(/Power.*Combinational Total/i)).toBeInTheDocument();
    expect(screen.queryByText('label')).not.toBeInTheDocument();
  });

  it('should call onXAxisChange when X-axis selection changes', () => {
    const { container } = render(<AxisConfigPanel {...defaultProps} />);
    
    const xAxisTrigger = container.querySelector('[aria-label="X-Axis"]') as HTMLElement;
    fireEvent.click(xAxisTrigger);
    
    const projectNameOption = screen.getByText('PROJECT_NAME');
    fireEvent.click(projectNameOption);
    
    expect(defaultProps.onXAxisChange).toHaveBeenCalledWith({
      type: 'doeMetadata',
      key: 'PROJECT_NAME'
    });
  });

  it('should call onYAxisChange when Y-axis selection changes', () => {
    const { container } = render(<AxisConfigPanel {...defaultProps} />);
    
    const yAxisTrigger = container.querySelector('[aria-label="Y-Axis"]') as HTMLElement;
    fireEvent.click(yAxisTrigger);
    
    const metricOption = screen.getAllByText(/Power.*Combinational Total/i)[0];
    fireEvent.click(metricOption);
    
    expect(defaultProps.onYAxisChange).toHaveBeenCalledWith({
      type: 'metric',
      key: expect.stringContaining('Power(mW)!')
    });
  });

  it('should render Quick Add button', () => {
    render(<AxisConfigPanel {...defaultProps} />);
    
    const quickAddButton = screen.getByRole('button', { name: /quick add series/i });
    expect(quickAddButton).toBeInTheDocument();
    expect(quickAddButton).not.toBeDisabled();
  });

  it('should call onQuickAddSeries when Quick Add button is clicked', () => {
    render(<AxisConfigPanel {...defaultProps} />);
    
    const quickAddButton = screen.getByRole('button', { name: /quick add series/i });
    fireEvent.click(quickAddButton);
    
    expect(defaultProps.onQuickAddSeries).toHaveBeenCalledTimes(1);
  });

  it('should disable Quick Add button when isQuickAddDisabled is true', () => {
    render(<AxisConfigPanel {...defaultProps} isQuickAddDisabled={true} />);
    
    const quickAddButton = screen.getByRole('button', { name: /quick add series/i });
    expect(quickAddButton).toBeDisabled();
  });

  it('should display current X-axis selection', () => {
    render(<AxisConfigPanel {...defaultProps} />);
    
    const xAxisTrigger = screen.getByRole('combobox', { name: /x-axis/i });
    expect(xAxisTrigger).toHaveTextContent('label');
  });

  it('should display formatted Y-axis selection', () => {
    render(<AxisConfigPanel {...defaultProps} />);
    
    const yAxisTrigger = screen.getByRole('combobox', { name: /y-axis/i });
    expect(yAxisTrigger).toHaveTextContent(/Power.*Combinational Total/i);
  });
});
