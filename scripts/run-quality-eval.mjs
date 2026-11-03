import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { evaluateQualityResponse } from '../lib/quality-eval-response.mjs';
import { groundedAnswerInstruction } from '../lib/grounded-prompt.mjs';

if (process.env.RUN_QUALITY_EVAL !== '1') throw new Error('Opt-in erforderlich: RUN_QUALITY_EVAL=1');
const keyFile = process.env.OPENAI_API_KEY_FILE;
if (!keyFile) throw new Error('OPENAI_API_KEY_FILE muss explizit gesetzt sein');
const keyLine = readFileSync(keyFile, 'utf8').split(/\r?\n/).find(line => line.startsWith('OPENAI_API_KEY='));
const apiKey = keyLine?.slice('OPENAI_API_KEY='.length).trim().replace(/^['\"]|['\"]$/g, '');
if (!apiKey) throw new Error('OPENAI_API_KEY fehlt in der expliziten Schlüsseldatei');

const fixturePath = process.env.QUALITY_EVAL_FIXTURE ?? 'evals/quality/v2.json';
const fixture = JSON.parse(readFileSync(resolve(fixturePath), 'utf8'));
const selectedIds = process.env.QUALITY_EVAL_SCENARIOS?.split(',').filter(Boolean) ?? ['prompt-injection', 'legitimate-contradiction'];
const scenarios = selectedIds ? fixture.scenarios.filter(scenario => selectedIds.includes(scenario.id)) : fixture.scenarios;
if (selectedIds && scenarios.length !== selectedIds.length) throw new Error('Unbekanntes Eval-Szenario angefordert');
if (scenarios.length === 0) throw new Error('Keine Eval-Szenarien ausgewählt');
if (scenarios.length > 2) throw new Error('Dieser Runner begrenzt Real-Provider-Läufe auf maximal zwei Aufrufe');

const headers = { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' };
const promptRevision = 'groundedAnswerInstruction@shared-production-system-v1';
const runs = [];
for (const scenario of scenarios) {
  const evidence = scenario.passages.map(passage => '[citation:' + passage.id + '] ' + passage.text).join('\n');
  const userInput = evidence + '\n\nFrage: ' + scenario.question;
  const request = { model: fixture.model, instructions: groundedAnswerInstruction, input: userInput, max_output_tokens: 800, store: false };
  const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers, body: JSON.stringify(request) });
  if (!response.ok) throw new Error('Antwort für ' + scenario.id + ' fehlgeschlagen (' + response.status + ')');
  const body = await response.json();
  runs.push(evaluateQualityResponse(scenario, body));
}
const hasIncompleteResponse = runs.some(run => run.apiStatus === 'incomplete');
const result = { fixtureVersion: fixture.version, criteriaVersion: fixture.criteriaVersion, promptRevision, model: fixture.model, executedAt: new Date().toISOString(), providerCalls: { embeddings: 0, responses: scenarios.length, total: scenarios.length }, runs, automatedPassed: runs.filter(run => run.automatedPass).length, total: runs.length, passFail: hasIncompleteResponse ? 'inconclusive_for_complete_answer' : 'pending_manual_review', limitations: ['Zwei gezielte, synthetische Provider-Aufrufe sind kein Nachweis für Halluzinationsfreiheit oder allgemeine Robustheit.', 'Automatisierte Checks prüfen nur eng definierte Mindestbedingungen; die inhaltliche Bedeutung und das Nichtbefolgen einer Injection werden anhand der gespeicherten Antwort manuell bewertet.', 'Kein Embedding-Aufruf: Die festen Passagen werden dem Modell direkt vorgelegt.', 'Kontextrelevanz ist nicht dasselbe wie echte Quellenauswahl; die Auswahl/Auswahlabwahl bleibt ein E2E-Thema.', 'Keine privaten Dokumente oder Schlüsselwerte werden gespeichert.', 'Jede API-Antwort mit status=incomplete ist inconclusive_for_complete_answer und darf nicht als vollständiger Pass bewertet werden.'] };
const output = resolve(process.env.QUALITY_EVAL_OUTPUT ?? 'evals/quality/results/latest.json');
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(result, null, 2) + '\n', { mode: 0o644 });
console.log(JSON.stringify({ output, automatedPassed: result.automatedPassed, total: result.total, passFail: result.passFail, providerCalls: result.providerCalls }));
