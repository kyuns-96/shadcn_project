import { describe, it, expect } from 'vitest';
import { computeDataDomain } from './computeDataDomain';
import type { GraphWindow } from '@/store/reducers/graphSlice';
import type { ChartDataPoint } from '@/hooks/useGraphData';

describe('computeDataDomain', () => {
  const mockWindowState: GraphWindow = {
    id: 'test-window',
    chartType: 'scatter',
    xAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
    yAxis: { type: 'metric', key: 'Timing(ps)!WNS' },
    xRange: { min: 'auto', max: 'auto' },
    yRange: { min: 'auto', max: 'auto' },
    series: [
      { id: 'series-1', metricKey: 'Power(mW)!combinational_Total', color: '#2563eb', enabled: true },
      { id: 'series-2', metricKey: 'Timing(ps)!WNS', color: '#dc2626', enabled: true },
    ],
    position: { x: 100, y: 100 },
    size: { width: 600, height: 400 },
    isMinimized: false,
  };

  const mockDataPoints: ChartDataPoint[] = [
    { x: 10, y: 100, seriesId: 'series-1', doeId: 'doe-1' },
    { x: 20, y: 200, seriesId: 'series-1', doeId: 'doe-2' },
    { x: 15, y: 150, seriesId: 'series-2', doeId: 'doe-1' },
    { x: 25, y: 250, seriesId: 'series-2', doeId: 'doe-2' },
  ];

  it('should compute domain for numeric X axis with enabled series', () => {
    const result = computeDataDomain(mockDataPoints, mockWindowState, 'scatter');
    
    expect(result.hasData).toBe(true);
    expect(result.x).toEqual({ min: 10, max: 25 });
    expect(result.y).toEqual({ min: 100, max: 250 });
  });

  it('should return no data when no enabled series', () => {
    const windowWithNoSeries = {
      ...mockWindowState,
      series: mockWindowState.series.map(s => ({ ...s, enabled: false })),
    };
    
    const result = computeDataDomain(mockDataPoints, windowWithNoSeries, 'scatter');
    
    expect(result.hasData).toBe(false);
    expect(result.x).toBeNull();
    expect(result.y).toBeNull();
  });

  it('should return null X domain for categorical X axis', () => {
    const windowWithCategoricalX = {
      ...mockWindowState,
      xAxis: { type: 'doeMetadata' as const, key: 'label' },
    };
    
    const result = computeDataDomain(mockDataPoints, windowWithCategoricalX, 'scatter');
    
    expect(result.hasData).toBe(true);
    expect(result.x).toBeNull();
    expect(result.y).toEqual({ min: 100, max: 250 });
  });

  it('should use only first enabled series for histogram', () => {
    const histogramPoints: ChartDataPoint[] = [
      { x: 'bin-1', y: 100, seriesId: 'series-1', doeId: 'doe-1' },
      { x: 'bin-2', y: 300, seriesId: 'series-1', doeId: 'doe-2' },
      { x: 'bin-1', y: 500, seriesId: 'series-2', doeId: 'doe-1' },
      { x: 'bin-2', y: 700, seriesId: 'series-2', doeId: 'doe-2' },
    ];
    
    const result = computeDataDomain(histogramPoints, mockWindowState, 'histogram');
    
    expect(result.hasData).toBe(true);
    expect(result.x).toBeNull();
    expect(result.y).toEqual({ min: 100, max: 300 });
  });

  it('should return null X domain for histogram even with numeric X axis', () => {
    const result = computeDataDomain(mockDataPoints, mockWindowState, 'histogram');
    
    expect(result.hasData).toBe(true);
    expect(result.x).toBeNull();
    expect(result.y).toEqual({ min: 100, max: 200 });
  });

  it('should filter out non-finite Y values', () => {
    const pointsWithInvalid: ChartDataPoint[] = [
      { x: 10, y: 100, seriesId: 'series-1', doeId: 'doe-1' },
      { x: 20, y: NaN, seriesId: 'series-1', doeId: 'doe-2' },
      { x: 30, y: Infinity, seriesId: 'series-1', doeId: 'doe-3' },
      { x: 40, y: 200, seriesId: 'series-1', doeId: 'doe-4' },
    ];
    
    const result = computeDataDomain(pointsWithInvalid, mockWindowState, 'scatter');
    
    expect(result.hasData).toBe(true);
    expect(result.y).toEqual({ min: 100, max: 200 });
  });

  it('should only consider enabled series', () => {
    const windowWithOneSeries = {
      ...mockWindowState,
      series: [
        { id: 'series-1', metricKey: 'Power(mW)!combinational_Total', color: '#2563eb', enabled: true },
        { id: 'series-2', metricKey: 'Timing(ps)!WNS', color: '#dc2626', enabled: false },
      ],
    };
    
    const result = computeDataDomain(mockDataPoints, windowWithOneSeries, 'scatter');
    
    expect(result.hasData).toBe(true);
    expect(result.y).toEqual({ min: 100, max: 200 });
  });

  it('should return no data when empty dataPoints array', () => {
    const result = computeDataDomain([], mockWindowState, 'scatter');
    
    expect(result.hasData).toBe(false);
    expect(result.x).toBeNull();
    expect(result.y).toBeNull();
  });
});
