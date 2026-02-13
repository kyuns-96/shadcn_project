import { describe, it, expect } from 'vitest';
import graphReducer, {
  addGraphWindow,
  removeGraphWindow,
  updateGraphWindow,
  addSeriesToWindow,
  removeSeriesFromWindow,
  toggleSeriesEnabled,
  updateSeriesChartType,
  setWindowPosition,
  setWindowSize,
  toggleMinimize,
  bringToFront,
  cloneWindow,
  setGraphWindows,
} from './graphSlice';

describe('graphSlice', () => {
  describe('addGraphWindow', () => {
    it('adds window with default config', () => {
      const state = graphReducer(undefined, addGraphWindow());
      expect(state.windows).toHaveLength(1);
      expect(state.windows[0].id).toBe('gw_0');
      expect(state.windows[0].chartType).toBe('line');
      expect(state.windows[0].series[0].chartType).toBe('line');
    });

    it('enforces max 10 windows', () => {
      let state = graphReducer(undefined, { type: 'unknown' });
      for (let i = 0; i < 10; i++) {
        state = graphReducer(state, addGraphWindow());
      }
      expect(state.windows).toHaveLength(10);
      state = graphReducer(state, addGraphWindow());
      expect(state.windows).toHaveLength(10);
    });

    it('truncates series to max 10', () => {
      const series = Array.from({ length: 15 }, (_, i) => ({
        metricKey: `m${i}`,
        color: '#ff0000',
        enabled: true,
      }));
      const state = graphReducer(undefined, addGraphWindow({ series }));
      expect(state.windows[0].series).toHaveLength(10);
    });
  });

  describe('removeGraphWindow', () => {
    it('removes window by id', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const id = state.windows[0].id;
      state = graphReducer(state, removeGraphWindow(id));
      expect(state.windows).toHaveLength(0);
    });
  });

  describe('updateGraphWindow', () => {
    it('updates window properties', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const id = state.windows[0].id;
      state = graphReducer(state, updateGraphWindow({ id, changes: { chartType: 'bar' } }));
      expect(state.windows[0].chartType).toBe('bar');
    });
  });

  describe('addSeriesToWindow', () => {
    it('adds series with generated id', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const windowId = state.windows[0].id;
      state = graphReducer(state, addSeriesToWindow({
        windowId,
        series: { metricKey: 'test', color: '#ff0000', enabled: true, chartType: 'bar' }
      }));
      expect(state.windows[0].series.length).toBeGreaterThan(1);
      expect(state.windows[0].series[1].chartType).toBe('bar');
    });

    it('enforces max 10 series', () => {
      let state = graphReducer(undefined, addGraphWindow({ series: [] }));
      const windowId = state.windows[0].id;
      for (let i = 0; i < 10; i++) {
        state = graphReducer(state, addSeriesToWindow({
          windowId,
          series: { metricKey: `m${i}`, color: '#ff0000', enabled: true, chartType: 'line' }
        }));
      }
      expect(state.windows[0].series).toHaveLength(10);
      state = graphReducer(state, addSeriesToWindow({
        windowId,
        series: { metricKey: 'm11', color: '#ff0000', enabled: true, chartType: 'line' }
      }));
      expect(state.windows[0].series).toHaveLength(10);
    });

    it('normalizes color with # prefix', () => {
      let state = graphReducer(undefined, addGraphWindow({ series: [] }));
      const windowId = state.windows[0].id;
      state = graphReducer(state, addSeriesToWindow({
        windowId,
        series: { metricKey: 'test', color: 'ff0000', enabled: true, chartType: 'line' }
      }));
      expect(state.windows[0].series[0].color).toBe('#ff0000');
    });
  });

  describe('updateSeriesChartType', () => {
    it('updates only targeted series chartType', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const windowId = state.windows[0].id;

      state = graphReducer(state, addSeriesToWindow({
        windowId,
        series: { metricKey: 's1', color: '#ff0000', enabled: true, chartType: 'bar' },
      }));

      state = graphReducer(state, addSeriesToWindow({
        windowId,
        series: { metricKey: 's2', color: '#00ff00', enabled: true, chartType: 'scatter' },
      }));

      const targetSeriesId = state.windows[0].series[1].id;
      const untouchedSeriesId = state.windows[0].series[2].id;

      state = graphReducer(state, updateSeriesChartType({ windowId, seriesId: targetSeriesId, chartType: 'area' }));

      expect(state.windows[0].series.find(s => s.id === targetSeriesId)?.chartType).toBe('area');
      expect(state.windows[0].series.find(s => s.id === untouchedSeriesId)?.chartType).toBe('scatter');
      expect(state.windows[0].series[0].chartType).toBe('line');
    });
  });

  describe('removeSeriesFromWindow', () => {
    it('removes series by id', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const windowId = state.windows[0].id;
      const seriesId = state.windows[0].series[0].id;
      state = graphReducer(state, removeSeriesFromWindow({ windowId, seriesId }));
      expect(state.windows[0].series).toHaveLength(0);
    });
  });

  describe('toggleSeriesEnabled', () => {
    it('toggles enabled state', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const windowId = state.windows[0].id;
      const seriesId = state.windows[0].series[0].id;
      const initial = state.windows[0].series[0].enabled;
      state = graphReducer(state, toggleSeriesEnabled({ windowId, seriesId }));
      expect(state.windows[0].series[0].enabled).toBe(!initial);
    });
  });

  describe('setWindowPosition', () => {
    it('sets position', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const id = state.windows[0].id;
      state = graphReducer(state, setWindowPosition({ id, position: { x: 100, y: 200 } }));
      expect(state.windows[0].position).toEqual({ x: 100, y: 200 });
    });
  });

  describe('setWindowSize', () => {
    it('sets size', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const id = state.windows[0].id;
      state = graphReducer(state, setWindowSize({ id, size: { width: 500, height: 400 } }));
      expect(state.windows[0].size).toEqual({ width: 500, height: 400 });
    });
  });

  describe('toggleMinimize', () => {
    it('toggles minimize state', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const id = state.windows[0].id;
      state = graphReducer(state, toggleMinimize(id));
      expect(state.windows[0].isMinimized).toBe(true);
      state = graphReducer(state, toggleMinimize(id));
      expect(state.windows[0].isMinimized).toBe(false);
    });
  });

  describe('bringToFront', () => {
    it('increments zIndex', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const id = state.windows[0].id;
      const initialZ = state.windows[0].zIndex;
      state = graphReducer(state, bringToFront(id));
      expect(state.windows[0].zIndex).toBeGreaterThan(initialZ || 0);
    });
  });

  describe('cloneWindow', () => {
    it('clones window with new id', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const id = state.windows[0].id;
      state = graphReducer(state, cloneWindow(id));
      expect(state.windows).toHaveLength(2);
      expect(state.windows[1].id).not.toBe(id);
    });

    it('enforces max 10 windows', () => {
      let state = graphReducer(undefined, { type: 'unknown' });
      for (let i = 0; i < 10; i++) {
        state = graphReducer(state, addGraphWindow());
      }
      const id = state.windows[0].id;
      state = graphReducer(state, cloneWindow(id));
      expect(state.windows).toHaveLength(10);
    });

    it('preserves per-series chartType when cloning', () => {
      let state = graphReducer(undefined, addGraphWindow({
        series: [{ metricKey: 'm1', color: '#ff0000', enabled: true, chartType: 'histogram' }],
      }));
      const id = state.windows[0].id;

      state = graphReducer(state, cloneWindow(id));

      expect(state.windows[1].series[0].chartType).toBe('histogram');
    });
  });

  describe('setGraphWindows', () => {
    it('replaces all windows', () => {
      let state = graphReducer(undefined, addGraphWindow());
      const configs = [{
        chartType: 'bar' as const,
        xAxis: { type: 'doeMetadata' as const, key: 'label' },
        yAxis: { type: 'metric' as const, key: 'test' },
        series: [],
        xRange: { min: 'auto' as const, max: 'auto' as const },
        yRange: { min: 'auto' as const, max: 'auto' as const },
      }];
      state = graphReducer(state, setGraphWindows(configs));
      expect(state.windows).toHaveLength(1);
      expect(state.windows[0].chartType).toBe('bar');
    });

    it('truncates to max 10 windows', () => {
      const configs = Array.from({ length: 15 }, () => ({
        chartType: 'line' as const,
        xAxis: { type: 'doeMetadata' as const, key: 'label' },
        yAxis: { type: 'metric' as const, key: 'test' },
        series: [],
        xRange: { min: 'auto' as const, max: 'auto' as const },
        yRange: { min: 'auto' as const, max: 'auto' as const },
      }));
      const state = graphReducer(undefined, setGraphWindows(configs));
      expect(state.windows).toHaveLength(10);
    });

    it('truncates series per window to max 10', () => {
      const series = Array.from({ length: 15 }, (_, i) => ({
        metricKey: `m${i}`,
        color: '#ff0000',
        enabled: true,
        chartType: 'line' as const,
      }));
      const configs = [{
        chartType: 'line' as const,
        xAxis: { type: 'doeMetadata' as const, key: 'label' },
        yAxis: { type: 'metric' as const, key: 'test' },
        series,
        xRange: { min: 'auto' as const, max: 'auto' as const },
        yRange: { min: 'auto' as const, max: 'auto' as const },
      }];
      const state = graphReducer(undefined, setGraphWindows(configs));
      expect(state.windows[0].series).toHaveLength(10);
    });

    it('restores per-series chartType with line fallback', () => {
      const configs = [{
        chartType: 'bar' as const,
        xAxis: { type: 'doeMetadata' as const, key: 'label' },
        yAxis: { type: 'metric' as const, key: 'test' },
        series: [
          { metricKey: 's1', color: '#ff0000', enabled: true, chartType: 'scatter' as const },
          { metricKey: 's2', color: '#00ff00', enabled: true },
        ],
        xRange: { min: 'auto' as const, max: 'auto' as const },
        yRange: { min: 'auto' as const, max: 'auto' as const },
      }];

      const state = graphReducer(undefined, setGraphWindows(configs));

      expect(state.windows[0].series[0].chartType).toBe('scatter');
      expect(state.windows[0].series[1].chartType).toBe('line');
    });
  });
});
