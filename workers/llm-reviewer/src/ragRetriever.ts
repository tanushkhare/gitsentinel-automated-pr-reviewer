import { loadRules, SecurityRule } from '../../../vector-store/indexer';

/** Returns the rules most relevant to the diff, ranked by keyword hits. */
export const retrieveRules = (diff: string, topK = 4): SecurityRule[] => {
  const text = diff.toLowerCase();
  return loadRules()
    .map((rule) => ({ rule, score: rule.keywords.filter((k) => text.includes(k.toLowerCase())).length }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r) => r.rule);
};
