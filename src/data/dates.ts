import type { HistoricalDate } from './schema';

export function dateLabel(date: HistoricalDate): string {
  return `${date.approximate ? 'c. ' : ''}${date.year}${date.endYear && date.endYear !== date.year ? `–${date.endYear}` : ''}`;
}
