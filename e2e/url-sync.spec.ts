import { test, expect } from '@playwright/test';
import { encodeGraphWindowsForUrl, createSeededTestUrl, type TestGraphWindowConfig } from './utils/graph-url-helper';

function encodeLegacyV1Payload(payload: unknown): string {
  return Buffer.from(encodeURIComponent(JSON.stringify(payload)), 'utf-8').toString('base64');
}

test.describe('URL State Synchronization', () => {
  test('should persist graph state to URL', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);

    await expect(page.locator('[data-testid="graph-fab"]')).toBeVisible();

    await page.click('[data-testid="graph-fab"]');

    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();

    const urlWithState = page.url();
    expect(urlWithState).toContain('gw=');
  });

  test('should restore graph state from URL on reload', async ({ page }) => {
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

    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);

    await page.reload();
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
  });

  test('restores v2 URL payload with per-series chart types', async ({ page }) => {
    const config: TestGraphWindowConfig[] = [{
      chartType: 'line',
      xAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
      yAxis: { type: 'metric', key: 'Power(mW)!clock_network_Total' },
      series: [
        { metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true, chartType: 'scatter' },
        { metricKey: 'Power(mW)!register_Total', color: '#00ff00', enabled: true, chartType: 'bar' },
      ],
      xRange: { min: 'auto', max: 'auto' },
      yRange: { min: 'auto', max: 'auto' },
    }];

    const encodedGw = encodeGraphWindowsForUrl(config);
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(`${seededUrl}&gw=${encodedGw}`);

    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="series-item-s_0"]')).toBeVisible();
    await expect(page.locator('[data-testid="series-item-s_1"]')).toBeVisible();
    await expect(page.locator('[data-testid="series-chart-type-select-s_0"]')).toContainText('Scatter');
    await expect(page.locator('[data-testid="series-chart-type-select-s_1"]')).toContainText('Bar');
  });

  test('restores legacy v1 payload using window chart type fallback', async ({ page }) => {
    const legacyV1Payload = {
      v: 1,
      w: [
        {
          ct: 'area',
          xa: { t: 'm', k: 'Power(mW)!combinational_Total' },
          ya: { t: 'm', k: 'Power(mW)!clock_network_Total' },
          sr: [
            { mk: 'Power(mW)!combinational_Total', c: 'ff0000', e: true },
            { mk: 'Power(mW)!register_Total', c: '00ff00', e: true },
          ],
          xr: { n: null, x: null },
          yr: { n: null, x: null },
        },
      ],
    };

    const encodedGw = encodeLegacyV1Payload(legacyV1Payload);
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(`${seededUrl}&gw=${encodedGw}`);

    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="series-item-s_0"]')).toBeVisible();
    await expect(page.locator('[data-testid="series-item-s_1"]')).toBeVisible();
    await expect(page.locator('[data-testid="series-chart-type-select-s_0"]')).toContainText('Area');
    await expect(page.locator('[data-testid="series-chart-type-select-s_1"]')).toContainText('Area');
  });

  test('should restore multiple windows from URL', async ({ page }) => {
    const configs: TestGraphWindowConfig[] = [
      {
        chartType: 'line',
        xAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
        yAxis: { type: 'metric', key: 'Power(mW)!clock_network_Total' },
        series: [{ metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true }],
        xRange: { min: 'auto', max: 'auto' },
        yRange: { min: 'auto', max: 'auto' },
      },
      {
        chartType: 'scatter',
        xAxis: { type: 'metric', key: 'Power(mW)!register_Total' },
        yAxis: { type: 'metric', key: 'Power(mW)!sequential_Total' },
        series: [{ metricKey: 'Power(mW)!register_Total', color: '#00ff00', enabled: true }],
        xRange: { min: 'auto', max: 'auto' },
        yRange: { min: 'auto', max: 'auto' },
      },
      {
        chartType: 'bar',
        xAxis: { type: 'doeMetadata', key: 'PROJECT_NAME' },
        yAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
        series: [{ metricKey: 'Power(mW)!combinational_Total', color: '#0000ff', enabled: true }],
        xRange: { min: 'auto', max: 'auto' },
        yRange: { min: 'auto', max: 'auto' },
      },
    ];

    const encodedGw = encodeGraphWindowsForUrl(configs);
    const seededUrl = createSeededTestUrl('qor-compare');

    await page.goto(`${seededUrl}&gw=${encodedGw}`);

    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(3);

    await page.reload();
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(3);
  });
});
