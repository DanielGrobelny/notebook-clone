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
