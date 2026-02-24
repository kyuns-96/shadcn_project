import { test, expect } from '@playwright/test';
import { encodeColumnsForNode } from './utils/graph-url-helper';

// ──────────────────────────────────────────────────────────────────────
// Node-compatible encoders for Power / Timing URL params
// (mirror encodePowerDoes / encodeTimingRows from src/hooks/useURLSync/utils.ts)
// ──────────────────────────────────────────────────────────────────────

const COMPRESS_MAP: Record<string, string> = {
  id: 'i', label: 'l', PROJECT_NAME: 'p', BLOCK: 'b',
  NET_VER: 'n', REVISION: 'r', ECO_NUM: 'e',
  POWER_SCENARIO: 's', TIMING_SCENARIO: 't', REVISION_MODE: 'm',
  AVAILABLE_SCENARIOS: 'a', AVAILABLE_TIMING_SCENARIOS: 'at',
};

function nodeEncode(data: object[]): string {
  const compressed = data.map(obj => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[COMPRESS_MAP[k] ?? k] = v;
    }
    return out;
  });
  return Buffer.from(encodeURIComponent(JSON.stringify(compressed)), 'utf-8').toString('base64');
}

// ──────────────────────────────────────────────────────────────────────
// DoE fixtures
// ──────────────────────────────────────────────────────────────────────

const DOE_A = {
  id: 'doe_a', label: 'Alpha',
  PROJECT_NAME: 'Proj1', BLOCK: 'BlkA', NET_VER: 'v1',
  REVISION: 'r1', ECO_NUM: 'E1',
  POWER_SCENARIO: 'tt_0.85v_25c', TIMING_SCENARIO: 'tt_0.85v_25c',
  REVISION_MODE: 'PRE',
};

const DOE_B = {
  id: 'doe_b', label: 'Beta',
  PROJECT_NAME: 'Proj2', BLOCK: 'BlkB', NET_VER: 'v2',
  REVISION: 'r2', ECO_NUM: 'E2',
  POWER_SCENARIO: 'tt_0.85v_25c', TIMING_SCENARIO: 'tt_0.85v_25c',
  REVISION_MODE: 'PRE',
};

function createQorUrl(): string {
  return `/?page=qor-compare&columns=${encodeColumnsForNode([DOE_A, DOE_B])}`;
}

function createPowerUrl(): string {
  return `/?page=power&power_does=${nodeEncode([DOE_A, DOE_B])}`;
}

function createTimingUrl(): string {
  return `/?page=timing&timing_rows=${nodeEncode([DOE_A, DOE_B])}`;
}

// ──────────────────────────────────────────────────────────────────────
// Shared helpers
// ──────────────────────────────────────────────────────────────────────

type PwPage = import('@playwright/test').Page;

async function waitForDoERows(page: PwPage) {
  await expect(page.locator('[data-testid="doe-row-doe_a"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="doe-row-doe_b"]')).toBeVisible({ timeout: 10000 });
}

async function dragHandleAToB(page: PwPage) {
  const handleBox = await page.locator('[data-testid="doe-drag-handle-doe_a"]').boundingBox();
  const targetBox = await page.locator('[data-testid="doe-row-doe_b"]').boundingBox();
  expect(handleBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    targetBox!.x + targetBox!.width / 2,
    targetBox!.y + targetBox!.height / 2 + 10,
    { steps: 20 },
  );
  await page.mouse.up();
  await page.waitForTimeout(300);
}

async function openRenameInputForDoeA(page: PwPage) {
  // Pencil button has no data-testid; it's a <button> sibling after the name <span>
  await page.locator('[data-testid="doe-name-doe_a"]').hover();
  await page.locator('[data-testid="doe-name-doe_a"] + button').click({ force: true });
  await expect(page.locator('[data-testid="doe-rename-input-doe_a"]')).toBeVisible({ timeout: 5000 });
}

// ──────────────────────────────────────────────────────────────────────
// Tests: QOR page — drag reorder
// ──────────────────────────────────────────────────────────────────────

