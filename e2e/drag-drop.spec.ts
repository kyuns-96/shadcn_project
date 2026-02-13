import { test, expect } from '@playwright/test';
import { createSeededTestUrl } from './utils/graph-url-helper';

test.describe('Drag and Drop Series', () => {
  test('should add series via quick add control', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create graph window via FAB
    await page.click('[data-testid="graph-fab"]');
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    // Verify 1 default series exists
    await expect(page.locator('[data-testid^="series-item-"]')).toHaveCount(1);
    
    await page.getByRole('button', { name: 'Quick Add Series' }).click();
    
    // Verify series added (now 2 total)
    await expect(page.locator('[data-testid^="series-item-"]')).toHaveCount(2);
  });

  test('should show series in active list after adding', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create window
    await page.click('[data-testid="graph-fab"]');
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    // Verify initial state: 1 default series
    const initialSeriesItems = page.locator('[data-testid^="series-item-"]');
    await expect(initialSeriesItems).toHaveCount(1);
    
    await page.getByRole('button', { name: 'Quick Add Series' }).click();
    
    // Verify series appears in legend/series list
    const updatedSeriesItems = page.locator('[data-testid^="series-item-"]');
    await expect(updatedSeriesItems).toHaveCount(2);
    
    // Check second series item has correct testid pattern (s_1)
    const secondSeriesItem = page.locator('[data-testid="series-item-s_1"]');
    await expect(secondSeriesItem).toBeVisible();
  });

  test('should keep chart rendered after adding series', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create window
    await page.click('[data-testid="graph-fab"]');
    await expect(page.locator('[data-testid="floating-graph-window"]')).toBeVisible();
    
    const chartContainer = page.locator('.recharts-wrapper').first();
    await expect(chartContainer).toBeVisible();
    
    await page.getByRole('button', { name: 'Quick Add Series' }).click();
    
    // Verify chart updates (2 series now visible)
    await expect(page.locator('[data-testid^="series-item-"]')).toHaveCount(2);
    
    // Verify chart container still visible (chart re-rendered with new data)
    await expect(chartContainer).toBeVisible();
  });
});
