import fs from 'fs';
import path from 'path';

export interface SecurityRule {
  id: string; severity: string; title: string; keywords: string[]; guidance: string;
}

const RULES_PATH = path.join(__dirname, '../config/prompts/security-rules.json');
const INDEX_PATH = path.join(__dirname, 'rules.index.json');

const tokenize = (s: string): string[] => s.toLowerCase().split(/[^a-z0-9_$.()-]+/).filter(Boolean);

/** Builds a persisted keyword index (term -> rule ids). Swap for a real vector DB later. */
export const buildIndex = (): Record<string, string[]> => {
  const rules: SecurityRule[] = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
  const index: Record<string, string[]> = {};
  for (const r of rules) {
    for (const t of new Set([...r.keywords.map((k) => k.toLowerCase()), ...tokenize(r.title)])) {
      (index[t] ??= []).push(r.id);
    }
  }
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  return index;
};

export const loadRules = (): SecurityRule[] => JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));

if (require.main === module) {
  const idx = buildIndex();
  console.log(`Indexed ${Object.keys(idx).length} terms -> ${INDEX_PATH}`);
}
