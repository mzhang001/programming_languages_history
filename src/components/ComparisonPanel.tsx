import { useEffect, useRef } from 'react';
import type { CatalogIndex, LanguageDetail, Source } from '../data/schema';
import { dateLabel } from '../data/dates';
import { inRange } from '../core/exploration';
import { useData } from '../hooks/useData';
import type { StateControls } from './Toolbar';
import { useMobile } from '../hooks/useMobile';

export function Evidence({ ids, sources }: { ids: string[]; sources: Source[] }) {
  return <ul className="evidence-list">{ids.map(id => {
    const source = sources.find(s => s.id === id);
    return source && <li key={id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} <span aria-hidden="true">↗</span></a><small>{source.author} · {source.section}</small></li>;
  })}</ul>;
}
export function ComparisonContent({ detail, index, state, update }: StateControls & { detail: LanguageDetail; index: CatalogIndex }) {
  const milestone = detail.milestones.find(m => m.id === state.milestone) ?? detail.milestones.find(m => m.id === detail.language.introduction)!;
  const groups = [...new Set(detail.influences.map(i => i.source))].sort((a, b) => {
    const selectedSource = detail.influences.find(i => i.id === state.influence)?.source;
    return Number(b === selectedSource) - Number(a === selectedSource) || a.localeCompare(b);
  });
  return <>
    <div className="panel-intro"><div className="tag-list">{detail.language.paradigms.map(p => <span key={p}>{p}</span>)}</div><p>{detail.language.summary}</p>{detail.language.scope && <p className="scope-note">{detail.language.scope}</p>}</div>
    <section className="milestone-detail" aria-labelledby="milestone-heading"><span className="eyebrow">SELECTED MILESTONE · {dateLabel(milestone.date)}</span><h3 id="milestone-heading">{milestone.title}</h3><p>{milestone.explanation}</p>{!inRange(milestone, state) && <p className="outside-note">Outside your time window</p>}<details><summary>Milestone sources</summary><Evidence ids={milestone.citations} sources={detail.sources} /></details></section>
    <div className="panel-section-title"><h3>Ideas that shaped {detail.language.name}</h3><span>{detail.influences.length}</span></div>
    {!groups.length && <p className="coverage-note">No incoming influences documented here yet. This is a gap in our coverage, not a claim of independent invention.</p>}
    {groups.map(sourceId => <section className="source-group" key={sourceId}><h4><span aria-hidden="true">↳</span> From <button onClick={() => update({ language: sourceId, milestone: undefined, influence: undefined })}>{index.languages.find(l => l.id === sourceId)!.name}</button></h4>
      {detail.influences.filter(i => i.source === sourceId).map(influence => {
        const event = detail.milestones.find(m => m.id === influence.destination)!;
        return <article key={influence.id} className={`influence-card ${state.influence === influence.id ? 'is-selected' : ''}`} data-testid="influence-card" aria-label={influence.title}>
          <div className="influence-card-top"><span className={`evidence-badge ${influence.evidence}`}>{influence.evidence}</span><span>{dateLabel(event.date)}</span></div>
          <button className="influence-title" aria-pressed={state.influence === influence.id} onClick={() => update({ influence: influence.id })}>{influence.title}<span aria-hidden="true"> ↗</span></button>
          {!inRange(event, state) && <p className="outside-note">Outside your time window</p>}
          <dl><dt>Adopted</dt><dd>{influence.adopted}</dd><dt>Changed</dt><dd>{influence.changed}</dd></dl>
          {influence.caveat && <p className="scope-note">{influence.caveat}</p>}
          {influence.examples && <details className="code-comparison"><summary>Compare the code</summary><span className="code-label">{index.languages.find(l => l.id === sourceId)!.name}</span><pre><code>{influence.examples.source}</code></pre><span className="code-label">{detail.language.name}</span><pre><code>{influence.examples.destination}</code></pre><p>{influence.examples.explanation}</p></details>}
          <details open={state.influence === influence.id}><summary>Evidence · {influence.citations.length} {influence.citations.length === 1 ? 'source' : 'sources'}</summary><Evidence ids={influence.citations} sources={detail.sources} /></details>
        </article>;
      })}</section>)}
    <section className="milestone-history"><h3>Milestones</h3>{detail.milestones.map(m => <button key={m.id} aria-pressed={state.milestone === m.id} onClick={() => update({ milestone: m.id, influence: undefined })}><span>{dateLabel(m.date)}</span><strong>{m.title}</strong>{!inRange(m, state) && <small>outside window</small>}</button>)}</section>
  </>;
}
export function ComparisonPanel({ index, state, update, close, repoUrl }: StateControls & { index: CatalogIndex; close: () => void; repoUrl?: string }) {
  const language = index.languages.find(l => l.id === state.language);
  const { data, error, retry } = useData<LanguageDetail>(language ? `languages/${language.id}.json` : undefined);
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLElement>(null);
  const mobile = useMobile();
  useEffect(() => { if (language) heading.current?.focus({ preventScroll: true }); }, [language, state.influence, state.milestone]);
  useEffect(() => {
    if (!mobile || !language) return;
    const background = [...document.querySelectorAll<HTMLElement>('.site-header, .intro, .toolbar, .timeline-panel, footer')];
    const previous = background.map(el => el.inert);
    background.forEach(el => { el.inert = true; });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { background.forEach((el, i) => { el.inert = previous[i]; }); document.body.style.overflow = overflow; };
  }, [mobile, language]);
  if (!language) return <aside className="comparison-panel welcome-panel" aria-label="How to explore"><span className="eyebrow">FOLLOW AN IDEA</span><div className="welcome-illustration" aria-hidden="true"><span>λ</span><i>↘</i><span>{'{ }'}</span><i>↗</i><span>+</span></div><h2>No language<br/>is an island.</h2><p>Every language carries ideas from the ones that came before it.</p><ol><li><b>Choose a language</b><span>Click its name or a milestone.</span></li><li><b>Follow a connection</b><span>See the ideas it borrowed.</span></li><li><b>Look closer</b><span>Compare adaptations and inspect the evidence.</span></li></ol><div className="starter-links"><span className="eyebrow">A PLACE TO START</span>{['python', 'cpp', 'rust'].filter(id => index.languages.some(l => l.id === id)).map(id => <button key={id} onClick={() => update({ language: id, milestone: undefined, influence: undefined })}>{index.languages.find(l => l.id === id)!.name}<span>↗</span></button>)}</div></aside>;
  return <aside ref={panel} data-testid="comparison-panel" className="comparison-panel has-selection" role={mobile ? 'dialog' : undefined} aria-modal={mobile || undefined} aria-label={`${language.name} details`} onKeyDown={e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (mobile && e.key === 'Tab' && panel.current) {
      const elements = [...panel.current.querySelectorAll<HTMLElement>('button, a[href], summary, [tabindex="0"]')].filter(el => el.getClientRects().length && !el.hasAttribute('disabled'));
      const first = elements[0], last = elements.at(-1);
      if (e.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  }}>
    <div className="panel-heading"><div><span className="eyebrow">LANGUAGE PROFILE</span><h2 ref={heading} tabIndex={-1}>{language.name}</h2></div><button className="icon-button" aria-label="Close details" onClick={close}>×</button></div>
    <div className="panel-body">{error ? <div role="alert"><p>{error}</p><button onClick={retry}>Try again</button></div> : data ? <ComparisonContent detail={data} index={index} state={state} update={update} /> : <p role="status">Loading historical detail…</p>}
    <div className="correction-note"><strong>History is a work in progress.</strong><p>Help improve this page with a source or a correction.</p>{repoUrl ? <><a href={`${repoUrl}/issues/new?template=history.md&title=${encodeURIComponent(`Historical correction: ${language.name}`)}`} target="_blank" rel="noreferrer">Suggest a correction ↗</a><a href={`${repoUrl}/blob/main/data/languages/${language.id}.yaml`} target="_blank" rel="noreferrer">View the source data ↗</a></> : <span>Contribute to <code>data/languages/{language.id}.yaml</code> in the repository.</span>}</div></div>
  </aside>;
}
