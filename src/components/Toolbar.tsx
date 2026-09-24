import { useState } from 'react';
import type { CatalogIndex } from '../data/schema';
import type { ExplorationState } from '../core/exploration';

export interface StateControls { state: ExplorationState; update: (patch: Partial<ExplorationState>, replace?: boolean) => void }
export function RangeFields({ from, to, bounds, onChange }: { from: number; to: number; bounds: [number, number]; onChange: (from: number, to: number) => void }) {
  const [start, setStart] = useState(String(from));
  const [end, setEnd] = useState(String(to));
  const [error, setError] = useState('');
  return <form className="year-form" onSubmit={event => {
    event.preventDefault();
    const a = Number(start), b = Number(end);
    if (!start.trim() || !end.trim() || !Number.isInteger(a) || !Number.isInteger(b) || a > b || a < bounds[0] || b > bounds[1]) {
      setError(`Enter years from ${bounds[0]} to ${bounds[1]}, with the start no later than the end.`); return;
    }
    setError(''); onChange(a, b);
  }} noValidate>
    <label><span className="sr-only">Start year</span><input aria-describedby={error ? 'range-error' : undefined} aria-invalid={Boolean(error)} type="number" value={start} onChange={e => setStart(e.target.value)} /></label>
    <span aria-hidden="true" className="year-separator">—</span>
    <label><span className="sr-only">End year</span><input aria-describedby={error ? 'range-error' : undefined} aria-invalid={Boolean(error)} type="number" value={end} onChange={e => setEnd(e.target.value)} /></label>
    <button className="apply-button" type="submit">Apply</button>
    {error && <span id="range-error" role="alert" className="range-error">{error}</span>}
  </form>;
}
export function Toolbar({ index, state, update, reset }: StateControls & { index: CatalogIndex; reset: () => void }) {
  const paradigms = [...new Set(index.languages.flatMap(l => l.paradigms))].sort();
  return <section className="toolbar" aria-label="Explore the atlas">
    <label className="search-field"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg><input aria-label="Search languages" type="search" placeholder="Find a language…" value={state.query} onChange={e => update({ query: e.target.value }, true)} /></label>
    <label className="paradigm-field"><span className="sr-only">Paradigm</span><select value={state.paradigm} onChange={e => update({ paradigm: e.target.value })}><option value="">All paradigms</option>{paradigms.map(p => <option key={p}>{p}</option>)}</select></label>
    <span className="toolbar-divider" />
    <RangeFields key={`${state.from}-${state.to}`} from={state.from} to={state.to} bounds={index.bounds} onChange={(from, to) => update({ from, to })} />
    <button className="text-button reset-button" onClick={reset}>↺ Reset</button>
    <div className="view-switch" role="group" aria-label="Presentation">
      <button aria-pressed={state.view === 'timeline'} onClick={() => update({ view: 'timeline' })}>Timeline</button>
      <button aria-pressed={state.view === 'list'} onClick={() => update({ view: 'list' })}>List</button>
    </div>
  </section>;
}
