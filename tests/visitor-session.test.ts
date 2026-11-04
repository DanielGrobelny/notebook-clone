import {beforeEach,describe,it,expect,vi} from 'vitest';
import {createHash} from 'node:crypto';
const m=vi.hoisted(()=>({cookie:undefined as string|undefined,found:null as any,failure:null as any,insert:vi.fn(),set:vi.fn(),eq:vi.fn(),secure:false}));
vi.mock('next/headers',()=>({cookies:async()=>({get:()=>m.cookie?{value:m.cookie}:undefined,set:m.set}),headers:async()=>({get:()=>m.secure?'https':'http'})}));
vi.mock('../lib/supabase/server',()=>({adminClient:()=>({from:()=>{const q:any={select:()=>q,eq:(...a:any[])=>{m.eq(...a);return q},gt:()=>q,maybeSingle:async()=>({data:m.found,error:m.failure}),insert:(row:any)=>{m.insert(row);return q},single:async()=>({data:m.failure?null:{id:'visitor-new'},error:m.failure})};return q}})}));
import {getVisitorSession} from '../lib/visitor-session';
beforeEach(()=>{vi.clearAllMocks();m.cookie=undefined;m.found=null;m.failure=null;m.secure=false});
describe('persistent visitor cookie',()=>{
 it('issues random opaque HttpOnly cookie and stores only its hash',async()=>{const s=await getVisitorSession();expect(s.token).toMatch(/^[A-Za-z0-9_-]{43}$/);expect(m.insert.mock.calls[0][0].token_hash).toBe(createHash('sha256').update(s.token).digest('hex'));expect(m.set).toHaveBeenCalledWith('notebook_visitor',s.token,expect.objectContaining({httpOnly:true,sameSite:'lax',path:'/'}));});
 it('reuses a valid existing cookie without another session',async()=>{m.cookie='a'.repeat(43);m.found={id:'existing'};expect((await getVisitorSession()).id).toBe('existing');expect(m.insert).not.toHaveBeenCalled();expect(m.set).not.toHaveBeenCalled()});
 it.each(['invalid','a'.repeat(43)])('replaces malformed, tampered or expired token %s',async cookie=>{m.cookie=cookie;expect((await getVisitorSession()).id).toBe('visitor-new');expect(m.insert).toHaveBeenCalledTimes(1)});
 it('uses Secure on HTTPS',async()=>{m.secure=true;await getVisitorSession();expect(m.set.mock.calls[0][2].secure).toBe(true)});
 it('fails closed on database failure',async()=>{m.cookie='a'.repeat(43);m.failure={code:'backend_down'};await expect(getVisitorSession()).rejects.toThrow('visitor_session_unavailable');expect(m.set).not.toHaveBeenCalled()});
 it('does not derive identity from previous cookie after loss',async()=>{const a=await getVisitorSession();const b=await getVisitorSession();expect(a.token).not.toBe(b.token)});
});
