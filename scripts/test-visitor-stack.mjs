import {execFile as execCallback} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHmac,randomBytes} from 'node:crypto';
import http from 'node:http'; import net from 'node:net';
const exec=promisify(execCallback);
const directory=await mkdtemp(join(tmpdir(),'visitor-tests-'));
const prefix='visitor-tests-'+process.pid;
const containers=[];let gateway;let networkCreated=false;
const run=async(command,args,options={})=>{try{const r=await exec(command,args,{maxBuffer:16*1024*1024,...options});return r.stdout;}catch(e){throw Error(command+' failed: '+String(e.stdout??'')+String(e.stderr??''));}};
const docker=(...args)=>run('docker',args);
const sql=async(text)=>{const file=join(directory,'query.sql');await writeFile(file,text,{mode:0o600});await docker('cp',file,prefix+'-db:/tmp/query.sql');return docker('exec',prefix+'-db','psql','-U','postgres','-v','ON_ERROR_STOP=1','-f','/tmp/query.sql');};
const envFile=async(name,values)=>{const file=join(directory,name);await writeFile(file,Object.entries(values).map(([k,v])=>k+'='+v).join(String.fromCharCode(10))+String.fromCharCode(10),{mode:0o600});return file;};
const start=async(name,args)=>{containers.push(name);await docker('run','-d','--name',name,'--network',prefix,...args);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(check){for(let i=0;i<60;i++){try{if(await check())return;}catch{}await sleep(500);}throw Error('test service startup timed out');}
const secret=randomBytes(32).toString('hex');
function jwt(role){const encode=o=>Buffer.from(JSON.stringify(o)).toString('base64url');const body=encode({alg:'HS256',typ:'JWT'})+'.'+encode({role,exp:Math.floor(Date.now()/1000)+3600});return body+'.'+createHmac('sha256',secret).update(body).digest('base64url');}
const anon=jwt('anon'),service=jwt('service_role');
try{
 for(const port of [4385,4386,56821,56823,56824])await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',()=>reject(Error('Required test port occupied: '+port)));probe.listen(port,'127.0.0.1',()=>probe.close(resolve));}); await docker('network','create',prefix);networkCreated=true;
 await start(prefix+'-db',['--tmpfs','/var/lib/postgresql/data:rw,size=1g','-e','POSTGRES_HOST_AUTH_METHOD=trust','pgvector/pgvector:pg16']);
 await waitFor(async()=>{await docker('exec',prefix+'-db','pg_isready','-U','postgres');return true;});
 await sql(await readFile('tests/fixtures/visitor-database-bootstrap.sql','utf8'));
 const storage=await envFile('storage.env',{ANON_KEY:anon,SERVICE_KEY:service,PGRST_JWT_SECRET:secret,DATABASE_URL:'postgres://supabase_storage_admin@'+prefix+'-db:5432/postgres',POSTGREST_URL:'http://'+prefix+'-rest:3000',STORAGE_BACKEND:'file',FILE_STORAGE_BACKEND_PATH:'/var/lib/storage',TENANT_ID:'visitor-test',REGION:'local',GLOBAL_S3_BUCKET:'local',FILE_SIZE_LIMIT:5242880});
 await start(prefix+'-storage',['--env-file',storage,'--tmpfs','/var/lib/storage:rw,size=128m','-p','127.0.0.1:56823:5000','public.ecr.aws/supabase/storage-api:v1.79.36']);
 await waitFor(async()=>{return (await sql("select to_regclass('storage.objects');")).includes('storage.objects');});
 for(const name of (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort()){
  if(name==='20261104160000_visitor_sessions.sql')await sql("with u as (insert into auth.users(id) values(gen_random_uuid()) returning id) insert into public.notebooks(owner_id,title) select id,'legacy-preservation-fixture' from u;");
  await sql(await readFile(join('supabase/migrations',name),'utf8'));
 }
 const legacy=await sql("select count(*) from public.notebooks where title='legacy-preservation-fixture' and owner_id is not null and visitor_id is null;");
 if(!legacy.includes('1'))throw Error('legacy ownership was not preserved');
 await sql('grant usage on schema storage to anon,authenticated,service_role; grant select on storage.buckets to anon,authenticated; grant all on all tables in schema storage to service_role;');
 const rest=await envFile('rest.env',{PGRST_DB_URI:'postgres://authenticator@'+prefix+'-db:5432/postgres',PGRST_DB_SCHEMAS:'public,storage',PGRST_DB_ANON_ROLE:'anon',PGRST_JWT_SECRET:secret});
 await start(prefix+'-rest',['--env-file',rest,'-p','127.0.0.1:56824:3000','public.ecr.aws/supabase/postgrest:v16.4']);
 await waitFor(async()=>{return (await fetch('http://127.0.0.1:56824/')).ok;});
 gateway=http.createServer((req,res)=>{const storage=req.url.startsWith('/storage/v1/');const prefix=storage?'/storage/v1':'/rest/v1';const upstream=http.request({host:'127.0.0.1',port:storage?56823:56824,path:req.url.slice(prefix.length),method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode,r.headers);r.pipe(res)});upstream.on('error',()=>{res.writeHead(502);res.end()});req.pipe(upstream);});
 await new Promise((resolve,reject)=>{gateway.once('error',reject);gateway.listen(56821,'127.0.0.1',resolve)});
 const env={...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:56821',NEXT_PUBLIC_SUPABASE_ANON_KEY:anon,SUPABASE_SERVICE_ROLE_KEY:service,OPENAI_API_KEY:'local-test-only',OPENAI_BASE_URL:'http://127.0.0.1:4386/v1',VISITOR_TEST_DB:'1'};
 delete env.RUN_OPENAI_INTEGRATION;delete env.RUN_INTEGRATION;
 for(const args of [['typecheck'],['test'],['next','build','--webpack'],['playwright','test','--workers=2']]){console.log('pnpm '+args.join(' '));console.log(await run('pnpm',args,{env}));}
 console.log(await run('pnpm',['playwright','test','tests/e2e/source-storage-delete.integration.spec.ts','--workers=1','--output=test-results/storage'],{env:{...env,RUN_INTEGRATION:'1'}}));
}finally{
 if(gateway)await new Promise(r=>gateway.close(r));
 for(const name of containers.reverse())await docker('rm','-f',name).catch(()=>{});
 if(networkCreated)await docker('network','rm',prefix).catch(()=>{});
 await rm(directory,{recursive:true,force:true});
}
