import { expect, test } from '@playwright/test';

test('loads the atlas, supports search aliases, and handles empty results', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const catalog = await (await page.request.get('/data/index.json')).json();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Every language tells a story.');
  await expect(page.getByText(`${catalog.languages.length} languages`, { exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search languages' }).fill('Golang');
  await expect(page.getByRole('button', { name: 'Explore Go', exact: true })).toBeVisible();
  await page.getByRole('searchbox').fill('a-language-that-does-not-exist');
  await expect(page.getByText('No milestones in this view')).toBeVisible();
  await page.getByRole('button', { name: '↺ Reset' }).click();
  await expect(page.getByRole('searchbox')).toHaveValue('');
  expect(errors).toEqual([]);
});

test('compares multiple influences and opens evidence from a shared selection', async ({ page }) => {
  await page.goto('/?from=2015&to=2015&influence=cpp-rust-1');
  const panel = page.getByTestId('comparison-panel');
  await expect(panel.getByRole('heading', { name: 'Rust', exact: true })).toBeVisible();
  await expect(panel.getByTestId('influence-card')).toHaveCount(4);
  await expect(panel.getByRole('button', { name: /Deterministic resource management/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.getByRole('link', { name: /Influences — The Rust Reference/ }).first()).toHaveAttribute('href', 'https://doc.rust-lang.org/reference/influences.html');
  await panel.getByRole('button', { name: /Types that describe alternatives/ }).click();
  await expect(page).toHaveURL(/influence=ml-rust-1/);
  await page.reload();
  await expect(panel.getByRole('button', { name: /Types that describe alternatives/ })).toHaveAttribute('aria-pressed', 'true');
});

test('filters changes to older languages and reveals offscreen sources', async ({ page }) => {
  await page.goto('/?from=2000&to=2000&language=python');
  const close = page.getByRole('button', { name: 'Close details' });
  // The mobile detail view covers the canvas; closing restores access to its controls.
  if (test.info().project.name === 'mobile') {
    await close.click();
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await expect(page.getByRole('button', { name: 'List comprehensions', exact: true })).toBeVisible();
    return;
  }
  await expect(page.getByRole('button', { name: 'Reveal Haskell' })).toBeVisible();
  await page.getByRole('button', { name: 'Reveal Haskell' }).click();
  await expect(page.getByRole('spinbutton', { name: 'Start year' })).toHaveValue('1990');
  const arrow = page.getByRole('button', { name: 'Haskell → Python: Comprehensions', exact: true });
  await arrow.click();
  const panel = page.getByTestId('comparison-panel');
  await expect(panel.getByRole('button', { name: 'Comprehensions', exact: true })).toBeVisible();
  await panel.getByText('Compare the code').click();
  await expect(panel.locator('pre')).toHaveCount(2);
});

test('restores browser history and keyboard focus when closing details', async ({ page }) => {
  await page.goto('/?q=Python');
  const language = page.getByRole('button', { name: 'Explore Python', exact: true });
  await language.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Python', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(language).toBeFocused();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Python', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Python', exact: true })).toHaveCount(0);
});

test('uses the accessible list and validates manual year entry', async ({ page }) => {
  await page.goto('/?q=Python&view=list');
  await page.getByRole('button', { name: 'List comprehensions', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'List comprehensions', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close details' }).click();
  await page.getByRole('spinbutton', { name: 'Start year' }).fill('2020');
  await page.getByRole('spinbutton', { name: 'End year' }).fill('1990');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('start no later than the end');
});

test('opens methodology and keeps the layout within the viewport', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'About the data' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflows).toBe(false);
});

test('recovers from a failed detail request', async ({ page }) => {
  let failed = false;
  await page.route('**/data/languages/python.json', async route => {
    if (!failed) { failed = true; await route.fulfill({ status: 503, body: 'Unavailable' }); }
    else await route.continue();
  });
  await page.goto('/?language=python');
  await expect(page.getByRole('alert')).toContainText('Could not load');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Ideas that shaped Python' })).toBeVisible();
});

test('uses keyboard range handles and zoom controls', async ({ page }) => {
  await page.goto('/');
  const start = page.getByRole('slider', { name: 'Range start', exact: true });
  await expect(start).toBeVisible();
  const initialFrom = Number(await start.inputValue());
  const initialTo = Number(await page.getByRole('slider', { name: 'Range end', exact: true }).inputValue());
  await start.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('spinbutton', { name: 'Start year' })).toHaveValue(String(initialFrom + 1));
  await page.getByRole('button', { name: 'Zoom in' }).click();
  const from = Number(await page.getByRole('spinbutton', { name: 'Start year' }).inputValue());
  const to = Number(await page.getByRole('spinbutton', { name: 'End year' }).inputValue());
  expect(to - from).toBeLessThan(initialTo - initialFrom - 1);
  await page.getByRole('button', { name: 'Zoom out' }).click();
  const widerFrom = Number(await page.getByRole('spinbutton', { name: 'Start year' }).inputValue());
  const widerTo = Number(await page.getByRole('spinbutton', { name: 'End year' }).inputValue());
  expect(widerTo - widerFrom).toBeGreaterThan(to - from);
});

test('mobile details trap focus and release it when dismissed', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'The desktop profile is a non-modal sidebar.');
  await page.goto('/?q=Rust');
  await page.getByRole('button', { name: 'Explore Rust', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Rust details' });
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Close details' }).focus();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Explore Rust', exact: true })).toBeFocused();
});
