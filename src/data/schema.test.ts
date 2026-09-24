import { describe, expect, it } from 'vitest';
import { makeIndex, validateCatalog, type Catalog } from './schema';
import { dateLabel } from './dates';

export function fixture(): Catalog {
  return {
    schemaVersion: 1,
    languages: ['a', 'b'].map((id) => ({ id, name: id.toUpperCase(), aliases: [], introduction: `${id}-intro`, summary: 'An example', paradigms: ['Functional'] })),
    milestones: ['a', 'b'].map((language, i) => ({ id: `${language}-intro`, language, date: { year: 1960 + i * 10 }, title: 'Public introduction', kind: 'introduction' as const, explanation: 'Published.', citations: ['reference'] })),
    influences: [{ id: 'a-b', source: 'a', destination: 'b-intro', title: 'Functions', adopted: 'Functions', changed: 'Different evaluation', evidence: 'documented', citations: ['reference'] }],
    sources: [{ id: 'reference', title: 'An original report', author: 'Author', url: 'https://example.org/report', section: 'History' }],
  };
}
describe('historical data validation', () => {
  it('accepts a cited graph and creates a compact index', () => {
    const { catalog } = validateCatalog(fixture());
    expect(makeIndex(catalog).milestones[0]).not.toHaveProperty('explanation');
  });
  it('rejects duplicate IDs', () => { const c = fixture(); c.languages.push(c.languages[0]); expect(() => validateCatalog(c)).toThrow('Duplicate language'); });
  it('rejects missing citations and unknown citations', () => {
    const c = fixture(); c.milestones[0].citations = []; expect(() => validateCatalog(c)).toThrow();
    c.milestones[0].citations = ['missing']; expect(() => validateCatalog(c)).toThrow('unknown source');
  });
  it('rejects broken cross references', () => { const c = fixture(); c.influences[0].destination = 'missing'; expect(() => validateCatalog(c)).toThrow('unknown destination'); });
  it('rejects backwards intervals and impossible chronology', () => {
    const c = fixture(); c.milestones[0].date.endYear = 1950; expect(() => validateCatalog(c)).toThrow();
    c.milestones[0].date = { year: 1980 }; expect(() => validateCatalog(c)).toThrow('postdates');
  });
  it('requires a caveat for disputed influence', () => { const c = fixture(); c.influences[0].evidence = 'disputed'; expect(() => validateCatalog(c)).toThrow('caveat'); });
  it('reports approximate dates for review and labels intervals', () => {
    const c = fixture(); c.milestones[0].date = { year: 1958, endYear: 1960, approximate: true };
    expect(validateCatalog(c).warnings.length).toBeGreaterThan(0);
    expect(dateLabel(c.milestones[0].date)).toBe('c. 1958–1960');
  });
  it('rejects a source milestone from the wrong language', () => { const c = fixture(); c.influences[0].sourceMilestone = 'b-intro'; expect(() => validateCatalog(c)).toThrow('invalid source milestone'); });
});
