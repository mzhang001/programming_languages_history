import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { readCatalog } from '../scripts/catalog';
import { makeIndex } from './data/schema';
import App from './App';

const resources = new Map<string, unknown>();
beforeAll(async () => {
  const { catalog, bundles } = await readCatalog();
  resources.set('/data/index.json', makeIndex(catalog));
  for (const bundle of bundles) resources.set(`/data/languages/${bundle.language.id}.json`, { ...bundle, sources: catalog.sources });
});
beforeEach(() => {
  window.history.replaceState({}, '', '/');
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: true, json: async () => resources.get(url) })));
});
afterEach(() => vi.unstubAllGlobals());

it('connects search, selection, comparison, and URL state using the real catalog', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(await screen.findByRole('searchbox'), 'Golang');
  expect(screen.getByRole('button', { name: 'Explore Go' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Explore Go' }));
  expect(await screen.findByRole('heading', { name: 'Ideas that shaped Go' })).toBeInTheDocument();
  expect(window.location.search).toContain('language=go');
  const panel = screen.getByTestId('comparison-panel');
  expect(within(panel).getAllByTestId('influence-card')).toHaveLength(2);
  await user.click(within(panel).getByRole('button', { name: /Declarations and packages/ }));
  expect(window.location.search).toContain('influence=pascal-go-intro');
});

it('reveals earlier sources without losing the chosen destination', async () => {
  const user = userEvent.setup();
  window.history.replaceState({}, '', '/?from=2000&to=2000&language=python');
  render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Reveal Haskell' }));
  expect(screen.getByRole('spinbutton', { name: 'Start year' })).toHaveValue(1990);
  expect(window.location.search).toContain('language=python');
  // jsdom does not emit a scroll event after the component sets scrollTop.
  fireEvent.scroll(screen.getByLabelText('Scrollable language timeline'), { target: { scrollTop: 600 } });
  await user.click(screen.getByRole('button', { name: 'Haskell → Python: Comprehensions' }));
  expect(await screen.findByRole('button', { name: 'Comprehensions' })).toHaveAttribute('aria-pressed', 'true');
});

it('responds to browser navigation and restores an equivalent list view', async () => {
  render(<App />);
  await screen.findByRole('searchbox');
  act(() => {
    window.history.pushState({}, '', '/?q=Rust&view=list&from=2015&to=2020');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Rust 1.0' })).toBeInTheDocument();
  expect(screen.getByRole('searchbox')).toHaveValue('Rust');
});

it('bounds rendered rows and updates them when scrolling', async () => {
  render(<App />);
  const scroll = await screen.findByRole('generic', { name: 'Scrollable language timeline' });
  expect(screen.getAllByTestId('timeline-row').length).toBeLessThan(20);
  fireEvent.scroll(scroll, { target: { scrollTop: 1000 } });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Explore Rust' })).toBeInTheDocument());
  expect(screen.queryByRole('button', { name: 'Explore Fortran' })).not.toBeInTheDocument();
});

it('makes mobile detail a modal and releases the background on close', async () => {
  const user = userEvent.setup();
  vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
  window.history.replaceState({}, '', '/?language=python');
  render(<App />);
  expect(await screen.findByRole('dialog', { name: 'Python details' })).toBeInTheDocument();
  expect(document.querySelector<HTMLElement>('.toolbar')?.inert).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Close details' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.querySelector<HTMLElement>('.toolbar')?.inert).not.toBe(true);
});
