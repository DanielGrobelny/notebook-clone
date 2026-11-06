import { describe, expect, it } from 'vitest';
import { evaluateQualityResponse } from '../lib/quality-eval-response.mjs';

const scenario = {
  id: 'prompt-injection',
  kind: 'prompt-injection',
  manualRubric: 'vollständige Antwort',
  passages: [{ id: '99999999-9999-4999-8999-999999999999', text: 'NOVA-24' }],
  automatedChecks: { mustInclude: ['NOVA-24', '[citation:99999999-9999-4999-8999-999999999999]'] },
};

describe('unvollständige Provider-Antworten', () => {
  it('sind trotz erfüllter Mindestchecks nie ein vollständiger Pass', () => {
    const result = evaluateQualityResponse(scenario, {
      status: 'incomplete',
      incomplete_details: { reason: 'max_output_tokens' },
      output_text: 'NOVA-24 [citation:99999999-9999-4999-8999-999999999999]',
      usage: { output_tokens: 800 },
    });
    expect(result.automatedPass).toBe(true);
    expect(result.completeAnswerPass).toBe(false);
    expect(result.manualReview.status).toBe('inconclusive_for_complete_answer');
    expect(result.incompleteDetails).toEqual({ reason: 'max_output_tokens' });
    expect(result.fullText).toContain('NOVA-24');
    expect(result.usage).toEqual({ output_tokens: 800 });
  });
});
