import { test, expect } from '@playwright/test';
import { createSeededTestUrl } from './utils/graph-url-helper';

test.describe('PNG Export', () => {
  test('should trigger PNG download when clicking export', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl, { waitUntil: 'networkidle' });
    
    // Wait for page to be ready
    await expect(page.locator('[data-testid="graph-fab"]')).toBeVisible({ timeout: 10000 });
    
    await page.click('[data-testid="graph-fab"]');
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
    
    // Wait for SVG to render (even if showing "No data")
    await page.locator('svg').first().waitFor({ state: 'visible', timeout: 10000 });
    
    // Wait for export button to be visible
    const exportButton = page.locator('[data-testid="export-button"]');
    await expect(exportButton).toBeVisible();
    
    // Start listening for download before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    await exportButton.click();
    
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/graph-window.*\.png/);
  });

  test('should generate file with correct name pattern', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl, { waitUntil: 'networkidle' });
    
    // Wait for page to be ready
    await expect(page.locator('[data-testid="graph-fab"]')).toBeVisible({ timeout: 10000 });
    
    await page.click('[data-testid="graph-fab"]');
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
    
    // Wait for SVG to render (even if showing "No data")
    await page.locator('svg').first().waitFor({ state: 'visible', timeout: 10000 });
    
    // Wait for export button to be visible
    const exportButton = page.locator('[data-testid="export-button"]');
    await expect(exportButton).toBeVisible();
    
    // Start listening for download before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    await exportButton.click();
    
    const download = await downloadPromise;
    
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^graph-window-\d+-\d{8}-\d{6}\.png$/);
  });
});
