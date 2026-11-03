import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocked=vi.hoisted(()=>({createClient:vi.fn(),config:vi.fn(),generateText:vi.fn(),openai:vi.fn()}));
vi.mock('../lib/supabase/server',()=>({createClient:mocked.createClient}));
vi.mock('../app/ai-config',()=>({getModelConfiguration:mocked.config}));
vi.mock('ai',()=>({generateText:mocked.generateText}));
vi.mock('@ai-sdk/openai',()=>({createOpenAI:mocked.openai}));
const {POST}=await import('../app/api/notebooks/[id]/briefing/route');
const notebookId='11111111-1111-4111-8111-111111111111', sourceId='22222222-2222-4222-8222-222222222222';
const params={params:Promise.resolve({id:notebookId})};const request=(sourceIds:string[])=>new Request('http://test',{method:'POST',body:JSON.stringify({sourceIds})});
function chain(result:any){const x:any={select:vi.fn(()=>x),eq:vi.fn(()=>x),in:vi.fn(()=>x),insert:vi.fn(()=>x),update:vi.fn(()=>x),maybeSingle:vi.fn().mockResolvedValue(result),single:vi.fn().mockResolvedValue(result),then:(ok:any,bad:any)=>Promise.resolve(result).then(ok,bad)};return x}
function db(sources:any[]){const updates:any[]=[];return {updates,auth:{getUser:vi.fn().mockResolvedValue({data:{user:{id:'tenant-a'}}})},from:vi.fn((table:string)=>{if(table==='notebooks')return chain({data:{id:notebookId}});if(table==='sources')return chain({data:sources,error:null});if(table==='artifacts'){const x=chain({data:{id:'33333333-3333-4333-8332-333333333333'},error:null});x.update=vi.fn((row:any)=>{updates.push(row);return x});return x}throw Error(table)})}}
beforeEach(()=>{vi.clearAllMocks();mocked.config.mockReturnValue({configured:false})});
describe('Studio Briefing',()=>{
 it('selected sources: lehnt fremde oder nicht bereite Quellen ab',async()=>{mocked.createClient.mockResolvedValue(db([]));const r=await POST(request([sourceId]),params);expect(r.status).toBe(409);expect((await r.json()).error).toBe('sources_unavailable')});
 it('source unavailable: akzeptiert keine teilweise Quellenliste',async()=>{mocked.createClient.mockResolvedValue(db([{id:sourceId,title:'A',status:'processing',source_chunks:[]}]));expect((await POST(request([sourceId]),params)).status).toBe(409)});
 it('generation status: speichert failed bei nicht konfiguriertem Provider für Retry',async()=>{const x=db([{id:sourceId,title:'A',status:'ready',source_chunks:[{id:'44444444-4444-4444-8444-444444444444',content:'Beleg',position:0}]}]);mocked.createClient.mockResolvedValue(x);const r=await POST(request([sourceId]),params);expect(r.status).toBe(503);expect(x.updates).toContainEqual(expect.objectContaining({generation_status:'failed'}))});
 it('failure retry: ein erneuter Request erzeugt einen neuen Verarbeitungslauf',async()=>{const source={id:sourceId,title:'A',status:'ready',source_chunks:[{id:'44444444-4444-4444-8444-444444444444',content:'Beleg',position:0}]};const one=db([source]),two=db([source]);mocked.createClient.mockResolvedValueOnce(one).mockResolvedValueOnce(two);expect((await POST(request([sourceId]),params)).status).toBe(503);expect((await POST(request([sourceId]),params)).status).toBe(503);expect(one.from).toHaveBeenCalledWith('artifacts');expect(two.from).toHaveBeenCalledWith('artifacts')});
});
