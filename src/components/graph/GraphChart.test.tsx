import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GraphChart } from './GraphChart';
import type { ChartDataPoint } from '@/hooks/useGraphData';
import type { Series, RangeConfig } from '@/store/reducers/graphSlice';

vi.mock('recharts', () => {
  const chartWrapper = (
    name: string,
    payloadKey: 'data' | 'domain' | 'none' = 'none'
  ) => {
    return ({
      children,
      data,
      domain,
    }: {
      children?: ReactNode;
      data?: unknown;
      domain?: unknown;
    }) => {
      const payload =
        payloadKey === 'data'
          ? JSON.stringify(data ?? null)
          : payloadKey === 'domain'
            ? JSON.stringify(domain ?? null)
            : undefined;
      return (
        <div className="recharts-wrapper" data-payload={payload} data-testid={`chart-${name}`}>
          {children}
        </div>
      );
    };
  };

  const seriesWrapper = (name: string) => {
    return ({ data, dataKey }: { data?: unknown; dataKey?: string }) => (
      <div
        data-payload={JSON.stringify(data ?? null)}
        data-testid={`series-${name}-${dataKey ?? 'no-key'}`}
      />
    );
  };

  return {
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 600, height: 400 }}>{children}</div>
    ),
    LineChart: chartWrapper('line', 'data'),
    BarChart: chartWrapper('bar', 'data'),
    AreaChart: chartWrapper('area', 'data'),
    ScatterChart: chartWrapper('scatter'),
    ComposedChart: chartWrapper('composed', 'data'),
    Line: seriesWrapper('line'),
    Bar: seriesWrapper('bar'),
    Area: seriesWrapper('area'),
    Scatter: seriesWrapper('scatter'),
    XAxis: chartWrapper('x-axis', 'domain'),
    YAxis: chartWrapper('y-axis', 'domain'),
    CartesianGrid: chartWrapper('grid'),
    Tooltip: chartWrapper('tooltip'),
  };
});

afterEach(() => {
  cleanup();
});

