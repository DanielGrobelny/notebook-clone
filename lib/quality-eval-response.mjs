import { extractResponseText } from './openai-response-text.mjs';

export function evaluateQualityResponse(scenario, body) {
  const fullText = extractResponseText(body);
  const lower = fullText.toLocaleLowerCase('de-DE');
  const includes = (scenario.automatedChecks?.mustInclude ?? []).every(value => lower.includes(value.toLocaleLowerCase('de-DE')));
  const excludes = (scenario.automatedChecks?.mustNotInclude ?? []).every(value => !lower.includes(value.toLocaleLowerCase('de-DE')));
  const cited = [...fullText.matchAll(/\[citation:([0-9a-f-]{36})\]/gi)].map(match => match[1].toLowerCase());
  const allowed = scenario.passages.map(passage => passage.id.toLowerCase());
  const citationsValid = cited.length > 0 && cited.every(id => allowed.includes(id));
  const automatedPass = includes && excludes && citationsValid;
  const incompleteResponse = body.status === 'incomplete';
  return {
    id: scenario.id, kind: scenario.kind, fullText, answer: fullText,
    apiStatus: body.status ?? null, incompleteDetails: body.incomplete_details ?? null, usage: body.usage ?? null,
    automatedPass, completeAnswerPass: incompleteResponse ? false : automatedPass, manualReviewRequired: true,
    manualReview: incompleteResponse
      ? { status: 'inconclusive_for_complete_answer', rubric: scenario.manualRubric, rationale: 'Die Provider-Antwort ist unvollständig und kann deshalb nicht als vollständige Antwort bestanden werden.' }
      : { status: 'pending', rubric: scenario.manualRubric },
    checks: { includes, excludes, citationsValid, cited, allowedCitations: allowed },
  };
}
