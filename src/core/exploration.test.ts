import { describe, expect, it } from 'vitest';
import { buildGraph, decodeState, defaultState, encodeState, normalizeState, selectAtlas } from './exploration';
import type { CatalogIndex } from '../data/schema';

export const sample: CatalogIndex = {
  schemaVersion: 1, bounds: [1960, 2026],
  languages: [
    { id: 'old', name: 'Older', aliases: ['Ancient'], introduction: 'old-intro', summary: 'Old', paradigms: ['Functional'] },
    { id: 'new', name: 'Newer', aliases: [], introduction: 'new-intro', summary: 'New', paradigms: ['Imperative'] },
  ],
  milestones: [
    { id: 'old-intro', language: 'old', date: { year: 1960 }, title: 'Old introduction', kind: 'introduction' },
    { id: 'new-intro', language: 'new', date: { year: 1990 }, title: 'New introduction', kind: 'introduction' },
    { id: 'new-feature', language: 'new', date: { year: 2000 }, title: 'New feature', kind: 'feature' },
  ],
  influences: [{ id: 'old-new', source: 'old', sourceMilestone: 'old-intro', destination: 'new-feature', title: 'An influence', evidence: 'documented' }],
};
describe('exploration state and selection', () => {
  const graph = buildGraph(sample);
  it('round trips URL state and resolves the destination of an arrow', () => {
    const s = normalizeState({ ...defaultState(sample), influence: 'old-new', view: 'list', query: 'new' }, sample);
    expect(s.language).toBe('new'); expect(s.milestone).toBe('new-feature');
    expect(decodeState(encodeState(s), sample)).toEqual(s);
  });
  it('normalizes malformed parameters without crashing', () => {
    const s = decodeState('?from=garbage&to=9999&language=unknown&influence=oops&paradigm=missing', sample);
    expect(s.from).toBe(1960); expect(s.to).toBe(2026); expect(s.language).toBeUndefined(); expect(s.paradigm).toBe('');
    expect(decodeState('?from=2000&to=1990', sample)).toMatchObject({ from: 1990, to: 2000 });
  });
  it('includes changes to older languages on inclusive range boundaries', () => {
    const s = { ...defaultState(sample), from: 2000, to: 2000 };
    expect(selectAtlas(sample, graph, s).rows.map(r => r.language.id)).toEqual(['new']);
  });
  it('retains offscreen sources as labeled context for selected languages', () => {
    const s = { ...defaultState(sample), from: 2000, to: 2005, language: 'new' };
    const result = selectAtlas(sample, graph, s);
    expect(result.edges).toHaveLength(1);
    expect(result.rows.find(r => r.language.id === 'old')?.context).toBe(true);
  });
  it('searches aliases and handles empty results', () => {
    expect(selectAtlas(sample, graph, { ...defaultState(sample), query: 'ancient' }).matchCount).toBe(1);
    expect(selectAtlas(sample, graph, { ...defaultState(sample), query: 'missing' }).rows).toEqual([]);
  });
  it('limits connections to the focused language and target period', () => {
    expect(selectAtlas(sample, graph, defaultState(sample)).edges).toEqual([]);
    expect(selectAtlas(sample, graph, { ...defaultState(sample), language: 'new', to: 1999 }).edges).toEqual([]);
  });
});
