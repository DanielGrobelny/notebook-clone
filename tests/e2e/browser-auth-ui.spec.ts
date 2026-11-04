import {expect,test} from '@playwright/test';

const session={access_token:'test-access-token',refresh_token:'test-refresh-token',token_type:'bearer',expires_in:3600,user:{id:'browser-test-user',email:'preview@example.test',aud:'authenticated',role:'authenticated'}};

test('zeigt Registrierung und erklärt eine gesperrte anonyme Demo im echten Browser-UI',async({page})=>{
  let signupRequested=false;
  await page.route('https://preview-auth-test.supabase.co/auth/v1/**',async route=>{
    const request=route.request();
    if(request.method()==='POST'&&request.url().includes('/signup')&&request.postData()?.includes('preview@example.test')){
      signupRequested=true;
      await route.fulfill({contentType:'application/json',body:JSON.stringify({user:session.user,session})});
      return;
    }
    if(request.method()==='POST'){
      await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'Anonymous sign-ins are disabled'})});
      return;
    }
    await route.fulfill({contentType:'application/json',body:JSON.stringify({user:null})});
  });
  await page.goto('/');
  await page.getByLabel('E-Mail').fill('preview@example.test');
  await page.getByLabel('Passwort').fill('sicheres-passwort');
  await page.getByRole('button',{name:'Registrieren'}).click();
  await expect.poll(()=>signupRequested).toBe(true);
  await page.getByRole('button',{name:'Echte Demo starten'}).click();
  await expect(page.getByRole('status')).toContainText('anonyme Anmeldung für die Demo ist in diesem Preview nicht verfügbar');
  await expect(page.getByRole('status')).not.toContainText('lokal nicht verfügbar');
});
