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
 await expect(page.getByRole('status')).toContainText('Dein persönliches Demo-Notebook ist bereit');
 expect(demoPosts).toBe(1);
});
