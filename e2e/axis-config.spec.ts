import { test, expect } from '@playwright/test';
import { createSeededTestUrl } from './utils/graph-url-helper';

test.describe('Axis Configuration', () => {
  test('should change X axis to doeMetadata', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create a graph window
    await page.click('[data-testid="graph-fab"]');
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
    
    // Open X axis dropdown
    await page.click('[data-testid="x-axis-select"]');
    
    // Wait for dropdown to be visible
    await expect(page.locator('[role="combobox"][aria-label="X-Axis"]')).toHaveAttribute('aria-expanded', 'true');
    
    // Select a doeMetadata option (label) - use cmdk-item selector
    await page.click('[cmdk-item]:has-text("label")');
    
    // Verify dropdown closed
    await expect(page.locator('[role="combobox"][aria-label="X-Axis"]')).toHaveAttribute('aria-expanded', 'false');
    
    // Verify X-axis button shows selected value
    await expect(page.locator('[data-testid="x-axis-select"]')).toContainText('label');
  });

  test('should change X axis to metric', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create a graph window
    await page.click('[data-testid="graph-fab"]');
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
    
    // Open X axis dropdown
    await page.click('[data-testid="x-axis-select"]');
    
    // Wait for dropdown to be visible
    await expect(page.locator('[role="combobox"][aria-label="X-Axis"]')).toHaveAttribute('aria-expanded', 'true');
    
    // Select a metric option - find items under "Metrics" heading
    const metricsHeading = page.locator('[cmdk-group-heading]:has-text("Metrics")');
    await expect(metricsHeading).toBeVisible();
    
    // Get parent group and find first metric item
    const metricsGroup = metricsHeading.locator('xpath=ancestor::*[@cmdk-group]');
    const firstMetric = metricsGroup.locator('[cmdk-item]').first();
    await firstMetric.click();
    
    // Verify dropdown closed
    await expect(page.locator('[role="combobox"][aria-label="X-Axis"]')).toHaveAttribute('aria-expanded', 'false');
    
    // Verify X-axis button shows a metric (contains " - " from formatMetricForDisplay)
    const xAxisButton = page.locator('[data-testid="x-axis-select"]');
    const buttonText = await xAxisButton.textContent();
    expect(buttonText).toContain(' - ');
  });

  test('should change Y axis configuration', async ({ page }) => {
    const seededUrl = createSeededTestUrl('qor-compare');
    await page.goto(seededUrl);
    
    // Create a graph window
    await page.click('[data-testid="graph-fab"]');
    await expect(page.locator('[data-testid="floating-graph-window"]')).toHaveCount(1);
    
    // Get initial Y-axis value
    const yAxisButton = page.locator('[data-testid="y-axis-select"]');
    const initialYAxis = await yAxisButton.textContent();
    
    // Open Y axis dropdown
    await page.click('[data-testid="y-axis-select"]');
    
    // Wait for dropdown to be visible
    await expect(page.locator('[role="combobox"][aria-label="Y-Axis"]')).toHaveAttribute('aria-expanded', 'true');
    
    // Select a different metric (second option to ensure it's different from default)
    const metricsHeading = page.locator('[cmdk-group-heading]:has-text("Metrics")');
    await expect(metricsHeading).toBeVisible();
    
    const metricsGroup = metricsHeading.locator('xpath=ancestor::*[@cmdk-group]');
    const secondMetric = metricsGroup.locator('[cmdk-item]').nth(1);
    await secondMetric.click();
    
    // Verify dropdown closed
    await expect(page.locator('[role="combobox"][aria-label="Y-Axis"]')).toHaveAttribute('aria-expanded', 'false');
    
    // Verify Y-axis changed
    const newYAxis = await yAxisButton.textContent();
    expect(newYAxis).not.toBe(initialYAxis);
    expect(newYAxis).toContain(' - ');
  });
});
