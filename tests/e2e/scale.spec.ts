import { expect, test } from '@playwright/test';
import type { CatalogIndex, LanguageDetail } from '../../src/data/schema';

test('keeps a large catalog bounded while retaining a selected neighborhood', async ({ page }) => {
  const index: CatalogIndex = { schemaVersion: 1, bounds: [1950, 2026], languages: [], milestones: [], influences: [] };
  for (let n = 0; n < 1000; n++) {
    index.languages.push({ id: `lang-${n}`, name: `Language ${n}`, aliases: [], introduction: `intro-${n}`, summary: 'Synthetic performance fixture', paradigms: ['Functional'] });
    index.milestones.push({ id: `intro-${n}`, language: `lang-${n}`, date: { year: 1950 + n % 70 }, title: 'Introduction', kind: 'introduction' });
  }
  for (let n = 0; n < 10000; n++) index.influences.push({ id: `edge-${n}`, source: `lang-${n % 1000}`, destination: `intro-${(n + 1 + Math.floor(n / 1000)) % 1000}`, title: 'Synthetic influence', evidence: 'documented' });
  const detail: LanguageDetail = { schemaVersion: 1, language: index.languages[500], milestones: [{ ...index.milestones[500], explanation: 'Synthetic milestone', citations: ['test-source'] }], influences: [], sources: [{ id: 'test-source', title: 'Test source', author: 'Test fixture', url: 'https://example.org', section: 'Fixture' }] };
  await page.route('**/data/index.json', route => route.fulfill({ json: index }));
  await page.route('**/data/languages/lang-500.json', route => route.fulfill({ json: detail }));
  await page.goto('/?language=lang-500');
  await expect(page.getByTestId('comparison-panel')).toBeVisible();
  await expect(page.getByTestId('timeline-row').first()).toBeAttached();
  expect(await page.getByTestId('timeline-row').count()).toBeLessThan(22);
  expect(await page.locator('.influence-hit').count()).toBeLessThanOrEqual(80);
  expect(await page.locator('.influence-hit').count()).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Close details' }).click();
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Language list pages' })).toBeVisible();
  expect(await page.locator('.accessible-list section').count()).toBe(20);
});
