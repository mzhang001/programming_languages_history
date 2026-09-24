import { useMemo, useRef, useState } from 'react';
import { buildGraph, defaultState, selectAtlas, type ExplorationState } from './core/exploration';
import type { CatalogIndex } from './data/schema';
import { useData } from './hooks/useData';
import { useExploration } from './hooks/useExploration';
import { Toolbar } from './components/Toolbar';
import { TimeNavigator } from './components/TimeNavigator';
import { Timeline } from './components/Timeline';
import { ComparisonPanel } from './components/ComparisonPanel';
import { AccessibleList } from './components/AccessibleList';
import { Methodology } from './components/Methodology';

const repoUrl = import.meta.env.VITE_REPOSITORY_URL as string | undefined;
function Atlas({ index }: { index: CatalogIndex }) {
  const [state, change] = useExploration(index);
  const graph = useMemo(() => buildGraph(index), [index]);
  const selection = useMemo(() => selectAtlas(index, graph, state), [index, graph, state]);
  const returnFocus = useRef<HTMLElement | SVGElement | null>(null);
  const update = (patch: Partial<ExplorationState>, replace = false) => {
    if ((patch.language || patch.milestone || patch.influence) && document.activeElement && !document.activeElement.closest('.comparison-panel')) returnFocus.current = document.activeElement as HTMLElement;
    change(patch, replace);
  };
  const close = () => { change({ language: undefined, milestone: undefined, influence: undefined }); requestAnimationFrame(() => { if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true }); else document.querySelector<HTMLInputElement>('[aria-label="Search languages"]')?.focus(); }); };
  const outsideSources = [...new Set(selection.edges.filter(i => {
    const source = graph.milestones.get(i.sourceMilestone ?? graph.languages.get(i.source)!.introduction)!;
    return source.date.year < state.from || source.date.year > state.to;
  }).map(i => i.source))];
  const contextCount = selection.rows.filter(r => r.context).length;
  return <>
    <Toolbar index={index} state={state} update={update} reset={() => change({ ...defaultState(index), language: undefined, milestone: undefined, influence: undefined })} />
    <div className={`explorer ${state.language ? 'selection-open' : ''}`}>
      <section className="timeline-panel" aria-label="Historical explorer">
        <div className="canvas-heading"><div><span className="status-dot" /><strong>THE EVOLUTION MAP</strong><span className="count" aria-live="polite">{selection.matchCount} languages{contextCount ? ` + ${contextCount} context` : ''}</span></div><span className="canvas-hint">Select a language to trace its influences</span></div>
        {state.view === 'timeline' ? <Timeline rows={selection.rows} edges={selection.edges} graph={graph} state={state} update={update} /> : <AccessibleList key={`${state.query}-${state.paradigm}-${state.from}-${state.to}`} rows={selection.rows} edges={selection.edges} graph={graph} state={state} update={update} />}
        {outsideSources.length > 0 && <div className="offscreen-sources"><span>← Sources outside this window</span>{outsideSources.map(id => <button key={id} onClick={() => {
          const years = selection.edges.filter(i => i.source === id).map(i => graph.milestones.get(i.sourceMilestone ?? graph.languages.get(id)!.introduction)!.date.year);
          update({ from: Math.min(state.from, ...years), to: Math.max(state.to, ...years) });
        }}>Reveal {graph.languages.get(id)!.name}</button>)}</div>}
        {state.view === 'timeline' && selection.edges.length > 80 && <div className="offscreen-sources">Showing up to 80 connections at a time. <button onClick={() => update({ view: 'list' })}>Browse all {selection.edges.length} connections in List</button></div>}
        <div className="map-legend"><span><i className="legend-origin" /> Introduction</span><span><i className="legend-milestone" /> Milestone</span><span><i className="legend-influence" /> Documented influence</span><span className="legend-note">Tracks show history, not active maintenance.</span></div>
        <TimeNavigator index={index} state={state} update={update} />
      </section>
      <ComparisonPanel index={index} state={state} update={update} close={close} repoUrl={repoUrl} />
    </div>
    <footer><span>A living atlas. Always evolving.</span><span>{index.languages.length} languages <i>·</i> {index.milestones.length} milestones <i>·</i> {index.influences.length} connections</span><span>Code <a href="https://opensource.org/license/mit" target="_blank" rel="noreferrer">MIT</a> <i>·</i> Content <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a></span></footer>
  </>;
}
export default function App() {
  const { data, error, retry } = useData<CatalogIndex>('index.json');
  const [methodology, setMethodology] = useState(false);
  return <><a className="skip-link" href="#atlas">Skip to explorer</a><header className="site-header"><a className="brand" href={import.meta.env.BASE_URL} aria-label="Language Atlas home"><span className="brand-mark" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 6h7l6 8h5M5 22h7l6-8M5 14h6"/><circle cx="5" cy="6" r="2" fill="currentColor"/><circle cx="5" cy="22" r="2" fill="currentColor"/><circle cx="23" cy="14" r="2" fill="currentColor"/></svg></span><span>language<span className="brand-light">atlas</span><small>AN OPEN HISTORY OF PROGRAMMING</small></span></a><nav aria-label="Project"><button className="text-button" onClick={() => setMethodology(true)}>About the data</button>{repoUrl ? <a className="github-link" href={repoUrl} target="_blank" rel="noreferrer">Contribute on GitHub <span>↗</span></a> : <span className="open-source-label">OPEN SOURCE <span>↗</span></span>}</nav></header>
    <main id="atlas"><section className="intro"><div><div className="eyebrow intro-eyebrow"><span /> IDEAS HAVE A HISTORY</div><h1>Every language tells<br className="mobile-break" /> a <em>story.</em></h1><p>Trace the ideas that connect programming languages.<br className="desktop-break" /> Discover what they borrowed, what they changed, and what came next.</p></div><div className="intro-aside"><span className="intro-years">{data?.bounds[0] ?? '1957'}<span>—</span>{data?.bounds[1] ?? '2026'}</span><span>SEVEN DECADES OF SHARED IDEAS</span></div></section>
      {error ? <div className="load-state" role="alert"><h2>The atlas could not load</h2><p>{error}</p><button onClick={retry}>Try again</button></div> : data ? <Atlas index={data} /> : <div className="load-state" role="status">Opening the atlas…</div>}
    </main>{methodology && <Methodology close={() => setMethodology(false)} />}</>;
}
