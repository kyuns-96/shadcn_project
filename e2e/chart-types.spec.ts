import { test, expect } from '@playwright/test';
import { encodeGraphWindowsForUrl, createSeededTestUrl, type TestGraphWindowConfig } from './utils/graph-url-helper';

test.describe('Chart Type Rendering', () => {
  test('should render line chart (default)', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    await expect(page.locator('[data-testid="graph-fab"]')).toBeVisible();
    
    await page.click('[data-testid="graph-fab"]');
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    await expect(page.locator('[data-testid="chart-drop-zone"]')).toBeVisible();
  });

  test('should render scatter chart from URL state', async ({ page }) => {
    const config: TestGraphWindowConfig[] = [{
      chartType: 'scatter',
      xAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
      yAxis: { type: 'metric', key: 'Power(mW)!clock_network_Total' },
      series: [{ metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true }],
      xRange: { min: 'auto', max: 'auto' },
      yRange: { min: 'auto', max: 'auto' },
    }];
    
    const encodedGw = encodeGraphWindowsForUrl(config);
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(`${seededUrl}&gw=${encodedGw}`);
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    await expect(page.locator('[data-testid="series-item-s_0"]')).toBeVisible();
  });

  test('should render bar chart from URL state', async ({ page }) => {
    const config: TestGraphWindowConfig[] = [{
      chartType: 'bar',
      xAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
      yAxis: { type: 'metric', key: 'Power(mW)!clock_network_Total' },
      series: [{ metricKey: 'Power(mW)!combinational_Total', color: '#00ff00', enabled: true }],
      xRange: { min: 'auto', max: 'auto' },
      yRange: { min: 'auto', max: 'auto' },
    }];
    
    const encodedGw = encodeGraphWindowsForUrl(config);
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(`${seededUrl}&gw=${encodedGw}`);
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    await expect(page.locator('[data-testid="chart-drop-zone"]')).toBeVisible();
  });

  test('should render area chart from URL state', async ({ page }) => {
    const config: TestGraphWindowConfig[] = [{
      chartType: 'area',
      xAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
      yAxis: { type: 'metric', key: 'Power(mW)!clock_network_Total' },
      series: [{ metricKey: 'Power(mW)!combinational_Total', color: '#0000ff', enabled: true }],
      xRange: { min: 'auto', max: 'auto' },
      yRange: { min: 'auto', max: 'auto' },
    }];
    
    const encodedGw = encodeGraphWindowsForUrl(config);
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(`${seededUrl}&gw=${encodedGw}`);
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    await expect(page.locator('[data-testid="chart-drop-zone"]')).toBeVisible();
  });

  test('should render histogram chart from URL state', async ({ page }) => {
    const config: TestGraphWindowConfig[] = [{
      chartType: 'histogram',
      xAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
      yAxis: { type: 'metric', key: 'Power(mW)!clock_network_Total' },
      series: [{ metricKey: 'Power(mW)!combinational_Total', color: '#ff00ff', enabled: true }],
      xRange: { min: 'auto', max: 'auto' },
      yRange: { min: 'auto', max: 'auto' },
    }];
    
    const encodedGw = encodeGraphWindowsForUrl(config);
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(`${seededUrl}&gw=${encodedGw}`);
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    await expect(page.locator('[data-testid="chart-drop-zone"]')).toBeVisible();
  });

  test('should render chart with actual data (not empty state)', async ({ page }) => {
    const config: TestGraphWindowConfig[] = [{
      chartType: 'line',
      xAxis: { type: 'doeMetadata', key: 'label' },
      yAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
      series: [{ metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true }],
      xRange: { min: 'auto', max: 'auto' },
      yRange: { min: 'auto', max: 'auto' },
    }];
    
    const encodedGw = encodeGraphWindowsForUrl(config);
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(`${seededUrl}&gw=${encodedGw}`);
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    await page.waitForTimeout(1000);
    
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
    await expect(page.getByText('No data')).not.toBeVisible();
  });

  test('should change chart type via UI selection', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create graph window
    await page.click('[data-testid="graph-fab"]');
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    // Open chart type selector
    await page.click('[data-testid="chart-type-select"]');
    
    // Select scatter
    await page.click('[cmdk-item]:has-text("Scatter")');
    
    // Verify selection updated
    await expect(page.locator('[data-testid="chart-type-select"]')).toContainText('Scatter');
  });
});
