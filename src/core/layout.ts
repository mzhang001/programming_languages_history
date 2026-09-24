import { scaleLinear } from 'd3-scale';
import type { MilestoneSummary } from '../data/schema';

export const ROW_HEIGHT = 52;
export const LABEL_WIDTH = 164;
export const AXIS_HEIGHT = 44;
export function yearScale(from: number, to: number, width: number) {
  return scaleLinear().domain(from === to ? [from - 0.5, to + 0.5] : [from, to]).range([LABEL_WIDTH + 28, width - 40]).clamp(true);
}
export function visibleRows(count: number, scrollTop: number, height: number, overscan = 3) {
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan);
  const end = Math.min(count, Math.ceil((scrollTop + height) / ROW_HEIGHT) + overscan);
  return { start, end };
}
export interface MilestoneCluster { x: number; milestones: MilestoneSummary[] }
export function clusterMilestones(milestones: MilestoneSummary[], x: (year: number) => number, threshold = 26): MilestoneCluster[] {
  const groups: MilestoneCluster[] = [];
  for (const milestone of [...milestones].sort((a, b) => a.date.year - b.date.year || a.id.localeCompare(b.id))) {
    const point = x(milestone.date.year);
    const last = groups.at(-1);
    if (last && point - last.x < threshold) last.milestones.push(milestone);
    else groups.push({ x: point, milestones: [milestone] });
  }
  return groups;
}
export function arrowPath(x1: number, y1: number, x2: number, y2: number): string {
  const bend = Math.max(35, Math.abs(x2 - x1) * 0.45);
  return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
}
