import { test, expect } from '@playwright/test';
import { createSeededTestUrl } from './utils/graph-url-helper';

test.describe('PNG Export', () => {
  test('should trigger PNG download when clicking export', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    await page.click('[data-testid="graph-fab"]');
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    
    await page.click('[data-testid="export-button"]');
    
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toMatch(/graph-window.*\.png/);
  });

  test('should generate file with correct name pattern', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    await page.click('[data-testid="graph-fab"]');
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    
    await page.click('[data-testid="export-button"]');
    
    const download = await downloadPromise;
    
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^graph-window-\d+-\d{8}-\d{6}\.png$/);
  });
});
