import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { AxisConfigPanel } from './AxisConfigPanel';

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

  function openPopover(axis: 'x' | 'y') {
    const combobox = screen.getByRole('combobox', {
      name: axis === 'x' ? /x-axis/i : /y-axis/i,
    });
    fireEvent.click(combobox);
    const dialog = screen.getByRole('dialog');
    return within(dialog);
  }

  it('should render X-axis and Y-axis dropdowns', () => {
    render(<AxisConfigPanel {...defaultProps} />);
    
    expect(screen.getByRole('combobox', { name: /x-axis/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /y-axis/i })).toBeInTheDocument();
  });

  it('should show DoE metadata in X-axis dropdown', () => {
    render(<AxisConfigPanel {...defaultProps} />);

    const popover = openPopover('x');
    expect(popover.getByRole('option', { name: 'label' })).toBeInTheDocument();
    expect(popover.getByRole('option', { name: 'PROJECT_NAME' })).toBeInTheDocument();
    expect(popover.getByRole('option', { name: 'BLOCK' })).toBeInTheDocument();
  });

  it('should show metrics in X-axis dropdown', () => {
    render(<AxisConfigPanel {...defaultProps} />);

    const popover = openPopover('x');
    expect(
      popover.getByRole('option', { name: /Power.*Combinational Total/i })
    ).toBeInTheDocument();
  });

  it('should show only metrics in Y-axis dropdown', () => {
    render(<AxisConfigPanel {...defaultProps} />);

    const popover = openPopover('y');
    expect(
      popover.getByRole('option', { name: /Power.*Combinational Total/i })
    ).toBeInTheDocument();
    expect(popover.queryByRole('option', { name: 'label' })).not.toBeInTheDocument();
  });

  it('should call onXAxisChange when X-axis selection changes', () => {
    render(<AxisConfigPanel {...defaultProps} />);

    const popover = openPopover('x');
    fireEvent.click(popover.getByRole('option', { name: 'PROJECT_NAME' }));
    
    expect(defaultProps.onXAxisChange).toHaveBeenCalledWith({
      type: 'doeMetadata',
      key: 'PROJECT_NAME'
    });
  });

  it('should call onYAxisChange when Y-axis selection changes', () => {
    render(<AxisConfigPanel {...defaultProps} />);

    const popover = openPopover('y');
    fireEvent.click(popover.getByRole('option', { name: /Power.*Combinational Total/i }));
    
    expect(defaultProps.onYAxisChange).toHaveBeenCalledWith({
      type: 'metric',
      key: 'Power(mW)!combinational_Total'
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
