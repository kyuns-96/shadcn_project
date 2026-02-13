import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within, waitFor } from '@testing-library/react';
import { RangeControls } from './RangeControls';
import type { DataDomain } from './utils/computeDataDomain';

describe('RangeControls', () => {
  afterEach(() => {
    cleanup();
  });

  const mockDataDomain: DataDomain = {
    x: { min: 0, max: 100 },
    y: { min: 50, max: 500 },
    hasData: true,
  };

  const defaultProps = {
    xRange: { min: 'auto' as const, max: 'auto' as const },
    yRange: { min: 'auto' as const, max: 'auto' as const },
    xAxisType: 'metric' as const,
    isHistogramMode: false,
    dataDomain: mockDataDomain,
    onXRangeChange: vi.fn(),
    onYRangeChange: vi.fn(),
  };

  it('should render X and Y range controls for scatter chart with metric X axis', () => {
    render(<RangeControls {...defaultProps} />);
    
    expect(screen.getByRole('spinbutton', { name: /x min/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /x max/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /y min/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /y max/i })).toBeInTheDocument();
  });

  it('should hide X controls for categorical X axis', () => {
    render(<RangeControls {...defaultProps} xAxisType="doeMetadata" />);
    
    expect(screen.queryByRole('spinbutton', { name: /x min/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton', { name: /x max/i })).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /y min/i })).toBeInTheDocument();
  });

  it('should hide X controls for histogram chart', () => {
    render(<RangeControls {...defaultProps} isHistogramMode />);
    
    expect(screen.queryByRole('spinbutton', { name: /x min/i })).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /value min/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /value max/i })).toBeInTheDocument();
  });

  it('should show placeholder for auto values', () => {
    render(<RangeControls {...defaultProps} />);
    
    const xMinInput = screen.getByRole('spinbutton', { name: /x min/i }) as HTMLInputElement;
    expect(xMinInput.value).toBe('');
    expect(xMinInput.placeholder).toContain('auto');
    expect(xMinInput.placeholder).toContain('0.0');
  });

  it('should show numeric values when not auto', () => {
    render(<RangeControls {...defaultProps} xRange={{ min: 10, max: 90 }} />);
    
    const xMinInput = screen.getByRole('spinbutton', { name: /x min/i }) as HTMLInputElement;
    const xMaxInput = screen.getByRole('spinbutton', { name: /x max/i }) as HTMLInputElement;
    
    expect(xMinInput.value).toBe('10');
    expect(xMaxInput.value).toBe('90');
  });

  it('should mark inputs as invalid when min > max', async () => {
    render(<RangeControls {...defaultProps} xRange={{ min: 90, max: 10 }} />);
    
    const xMinInput = screen.getByRole('spinbutton', { name: /x min/i });
    const xMaxInput = screen.getByRole('spinbutton', { name: /x max/i });
    
    expect(xMinInput).toHaveAttribute('aria-invalid', 'true');
    expect(xMaxInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('should not call onXRangeChange when range is invalid', async () => {
    const onXRangeChange = vi.fn();
    render(<RangeControls {...defaultProps} xRange={{ min: 10, max: 90 }} onXRangeChange={onXRangeChange} />);
    
    onXRangeChange.mockClear();
    
    const xMinInput = screen.getByRole('spinbutton', { name: /x min/i });
    
    fireEvent.change(xMinInput, { target: { value: '100' } });
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    expect(onXRangeChange).not.toHaveBeenCalled();
  });

  it('should convert empty input to auto', async () => {
    const onYRangeChange = vi.fn();
    render(<RangeControls {...defaultProps} yRange={{ min: 100, max: 200 }} onYRangeChange={onYRangeChange} />);
    
    const yMinInput = screen.getByRole('spinbutton', { name: /y min/i });
    fireEvent.change(yMinInput, { target: { value: '' } });

    await waitFor(() => {
      expect(onYRangeChange).toHaveBeenCalledWith(
        expect.objectContaining({ min: 'auto' })
      );
    });
  });

  it('should reject non-numeric input', () => {
    render(<RangeControls {...defaultProps} />);
    
    const xMinInput = screen.getByRole('spinbutton', { name: /x min/i }) as HTMLInputElement;
    const initialValue = xMinInput.value;
    
    fireEvent.change(xMinInput, { target: { value: 'abc' } });
    
    expect(xMinInput.value).toBe(initialValue);
  });

  it('should render sliders with data-testid', () => {
    render(<RangeControls {...defaultProps} />);
    
    expect(screen.getByTestId('x-range-slider')).toBeInTheDocument();
    expect(screen.getByTestId('y-range-slider')).toBeInTheDocument();
  });

  it('should render value-range-slider for histogram', () => {
    render(<RangeControls {...defaultProps} isHistogramMode />);
    
    expect(screen.queryByTestId('y-range-slider')).not.toBeInTheDocument();
    expect(screen.getByTestId('value-range-slider')).toBeInTheDocument();
  });

  it('should disable slider when range is invalid', () => {
    render(<RangeControls {...defaultProps} xRange={{ min: 100, max: 50 }} />);
    
    const xSliderContainer = screen.getByTestId('x-range-slider');
    const slider = xSliderContainer.querySelector('[data-radix-collection-item]');
    
    expect(slider).toHaveAttribute('data-disabled');
  });

  it('should show no data message when hasData is false', () => {
    const noDataDomain: DataDomain = { x: null, y: null, hasData: false };
    render(<RangeControls {...defaultProps} dataDomain={noDataDomain} />);
    
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('should update slider when input changes', () => {
    render(<RangeControls {...defaultProps} />);
    
    const yMinInput = screen.getByRole('spinbutton', { name: /y min/i });
    fireEvent.change(yMinInput, { target: { value: '100' } });
    
    const ySliderContainer = screen.getByTestId('y-range-slider');
    const sliderThumbs = within(ySliderContainer).getAllByRole('slider');
    
    expect(sliderThumbs).toHaveLength(2);
  });
});
