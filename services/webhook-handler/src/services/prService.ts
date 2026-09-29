import axios from 'axios';

/** Posts the review as a PR comment. No-op without GITHUB_TOKEN. */
export const postReviewComment = async (
  owner: string, repo: string, prNumber: number, body: string
): Promise<boolean> => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return false;
  await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    { body },
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } }
  );
  return true;
};

export const formatComment = (summary: string, flags: { ruleId: string; severity: string; description: string }[]): string =>
  [`### GitSentinel review`, summary, ...(flags.length ? ['', '| Rule | Severity | Finding |', '|---|---|---|', ...flags.map((f) => `| ${f.ruleId} | ${f.severity} | ${f.description} |`)] : ['', 'No security issues found.'])].join('\n');
