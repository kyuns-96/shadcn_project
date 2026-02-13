import { test, expect } from '@playwright/test';
import { createSeededTestUrl } from './utils/graph-url-helper';

test.describe('Window Interactions', () => {
  test('should minimize and restore window', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create a window
    await page.click('[data-testid="graph-fab"]');
    
    const window = page.locator('[data-testid="floating-graph-window"]');
    await expect(window).toBeVisible();
    
    const chartArea = window.locator('.recharts-wrapper').first();
    await expect(chartArea).toBeVisible();
    
    // Click minimize button
    const minimizeButton = window.locator('[data-testid="minimize-button"]');
    await minimizeButton.click();
    
    await expect(window.locator('.recharts-wrapper')).toHaveCount(0);
    
    // Click restore button (minimize button toggles)
    await minimizeButton.click();
    
    await expect(chartArea).toBeVisible();
  });

  test('should clone window', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create initial window
    await page.click('[data-testid="graph-fab"]');
    
    // Verify 1 window exists
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
    
    // Click clone button
    const cloneButton = page.locator('[data-testid="clone-button"]');
    await cloneButton.click();
    
    // Verify 2 windows exist
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(2);
  });

  test('should close window', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create a window
    await page.click('[data-testid="graph-fab"]');
    
    // Verify 1 window exists
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
    
    // Click close button
    const closeButton = page.locator('[data-testid="close-button"]');
    await closeButton.click();
    
    // Verify 0 windows exist
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(0);
  });

  test('should move window by dragging title bar', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create a window
    await page.click('[data-testid="graph-fab"]');
    
    const window = page.locator('[data-testid="floating-graph-window"]');
    await expect(window).toBeVisible();
    
    // Get initial position
    const initialBox = await window.boundingBox();
    expect(initialBox).not.toBeNull();
    
    // Drag window by title bar using mouse events
    const dragHandle = window.locator('[data-testid="window-title-bar"]');
    const handleBox = await dragHandle.boundingBox();
    expect(handleBox).not.toBeNull();
    
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2 + 100, handleBox!.y + handleBox!.height / 2 + 100);
    await page.mouse.up();
    
    // Wait for position to update
    await page.waitForTimeout(100);
    
    // Get final position
    const finalBox = await window.boundingBox();
    expect(finalBox).not.toBeNull();
    
    const deltaX = Math.abs(finalBox!.x - initialBox!.x);
    const deltaY = Math.abs(finalBox!.y - initialBox!.y);
    expect(deltaX).toBeGreaterThanOrEqual(50);
    expect(deltaY).toBeGreaterThanOrEqual(30);
  });

  test('should resize window', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create a window
    await page.click('[data-testid="graph-fab"]');
    
    const window = page.locator('[data-testid="floating-graph-window"]');
    await expect(window).toBeVisible();
    
    // Get initial size
    const initialBox = await window.boundingBox();
    expect(initialBox).not.toBeNull();
    
    // Drag bottom-right corner to resize using mouse events
    // Rnd creates resize handles at the corners/edges
    await page.mouse.move(initialBox!.x + initialBox!.width - 5, initialBox!.y + initialBox!.height - 5);
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + initialBox!.width + 100, initialBox!.y + initialBox!.height + 100);
    await page.mouse.up();
    
    // Wait for resize to complete
    await page.waitForTimeout(100);
    
    // Get final size
    const finalBox = await window.boundingBox();
    expect(finalBox).not.toBeNull();
    
    // Verify size increased by at least 50px
    const deltaWidth = finalBox!.width - initialBox!.width;
    const deltaHeight = finalBox!.height - initialBox!.height;
    expect(deltaWidth).toBeGreaterThanOrEqual(50);
    expect(deltaHeight).toBeGreaterThanOrEqual(50);
  });
});
