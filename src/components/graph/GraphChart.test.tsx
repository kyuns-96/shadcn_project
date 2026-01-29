import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { GraphChart } from './GraphChart';
import type { ChartDataPoint } from '@/hooks/useGraphData';
import type { Series, RangeConfig } from '@/store/reducers/graphSlice';

vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 600, height: 400 }}>{children}</div>
    ),
  };
});

afterEach(() => {
  cleanup();
});

describe('GraphChart', () => {
  const mockSeries: Series[] = [
    { id: 's_0', metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true },
  ];

  const mockXRange: RangeConfig = { min: 'auto', max: 'auto' };
  const mockYRange: RangeConfig = { min: 'auto', max: 'auto' };

  describe('empty state', () => {
    it('shows "No data" when dataPoints is empty', () => {
      render(
        <GraphChart
          chartType="line"
          dataPoints={[]}
          series={mockSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('shows "No data" when all series are disabled', () => {
      const disabledSeries: Series[] = [
        { id: 's_0', metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: false },
      ];

      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 1, y: 100, color: '#ff0000' },
      ];

      render(
        <GraphChart
          chartType="line"
          dataPoints={dataPoints}
          series={disabledSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  describe('line chart', () => {
    it('renders LineChart with data', () => {
      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 1, y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2, y: 200, color: '#ff0000' },
      ];

      const { container } = render(
        <GraphChart
          chartType="line"
          dataPoints={dataPoints}
          series={mockSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
    });

    it('renders multiple series', () => {
      const multiSeries: Series[] = [
        { id: 's_0', metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true },
        { id: 's_1', metricKey: 'Power(mW)!sequential_Total', color: '#00ff00', enabled: true },
      ];

      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 1, y: 100, color: '#ff0000' },
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_1', x: 1, y: 150, color: '#00ff00' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2, y: 200, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_1', x: 2, y: 250, color: '#00ff00' },
      ];

      const { container } = render(
        <GraphChart
          chartType="line"
          dataPoints={dataPoints}
          series={multiSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
    });
  });

  describe('scatter chart', () => {
    it('renders ScatterChart with numeric X values', () => {
      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 1.5, y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2.5, y: 200, color: '#ff0000' },
      ];

      const { container } = render(
        <GraphChart
          chartType="scatter"
          dataPoints={dataPoints}
          series={mockSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
    });

    it('filters out non-numeric X values', () => {
      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 'categorical', y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2.5, y: 200, color: '#ff0000' },
      ];

      const { container } = render(
        <GraphChart
          chartType="scatter"
          dataPoints={dataPoints}
          series={mockSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('bar chart', () => {
    it('renders BarChart with data', () => {
      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 'A', y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 'B', y: 200, color: '#ff0000' },
      ];

      const { container } = render(
        <GraphChart
          chartType="bar"
          dataPoints={dataPoints}
          series={mockSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
    });
  });

  describe('area chart', () => {
    it('renders AreaChart with data', () => {
      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 1, y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2, y: 200, color: '#ff0000' },
      ];

      const { container } = render(
        <GraphChart
          chartType="area"
          dataPoints={dataPoints}
          series={mockSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
    });
  });

  describe('histogram', () => {
    it('renders histogram with binned data', () => {
      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 1, y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2, y: 150, color: '#ff0000' },
        { doeId: 'col3', doeLabel: 'DOE_3', seriesId: 's_0', x: 3, y: 200, color: '#ff0000' },
        { doeId: 'col4', doeLabel: 'DOE_4', seriesId: 's_0', x: 4, y: 250, color: '#ff0000' },
      ];

      const { container } = render(
        <GraphChart
          chartType="histogram"
          dataPoints={dataPoints}
          series={mockSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(container.querySelector('.recharts-wrapper')).toBeInTheDocument();
    });

    it('handles empty values gracefully', () => {
      render(
        <GraphChart
          chartType="histogram"
          dataPoints={[]}
          series={mockSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('handles identical values (min === max)', () => {
      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 1, y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2, y: 100, color: '#ff0000' },
        { doeId: 'col3', doeLabel: 'DOE_3', seriesId: 's_0', x: 3, y: 100, color: '#ff0000' },
      ];

      const { container } = render(
        <GraphChart
          chartType="histogram"
          dataPoints={dataPoints}
          series={mockSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('custom ranges', () => {
    it('applies custom xRange for numeric X axis', () => {
      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 1, y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2, y: 200, color: '#ff0000' },
      ];

      const customXRange: RangeConfig = { min: 0, max: 10 };

      const { container } = render(
        <GraphChart
          chartType="line"
          dataPoints={dataPoints}
          series={mockSeries}
          xRange={customXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('applies custom yRange', () => {
      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 1, y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2, y: 200, color: '#ff0000' },
      ];

      const customYRange: RangeConfig = { min: 0, max: 500 };

      const { container } = render(
        <GraphChart
          chartType="line"
          dataPoints={dataPoints}
          series={mockSeries}
          xRange={mockXRange}
          yRange={customYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });
});
