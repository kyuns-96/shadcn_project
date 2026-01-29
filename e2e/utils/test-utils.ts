import { Page } from '@playwright/test';

/**
 * Wait for graph components to load and be ready for interaction
 */
export async function waitForGraphToLoad(page: Page): Promise<void> {
  // Wait for the graph FAB to be visible (indicates graph system is ready)
  await page.waitForSelector('[data-testid="graph-fab"]', { state: 'visible' });
}

/**
 * Count the number of visible graph windows
 */
export async function getGraphWindowCount(page: Page): Promise<number> {
  const windows = await page.locator('[data-testid="floating-graph-window"]').all();
  return windows.length;
}
