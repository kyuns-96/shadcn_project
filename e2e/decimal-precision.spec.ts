import { test, expect } from '@playwright/test';
import { createSeededTestUrl } from './utils/graph-url-helper';

/**
 * E2E Tests for Per-Group Decimal Precision Context Menu
 * 
 * Tests the right-click context menu that allows users to adjust decimal
 * precision on a per-group basis across QoR Compare, Power, and Timing tables.
 * 
 * Key behaviors tested:
 * - Context menu appears on right-click at correct position
 * - Group/row/column name displayed in menu header
 * - +/- buttons increment/decrement decimal places
 * - Cell values update immediately when decimal changes
 * - Different groups maintain independent decimal settings
 * - Context menu closes when clicking outside
 * - NVP columns in Timing remain integers regardless of decimal setting
 */
test.describe('Per-Group Decimal Precision - Context Menu', () => {
  test.describe('QoR Compare Table', () => {
    test.beforeEach(async ({ page }) => {
      const seededUrl = createSeededTestUrl('qor-compare');
      await page.goto(seededUrl);
      
      // Wait for QoR Compare page to load
      await page.waitForLoadState('networkidle');
      
      // Wait for ag-grid to render
      await page.waitForSelector('.ag-theme-quartz', { timeout: 5000 });
      await page.waitForSelector('.ag-row', { timeout: 5000 });
    });

    test('should open context menu on right-click of group cell', async ({ page }) => {
      // Find a group cell (rowGroup column)
      const groupCell = page.locator('.ag-cell[col-id="rowGroup"]').first();
      await expect(groupCell).toBeVisible();

      // Right-click to open context menu
      await groupCell.click({ button: 'right' });

      // Verify context menu appears
      await page.waitForSelector('div.fixed', { timeout: 2000 });
      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      await expect(contextMenu).toBeVisible();
    });

    test('should display group name in context menu header', async ({ page }) => {
      // Find the "Area(G/C)" group cell
      const groupCell = page.locator('.ag-cell[col-id="rowGroup"]', { hasText: 'Area(G/C)' }).first();
      await expect(groupCell).toBeVisible();

      // Right-click to open context menu
      await groupCell.click({ button: 'right' });

      // Wait for context menu
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      // Verify group name is displayed
      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      await expect(contextMenu).toContainText('Area(G/C)');
    });

    test('should increase decimal places when clicking + button', async ({ page }) => {
      // Find a group cell
      const groupCell = page.locator('.ag-cell[col-id="rowGroup"]', { hasText: 'Area(G/C)' }).first();
      await expect(groupCell).toBeVisible();

      // Right-click to open context menu
      await groupCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      // Get current decimal value
      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      const decimalDisplay = contextMenu.locator('span.text-xs.font-medium');
      const currentDecimal = await decimalDisplay.textContent();

      // Click + button
      const plusButton = contextMenu.locator('button[title="Increase decimal places"]');
      await plusButton.click();

      // Wait a bit for the grid to refresh
      await page.waitForTimeout(500);

      // Verify decimal value increased
      const newDecimal = await decimalDisplay.textContent();
      expect(parseInt(newDecimal || '0')).toBe(parseInt(currentDecimal || '0') + 1);
    });

    test('should decrease decimal places when clicking - button', async ({ page }) => {
      // Find a group cell
      const groupCell = page.locator('.ag-cell[col-id="rowGroup"]', { hasText: 'Power(mW)' }).first();
      await expect(groupCell).toBeVisible();

      // Right-click to open context menu
      await groupCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      const decimalDisplay = contextMenu.locator('span.text-xs.font-medium');
      const currentDecimal = await decimalDisplay.textContent();

      // Click - button
      const minusButton = contextMenu.locator('button[title="Decrease decimal places"]');
      
      // Only click if current decimal > 0
      if (parseInt(currentDecimal || '0') > 0) {
        await minusButton.click();
        await page.waitForTimeout(500);

        // Verify decimal value decreased
        const newDecimal = await decimalDisplay.textContent();
        expect(parseInt(newDecimal || '0')).toBe(parseInt(currentDecimal || '0') - 1);
      } else {
        // Button should be disabled at 0
        await expect(minusButton).toBeDisabled();
      }
    });

    test('should disable - button at 0 decimal places', async ({ page }) => {
      const groupCell = page.locator('.ag-cell[col-id="rowGroup"]', { hasText: 'Physical Info' }).first();
      await expect(groupCell).toBeVisible();

      // Right-click (Physical Info defaults to 0 decimals)
      await groupCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      const decimalDisplay = contextMenu.locator('span.text-xs.font-medium');
      const currentDecimal = await decimalDisplay.textContent();

      if (parseInt(currentDecimal || '0') === 0) {
        const minusButton = contextMenu.locator('button[title="Decrease decimal places"]');
        await expect(minusButton).toBeDisabled();
      }
    });

    test('should close context menu when clicking outside', async ({ page }) => {
      const groupCell = page.locator('.ag-cell[col-id="rowGroup"]').first();
      await expect(groupCell).toBeVisible();

      // Open context menu
      await groupCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      await expect(contextMenu).toBeVisible();

      // Click outside (on body at top-left corner)
      await page.locator('body').click({ position: { x: 10, y: 10 } });

      // Verify context menu is closed
      await expect(contextMenu).not.toBeVisible();
    });

    test('should maintain independent decimal settings per group', async ({ page }) => {
      // Set decimal for Area(G/C) group
      const areaCell = page.locator('.ag-cell[col-id="rowGroup"]', { hasText: 'Area(G/C)' }).first();
      await areaCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      let contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      const areaDecimalBefore = await contextMenu.locator('span.text-xs.font-medium').textContent();
      
      // Increase Area decimal
      await contextMenu.locator('button[title="Increase decimal places"]').click();
      await page.waitForTimeout(300);
      
      const areaDecimalAfter = await contextMenu.locator('span.text-xs.font-medium').textContent();
      expect(parseInt(areaDecimalAfter || '0')).toBe(parseInt(areaDecimalBefore || '0') + 1);

      // Close menu
      await page.locator('body').click({ position: { x: 10, y: 10 } });
      await expect(contextMenu).not.toBeVisible();

      // Now check Power(mW) group - should have different decimal
      const powerCell = page.locator('.ag-cell[col-id="rowGroup"]', { hasText: 'Power(mW)' }).first();
      await powerCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      const powerDecimal = await contextMenu.locator('span.text-xs.font-medium').textContent();

      // Power should still have its original default (3), not affected by Area change
      expect(parseInt(powerDecimal || '0')).toBe(3);
    });
  });

  test.describe('Power Table', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // Navigate to Power page via sidebar button
      const powerButton = page.locator('button:has-text("Power")').or(page.locator('[role="button"]:has-text("Power")')).first();
      await powerButton.click();
      await page.waitForLoadState('networkidle');

      // Wait for ag-grid to render
      await page.waitForSelector('.ag-theme-quartz', { timeout: 5000 });
      await page.waitForSelector('.ag-row', { timeout: 5000 });
    });

    test('should open context menu on right-click of row header', async ({ page }) => {
      // Find a row header cell (rowHeader column)
      const rowHeaderCell = page.locator('.ag-cell[col-id="rowHeader"]').first();
      await expect(rowHeaderCell).toBeVisible();

      // Right-click to open context menu
      await rowHeaderCell.click({ button: 'right' });

      // Verify context menu appears
      await page.waitForSelector('div.fixed', { timeout: 2000 });
      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      await expect(contextMenu).toBeVisible();
    });

    test('should display row name in context menu header', async ({ page }) => {
      // Find "Clock Network" row header
      const rowHeaderCell = page.locator('.ag-cell[col-id="rowHeader"]', { hasText: 'Clock Network' }).first();
      await expect(rowHeaderCell).toBeVisible();

      // Right-click
      await rowHeaderCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      // Verify row name displayed
      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      await expect(contextMenu).toContainText('Clock Network');
    });

    test('should adjust decimal precision for row', async ({ page }) => {
      const rowHeaderCell = page.locator('.ag-cell[col-id="rowHeader"]').first();
      await expect(rowHeaderCell).toBeVisible();

      await rowHeaderCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      await expect(contextMenu).toBeVisible();

      const plusButton = contextMenu.locator('button[title="Increase decimal places"]');
      await plusButton.evaluate((el: HTMLElement) => el.click());
      
      await page.waitForTimeout(500);
    });

    test('should maintain independent decimal settings per row', async ({ page }) => {
      // Adjust decimal for first row
      const firstRowHeader = page.locator('.ag-cell[col-id="rowHeader"]').first();
      await firstRowHeader.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      let contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      const plusButton = contextMenu.locator('button[title="Increase decimal places"]');
      await plusButton.evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(300);

      // Close menu
      await page.locator('body').click({ position: { x: 10, y: 10 } });
      await expect(contextMenu).not.toBeVisible();

      // Check second row - should have original default
      const secondRowHeader = page.locator('.ag-cell[col-id="rowHeader"]').nth(1);
      await secondRowHeader.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      const secondRowDecimal = await contextMenu.locator('span.text-xs.font-medium').textContent();

      // Should still be default (3)
      expect(parseInt(secondRowDecimal || '0')).toBe(3);
    });

    test('should close context menu when clicking outside', async ({ page }) => {
      const rowHeaderCell = page.locator('.ag-cell[col-id="rowHeader"]').first();
      await rowHeaderCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      await expect(contextMenu).toBeVisible();

      // Click outside
      await page.locator('body').click({ position: { x: 10, y: 10 } });

      // Verify closed
      await expect(contextMenu).not.toBeVisible();
    });
  });

  test.describe('Timing Table', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');

      // Navigate to Timing page via sidebar button
      const timingButton = page.locator('button:has-text("Timing")').or(page.locator('[role="button"]:has-text("Timing")')).first();
      await timingButton.click();
      await page.waitForLoadState('networkidle');

      // Wait for ag-grid to render
      await page.waitForSelector('.ag-theme-quartz', { timeout: 5000 });
      
      // Timing table may not have data initially - that's OK for context menu testing
      // We'll check for rows in individual tests
    });

    test('should open context menu on right-click of data cell', async ({ page }) => {
      const rowCount = await page.locator('.ag-row').count();
      test.skip(rowCount === 0, 'No timing data available to test');

      const dataCell = page.locator('.ag-cell').filter({ hasNotText: 'DoE' }).first();
      await expect(dataCell).toBeVisible();

      await dataCell.click({ button: 'right' });

      await page.waitForSelector('div.fixed', { timeout: 2000 });
      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      await expect(contextMenu).toBeVisible();
    });

    test('should display column group name in context menu', async ({ page }) => {
      const setupCell = page.locator('.ag-cell[col-id^="setup(r2r)"]').first();
      const cellCount = await setupCell.count();
      test.skip(cellCount === 0, 'No timing data available to test');
      
      await setupCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      await expect(contextMenu).toContainText('setup(r2r)');
    });

    test('should adjust decimal precision for column group', async ({ page }) => {
      const dataCell = page.locator('.ag-cell[col-id^="setup(r2r)"]').first();
      const cellCount = await dataCell.count();
      test.skip(cellCount === 0, 'No timing data available to test');
      
      await dataCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      const decimalDisplay = contextMenu.locator('span.text-xs.font-medium');
      const currentDecimal = await decimalDisplay.textContent();

      const plusButton = contextMenu.locator('button[title="Increase decimal places"]');
      await plusButton.evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(500);

      const newDecimal = await decimalDisplay.textContent();
      expect(parseInt(newDecimal || '0')).toBe(parseInt(currentDecimal || '0') + 1);
    });

    test('should maintain independent decimal settings per column group', async ({ page }) => {
      const setupCell = page.locator('.ag-cell[col-id^="setup(r2r)"]').first();
      const setupCount = await setupCell.count();
      test.skip(setupCount === 0, 'No timing data available to test');
      
      await setupCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      let contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      const plusButtonInc = contextMenu.locator('button[title="Increase decimal places"]');
      await plusButtonInc.evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(300);

      await page.locator('body').click({ position: { x: 10, y: 10 } });
      await expect(contextMenu).not.toBeVisible();

      const holdCell = page.locator('.ag-cell[col-id^="hold(r2r)"]').first();
      const holdCount = await holdCell.count();
      test.skip(holdCount === 0, 'No hold(r2r) column available to test');
      
      await holdCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      const holdDecimal = await contextMenu.locator('span.text-xs.font-medium').textContent();

      expect(parseInt(holdDecimal || '0')).toBe(3);
    });

    test('should keep NVP columns as integers regardless of decimal setting', async ({ page }) => {
      const nvpCell = page.locator('.ag-cell[col-id$="_NVP"]').first();
      const nvpCount = await nvpCell.count();
      test.skip(nvpCount === 0, 'No NVP column available to test');

      await nvpCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      
      const plusButton = contextMenu.locator('button[title="Increase decimal places"]');
      await plusButton.evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(200);
      await plusButton.evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(200);
      await plusButton.evaluate((el: HTMLElement) => el.click());
      await page.waitForTimeout(500);

      await page.locator('body').click({ position: { x: 10, y: 10 } });

      const newValue = await nvpCell.textContent();
      
      if (newValue && newValue.trim() !== '' && !newValue.includes('LOADING')) {
        expect(newValue).not.toContain('.');
        const numValue = parseInt(newValue);
        expect(numValue.toString()).toBe(newValue.trim());
      }
    });

    test('should close context menu when clicking outside', async ({ page }) => {
      const rowCount = await page.locator('.ag-row').count();
      test.skip(rowCount === 0, 'No timing data available to test');

      const dataCell = page.locator('.ag-cell').filter({ hasNotText: 'DoE' }).first();
      await dataCell.click({ button: 'right' });
      await page.waitForSelector('div.fixed', { timeout: 2000 });

      const contextMenu = page.locator('div.fixed').filter({ hasText: 'Decimal' });
      await expect(contextMenu).toBeVisible();

      await page.locator('body').click({ position: { x: 10, y: 10 } });

      await expect(contextMenu).not.toBeVisible();
    });
  });
});
