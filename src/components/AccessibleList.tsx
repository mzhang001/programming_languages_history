import { useState } from 'react';
import type { AtlasRow, GraphData } from '../core/exploration';
import type { InfluenceSummary } from '../data/schema';
import { dateLabel } from '../data/dates';
import type { StateControls } from './Toolbar';

export function AccessibleList({ rows, edges, graph, state, update }: StateControls & { rows: AtlasRow[]; edges: InfluenceSummary[]; graph: GraphData }) {
  const [page, setPage] = useState(0);
  const [connectionPage, setConnectionPage] = useState(0);
  const pageSize = 20;
  const safePage = Math.min(page, Math.max(0, Math.ceil(rows.length / pageSize) - 1));
  const safeConnectionPage = Math.min(connectionPage, Math.max(0, Math.ceil(edges.length / pageSize) - 1));
  return <div className="accessible-list"><p className="list-intro">The same history, in reading order. Choose a language to see its connections.</p>
    {rows.slice(safePage * pageSize, (safePage + 1) * pageSize).map(row => <section key={row.language.id}><h3><button onClick={() => update({ language: row.language.id, milestone: undefined, influence: undefined })}>{row.language.name}</button>{row.context && <small>Related context</small>}</h3><ul>{row.milestones.map(m => <li key={m.id}><time>{dateLabel(m.date)}</time><button aria-pressed={state.milestone === m.id} onClick={() => update({ milestone: m.id, influence: undefined })}>{m.title}</button></li>)}</ul>{!row.milestones.length && <p>No milestones in the current window.</p>}</section>)}
    {!rows.length && <p>No milestones in this view. Try a wider range or clear the filters.</p>}
    {rows.length > pageSize && <nav aria-label="Language list pages"><button disabled={!safePage} onClick={() => setPage(safePage - 1)}>Previous</button><span>Page {safePage + 1} of {Math.ceil(rows.length / pageSize)}</span><button disabled={(safePage + 1) * pageSize >= rows.length} onClick={() => setPage(safePage + 1)}>Next</button></nav>}
    {edges.length > 0 && <section><h3>Connections for the selected language</h3><ul>{edges.slice(safeConnectionPage * pageSize, (safeConnectionPage + 1) * pageSize).map(i => <li key={i.id}><button onClick={() => update({ influence: i.id })}>{graph.languages.get(i.source)!.name} → {graph.languages.get(graph.milestones.get(i.destination)!.language)!.name}: {i.title}</button></li>)}</ul>{edges.length > pageSize && <nav aria-label="Connection list pages"><button disabled={!safeConnectionPage} onClick={() => setConnectionPage(safeConnectionPage - 1)}>Previous connections</button><span>{safeConnectionPage + 1} / {Math.ceil(edges.length / pageSize)}</span><button disabled={(safeConnectionPage + 1) * pageSize >= edges.length} onClick={() => setConnectionPage(safeConnectionPage + 1)}>Next connections</button></nav>}</section>}
  </div>;
}