describe('GraphChart', () => {
  const mockSeries: Series[] = [
    { id: 's_0', metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true, chartType: 'line' },
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
        { id: 's_0', metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: false, chartType: 'line' },
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
      expect(container.querySelector('[data-testid="chart-composed"]')).toBeInTheDocument();
    });

    it('renders multiple series', () => {
      const multiSeries: Series[] = [
        { id: 's_0', metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true, chartType: 'line' },
        { id: 's_1', metricKey: 'Power(mW)!sequential_Total', color: '#00ff00', enabled: true, chartType: 'line' },
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
      expect(container.querySelector('[data-testid="chart-composed"]')).toBeInTheDocument();
    });
  });

  describe('scatter chart', () => {
    const scatterSeries: Series[] = [
      {
        id: 's_0',
        metricKey: 'Power(mW)!combinational_Total',
        color: '#ff0000',
        enabled: true,
        chartType: 'scatter',
      },
    ];

    it('renders ScatterChart with numeric X values', () => {
      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 1.5, y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2.5, y: 200, color: '#ff0000' },
      ];

      const { container } = render(
        <GraphChart
          chartType="scatter"
          dataPoints={dataPoints}
          series={scatterSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="chart-scatter"]')).toBeInTheDocument();
    });

    it('filters out non-numeric X values', () => {
      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 'categorical', y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2.5, y: 200, color: '#ff0000' },
      ];

      render(
        <GraphChart
          chartType="scatter"
          dataPoints={dataPoints}
          series={scatterSeries}
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
      expect(container.querySelector('[data-testid="chart-composed"]')).toBeInTheDocument();
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
      expect(container.querySelector('[data-testid="chart-composed"]')).toBeInTheDocument();
    });
  });

  describe('histogram', () => {
    const histogramSeries: Series[] = [
      {
        id: 's_0',
        metricKey: 'Power(mW)!combinational_Total',
        color: '#ff0000',
        enabled: true,
        chartType: 'histogram',
      },
    ];

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
          series={histogramSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="chart-bar"]')).toBeInTheDocument();
    });

    it('handles empty values gracefully', () => {
      render(
        <GraphChart
          chartType="histogram"
          dataPoints={[]}
          series={histogramSeries}
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

      render(
        <GraphChart
          chartType="histogram"
          dataPoints={dataPoints}
          series={histogramSeries}
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

      render(
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

      render(
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

  describe('per-series chart types', () => {
    it('renders mixed line, bar, and area series in one composed chart', () => {
      const mixedSeries: Series[] = [
        {
          id: 's_line',
          metricKey: 'Power(mW)!combinational_Total',
          color: '#ff0000',
          enabled: true,
          chartType: 'line',
        },
        {
          id: 's_bar',
          metricKey: 'Power(mW)!sequential_Total',
          color: '#00ff00',
          enabled: true,
          chartType: 'bar',
        },
        {
          id: 's_area',
          metricKey: 'Power(mW)!leakage_Total',
          color: '#0000ff',
          enabled: true,
          chartType: 'area',
        },
      ];

      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_line', x: 1, y: 100, color: '#ff0000' },
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_bar', x: 1, y: 110, color: '#00ff00' },
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_area', x: 1, y: 120, color: '#0000ff' },
      ];

      render(
        <GraphChart
          chartType="line"
          dataPoints={dataPoints}
          series={mixedSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('chart-composed')).toBeInTheDocument();
      expect(screen.getByTestId('series-line-s_line')).toBeInTheDocument();
      expect(screen.getByTestId('series-bar-s_bar')).toBeInTheDocument();
      expect(screen.getByTestId('series-area-s_area')).toBeInTheDocument();
    });

    it('filters non-numeric X points for scatter series', () => {
      const scatterSeries: Series[] = [
        {
          id: 's_0',
          metricKey: 'Power(mW)!combinational_Total',
          color: '#ff0000',
          enabled: true,
          chartType: 'scatter',
        },
      ];

      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_0', x: 'categorical', y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_0', x: 2.5, y: 200, color: '#ff0000' },
      ];

      render(
        <GraphChart
          chartType="line"
          dataPoints={dataPoints}
          series={scatterSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      const scatterPayload = screen.getByTestId('series-scatter-no-key').getAttribute('data-payload');
      expect(scatterPayload).toContain('"x":2.5');
      expect(scatterPayload).not.toContain('categorical');
    });

    it('uses first enabled histogram series to lock histogram mode', () => {
      const histogramSeries: Series[] = [
        {
          id: 's_line',
          metricKey: 'Power(mW)!combinational_Total',
          color: '#ff0000',
          enabled: true,
          chartType: 'line',
        },
        {
          id: 's_hist',
          metricKey: 'Power(mW)!sequential_Total',
          color: '#00ff00',
          enabled: true,
          chartType: 'histogram',
        },
      ];

      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_line', x: 1, y: 1, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_line', x: 2, y: 2, color: '#ff0000' },
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_hist', x: 1, y: 100, color: '#00ff00' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_hist', x: 2, y: 200, color: '#00ff00' },
      ];

      render(
        <GraphChart
          chartType="line"
          dataPoints={dataPoints}
          series={histogramSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('chart-bar')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-composed')).not.toBeInTheDocument();
      expect(screen.getByTestId('series-bar-count')).toBeInTheDocument();
    });

    it('keeps histogram precedence over scatter regardless of series order', () => {
      const mixedSpecialSeries: Series[] = [
        {
          id: 's_scatter',
          metricKey: 'Power(mW)!combinational_Total',
          color: '#ff0000',
          enabled: true,
          chartType: 'scatter',
        },
        {
          id: 's_hist',
          metricKey: 'Power(mW)!sequential_Total',
          color: '#00ff00',
          enabled: true,
          chartType: 'histogram',
        },
      ];

      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_scatter', x: 1, y: 5, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_scatter', x: 2, y: 10, color: '#ff0000' },
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_hist', x: 1, y: 100, color: '#00ff00' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_hist', x: 2, y: 200, color: '#00ff00' },
      ];

      render(
        <GraphChart
          chartType="line"
          dataPoints={dataPoints}
          series={mixedSpecialSeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('chart-bar')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-scatter')).not.toBeInTheDocument();
      expect(screen.getByTestId('series-bar-count')).toBeInTheDocument();
    });

    it('does not let global chartType prop override per-series mode selection', () => {
      const lineOnlySeries: Series[] = [
        {
          id: 's_line',
          metricKey: 'Power(mW)!combinational_Total',
          color: '#ff0000',
          enabled: true,
          chartType: 'line',
        },
      ];

      const dataPoints: ChartDataPoint[] = [
        { doeId: 'col1', doeLabel: 'DOE_1', seriesId: 's_line', x: 1, y: 100, color: '#ff0000' },
        { doeId: 'col2', doeLabel: 'DOE_2', seriesId: 's_line', x: 2, y: 200, color: '#ff0000' },
      ];

      render(
        <GraphChart
          chartType="scatter"
          dataPoints={dataPoints}
          series={lineOnlySeries}
          xRange={mockXRange}
          yRange={mockYRange}
        />
      );

      expect(screen.getByTestId('chart-composed')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-scatter')).not.toBeInTheDocument();
    });
  });
});
