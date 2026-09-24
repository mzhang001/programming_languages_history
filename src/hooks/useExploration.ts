import { useCallback, useEffect, useState } from 'react';
import { decodeState, encodeState, normalizeState, type ExplorationState } from '../core/exploration';
import type { CatalogIndex } from '../data/schema';

export function useExploration(index: CatalogIndex) {
  const [state, setState] = useState(() => decodeState(window.location.search, index));
  useEffect(() => {
    const read = () => setState(decodeState(window.location.search, index));
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, [index]);
  const update = useCallback((patch: Partial<ExplorationState>, replace = false) => {
    setState(previous => {
      const next = normalizeState({ ...previous, ...patch }, index);
      const url = `${window.location.pathname}${encodeState(next)}${window.location.hash}`;
      // React may invoke an updater twice in development; do not duplicate history entries.
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== url) {
        window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
      }
      return next;
    });
  }, [index]);
  return [state, update] as const;
}
