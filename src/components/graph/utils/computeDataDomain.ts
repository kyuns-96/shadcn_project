import type { ChartType, GraphWindow } from '@/store/reducers/graphSlice';
import type { ChartDataPoint } from '@/hooks/useGraphData';

export interface DataDomain {
  x: { min: number; max: number } | null;
  y: { min: number; max: number } | null;
  hasData: boolean;
}

export function computeDataDomain(
  dataPoints: ChartDataPoint[],
  windowState: GraphWindow,
  chartType: ChartType
): DataDomain {
  const enabledSeries = windowState.series.filter(s => s.enabled);
  const enabledSeriesIds = new Set(enabledSeries.map(s => s.id));
  
  const filteredPoints = dataPoints.filter(pt => 
    enabledSeriesIds.has(pt.seriesId) && Number.isFinite(pt.y)
  );
  
  if (filteredPoints.length === 0) {
    return { x: null, y: null, hasData: false };
  }
  
  let yMin: number;
  let yMax: number;
  
  if (chartType === 'histogram') {
    const firstEnabledSeriesId = enabledSeries[0]?.id;
    const histogramPoints = filteredPoints.filter(pt => pt.seriesId === firstEnabledSeriesId);
    
    if (histogramPoints.length === 0) {
      return { x: null, y: null, hasData: false };
    }
    
    const yValues = histogramPoints.map(pt => pt.y);
    yMin = Math.min(...yValues);
    yMax = Math.max(...yValues);
  } else {
    const yValues = filteredPoints.map(pt => pt.y);
    yMin = Math.min(...yValues);
    yMax = Math.max(...yValues);
  }
  
  if (windowState.xAxis.type === 'metric' && chartType !== 'histogram') {
    const xValues = filteredPoints
      .filter(pt => typeof pt.x === 'number')
      .map(pt => pt.x as number);
    
    if (xValues.length > 0) {
      return {
        x: { min: Math.min(...xValues), max: Math.max(...xValues) },
        y: { min: yMin, max: yMax },
        hasData: true,
      };
    }
  }
  
  return { x: null, y: { min: yMin, max: yMax }, hasData: true };
}
