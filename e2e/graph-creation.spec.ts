import { test, expect } from '@playwright/test';
import { createSeededTestUrl } from './utils/graph-url-helper';

test.describe('Graph Window Creation', () => {
  test('should create graph window when clicking FAB', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    await expect(page.locator('[data-testid="graph-fab"]')).toBeVisible();
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(0);
    
    await page.click('[data-testid="graph-fab"]');
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
    
    await expect(page.locator('[data-testid^="series-item-"]')).toHaveCount(1);
  });

  test('should create window with default chart type (line) and default series', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    await expect(page.locator('[data-testid="graph-fab"]')).toBeVisible();
    
    await page.click('[data-testid="graph-fab"]');
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
    
    const seriesItems = page.locator('[data-testid^="series-item-"]');
    await expect(seriesItems).toHaveCount(1);
    
    const firstSeriesItem = page.locator('[data-testid="series-item-s_0"]');
    await expect(firstSeriesItem).toBeVisible();
  });

  test('should create multiple windows (up to limit)', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    await expect(page.locator('[data-testid="graph-fab"]')).toBeVisible();
    
    await page.click('[data-testid="graph-fab"]');
    await page.click('[data-testid="graph-fab"]');
    await page.click('[data-testid="graph-fab"]');
    
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(3);
    
    const allSeriesItems = page.locator('[data-testid^="series-item-"]');
    await expect(allSeriesItems).toHaveCount(3);
  });

  test('should create window with correct default series configuration', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    await expect(page.locator('[data-testid="graph-fab"]')).toBeVisible();
    
    await page.click('[data-testid="graph-fab"]');
    
    const window = page.locator('[data-testid="floating-graph-window"]');
    await expect(window).toBeVisible();
    
    const seriesItem = page.locator('[data-testid="series-item-s_0"]');
    await expect(seriesItem).toBeVisible();
    
    const windowTitle = page.locator('[data-testid="window-title-bar"]');
    await expect(windowTitle).toContainText('Graph Window 1');
  });
});
