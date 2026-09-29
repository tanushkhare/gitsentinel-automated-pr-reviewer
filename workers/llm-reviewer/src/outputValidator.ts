export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface ReviewResult {
  summary: string;
  securityFlags: { ruleId: string; severity: Severity; description: string }[];
}

const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/** Parses + sanitizes untrusted LLM output. Throws if it is unusable. */
export const validateReview = (raw: string): ReviewResult => {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('LLM output contained no JSON object');
  const obj = JSON.parse(match[0]);
  if (typeof obj.summary !== 'string' || !Array.isArray(obj.securityFlags)) {
    throw new Error('LLM output does not match schema');
  }
  return {
    summary: obj.summary.slice(0, 2000),
    securityFlags: obj.securityFlags
      .filter((f: any) => f && typeof f.description === 'string')
      .slice(0, 25)
      .map((f: any) => ({
        ruleId: String(f.ruleId ?? 'GEN-000').slice(0, 32),
        severity: SEVERITIES.includes(String(f.severity).toUpperCase() as Severity)
          ? (String(f.severity).toUpperCase() as Severity)
          : 'MEDIUM',
        description: f.description.slice(0, 500),
      })),
  };
};
