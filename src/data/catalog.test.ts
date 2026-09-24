// @vitest-environment node
import { expect, it } from 'vitest';
import { readCatalog } from '../../scripts/catalog';
import { makeIndex } from './schema';
import { buildGraph, defaultState, selectAtlas } from '../core/exploration';

it('validates every historical record and builds the complete initial catalog', async () => {
  const { catalog, bundles } = await readCatalog();
  const initialLanguages = ['fortran', 'lisp', 'cobol', 'algol', 'apl', 'basic', 'simula', 'pascal', 'c', 'smalltalk', 'prolog', 'ml', 'scheme', 'sql', 'ada', 'cpp', 'objective-c', 'erlang', 'perl', 'haskell', 'python', 'lua', 'java', 'javascript', 'csharp', 'scala', 'go', 'rust', 'kotlin', 'swift'];
  expect(catalog.languages.map(l => l.id)).toEqual(expect.arrayContaining(initialLanguages));
  expect(catalog.milestones.length).toBeGreaterThanOrEqual(90);
  expect(bundles.every(b => b.milestones.length >= 3)).toBe(true);
  expect(new Set(catalog.sources.map(s => s.url)).size).toBeGreaterThan(30);
  const index = makeIndex(catalog), graph = buildGraph(index);
  const selected = selectAtlas(index, graph, { ...defaultState(index), language: 'rust', from: 2015, to: 2015 });
  expect(new Set(selected.edges.map(i => i.source)).size).toBeGreaterThanOrEqual(3);
  expect(selected.rows.find(r => r.language.id === 'haskell')?.context).toBe(true);
});
