import { expect, it } from 'vitest';
import type { CatalogIndex } from '../data/schema';
import { buildGraph, defaultState, selectAtlas } from './exploration';
import { visibleRows } from './layout';

it('selects a neighborhood in a 1,000-language, 10,000-relationship catalog', () => {
  const index: CatalogIndex = { schemaVersion: 1, bounds: [1950, 2026], languages: [], milestones: [], influences: [] };
  for (let n = 0; n < 1000; n++) {
    index.languages.push({ id: `lang-${n}`, name: `Language ${n}`, aliases: [], introduction: `intro-${n}`, summary: 'Synthetic load fixture', paradigms: ['Functional'] });
    index.milestones.push({ id: `intro-${n}`, language: `lang-${n}`, date: { year: 1950 + n % 70 }, kind: 'introduction', title: 'Introduction' });
  }
  for (let n = 0; n < 10000; n++) index.influences.push({ id: `edge-${n}`, source: `lang-${n % 1000}`, destination: `intro-${(n + 1 + Math.floor(n / 1000)) % 1000}`, title: 'Synthetic connection', evidence: 'documented' });
  const graph = buildGraph(index);
  const selected = selectAtlas(index, graph, { ...defaultState(index), language: 'lang-500' });
  expect(index.influences).toHaveLength(10000);
  expect(selected.edges).toHaveLength(20);
  const range = visibleRows(selected.rows.length, 5000, 540);
  expect(range.end - range.start).toBeLessThanOrEqual(18);
  expect(selected.matchCount).toBe(1000);
});
