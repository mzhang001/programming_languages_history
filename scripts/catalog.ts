import { readFile, readdir } from 'node:fs/promises';
import { parse } from 'yaml';
import { bundleSchema, validateCatalog } from '../src/data/schema';

export async function readCatalog() {
  const files = (await readdir('data/languages')).filter(f => f.endsWith('.yaml')).sort();
  const bundles = await Promise.all(files.map(async file => {
    const bundle = bundleSchema.parse(parse(await readFile(`data/languages/${file}`, 'utf8')));
    if (file !== `${bundle.language.id}.yaml`) throw new Error(`${file}: filename must match language ID`);
    if (bundle.milestones.some(m => m.language !== bundle.language.id)) throw new Error(`${file}: milestone belongs to another language`);
    if (bundle.influences.some(i => !bundle.milestones.some(m => m.id === i.destination))) throw new Error(`${file}: influence must target a milestone in this file`);
    return bundle;
  }));
  const result = validateCatalog({
    schemaVersion: 1, languages: bundles.map(b => b.language),
    milestones: bundles.flatMap(b => b.milestones), influences: bundles.flatMap(b => b.influences),
    sources: parse(await readFile('data/sources.yaml', 'utf8')),
  });
  return { ...result, bundles };
}
