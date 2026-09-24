import { useEffect, useId, useRef, useState } from 'react';
import type { AtlasRow, GraphData } from '../core/exploration';
import { arrowPath, AXIS_HEIGHT, clusterMilestones, LABEL_WIDTH, ROW_HEIGHT, visibleRows, yearScale } from '../core/layout';
import type { InfluenceSummary } from '../data/schema';
import { dateLabel } from '../data/dates';
import type { StateControls } from './Toolbar';

export function Timeline({ rows, edges, graph, state, update }: StateControls & { rows: AtlasRow[]; edges: InfluenceSummary[]; graph: GraphData }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 920, height: 540, top: 0 });
  const markerId = useId().replace(/:/g, '');
  useEffect(() => {
    const element = scroller.current!;
    const resize = new ResizeObserver(() => setViewport(v => ({ ...v, width: Math.max(740, element.clientWidth), height: element.clientHeight - AXIS_HEIGHT })));
    resize.observe(element); return () => resize.disconnect();
  }, []);
  const selectedRow = rows.findIndex(r => r.language.id === state.language);
  useEffect(() => {
    if (selectedRow < 0 || !scroller.current) return;
    const element = scroller.current;
    const y = selectedRow * ROW_HEIGHT;
    if (y < element.scrollTop || y + ROW_HEIGHT > element.scrollTop + element.clientHeight - AXIS_HEIGHT) element.scrollTop = Math.max(0, y - element.clientHeight / 2);
  }, [selectedRow, state.language]);
  useEffect(() => {
    if (!scroller.current) return;
    const maxTop = Math.max(0, rows.length * ROW_HEIGHT - scroller.current.clientHeight + AXIS_HEIGHT);
    if (scroller.current.scrollTop > maxTop) scroller.current.scrollTop = maxTop;
  }, [rows.length]);
  const { width, height, top } = viewport;
  const x = yearScale(state.from, state.to, width);
  const ticks = [...new Set([state.from, ...x.ticks(Math.floor((width - LABEL_WIDTH) / 85)).filter(Number.isInteger), state.to])].sort((a, b) => a - b).filter((year, i, all) => i === 0 || year === state.to || x(year) - x(all[i - 1]) > 36);
  const visible = visibleRows(rows.length, top, height);
  const rowIndex = new Map(rows.map((r, i) => [r.language.id, i]));
  const clipTop = Math.max(0, top - ROW_HEIGHT);
  const clipBottom = top + height + ROW_HEIGHT;
  const selectLanguage = (language: string) => update({ language, milestone: undefined, influence: undefined });
  const drawableEdges = [...edges].sort((a, b) => Number(b.id === state.influence) - Number(a.id === state.influence)).filter(edge => {
    const destination = graph.milestones.get(edge.destination)!;
    const a = rowIndex.get(edge.source), b = rowIndex.get(destination.language);
    return a !== undefined && b !== undefined && Math.max(a, b) * ROW_HEIGHT + ROW_HEIGHT >= clipTop && Math.min(a, b) * ROW_HEIGHT <= clipBottom;
  }).slice(0, 80);
  return <div className="timeline-scroll" ref={scroller} tabIndex={0} aria-label="Scrollable language timeline" onScroll={e => { const top = e.currentTarget.scrollTop; setViewport(v => ({ ...v, top })); }}>
    <div className="timeline-axis" style={{ width, height: AXIS_HEIGHT }}>
      <span className="axis-language">LANGUAGE <span>↓</span></span>
      <svg width={width} height={AXIS_HEIGHT} aria-hidden="true">{ticks.map(year => <g key={year}><text x={x(year)} y="25" textAnchor="middle">{year}</text><line x1={x(year)} x2={x(year)} y1="34" y2="44" /></g>)}</svg>
    </div>
    <div className="timeline-content" style={{ width, height: Math.max(rows.length * ROW_HEIGHT, height) }}>
      <div className="language-labels">{rows.slice(visible.start, visible.end).map((row, offset) => <button key={row.language.id} className={`language-label ${state.language === row.language.id ? 'selected' : ''}`} style={{ top: (visible.start + offset) * ROW_HEIGHT, height: ROW_HEIGHT }} onClick={() => selectLanguage(row.language.id)} aria-label={`Explore ${row.language.name}`} aria-pressed={state.language === row.language.id}><span>{row.language.name}</span><small>{row.context ? 'context' : dateLabel(graph.milestones.get(row.language.introduction)!.date)}</small></button>)}</div>
      <svg className="timeline-svg" width={width} height={Math.max(rows.length * ROW_HEIGHT, height)} aria-label="Language milestones and influences">
        <defs>
          <marker id={`${markerId}-blue`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#1d4ed8" /></marker>
          <marker id={`${markerId}-teal`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#0f766e" /></marker>
          <clipPath id={`${markerId}-clip`}><rect x={LABEL_WIDTH} y={clipTop} width={width - LABEL_WIDTH} height={clipBottom - clipTop} /></clipPath>
        </defs>
        {ticks.map(year => <line className="year-grid" key={year} x1={x(year)} x2={x(year)} y1={clipTop} y2={Math.min(rows.length * ROW_HEIGHT, clipBottom)} />)}
        {rows.slice(visible.start, visible.end).map((row, offset) => {
          const y = (visible.start + offset) * ROW_HEIGHT;
          const intro = graph.milestones.get(row.language.introduction)!;
          return <g key={row.language.id} data-testid="timeline-row">
            {state.language === row.language.id && <rect x={LABEL_WIDTH} y={y} width={width - LABEL_WIDTH} height={ROW_HEIGHT} className="selected-row" />}
            <line className="row-divider" x1={LABEL_WIDTH} x2={width} y1={y + ROW_HEIGHT} y2={y + ROW_HEIGHT} />
            {intro.date.year <= state.to && <line className={`language-track ${state.language === row.language.id ? 'active-track' : ''}`} x1={x(intro.date.year)} x2={width - 24} y1={y + ROW_HEIGHT / 2} y2={y + ROW_HEIGHT / 2} />}
          </g>;
        })}
        <g clipPath={`url(#${markerId}-clip)`}>{drawableEdges.map(edge => {
          const dest = graph.milestones.get(edge.destination)!;
          const source = graph.milestones.get(edge.sourceMilestone ?? graph.languages.get(edge.source)!.introduction)!;
          const sourceRow = rowIndex.get(edge.source), destRow = rowIndex.get(dest.language);
          if (sourceRow === undefined || destRow === undefined) return null;
          const y1 = sourceRow * ROW_HEIGHT + ROW_HEIGHT / 2, y2 = destRow * ROW_HEIGHT + ROW_HEIGHT / 2;
          if (Math.max(y1, y2) < clipTop || Math.min(y1, y2) > clipBottom) return null;
          const selected = state.influence === edge.id;
          const path = arrowPath(x(source.date.year), y1, x(dest.date.year) - 9, y2);
          const name = `${graph.languages.get(edge.source)!.name} → ${graph.languages.get(dest.language)!.name}: ${edge.title}`;
          return <g key={edge.id} className={`influence ${selected ? 'selected-influence' : ''} ${edge.evidence === 'disputed' ? 'disputed' : ''}`}>
            <path className="influence-line" d={path} markerEnd={`url(#${markerId}-${selected ? 'blue' : 'teal'})`} />
            <path className="influence-hit" d={path} role="button" tabIndex={0} aria-label={name} onClick={() => update({ influence: edge.id })} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update({ influence: edge.id }); } }}><title>{name}</title></path>
          </g>;
        })}</g>
        {rows.slice(visible.start, visible.end).map((row, offset) => {
          const y = (visible.start + offset) * ROW_HEIGHT + ROW_HEIGHT / 2;
          return <g key={row.language.id}>{clusterMilestones(row.milestones, x).map(cluster => {
            const m = cluster.milestones[0];
            const isCluster = cluster.milestones.length > 1;
            const selected = cluster.milestones.some(m => m.id === state.milestone);
            const label = isCluster ? `${row.language.name}: ${cluster.milestones.length} milestones, ${dateLabel(m.date)} to ${dateLabel(cluster.milestones.at(-1)!.date)}` : `${row.language.name}: ${m.title}, ${dateLabel(m.date)}`;
            const activate = () => isCluster ? update({ language: row.language.id, milestone: m.id, influence: undefined, from: Math.max(state.from, m.date.year - 1), to: Math.min(state.to, cluster.milestones.at(-1)!.date.year + 1) }) : update({ language: row.language.id, milestone: m.id, influence: undefined });
            return <g key={m.id} className={`milestone ${m.kind === 'introduction' ? 'origin' : ''} ${selected ? 'selected-milestone' : ''}`} role="button" tabIndex={0} aria-label={label} onClick={activate} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } }}>
              <title>{label}</title><circle className="milestone-hit" cx={cluster.x} cy={y} r="17" />
              {m.date.endYear && <line className="uncertain-date" x1={cluster.x} x2={x(m.date.endYear)} y1={y} y2={y} />}
              <circle className={`milestone-dot ${m.date.approximate ? 'approximate' : ''}`} cx={cluster.x} cy={y} r={isCluster ? 10 : m.kind === 'introduction' ? 6 : 4.5} />
              {isCluster && <text className="cluster-count" x={cluster.x} y={y + 3.5} textAnchor="middle">{cluster.milestones.length}</text>}
              {row.language.id === state.language && !isCluster && <text className="milestone-caption" x={cluster.x} y={y - 13} textAnchor={cluster.x > width - 160 ? 'end' : 'start'}>{m.version ? `v${m.version}` : m.title.slice(0, 24)}</text>}
            </g>;
          })}</g>;
        })}
      </svg>
      {!rows.length && <div className="empty-state"><strong>No milestones in this view</strong><p>Try a wider time range or clear your search and filters.</p></div>}
    </div>
  </div>;
}
