import { test, expect } from '@playwright/test';

test('capture qor compare with data', async ({ page }) => {
  await page.goto('/?page=qor-compare');

  await expect(page.locator('#mode-post')).toBeChecked();

  await expect(page.locator('button[role="combobox"]').first()).toBeVisible();
  
  const comboboxes = page.locator('button[role="combobox"]');
  
  await comboboxes.nth(0).click();
  await page.getByRole('option', { name: 'TestProject1' }).click();

  await comboboxes.nth(1).click();
  await page.getByRole('option', { name: 'BlockA' }).click();

  await comboboxes.nth(2).click();
  await page.getByRole('option', { name: 'v1.0' }).click();

  await page.waitForTimeout(1000); 

  await comboboxes.nth(3).click();
  await page.getByRole('option', { name: 'rev1-BE' }).click();

  await page.waitForTimeout(500);

  await comboboxes.nth(4).click();
  await page.getByRole('option', { name: 'ECO001' }).click();

  await page.fill('input[placeholder="DoE Name"]', 'TestDoe');
  await page.keyboard.press('Tab');
  
  const addButton = page.locator('button:has-text("Add")');
  await expect(addButton).toBeEnabled();
  await addButton.click();
  
  console.log("Clicked Add button");

  await page.waitForTimeout(5000); 
  
  const textLocator = page.getByText('TestDoe').first();
  await expect(textLocator).toBeVisible();
  
  await page.screenshot({ path: 'public/screenshots/qor-compare-with-data.png', fullPage: true });
});
