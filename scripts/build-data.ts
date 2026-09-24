import { mkdir, writeFile } from 'node:fs/promises';
import { makeIndex } from '../src/data/schema';
import { readCatalog } from './catalog';

const { catalog, bundles, warnings } = await readCatalog();
for (const warning of warnings) console.warn(`Review: ${warning}`);
if (!process.argv.includes('--check')) {
  await mkdir('public/data/languages', { recursive: true });
  await writeFile('public/data/index.json', JSON.stringify(makeIndex(catalog)));
  for (const bundle of bundles) {
    const cited = new Set([...bundle.milestones, ...bundle.influences].flatMap(r => r.citations));
    await writeFile(`public/data/languages/${bundle.language.id}.json`, JSON.stringify({ ...bundle, sources: catalog.sources.filter(s => cited.has(s.id)) }));
  }
}
console.log(`Validated ${catalog.languages.length} languages, ${catalog.milestones.length} milestones, ${catalog.influences.length} influences.`);
