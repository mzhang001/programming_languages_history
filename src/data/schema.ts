import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().trim().min(1);
const citations = z.array(id).min(1);
export const dateSchema = z.object({
  year: z.number().int().min(1800).max(2100),
  endYear: z.number().int().min(1800).max(2100).optional(),
  approximate: z.boolean().optional(),
}).strict().refine(d => d.endYear === undefined || d.endYear >= d.year, 'Date interval ends before it starts');
export const sourceSchema = z.object({
  id, title: text, author: text, url: z.url().refine(s => /^https?:\/\//.test(s)),
  section: text, published: z.string().optional(),
}).strict();
export const languageSchema = z.object({
  id, name: text, aliases: z.array(text), introduction: id, summary: text,
  paradigms: z.array(text).min(1), scope: text.optional(),
}).strict();
export const milestoneSchema = z.object({
  id, language: id, date: dateSchema, title: text,
  kind: z.enum(['introduction', 'feature', 'semantics', 'standard']),
  version: text.optional(), explanation: text, citations,
}).strict();
export const influenceSchema = z.object({
  id, source: id, sourceMilestone: id.optional(), destination: id,
  title: text, adopted: text, changed: text,
  evidence: z.enum(['documented', 'disputed']), caveat: text.optional(), citations,
  examples: z.object({ source: text, destination: text, explanation: text }).strict().optional(),
}).strict().refine(i => i.evidence !== 'disputed' || Boolean(i.caveat), 'Disputed influence requires a caveat');
export const bundleSchema = z.object({
  schemaVersion: z.literal(1), language: languageSchema,
  milestones: z.array(milestoneSchema).min(1), influences: z.array(influenceSchema),
}).strict();
export const catalogSchema = z.object({
  schemaVersion: z.literal(1), languages: z.array(languageSchema).min(1),
  milestones: z.array(milestoneSchema), influences: z.array(influenceSchema),
  sources: z.array(sourceSchema),
}).strict();

export type HistoricalDate = z.infer<typeof dateSchema>;
export type Language = z.infer<typeof languageSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type Influence = z.infer<typeof influenceSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type LanguageBundle = z.infer<typeof bundleSchema>;
export type MilestoneSummary = Omit<Milestone, 'explanation' | 'citations'>;
export type InfluenceSummary = Pick<Influence, 'id' | 'source' | 'sourceMilestone' | 'destination' | 'title' | 'evidence'>;
export interface CatalogIndex {
  schemaVersion: 1;
  languages: Language[];
  milestones: MilestoneSummary[];
  influences: InfluenceSummary[];
  bounds: [number, number];
}
export interface LanguageDetail extends LanguageBundle { sources: Source[] }

export function validateCatalog(input: unknown): { catalog: Catalog; warnings: string[] } {
  const catalog = catalogSchema.parse(input);
  const errors: string[] = [];
  const warnings: string[] = [];
  const unique = <T extends { id: string }>(records: T[], kind: string) => {
    const map = new Map<string, T>();
    for (const record of records) {
      if (map.has(record.id)) errors.push(`Duplicate ${kind} ID: ${record.id}`);
      map.set(record.id, record);
    }
    return map;
  };
  const languages = unique(catalog.languages, 'language');
  const milestones = unique(catalog.milestones, 'milestone');
  unique(catalog.influences, 'influence');
  const sources = unique(catalog.sources, 'source');
  for (const language of catalog.languages) {
    const intro = milestones.get(language.introduction);
    if (!intro || intro.language !== language.id || intro.kind !== 'introduction') errors.push(`${language.id}: invalid introduction`);
  }
  for (const milestone of catalog.milestones) {
    const language = languages.get(milestone.language);
    if (!language) errors.push(`${milestone.id}: unknown language ${milestone.language}`);
    const intro = language && milestones.get(language.introduction);
    if (intro && (milestone.date.endYear ?? milestone.date.year) < intro.date.year) errors.push(`${milestone.id}: predates introduction`);
    if (milestone.date.approximate || milestone.date.endYear) warnings.push(`${milestone.id}: editorial review of uncertain date`);
  }
  for (const record of [...catalog.milestones, ...catalog.influences]) {
    for (const citation of record.citations) if (!sources.has(citation)) errors.push(`${record.id}: unknown source ${citation}`);
  }
  for (const influence of catalog.influences) {
    const source = languages.get(influence.source);
    const destination = milestones.get(influence.destination);
    const origin = influence.sourceMilestone ? milestones.get(influence.sourceMilestone) : source && milestones.get(source.introduction);
    if (!source) errors.push(`${influence.id}: unknown source language`);
    if (!destination) errors.push(`${influence.id}: unknown destination milestone`);
    if (influence.sourceMilestone && (!origin || origin.language !== influence.source)) errors.push(`${influence.id}: invalid source milestone`);
    if (source && destination?.language === source.id) errors.push(`${influence.id}: use a milestone for changes within a language`);
    if (origin && destination) {
      if (origin.date.year > (destination.date.endYear ?? destination.date.year)) errors.push(`${influence.id}: source postdates destination`);
      else if ((origin.date.endYear ?? origin.date.year) > destination.date.year || origin.date.approximate || destination.date.approximate) warnings.push(`${influence.id}: uncertain chronology requires review`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { catalog, warnings };
}

export function makeIndex(catalog: Catalog): CatalogIndex {
  return {
    schemaVersion: 1,
    languages: catalog.languages,
    milestones: catalog.milestones.map(({ id, language, date, title, kind, version }) => ({ id, language, date, title, kind, version })),
    influences: catalog.influences.map(({ id, source, sourceMilestone, destination, title, evidence }) => ({ id, source, sourceMilestone, destination, title, evidence })),
    bounds: [Math.min(...catalog.milestones.map(m => m.date.year)), Math.max(new Date().getUTCFullYear(), ...catalog.milestones.map(m => m.date.endYear ?? m.date.year))],
  };
}
