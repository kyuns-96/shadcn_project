import { test, expect } from '@playwright/test';
import { encodeGraphWindowsForUrl, createSeededTestUrl, type TestGraphWindowConfig } from './utils/graph-url-helper';

test.describe('Chart Type Rendering', () => {
  test('shows per-series chart type selector for default window', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);

    await expect(page.locator('[data-testid="graph-fab"]')).toBeVisible();

    await page.click('[data-testid="graph-fab"]');

    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();

    await expect(page.locator('[data-testid="series-item-s_0"]')).toBeVisible();
    await expect(page.locator('[data-testid="series-chart-type-select-s_0"]')).toBeVisible();
    await expect(page.locator('[data-testid="series-chart-type-select-s_0"]')).toContainText('Line');
    await expect(page.locator('[data-testid="chart-type-select"]')).toHaveCount(0);
  });

  test('restores per-series chart type from seeded URL', async ({ page }) => {
    const config: TestGraphWindowConfig[] = [{
      chartType: 'line',
      xAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
      yAxis: { type: 'metric', key: 'Power(mW)!clock_network_Total' },
      series: [{ metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true, chartType: 'scatter' }],
      xRange: { min: 'auto', max: 'auto' },
      yRange: { min: 'auto', max: 'auto' },
    }];

    const encodedGw = encodeGraphWindowsForUrl(config);
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(`${seededUrl}&gw=${encodedGw}`);

    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();

    await expect(page.locator('[data-testid="series-item-s_0"]')).toBeVisible();
    await expect(page.locator('[data-testid="series-chart-type-select-s_0"]')).toContainText('Scatter');
  });

  test('changes one series chart type without mutating other series', async ({ page }) => {
    const config: TestGraphWindowConfig[] = [{
      chartType: 'line',
      xAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
      yAxis: { type: 'metric', key: 'Power(mW)!clock_network_Total' },
      series: [
        { metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true, chartType: 'line' },
        { metricKey: 'Power(mW)!register_Total', color: '#00ff00', enabled: true, chartType: 'bar' },
      ],
      xRange: { min: 'auto', max: 'auto' },
      yRange: { min: 'auto', max: 'auto' },
    }];

    const encodedGw = encodeGraphWindowsForUrl(config);
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(`${seededUrl}&gw=${encodedGw}`);

    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();

    await expect(page.locator('[data-testid="series-item-s_0"]')).toBeVisible();
    await expect(page.locator('[data-testid="series-item-s_1"]')).toBeVisible();
    await expect(page.locator('[data-testid="series-chart-type-select-s_0"]')).toContainText('Line');
    await expect(page.locator('[data-testid="series-chart-type-select-s_1"]')).toContainText('Bar');

    await page.click('[data-testid="series-chart-type-select-s_0"]');
    await page.locator('[cmdk-item]:has-text("Scatter")').click();

    await expect(page.locator('[data-testid="series-chart-type-select-s_0"]')).toContainText('Scatter');
    await expect(page.locator('[data-testid="series-chart-type-select-s_1"]')).toContainText('Bar');
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
    
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
    await expect(page.getByText('No data')).not.toBeVisible();
  });
});
