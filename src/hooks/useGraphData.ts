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

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function useGraphData(window: GraphWindow): ChartDataPoint[] {
  const columnHeaders = useAppSelector(state => state.matrix.columnHeaders);
  const doeRegistry = useAppSelector(state => state.doeRegistry.byId);
  const datasets = useAppSelector(state => state.dataset.data ?? {});
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
        const numericX = toFiniteNumber(xRaw);
        if (numericX === undefined) return;
        xValue = numericX;
      }
      
      enabledSeries.forEach(series => {
        const yRaw = extractMetricValue(series.metricKey, dataset, scenario, revisionMode);
        const numericY = toFiniteNumber(yRaw);
        if (numericY === undefined) return;
        
        dataPoints.push({
          doeId: columnId,
          doeLabel,
          seriesId: series.id,
          x: xValue,
          y: numericY,
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
