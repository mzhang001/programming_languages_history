import type { CatalogIndex, InfluenceSummary, Language, MilestoneSummary } from '../data/schema';

export interface ExplorationState {
  from: number;
  to: number;
  query: string;
  paradigm: string;
  language?: string;
  milestone?: string;
  influence?: string;
  view: 'timeline' | 'list';
}
export interface AtlasRow { language: Language; milestones: MilestoneSummary[]; context: boolean }
export interface GraphData {
  languages: Map<string, Language>;
  milestones: Map<string, MilestoneSummary>;
  byLanguage: Map<string, MilestoneSummary[]>;
  incoming: Map<string, InfluenceSummary[]>;
  outgoing: Map<string, InfluenceSummary[]>;
}
export function buildGraph(index: CatalogIndex): GraphData {
  const languages = new Map(index.languages.map(l => [l.id, l]));
  const milestones = new Map(index.milestones.map(m => [m.id, m]));
  const byLanguage = new Map<string, MilestoneSummary[]>();
  const incoming = new Map<string, InfluenceSummary[]>();
  const outgoing = new Map<string, InfluenceSummary[]>();
  for (const m of index.milestones) {
    if (!byLanguage.has(m.language)) byLanguage.set(m.language, []);
    byLanguage.get(m.language)!.push(m);
  }
  for (const list of byLanguage.values()) list.sort((a, b) => a.date.year - b.date.year || a.id.localeCompare(b.id));
  for (const i of index.influences) {
    const dest = milestones.get(i.destination)!.language;
    if (!incoming.has(dest)) incoming.set(dest, []);
    if (!outgoing.has(i.source)) outgoing.set(i.source, []);
    incoming.get(dest)!.push(i);
    outgoing.get(i.source)!.push(i);
  }
  return { languages, milestones, byLanguage, incoming, outgoing };
}
export function defaultState(index: CatalogIndex): ExplorationState {
  return { from: index.bounds[0], to: index.bounds[1], query: '', paradigm: '', view: 'timeline' };
}
export function normalizeState(state: ExplorationState, index: CatalogIndex): ExplorationState {
  const fallback = defaultState(index);
  let from = Number.isFinite(state.from) ? Math.round(Math.max(index.bounds[0], Math.min(index.bounds[1], state.from))) : fallback.from;
  let to = Number.isFinite(state.to) ? Math.round(Math.max(index.bounds[0], Math.min(index.bounds[1], state.to))) : fallback.to;
  if (from > to) [from, to] = [to, from];
  const next = { ...state, from, to, query: state.query.slice(0, 120), paradigm: index.languages.some(l => l.paradigms.includes(state.paradigm)) ? state.paradigm : '' };
  if (!index.languages.some(l => l.id === next.language)) next.language = undefined;
  const influence = index.influences.find(i => i.id === next.influence);
  next.influence = influence?.id;
  const milestone = index.milestones.find(m => m.id === (influence?.destination ?? next.milestone));
  next.milestone = milestone?.id;
  if (milestone) next.language = milestone.language;
  return next;
}
export function decodeState(search: string, index: CatalogIndex): ExplorationState {
  const p = new URLSearchParams(search);
  const year = (name: string, fallback: number) => p.has(name) && p.get(name)?.trim() ? Number(p.get(name)) : fallback;
  return normalizeState({
    ...defaultState(index), from: year('from', index.bounds[0]), to: year('to', index.bounds[1]),
    query: p.get('q') ?? '', paradigm: p.get('paradigm') ?? '',
    language: p.get('language') ?? undefined, milestone: p.get('milestone') ?? undefined,
    influence: p.get('influence') ?? undefined, view: p.get('view') === 'list' ? 'list' : 'timeline',
  }, index);
}
export function encodeState(state: ExplorationState): string {
  const p = new URLSearchParams({ from: String(state.from), to: String(state.to) });
  for (const [key, value] of Object.entries({ q: state.query, paradigm: state.paradigm, language: state.language, milestone: state.milestone, influence: state.influence, view: state.view === 'list' ? 'list' : '' })) if (value) p.set(key, value);
  return `?${p.toString()}`;
}
export function inRange(m: MilestoneSummary, state: Pick<ExplorationState, 'from' | 'to'>): boolean {
  return m.date.year <= state.to && (m.date.endYear ?? m.date.year) >= state.from;
}
export function selectAtlas(index: CatalogIndex, graph: GraphData, state: ExplorationState) {
  const query = state.query.trim().toLocaleLowerCase();
  const matches = new Set(index.languages.filter(l =>
    (!query || [l.name, ...l.aliases].some(n => n.toLocaleLowerCase().includes(query))) &&
    (!state.paradigm || l.paradigms.includes(state.paradigm)) &&
    (graph.byLanguage.get(l.id) ?? []).some(m => inRange(m, state)),
  ).map(l => l.id));
  const related = state.language ? [...(graph.incoming.get(state.language) ?? []), ...(graph.outgoing.get(state.language) ?? [])] : [];
  const edges = related.filter(i => inRange(graph.milestones.get(i.destination)!, state) || i.id === state.influence);
  const visible = new Set(matches);
  if (state.language) visible.add(state.language);
  for (const edge of edges) { visible.add(edge.source); visible.add(graph.milestones.get(edge.destination)!.language); }
  const rows: AtlasRow[] = [...visible].map(id => ({
    language: graph.languages.get(id)!, context: !matches.has(id),
    milestones: (graph.byLanguage.get(id) ?? []).filter(m => inRange(m, state)),
  })).sort((a, b) => graph.milestones.get(a.language.introduction)!.date.year - graph.milestones.get(b.language.introduction)!.date.year || a.language.name.localeCompare(b.language.name));
  return { rows, edges, matchCount: matches.size };
}
