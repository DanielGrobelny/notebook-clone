import {expect,test} from '@playwright/test';

test('zeigt den isolierten echten Demo-Einstieg ohne Offline-Account-Versprechen',async({page,isMobile})=>{
  await page.goto('/');
  const demo=page.getByRole('region',{name:'Persönliches Demo-Notebook'});
  await expect(demo).toContainText('eigene anonyme Sitzung');
  await expect(demo).toContainText('kein gemeinsamer Demo-Account');
  await expect(demo.getByRole('button',{name:'Echte Demo starten'})).toBeVisible();
  await expect(demo.getByRole('button',{name:'Nur meine Demo zurücksetzen'})).toBeVisible();
  if(isMobile) await expect(demo).toBeVisible();
});

test('aktiviert die anonyme Demo mit Mock-Sitzung ohne Provider-Aufruf',async({page})=>{
 const anonymousSession={access_token:'anonymous-token',refresh_token:'anonymous-refresh',token_type:'bearer',expires_in:3600,user:{id:'anonymous-user',aud:'authenticated',role:'authenticated',is_anonymous:true}};
 let demoPosts=0;
 await page.route('https://preview-auth-test.supabase.co/auth/v1/**',async route=>{
  const request=route.request();
  if(request.method()==='POST'&&request.url().includes('/token?grant_type=anonymous')) return route.fulfill({contentType:'application/json',body:JSON.stringify(anonymousSession)});
  return route.fulfill({contentType:'application/json',body:JSON.stringify({user:null})});
 });
 await page.route('**/api/demo',async route=>{if(route.request().method()==='POST')demoPosts++; await route.fulfill({contentType:'application/json',body:JSON.stringify({notebook:{id:'demo-notebook',title:'Meine Demo'},providerReady:false})});});
 await page.goto('/'); await page.getByRole('button',{name:'Echte Demo starten'}).click();
 await expect(page.getByRole('status')).toContainText('Quellen konnten nicht vorbereitet werden');
 await expect(page.getByRole('status')).toContainText('Fehlercode: demo_sources_unavailable');
 expect(demoPosts).toBe(1);
});

test('zeigt bei fehlenden Demoquellen nur den allgemeinen Nicht-bereit-Hinweis',async({page})=>{
 const anonymousSession={access_token:'anonymous-token',refresh_token:'anonymous-refresh',token_type:'bearer',expires_in:3600,user:{id:'anonymous-user',aud:'authenticated',role:'authenticated',is_anonymous:true}};
 await page.route('https://preview-auth-test.supabase.co/auth/v1/**',async route=>{
  const request=route.request();
  if(request.method()==='POST'&&request.url().includes('/token?grant_type=anonymous')) return route.fulfill({contentType:'application/json',body:JSON.stringify(anonymousSession)});
  return route.fulfill({contentType:'application/json',body:JSON.stringify({user:null})});
 });
 await page.route('**/api/demo',async route=>route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({notebook:{id:'demo-notebook',title:'Meine Demo'},providerReady:false,providerIssue:'demo_sources_unavailable',internalError:{message:'provider credential rejected'}})}));
 await page.goto('/');
 await page.getByRole('button',{name:'Echte Demo starten'}).click();
 const status=page.getByRole('status');
 await expect(status).toContainText('Quellen konnten nicht vorbereitet werden');
 await expect(status).toContainText('Fehlercode: demo_sources_unavailable');
 await expect(status).not.toContainText('provider credential rejected');
 await expect(status).not.toContainText('bereit. Die Quellen sind synthetisch');
});
