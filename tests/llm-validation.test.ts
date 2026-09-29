import { validateReview } from '../workers/llm-reviewer/src/outputValidator';
import { retrieveRules } from '../workers/llm-reviewer/src/ragRetriever';

describe('LLM output validation', () => {
  it('extracts JSON wrapped in prose and normalizes severity', () => {
    const r = validateReview('Sure!\n{"summary":"ok","securityFlags":[{"ruleId":"SEC-001","severity":"high","description":"leak"}]}');
    expect(r.securityFlags[0]?.severity).toBe('HIGH');
  });
  it('defaults unknown severities to MEDIUM', () => {
    const r = validateReview('{"summary":"x","securityFlags":[{"severity":"weird","description":"d"}]}');
    expect(r.securityFlags[0]?.severity).toBe('MEDIUM');
  });
  it('throws on non-JSON or wrong schema', () => {
    expect(() => validateReview('no json here')).toThrow();
    expect(() => validateReview('{"summary":1}')).toThrow();
  });
});

describe('RAG retriever', () => {
  it('retrieves the hardcoded-credential rule for a leaked key', () => {
    expect(retrieveRules('+const api_key = "abc"').map((r) => r.id)).toContain('SEC-001');
  });
});
