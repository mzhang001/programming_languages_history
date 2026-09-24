import { describe, expect, it } from 'vitest';
import { clusterMilestones, visibleRows, yearScale } from './layout';
import type { MilestoneSummary } from '../data/schema';

describe('timeline layout', () => {
  it('maps years monotonically and handles one-year ranges', () => {
    const x = yearScale(1950, 2020, 900);
    expect(x(1950)).toBeLessThan(x(2020));
    expect(x(1800)).toBe(x(1950));
    expect(Number.isFinite(yearScale(2000, 2000, 900)(2000))).toBe(true);
  });
  it('clusters close milestones without mutating their order', () => {
    const milestones = [2001, 2000, 2010].map((year, i) => ({ id: `m-${i}`, language: 'test', title: 'Feature', date: { year }, kind: 'feature' as const }));
    const clusters = clusterMilestones(milestones, y => (y - 2000) * 10);
    expect(clusters.map(c => c.milestones.length)).toEqual([2, 1]);
    expect(milestones[0].date.year).toBe(2001);
  });
  it('bounds visible rows for a thousand-language catalog', () => {
    const { start, end } = visibleRows(1000, 10000, 520);
    expect(end - start).toBeLessThanOrEqual(17);
    expect(start).toBeGreaterThan(0);
  });
  it('handles an empty catalog', () => {
    expect(visibleRows(0, 0, 500)).toEqual({ start: 0, end: 0 });
    expect(clusterMilestones([] as MilestoneSummary[], x => x)).toEqual([]);
  });
});
