import type { CatalogIndex } from '../data/schema';
import type { StateControls } from './Toolbar';

export function TimeNavigator({ index, state, update }: StateControls & { index: CatalogIndex }) {
  const [min, max] = index.bounds;
  const span = Math.max(1, max - min);
  const bins = Array.from({ length: max - min + 1 }, (_, i) => index.milestones.filter(m => m.date.year === min + i).length);
  const peak = Math.max(1, ...bins);
  const zoom = (factor: number) => {
    const current = Math.max(2, state.to - state.from);
    const width = Math.min(span, Math.max(2, Math.round(current * factor)));
    const middle = (state.from + state.to) / 2;
    const from = Math.max(min, Math.min(max - width, Math.round(middle - width / 2)));
    update({ from, to: from + width });
  };
  return <section className="time-navigator" aria-label="Time-range navigator">
    <div className="navigator-label"><span className="eyebrow">TIME WINDOW</span><strong>{state.from} <span>—</span> {state.to}</strong></div>
    <div className="navigator-track">
      <svg viewBox={`0 0 ${bins.length * 6} 32`} preserveAspectRatio="none" aria-hidden="true">
        {bins.map((n, i) => <rect key={i} x={i * 6} y={30 - (n / peak) * 26} width="3" height={Math.max(2, (n / peak) * 26)} rx="1" />)}
      </svg>
      <div className="range-highlight" style={{ left: `${((state.from - min) / span) * 100}%`, right: `${((max - state.to) / span) * 100}%` }} />
      <input aria-label="Range start" className="range-handle range-start" type="range" min={min} max={max} value={state.from} onChange={e => update({ from: Math.min(Number(e.target.value), state.to) }, true)} />
      <input aria-label="Range end" className="range-handle range-end" type="range" min={min} max={max} value={state.to} onChange={e => update({ to: Math.max(Number(e.target.value), state.from) }, true)} />
      <div className="navigator-years"><span>{min}</span><span>{Math.round((min + max) / 2)}</span><span>{max}</span></div>
    </div>
    <div className="zoom-controls"><button onClick={() => zoom(1.5)} aria-label="Zoom out" disabled={state.from === min && state.to === max}>−</button><button onClick={() => zoom(0.6)} aria-label="Zoom in" disabled={state.to - state.from <= 2}>+</button></div>
  </section>;
}
