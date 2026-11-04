import {expect,test} from '@playwright/test';
const session={access_token:'test-access-token',refresh_token:'test-refresh-token',token_type:'bearer',expires_in:3600,user:{id:'browser-test-user',email:'preview@example.test',aud:'authenticated',role:'authenticated'}};
async function routeAuth(page: import('@playwright/test').Page, signupResponse: unknown) {
 await page.route('https://preview-auth-test.supabase.co/auth/v1/**',async route=>{
  const request=route.request();
  if(request.method()==='POST'&&request.url().includes('/signup')) return route.fulfill({contentType:'application/json',body:JSON.stringify(signupResponse)});
  if(request.method()==='POST'&&request.url().includes('/token?grant_type=password')) return route.fulfill({contentType:'application/json',body:JSON.stringify(session)});
  if(request.method()==='POST') return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'Anonymous sign-ins are disabled'})});
  return route.fulfill({contentType:'application/json',body:JSON.stringify({user:null})});
 });
}
test('zeigt nach Registrierung ohne Sitzung einen Bestätigungsmail-Hinweis',async({page})=>{
 await routeAuth(page,{user:session.user,session:null}); await page.goto('/');
 await page.getByLabel('E-Mail').fill('preview@example.test'); await page.getByLabel('Passwort').fill('sicheres-passwort'); await page.getByRole('button',{name:'Registrieren'}).click();
 await expect(page.getByRole('status')).toContainText('Bitte bestätige die E-Mail-Adresse');
 await expect(page.getByRole('button',{name:'Anmelden'})).toBeVisible();
});
test('meldet bestätigte Konten an',async({page})=>{
 await routeAuth(page,{user:session.user,session}); await page.goto('/');
 await page.getByLabel('E-Mail').fill('preview@example.test'); await page.getByLabel('Passwort').fill('sicheres-passwort'); await page.getByRole('button',{name:'Anmelden'}).click();
 await expect(page.getByText('Angemeldet',{exact:true})).toBeVisible();
});
test('erklärt eine gesperrte anonyme Demo im echten Browser-UI',async({page})=>{
 await page.route('https://preview-auth-test.supabase.co/auth/v1/**',async route=>{
  if(route.request().method()==='POST') return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'Anonymous sign-ins are disabled'})});
  return route.fulfill({contentType:'application/json',body:JSON.stringify({user:null})});
 });
 await page.goto('/'); await page.getByRole('button',{name:'Echte Demo starten'}).click();
 await expect(page.getByRole('status')).toContainText('anonyme Anmeldung für die Demo ist in diesem Preview nicht verfügbar');
 await expect(page.getByRole('status')).not.toContainText('lokal nicht verfügbar');
});
