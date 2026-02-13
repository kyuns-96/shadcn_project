import { describe, it, expect } from 'vitest';
import { computeDataDomain } from './computeDataDomain';
import type { GraphWindow } from '@/store/reducers/graphSlice';
import type { ChartDataPoint } from '@/hooks/useGraphData';

describe('computeDataDomain', () => {
  const makePoint = (point: Pick<ChartDataPoint, 'x' | 'y' | 'seriesId' | 'doeId'>): ChartDataPoint => ({
    ...point,
    doeLabel: point.doeId,
    color: '#2563eb',
  });

  const mockWindowState: GraphWindow = {
    id: 'test-window',
    chartType: 'scatter',
    xAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
    yAxis: { type: 'metric', key: 'Timing(ps)!WNS' },
    xRange: { min: 'auto', max: 'auto' },
    yRange: { min: 'auto', max: 'auto' },
    series: [
      { id: 'series-1', metricKey: 'Power(mW)!combinational_Total', color: '#2563eb', enabled: true, chartType: 'line' },
      { id: 'series-2', metricKey: 'Timing(ps)!WNS', color: '#dc2626', enabled: true, chartType: 'scatter' },
    ],
    position: { x: 100, y: 100 },
    size: { width: 600, height: 400 },
    isMinimized: false,
  };

  const mockDataPoints: ChartDataPoint[] = [
    makePoint({ x: 10, y: 100, seriesId: 'series-1', doeId: 'doe-1' }),
    makePoint({ x: 20, y: 200, seriesId: 'series-1', doeId: 'doe-2' }),
    makePoint({ x: 15, y: 150, seriesId: 'series-2', doeId: 'doe-1' }),
    makePoint({ x: 25, y: 250, seriesId: 'series-2', doeId: 'doe-2' }),
  ];

  it('should compute domain for numeric X axis with enabled series', () => {
    const result = computeDataDomain(mockDataPoints, mockWindowState);
    
    expect(result.hasData).toBe(true);
    expect(result.x).toEqual({ min: 10, max: 25 });
    expect(result.y).toEqual({ min: 100, max: 250 });
  });

  it('should return no data when no enabled series', () => {
    const windowWithNoSeries = {
      ...mockWindowState,
      series: mockWindowState.series.map(s => ({ ...s, enabled: false })),
    };
    
    const result = computeDataDomain(mockDataPoints, windowWithNoSeries);
    
    expect(result.hasData).toBe(false);
    expect(result.x).toBeNull();
    expect(result.y).toBeNull();
  });

  it('should return null X domain for categorical X axis', () => {
    const windowWithCategoricalX = {
      ...mockWindowState,
      xAxis: { type: 'doeMetadata' as const, key: 'label' },
    };
    
    const result = computeDataDomain(mockDataPoints, windowWithCategoricalX);
    
    expect(result.hasData).toBe(true);
    expect(result.x).toBeNull();
    expect(result.y).toEqual({ min: 100, max: 250 });
  });

  it('should use only first enabled histogram series for histogram y domain', () => {
    const histogramPoints: ChartDataPoint[] = [
      makePoint({ x: 'bin-1', y: 100, seriesId: 'series-1', doeId: 'doe-1' }),
      makePoint({ x: 'bin-2', y: 300, seriesId: 'series-1', doeId: 'doe-2' }),
      makePoint({ x: 'bin-1', y: 500, seriesId: 'series-2', doeId: 'doe-1' }),
      makePoint({ x: 'bin-2', y: 700, seriesId: 'series-2', doeId: 'doe-2' }),
    ];

    const histogramWindowState: GraphWindow = {
      ...mockWindowState,
      chartType: 'line',
      series: [
        { id: 'series-1', metricKey: 'Power(mW)!combinational_Total', color: '#2563eb', enabled: true, chartType: 'histogram' },
        { id: 'series-2', metricKey: 'Timing(ps)!WNS', color: '#dc2626', enabled: true, chartType: 'histogram' },
      ],
    };
    
    const result = computeDataDomain(histogramPoints, histogramWindowState);
    
    expect(result.hasData).toBe(true);
    expect(result.x).toBeNull();
    expect(result.y).toEqual({ min: 100, max: 300 });
  });

  it('should return null X domain for histogram mode even with numeric X axis', () => {
    const histogramModeWindow: GraphWindow = {
      ...mockWindowState,
      chartType: 'line',
      series: [
        { ...mockWindowState.series[0], chartType: 'histogram' as const },
        { ...mockWindowState.series[1], chartType: 'scatter' as const },
      ],
    };

    const result = computeDataDomain(mockDataPoints, histogramModeWindow);
    
    expect(result.hasData).toBe(true);
    expect(result.x).toBeNull();
    expect(result.y).toEqual({ min: 100, max: 200 });
  });

  it('should filter out non-finite Y values', () => {
    const pointsWithInvalid: ChartDataPoint[] = [
      makePoint({ x: 10, y: 100, seriesId: 'series-1', doeId: 'doe-1' }),
      makePoint({ x: 20, y: NaN, seriesId: 'series-1', doeId: 'doe-2' }),
      makePoint({ x: 30, y: Infinity, seriesId: 'series-1', doeId: 'doe-3' }),
      makePoint({ x: 40, y: 200, seriesId: 'series-1', doeId: 'doe-4' }),
    ];
    
    const result = computeDataDomain(pointsWithInvalid, mockWindowState);
    
    expect(result.hasData).toBe(true);
    expect(result.y).toEqual({ min: 100, max: 200 });
  });

  it('should only consider enabled series', () => {
    const windowWithOneSeries: GraphWindow = {
      ...mockWindowState,
      series: [
        { id: 'series-1', metricKey: 'Power(mW)!combinational_Total', color: '#2563eb', enabled: true, chartType: 'line' },
        { id: 'series-2', metricKey: 'Timing(ps)!WNS', color: '#dc2626', enabled: false, chartType: 'histogram' },
      ],
    };
    
    const result = computeDataDomain(mockDataPoints, windowWithOneSeries);
    
    expect(result.hasData).toBe(true);
    expect(result.y).toEqual({ min: 100, max: 200 });
  });

  it('should return no data when empty dataPoints array', () => {
    const result = computeDataDomain([], mockWindowState);
    
    expect(result.hasData).toBe(false);
    expect(result.x).toBeNull();
    expect(result.y).toBeNull();
  });

  it('should keep numeric X domain when histogram series is disabled', () => {
    const windowWithDisabledHistogram: GraphWindow = {
      ...mockWindowState,
      chartType: 'histogram',
      series: [
        { ...mockWindowState.series[0], chartType: 'line' as const, enabled: true },
        { ...mockWindowState.series[1], chartType: 'histogram' as const, enabled: false },
      ],
    };

    const result = computeDataDomain(mockDataPoints, windowWithDisabledHistogram);

    expect(result.hasData).toBe(true);
    expect(result.x).toEqual({ min: 10, max: 20 });
    expect(result.y).toEqual({ min: 100, max: 200 });
  });
});
