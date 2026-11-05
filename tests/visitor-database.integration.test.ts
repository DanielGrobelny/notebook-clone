import {describe,it,expect,beforeAll,afterAll} from 'vitest';
import {createClient} from '@supabase/supabase-js';
import {randomBytes,createHash} from 'node:crypto';
const enabled=process.env.VISITOR_TEST_DB==='1';
describe.skipIf(!enabled)('real visitor RLS and private storage',()=>{
 let admin:any,a:any,b:any,publicDb:any,aid:string,bid:string,n:string,s:string,c:string,m:string,artifact:string,path:string;
 beforeAll(async()=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if(!['127.0.0.1','localhost'].includes(new URL(url).hostname))throw Error('Only isolated loopback test DB allowed');
  admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
  const visitor=async()=>{const token=randomBytes(32).toString('base64url');const {data,error}=await admin.from('visitor_sessions').insert({token_hash:createHash('sha256').update(token).digest('hex'),expires_at:new Date(Date.now()+3600000).toISOString()}).select('id').single();expect(error).toBeNull();return {id:data.id,db:createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false},global:{headers:{'x-visitor-token':token}}})}};
  const av=await visitor(),bv=await visitor();a=av.db;b=bv.db;aid=av.id;bid=bv.id;publicDb=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const notebook=await a.from('notebooks').insert({title:'test fixture'}).select('id').single();expect(notebook.error).toBeNull();n=notebook.data.id;
  const source=await a.from('sources').insert({notebook_id:n,title:'fixture',source_type:'text'}).select('id').single();expect(source.error).toBeNull();s=source.data.id;
  const chat=await a.from('chats').insert({notebook_id:n}).select('id').single();c=chat.data.id;
  const message=await a.from('messages').insert({chat_id:c,role:'user',content:'fixture'}).select('id').single();m=message.data.id;
  const art=await a.from('artifacts').insert({notebook_id:n,kind:'note',title:'fixture'}).select('id').single();artifact=art.data.id;
  path=aid+'/'+n+'/fixture.txt';expect((await a.storage.from('source-files').upload(path,'private fixture')).error).toBeNull();
 });
 afterAll(async()=>{if(path)await a.storage.from('source-files').remove([path]);if(admin&&aid){await admin.from('visitor_provider_limits').delete().in('visitor_id',[aid,bid]);await admin.from('visitor_sessions').delete().in('id',[aid,bid]);}});
 it('denies public and second visitor reads for all resource tables',async()=>{
  for(const [table,id] of [['notebooks',n],['sources',s],['chats',c],['messages',m],['artifacts',artifact]])for(const db of [b,publicDb]){const r=await db.from(table).select('id').eq('id',id);expect(r.error).toBeNull();expect(r.data).toEqual([])}
 });
 it('rejects client-selected foreign ownership and parent IDs',async()=>{
  expect((await b.from('notebooks').insert({title:'spoof',visitor_id:aid})).error).not.toBeNull();
  expect((await b.from('sources').insert({title:'spoof',source_type:'text',notebook_id:n})).error).not.toBeNull();
  expect((await b.from('messages').insert({chat_id:c,role:'user',content:'spoof'})).error).not.toBeNull();
  expect((await b.from('source_chunks').insert({source_id:s,position:0,content:'spoof'})).error).not.toBeNull();
 });
 it('foreign mutations affect no rows and preserve original data',async()=>{
  expect((await b.from('notebooks').update({title:'stolen'}).eq('id',n).select()).data).toEqual([]);
  expect((await b.from('sources').delete().eq('id',s).select()).data).toEqual([]);
  expect((await a.from('sources').select('id').eq('id',s).single()).data.id).toBe(s);
 });
 it('private storage only permits owning visitor download and deletion',async()=>{
  expect((await b.storage.from('source-files').download(path)).error).not.toBeNull();
  await b.storage.from('source-files').remove([path]);
  const own=await a.storage.from('source-files').download(path);expect(own.error).toBeNull();expect(await own.data.text()).toBe('private fixture');
  expect((await publicDb.storage.from('source-files').download(path)).error).not.toBeNull();
 });
 it('exact retrieval covers both visitor sources and rejects forged identities',async()=>{
  await a.from('sources').update({status:'ready'}).eq('id',s);
  const second=await a.from('sources').insert({notebook_id:n,title:'second fixture',source_type:'text',status:'ready'}).select('id').single();expect(second.error).toBeNull();
  const vector=Array.from({length:1536},(_,i)=>i===0?1:0);
  const rows=Array.from({length:15},(_,i)=>({source_id:s,position:i,content:'synthetic CV '+i,embedding:vector}));rows.push({source_id:second.data.id,position:0,content:'synthetic job',embedding:vector});
  expect((await a.from('source_chunks').insert(rows)).error).toBeNull();
  const args={p_notebook_id:n,p_user_id:aid,p_source_ids:[s,second.data.id],p_query_embedding:JSON.stringify(vector),p_match_count:12};
  const found=await a.rpc('match_source_chunks',args);expect(found.error).toBeNull();expect(found.data).toHaveLength(12);expect(new Set(found.data.map((r:any)=>r.source_id)).size).toBe(2);
  for(const db of [b,publicDb])expect((await db.rpc('match_source_chunks',args)).data).toEqual([]);
  expect((await a.rpc('match_source_chunks',{...args,p_user_id:bid})).data).toEqual([]);
  expect((await a.rpc('match_source_chunks',{...args,p_source_ids:[second.data.id]})).data).toHaveLength(1);
 });
 it('bootstrap is idempotent under concurrent requests',async()=>{
  const rows=await Promise.all([b.rpc('ensure_visitor_notebook'),b.rpc('ensure_visitor_notebook')]);expect(rows[0].error).toBeNull();expect(rows[0].data).toBe(rows[1].data);
 });
 it('enforces twelve calls atomically and rejects missing visitor identity',async()=>{
  const rows=await Promise.all(Array.from({length:14},()=>b.rpc('claim_visitor_provider_call')));expect(rows.filter(r=>r.data?.[0]?.allowed).length).toBe(12);expect((await publicDb.rpc('claim_visitor_provider_call')).data[0].allowed).toBe(false);
 });
});
