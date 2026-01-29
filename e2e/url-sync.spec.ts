import { test, expect } from '@playwright/test';
import { encodeGraphWindowsForUrl, createSeededTestUrl, type TestGraphWindowConfig } from './utils/graph-url-helper';

test.describe('URL State Synchronization', () => {
  test('should persist graph state to URL', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Verify FAB is visible
    await expect(page.locator('[data-testid="graph-fab"]')).toBeVisible();
    
    // Create a graph window
    await page.click('[data-testid="graph-fab"]');
    
    // Verify window is created
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    // Window has default series, so URL should have gw param
    const urlWithState = page.url();
    expect(urlWithState).toContain('gw=');
  });

  test('should restore graph state from URL on reload', async ({ page }) => {
    // Create a test configuration with a scatter chart
    const config: TestGraphWindowConfig[] = [{
      chartType: 'scatter',
      xAxis: { type: 'metric', key: 'Power(mW)!combinational_Total' },
      yAxis: { type: 'metric', key: 'Power(mW)!clock_network_Total' },
      series: [{ metricKey: 'Power(mW)!combinational_Total', color: '#ff0000', enabled: true }],
      xRange: { min: 'auto', max: 'auto' },
      yRange: { min: 'auto', max: 'auto' },
    }];
    
    // Encode the configuration
    const encodedGw = encodeGraphWindowsForUrl(config);
    const seededUrl = createSeededTestUrl('qor-compare');
    
    // Navigate to URL with encoded graph state
    await page.goto(`${seededUrl}&gw=${encodedGw}`);
    
    // Verify window is restored
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
    
    // Reload and verify state survives
    await page.reload();
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
  });

  test('should restore multiple windows from URL', async ({ page }) => {
    // Create multiple test configurations
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
    
    // Encode the configurations
    const encodedGw = encodeGraphWindowsForUrl(configs);
    const seededUrl = createSeededTestUrl('qor-compare');
    
    // Navigate to URL with encoded graph state
    await page.goto(`${seededUrl}&gw=${encodedGw}`);
    
    // Verify all 3 windows are restored
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(3);
    
    // Reload and verify state survives
    await page.reload();
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(3);
  });
});
