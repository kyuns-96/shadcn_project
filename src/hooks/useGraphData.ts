import { useMemo } from 'react';
import { useAppSelector } from '@/store';
import type { GraphWindow } from '@/store/reducers/graphSlice';
import { extractMetricValue } from '@/variables/metricValueExtractor';

export interface ChartDataPoint {
  doeId: string;
  doeLabel: string;
  seriesId: string;
  x: number | string;
  y: number;
  color: string;
}

export function useGraphData(window: GraphWindow): ChartDataPoint[] {
  const columnHeaders = useAppSelector(state => state.matrix.columnHeaders);
  const doeRegistry = useAppSelector(state => state.doeRegistry.byId);
  const datasets = useAppSelector(state => state.dataset.data);
  const revisionMode = useAppSelector(state => state.selected.revisionMode);
  
  return useMemo(() => {
    const dataPoints: ChartDataPoint[] = [];
    const enabledSeries = window.series.filter(s => s.enabled);
    
    if (enabledSeries.length === 0) return [];
    
    columnHeaders.forEach(column => {
      const columnId = column.id;
      const doeMeta = doeRegistry[columnId];
      if (!doeMeta) return;
      
      const doeLabel = doeMeta.label;
      const dataset = datasets[doeLabel];
      if (!dataset || Object.keys(dataset).length === 0) return;
      
      const scenario = doeMeta.POWER_SCENARIO;
      
      let xValue: number | string;
      if (window.xAxis.type === "doeMetadata") {
        xValue = doeMeta[window.xAxis.key as keyof typeof doeMeta] as string ?? doeLabel;
      } else {
        const xRaw = extractMetricValue(window.xAxis.key, dataset, scenario, revisionMode);
        if (xRaw === undefined || xRaw === null || typeof xRaw !== 'number') return;
        xValue = xRaw;
      }
      
      enabledSeries.forEach(series => {
        const yRaw = extractMetricValue(series.metricKey, dataset, scenario, revisionMode);
        if (yRaw === undefined || yRaw === null || typeof yRaw !== 'number') return;
        
        dataPoints.push({
          doeId: columnId,
          doeLabel,
          seriesId: series.id,
          x: xValue,
          y: yRaw,
          color: series.color,
        });
      });
    });
    
    return dataPoints;
  }, [
    columnHeaders,
    doeRegistry,
    datasets,
    revisionMode,
    window.xAxis.type,
    window.xAxis.key,
    window.series,
  ]);
}
