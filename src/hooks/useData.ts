import { useEffect, useState } from 'react';
import type { CatalogIndex, LanguageDetail } from '../data/schema';

const cache = new Map<string, unknown>();
export function useData<T extends CatalogIndex | LanguageDetail>(path: string | undefined) {
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ path?: string; data?: T; error?: string }>({});
  useEffect(() => {
    if (!path) return;
    const cached = cache.get(path) as T | undefined;
    if (cached) { setResult({ path, data: cached }); return; }
    const controller = new AbortController();
    setResult({ path });
    fetch(`${import.meta.env.BASE_URL}data/${path}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json() as Promise<T>; })
      .then(data => { if (!controller.signal.aborted) { cache.set(path, data); setResult({ path, data }); } })
      .catch(error => { if (!controller.signal.aborted) setResult({ path, error: `Could not load this part of the atlas (${String(error.message)}).` }); });
    return () => controller.abort();
  }, [path, retry]);
  return { data: result.path === path ? result.data : undefined, error: result.path === path ? result.error : undefined, retry: () => setRetry(n => n + 1) };
}