test.describe('DoE Drag Reorder — QOR', () => {
  test('drag reorder changes DOM order', async ({ page }) => {
    await page.goto(createQorUrl());
    await waitForDoERows(page);

    await dragHandleAToB(page);

    const rows = page.locator('[data-testid^="doe-row-"]');
    expect(await rows.first().getAttribute('data-testid')).toBe('doe-row-doe_b');
  });

  test('URL captures reordered state; reload restores order', async ({ page }) => {
    await page.goto(createQorUrl());
    await waitForDoERows(page);

    await dragHandleAToB(page);

    const url = page.url();
    expect(url).toContain('columns=');

    await page.goto(url);
    await waitForDoERows(page);

    const rows = page.locator('[data-testid^="doe-row-"]');
    expect(await rows.first().getAttribute('data-testid')).toBe('doe-row-doe_b');
  });

  test('keyboard reorder (Space/ArrowDown/Space) changes order', async ({ page }) => {
    await page.goto(createQorUrl());
    await waitForDoERows(page);

    const handle = page.locator('[data-testid="doe-drag-handle-doe_a"]');
    await handle.focus();
    await page.waitForTimeout(100);
    await handle.press('Space');
    await page.waitForTimeout(100);
    await handle.press('ArrowDown');
    await page.waitForTimeout(100);
    await handle.press('Space');
    await page.waitForTimeout(300);

    const rows = page.locator('[data-testid^="doe-row-"]');
    expect(await rows.first().getAttribute('data-testid')).toBe('doe-row-doe_b');
  });
});

// ──────────────────────────────────────────────────────────────────────
// Tests: Rename
// ──────────────────────────────────────────────────────────────────────

test.describe('DoE Rename', () => {
  test('rename via pencil → Enter commits new label', async ({ page }) => {
    await page.goto(createQorUrl());
    await waitForDoERows(page);

    await openRenameInputForDoeA(page);
    const input = page.locator('[data-testid="doe-rename-input-doe_a"]');
    await input.fill('AlphaRenamed');
    await input.press('Enter');

    await expect(page.locator('[data-testid="doe-name-doe_a"]')).toHaveText('AlphaRenamed');
  });

  test('rename → Escape cancels, original label retained', async ({ page }) => {
    await page.goto(createQorUrl());
    await waitForDoERows(page);

    await openRenameInputForDoeA(page);
    const input = page.locator('[data-testid="doe-rename-input-doe_a"]');
    await input.fill('NewName');
    await input.press('Escape');

    await expect(page.locator('[data-testid="doe-name-doe_a"]')).toHaveText('Alpha');
  });

  test('URL captures renamed label; reload restores it', async ({ page }) => {
    await page.goto(createQorUrl());
    await waitForDoERows(page);

    await openRenameInputForDoeA(page);
    const input = page.locator('[data-testid="doe-rename-input-doe_a"]');
    await input.fill('AlphaRenamed');
    await input.press('Enter');
    await expect(page.locator('[data-testid="doe-name-doe_a"]')).toHaveText('AlphaRenamed');

    const url = page.url();
    expect(url).toContain('columns=');

    await page.goto(url);
    await expect(page.locator('[data-testid="doe-name-doe_a"]')).toHaveText('AlphaRenamed');
  });
});

// ──────────────────────────────────────────────────────────────────────
// Tests: Reorder on Power + Timing pages
// ──────────────────────────────────────────────────────────────────────

test.describe('DoE Drag Reorder — Power page', () => {
  test('drag reorder changes DOM order on power page', async ({ page }) => {
    await page.goto(createPowerUrl());
    await waitForDoERows(page);

    await dragHandleAToB(page);

    const rows = page.locator('[data-testid^="doe-row-"]');
    expect(await rows.first().getAttribute('data-testid')).toBe('doe-row-doe_b');
  });
});

test.describe('DoE Drag Reorder — Timing page', () => {
  test('drag reorder changes DOM order on timing page', async ({ page }) => {
    await page.goto(createTimingUrl());
    await waitForDoERows(page);

    await dragHandleAToB(page);

    const rows = page.locator('[data-testid^="doe-row-"]');
    expect(await rows.first().getAttribute('data-testid')).toBe('doe-row-doe_b');
  });
});
