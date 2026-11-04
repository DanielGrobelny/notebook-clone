import {test,expect} from '@playwright/test';
test('first visit: accessible welcome, dismiss, reload and new tab',async({page,context},info)=>{
 await page.goto('/');const modal=page.getByRole('dialog',{name:'Deine Quellen. Deine Erkenntnisse.'});await expect(modal).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('lumen.welcome.v1'))).toBeNull();
 await expect(modal).toContainText('ohne Account');await expect(modal).toContainText('keine sensiblen Dokumente');
 await expect(modal.getByLabel('Willkommen schließen')).toBeFocused();
 await page.keyboard.press('Shift+Tab');await expect(modal.getByRole('button',{name:'Erst einmal umsehen'})).toBeFocused();
 await page.keyboard.press('Tab');await expect(modal.getByLabel('Willkommen schließen')).toBeFocused();
 expect(await modal.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 await page.screenshot({path:'/home/daniel-grobelny/.config/notebook-clone/onboarding/'+info.project.name+'-modal.png',fullPage:true});
 await page.keyboard.press('Escape');await expect(modal).toHaveCount(0);
 await expect(page.getByLabel('Frage an deine Quellen')).toBeDisabled();await expect(page.getByRole('button',{name:'Frage senden'})).toBeDisabled();
 await expect(page.getByRole('heading',{name:'Lade zuerst mindestens eine Quelle hoch'})).toBeVisible();
 await page.screenshot({path:'/home/daniel-grobelny/.config/notebook-clone/onboarding/'+info.project.name+'-empty.png',fullPage:true});
 await page.reload();await expect(page.locator('.welcome-dialog')).toHaveCount(0);
 const tab=await context.newPage();await tab.goto('/');await expect(tab.getByLabel('Frage an deine Quellen')).toBeDisabled();await expect(tab.locator('.welcome-dialog')).toHaveCount(0);await tab.close();
});
test('blocked storage remains usable and upload CTA works',async({page,isMobile})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}})});
 await page.goto('/');await page.getByRole('button',{name:'Erste Quelle hochladen'}).click();await expect(page.locator('.welcome-dialog')).toHaveCount(0);
 if(isMobile)await expect(page.getByRole('dialog',{name:'Quellen',exact:true})).toBeVisible();
 await expect(page.getByLabel('Frage an deine Quellen')).toBeDisabled();
});
test('bootstrap error is not hidden by welcome',async({page})=>{
 await page.route('**/api/session',r=>r.fulfill({status:503,json:{message:'unavailable'}}));await page.goto('/');
 await expect(page.getByRole('alert').first()).toContainText('Arbeitsbereich nicht verfügbar');await expect(page.locator('.welcome-dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:'Erneut versuchen'})).toBeVisible();
});
test('initialization is distinct; simultaneous tab dismissal persists only on action',async({page,context},info)=>{
 let release!:()=>void;const gate=new Promise<void>(r=>release=r);await page.route('**/api/session',async r=>{await gate;await r.continue()});await page.goto('/');
 await expect(page.getByLabel('Frage an deine Quellen')).toBeDisabled();await expect(page.locator('.welcome-dialog')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Dein Arbeitsbereich wird eingerichtet …'})).toBeVisible();
 await page.screenshot({path:'/home/daniel-grobelny/.config/notebook-clone/onboarding/'+info.project.name+'-loading.png',fullPage:true});release();
 await expect(page.locator('.welcome-dialog')).toBeVisible();const tab=await context.newPage();await tab.goto('/');await expect(tab.locator('.welcome-dialog')).toBeVisible();
 await page.getByRole('button',{name:'Erst einmal umsehen'}).click();await expect(tab.locator('.welcome-dialog')).toHaveCount(0);await tab.close();
});
