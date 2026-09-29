import { SecurityRule } from '../../../vector-store/indexer';
import prompts from '../../../config/prompts/review-prompts.json';

export const buildMessages = (diff: string, rules: SecurityRule[]) => {
  const ruleText = rules.length
    ? rules.map((r) => `- ${r.id} [${r.severity}] ${r.title}: ${r.guidance}`).join('\n')
    : '- No specific rules matched; use general secure-coding judgment.';
  return [
    { role: 'system', content: prompts.system },
    {
      role: 'user',
      content: `Relevant security rules:\n${ruleText}\n\nReturn JSON matching: ${prompts.outputSchema}\n\nDiff:\n${diff.slice(0, prompts.maxDiffChars)}`,
    },
  ];
};
