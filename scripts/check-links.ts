import { writeFile } from 'node:fs/promises';
import { readCatalog } from './catalog';

const { catalog } = await readCatalog();
const queue = [...new Set(catalog.sources.map(source => source.url))];
const failures: { url: string; reason: string }[] = [];
let checked = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (queue.length) {
    const url = queue.shift()!;
    try {
      let response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'LanguageAtlas-LinkChecker/1.0' } });
      if (!response.ok) {
        await response.body?.cancel();
        response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'LanguageAtlas-LinkChecker/1.0' } });
      }
      if (!response.ok) failures.push({ url, reason: `HTTP ${response.status}` });
      await response.body?.cancel();
    } catch (error) { failures.push({ url, reason: error instanceof Error ? error.message : String(error) }); }
    checked++;
  }
}));
const report = { checkedAt: new Date().toISOString(), checked, failures };
await writeFile('link-report.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(`${checked} sources checked; ${failures.length} need review. See link-report.json.`);
if (failures.length) process.exitCode = 1;
