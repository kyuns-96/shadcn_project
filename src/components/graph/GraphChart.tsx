/**
 * @file GraphChart.tsx
 * @purpose Recharts wrapper component for rendering all 5 chart types
 * 
 * Transforms ChartDataPoint[] into Recharts-compatible formats and renders
 * appropriate chart components based on chartType.
 */

import { type ChartDataPoint } from '@/hooks/useGraphData';
import {
  type ChartType,
  type RangeConfig,
  type Series,
} from '@/store/reducers/graphSlice';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { XAxisProps, YAxisProps } from 'recharts';
import { Loader2 } from 'lucide-react';

// ============================================
// RECHARTS DATA TYPES
// ============================================
interface RechartsLineBarAreaData {
  type: 'line' | 'bar' | 'area';
  data: Array<Record<string, number | string>>;
  seriesKeys: string[];
}

interface RechartsScatterData {
  type: 'scatter';
  seriesData: Map<string, Array<{ x: number; y: number; label: string }>>;
}

interface RechartsHistogramData {
  type: 'histogram';
  bins: Array<{ label: string; count: number; range: [number, number] }>;
}

type RechartsData =
  | RechartsLineBarAreaData
  | RechartsScatterData
  | RechartsHistogramData;

// ============================================
// COMPONENT PROPS
// ============================================
export interface GraphChartProps {
  chartType: ChartType;
  dataPoints: ChartDataPoint[];
  series: Series[];
  xRange: RangeConfig;
  yRange: RangeConfig;
  isLoading?: boolean;
}

// ============================================
// HISTOGRAM BINNING
// ============================================
function computeHistogramBins(
  values: number[],
  binCount: number,
  yRange: RangeConfig
): Array<{ label: string; count: number; range: [number, number] }> {
  // EDGE CASE: Empty values array
  if (values.length === 0) return [];

  // EDGE CASE: Filter out NaN and non-finite values
  const validValues = values.filter((v) => Number.isFinite(v));
  if (validValues.length === 0) return [];

  // Determine bin boundaries from yRange (the range of values being binned)
  const min =
    yRange.min === 'auto' ? Math.min(...validValues) : yRange.min;
  const max =
    yRange.max === 'auto' ? Math.max(...validValues) : yRange.max;

  // EDGE CASE: min === max (all values identical, or range collapsed)
  if (min === max) {
    return [
      {
        label: `${min.toFixed(1)}`,
        count: validValues.length,
        range: [min, max],
      },
    ];
  }

  const binWidth = (max - min) / binCount;

  // EDGE CASE: binWidth is 0 or negative (shouldn't happen after min===max check, but defensive)
  if (binWidth <= 0) {
    return [
      {
        label: `${min.toFixed(1)}-${max.toFixed(1)}`,
        count: validValues.length,
        range: [min, max],
      },
    ];
  }

  const bins: Array<{
    label: string;
    count: number;
    range: [number, number];
  }> = [];

  for (let i = 0; i < binCount; i++) {
    const rangeMin = min + i * binWidth;
    const rangeMax = min + (i + 1) * binWidth;
    const count = validValues.filter((v) =>
      i === binCount - 1
        ? v >= rangeMin && v <= rangeMax // Last bin includes upper bound
        : v >= rangeMin && v < rangeMax
    ).length;

    bins.push({
      label: `${rangeMin.toFixed(1)}-${rangeMax.toFixed(1)}`,
      count,
      range: [rangeMin, rangeMax],
    });
  }

  return bins;
}

// ============================================
// DATA TRANSFORMATION
// ============================================
function transformForRecharts(
  dataPoints: ChartDataPoint[],
  chartType: ChartType,
  series: Series[],
  yRange: RangeConfig
): RechartsData {
  const enabledSeries = series.filter((s) => s.enabled);

  // ============ SCATTER ============
  if (chartType === 'scatter') {
    // Scatter requires numeric X and Y, grouped by series
    const seriesData = new Map<
      string,
      Array<{ x: number; y: number; label: string }>
    >();

    enabledSeries.forEach((s) => {
      const seriesPoints = dataPoints
        .filter((pt) => pt.seriesId === s.id && typeof pt.x === 'number')
        .map((pt) => ({
          x: pt.x as number,
          y: pt.y,
          label: pt.doeLabel,
        }));
      seriesData.set(s.id, seriesPoints);
    });

    return { type: 'scatter', seriesData };
  }

  // ============ HISTOGRAM ============
  if (chartType === 'histogram') {
    // Histogram bins Y values from first enabled series
    // NOTE: For histogram, the Y values are binned, and the bins become the X axis
    // The count (frequency) becomes the Y axis
    // Use yRange to control the binning range (since we're binning Y values)

    // EDGE CASE: No enabled series
    if (enabledSeries.length === 0) {
      return { type: 'histogram', bins: [] };
    }

    const firstSeriesId = enabledSeries[0]?.id;
    if (!firstSeriesId) {
      return { type: 'histogram', bins: [] };
    }

    const yValues = dataPoints
      .filter((pt) => pt.seriesId === firstSeriesId)
      .map((pt) => pt.y)
      .filter((y) => Number.isFinite(y)); // Filter NaN/Infinity

    // IMPORTANT: Use yRange (not xRange) because we're binning Y values
    const bins = computeHistogramBins(yValues, 10, yRange);
    return { type: 'histogram', bins };
  }

  // ============ LINE / BAR / AREA ============
  // Aggregate by X value, each series becomes a column
  const xMap = new Map<string | number, Record<string, number | string>>();

  dataPoints.forEach((pt) => {
    if (!enabledSeries.find((s) => s.id === pt.seriesId)) return;

    const xKey = pt.x;
    if (!xMap.has(xKey)) {
      xMap.set(xKey, { x: xKey });
    }
    const row = xMap.get(xKey)!;
    // Note: If same series has multiple points for same X, last wins
    row[pt.seriesId] = pt.y;
  });

  // Sort by X (numeric or alphabetic)
  const data = Array.from(xMap.values()).sort((a, b) => {
    if (typeof a.x === 'number' && typeof b.x === 'number') {
      return a.x - b.x;
    }
    return String(a.x).localeCompare(String(b.x));
  });

  return {
    type: chartType as 'line' | 'bar' | 'area',
    data,
    seriesKeys: enabledSeries.map((s) => s.id),
  };
}

