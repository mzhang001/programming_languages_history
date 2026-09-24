import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ComparisonContent } from './ComparisonPanel';
import type { CatalogIndex, LanguageDetail } from '../data/schema';
import { defaultState } from '../core/exploration';

const language = { id: 'target', name: 'Target', aliases: [], introduction: 'target-intro', summary: 'A test language', paradigms: ['Functional'] };
const milestones: LanguageDetail['milestones'] = [
  { id: 'target-intro', language: 'target', title: 'Introduction', date: { year: 1990 }, kind: 'introduction', explanation: 'A publication', citations: ['s'] },
  { id: 'target-later', language: 'target', title: 'A later feature', date: { year: 2000 }, kind: 'feature', explanation: 'A feature', citations: ['s'] },
];
const detail: LanguageDetail = {
  schemaVersion: 1, language, milestones,
  sources: [{ id: 's', title: 'Original report', author: 'Author', url: 'https://example.org/report', section: 'Design' }],
  influences: [
    { id: 'first-target', source: 'first', destination: 'target-intro', title: 'Pattern matching', adopted: 'Patterns from the first source.', changed: 'Adapted to a new setting.', evidence: 'documented', citations: ['s'] },
    { id: 'second-target', source: 'second', destination: 'target-later', title: 'Closures', adopted: 'Functions from the second source.', changed: 'Different evaluation.', evidence: 'documented', citations: ['s'], examples: { source: 'source()', destination: 'target()', explanation: 'A comparison' } },
  ],
};
const index: CatalogIndex = { schemaVersion: 1, languages: [language, ...['first', 'second'].map(id => ({ ...language, id, name: id }))], milestones, influences: detail.influences, bounds: [1950, 2026] };

it('separates sources, highlights the selected influence, and labels out-of-window history', async () => {
  const user = userEvent.setup();
  const update = vi.fn();
  render(<ComparisonContent detail={detail} index={index} state={{ ...defaultState(index), from: 1990, to: 1995, language: 'target', influence: 'second-target', milestone: 'target-later' }} update={update} />);
  const cards = screen.getAllByTestId('influence-card');
  expect(cards).toHaveLength(2);
  expect(cards[0]).toHaveClass('is-selected');
  expect(within(cards[0]).getByText('Outside your time window')).toBeInTheDocument();
  expect(within(cards[0]).getByRole('link', { name: /Original report/ })).toHaveAttribute('href', 'https://example.org/report');
  expect(within(cards[1]).queryByText('Compare the code')).not.toBeInTheDocument();
  await user.click(within(cards[0]).getByText('Compare the code'));
  expect(within(cards[0]).getByText('source()')).toBeVisible();
  await user.click(within(cards[1]).getByRole('button', { name: /Pattern matching/ }));
  expect(update).toHaveBeenCalledWith({ influence: 'first-target' });
});

it('explains incomplete coverage for a language without incoming influences', () => {
  render(<ComparisonContent detail={{ ...detail, influences: [] }} index={index} state={defaultState(index)} update={vi.fn()} />);
  expect(screen.getByText(/gap in our coverage/)).toBeInTheDocument();
});
