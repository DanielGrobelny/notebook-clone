import { createServer, type Server } from 'node:http';
let server: Server | undefined;
let requests = 0;
const failed = new Set<string>();
function completedResponse(text: string) {
  return { id: 'resp_local', object: 'response', created_at: 0, status: 'completed', model: 'test-local', output: [{ id: 'msg_local', type: 'message', status: 'completed', role: 'assistant', content: [{ type: 'output_text', text, annotations: [] }] }], usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } };
}
function sendEvent(res: import('node:http').ServerResponse, event: string, data: unknown) {
  res.write('event: ' + event + '\ndata: ' + JSON.stringify(data) + '\n\n');
}
async function streamResponse(res: import('node:http').ServerResponse, text: string, limited = false, mode = 'normal') {
  const item = { id: 'msg_local', type: 'message', status: 'in_progress', role: 'assistant', content: [] as unknown[] };
  const part = { type: 'output_text', text: '', annotations: [] as unknown[] };
  sendEvent(res, 'response.created', { type: 'response.created', response: { id: 'resp_local', object: 'response', created_at: 0, status: 'in_progress', model: 'test-local', output: [] } });
  sendEvent(res, 'response.output_item.added', { type: 'response.output_item.added', output_index: 0, item });
  sendEvent(res, 'response.content_part.added', { type: 'response.content_part.added', item_id: item.id, output_index: 0, content_index: 0, part });
  for(const delta of mode==='slow'?text.match(/[\s\S]{1,240}/g)??[]:[text]){sendEvent(res, 'response.output_text.delta', { type: 'response.output_text.delta', item_id: item.id, output_index: 0, content_index: 0, delta, logprobs: [] });if(mode==='slow')await new Promise(resolve=>setTimeout(resolve,60));}
  if(mode==='error'){sendEvent(res,'error',{type:'error',code:'server_error',message:'local synthetic stream error',param:null});res.end();return;}
  if(mode==='abort'){const timer=setTimeout(()=>res.end(),35000);res.on('close',()=>clearTimeout(timer));return;}
  sendEvent(res, 'response.output_text.done', { type: 'response.output_text.done', item_id: item.id, output_index: 0, content_index: 0, text, logprobs: [] });
  sendEvent(res, 'response.content_part.done', { type: 'response.content_part.done', item_id: item.id, output_index: 0, content_index: 0, part: { ...part, text } });
  sendEvent(res, 'response.output_item.done', { type: 'response.output_item.done', output_index: 0, item: { ...item, status: 'completed', content: [{ ...part, text }] } });
  const final = completedResponse(text); const event = limited ? 'response.incomplete' : 'response.completed'; sendEvent(res, event, { type: event, response: limited ? {...final,status:'incomplete',incomplete_details:{reason:'max_output_tokens'}} : final });
  res.end();
}
export default async function globalSetup() {
  server = createServer(async (req, res) => {
    requests++;
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk)); const raw = Buffer.concat(chunks).toString('utf8');
    if (req.url === '/v1/embeddings' && req.method === 'POST') { const body = JSON.parse(raw) as { input: string | string[] }; const inputs = Array.isArray(body.input) ? body.input : [body.input]; res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ object: 'list', data: inputs.map((_, index) => ({ object: 'embedding', index, embedding: Array.from({ length: 1536 }, () => 0.001) })), model: 'test-local-embedding', usage: { prompt_tokens: 0, total_tokens: 0 } })); return; }
    if (req.url === '/v1/responses' && req.method === 'POST') { const body = JSON.parse(raw); const key = raw.match(/PROVIDER_FAIL_ONCE-[a-z]+/i)?.[0] ?? 'normal'; if (key !== 'normal' ? !failed.has(key) : false) { failed.add(key); res.writeHead(503, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: { message: 'local controlled provider failure' } })); return; } const citations = [...new Set([...raw.matchAll(/\[citation:([0-9a-f-]{36})\]/gi)].map(match => match[1]))]; const long = raw.includes('LONG_CV_RESPONSE'); const limited = raw.includes('LIMIT_CV_RESPONSE'); const text = long || limited ? '**CV und Ausschreibung**\n\n' + ('- Belegte Erfahrung in TypeScript und Projektarbeit. '+citations.map(id=>'[citation:'+id+']').join(' ')+'\n').repeat(long?70:10)+(limited?'Offene Punkte: Die gef':'ENDE DER VOLLSTÄNDIGEN ANTWORT') : citations.length ? 'Lokale Chatantwort mit Beleg ' + citations.map(id => '[citation:' + id + ']').join(' ') + '.' : 'Lokales Briefing aus den ausgewählten Quellen.'; if (body.stream) { res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' }); streamResponse(res, text, limited, raw.includes('SLOW_LAYOUT_STREAM')?'slow':raw.includes('STREAM_ERROR_CV')?'error':(raw.includes('STREAM_ABORT_CV')||raw.includes('STREAM_TIMEOUT_CV'))?'abort':'normal'); return; } res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(completedResponse(text))); return; }
    res.writeHead(501); res.end(JSON.stringify({ error: 'Unsupported local provider endpoint.' }));
  });
  await new Promise<void>((resolve, reject) => { server!.once('error', reject); server!.listen(4386, '127.0.0.1', resolve); });
  process.env.OPENAI_API_KEY = 'normal-suite-local-only'; process.env.OPENAI_BASE_URL = 'http://127.0.0.1:4386/v1';
  return async () => { await new Promise<void>(resolve => server?.close(() => resolve())); };
}