// ============================================
// MAIN COMPONENT
// ============================================
export function GraphChart({
  chartType,
  dataPoints,
  series,
  xRange,
  yRange,
  isLoading,
}: GraphChartProps) {
  // Transform data for Recharts
  const transformedData = transformForRecharts(
    dataPoints,
    chartType,
    series,
    yRange
  );

  // Loading state - show spinner instead of "No data"
  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground" data-testid="graph-loading-indicator">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-sm">Loading data...</span>
      </div>
    );
  }

  // Empty state
  if (
    (transformedData.type === 'scatter' &&
      transformedData.seriesData.size === 0) ||
    (transformedData.type === 'histogram' && transformedData.bins.length === 0) ||
    ((transformedData.type === 'line' ||
      transformedData.type === 'bar' ||
      transformedData.type === 'area') &&
      transformedData.data.length === 0)
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        No data
      </div>
    );
  }

  // Determine domain for axes
  // xRange applies ONLY to numeric X axes
  // For categorical X (strings), ignore xRange - let Recharts auto-scale
  const xDomain =
    transformedData.type !== 'scatter' &&
    transformedData.type !== 'histogram' &&
    transformedData.data.length > 0 &&
    typeof transformedData.data[0]?.x === 'number'
      ? [
          xRange.min === 'auto' ? 'auto' : xRange.min,
          xRange.max === 'auto' ? 'auto' : xRange.max,
        ]
      : undefined; // undefined = Recharts auto for categorical

  // yRange always applies (Y is always numeric)
  const yDomain = [
    yRange.min === 'auto' ? 'auto' : yRange.min,
    yRange.max === 'auto' ? 'auto' : yRange.max,
  ];

  // Get series color map
  const seriesColorMap = new Map(series.map((s) => [s.id, s.color]));

  // ============ RENDER SCATTER ============
  if (transformedData.type === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name="X"
            domain={
              xRange.min === 'auto' && xRange.max === 'auto'
                ? undefined
                : [
                    xRange.min === 'auto' ? 'auto' : xRange.min,
                    xRange.max === 'auto' ? 'auto' : xRange.max,
                  ]
            }
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Y"
            domain={yDomain as YAxisProps['domain']}
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          {Array.from(transformedData.seriesData.entries()).map(
            ([seriesId, points]) => (
              <Scatter
                key={seriesId}
                name={seriesId}
                data={points}
                fill={seriesColorMap.get(seriesId) ?? '#8884d8'}
              />
            )
          )}
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  // ============ RENDER HISTOGRAM ============
  if (transformedData.type === 'histogram') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={transformedData.bins}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // ============ RENDER LINE ============
  if (transformedData.type === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={transformedData.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" domain={xDomain as XAxisProps['domain']} />
          <YAxis domain={yDomain as YAxisProps['domain']} />
          <Tooltip />
          {transformedData.seriesKeys.map((seriesId) => (
            <Line
              key={seriesId}
              type="monotone"
              dataKey={seriesId}
              stroke={seriesColorMap.get(seriesId) ?? '#8884d8'}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // ============ RENDER BAR ============
  if (transformedData.type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={transformedData.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" domain={xDomain as XAxisProps['domain']} />
          <YAxis domain={yDomain as YAxisProps['domain']} />
          <Tooltip />
          {transformedData.seriesKeys.map((seriesId) => (
            <Bar
              key={seriesId}
              dataKey={seriesId}
              fill={seriesColorMap.get(seriesId) ?? '#8884d8'}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // ============ RENDER AREA ============
  if (transformedData.type === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={transformedData.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" domain={xDomain as XAxisProps['domain']} />
          <YAxis domain={yDomain as YAxisProps['domain']} />
          <Tooltip />
          {transformedData.seriesKeys.map((seriesId) => (
            <Area
              key={seriesId}
              type="monotone"
              dataKey={seriesId}
              stroke={seriesColorMap.get(seriesId) ?? '#8884d8'}
              fill={seriesColorMap.get(seriesId) ?? '#8884d8'}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Fallback (should never reach here)
  return (
    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
      Unsupported chart type
    </div>
  );
}
