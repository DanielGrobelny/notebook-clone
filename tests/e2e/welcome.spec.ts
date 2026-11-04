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
test('dialog geometry remains centered with safe margins on desktop and small viewport',async({page})=>{
 await page.goto('/');const modal=page.locator('.welcome-dialog');await expect(modal).toBeVisible();
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:480}]){
  await page.setViewportSize(viewport);const b=await modal.boundingBox();expect(b).not.toBeNull();
  expect(b!.x).toBeGreaterThanOrEqual(16);expect(b!.y).toBeGreaterThanOrEqual(16);
  expect(b!.x+b!.width).toBeLessThanOrEqual(viewport.width-16);expect(b!.y+b!.height).toBeLessThanOrEqual(viewport.height-16);
  expect(Math.abs(b!.x+b!.width/2-viewport.width/2)).toBeLessThanOrEqual(1);
  expect(Math.abs(b!.y+b!.height/2-viewport.height/2)).toBeLessThanOrEqual(1);
  expect(await modal.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 }
 await modal.getByRole('button',{name:'Erst einmal umsehen'}).click();await expect(modal).toHaveCount(0);
});
test('initialization card has panel insets and upload is visibly unavailable',async({page,isMobile})=>{
 await page.route('**/api/session',()=>{});await page.goto('/');
 await expect(page.getByRole('button',{name:'Upload nach Einrichtung verfügbar'})).toBeDisabled();
 if(!isMobile){const card=await page.locator('.sources>.initialization-card').boundingBox();const panel=await page.locator('.sources').boundingBox();expect(card!.x-panel!.x).toBeGreaterThanOrEqual(16);expect(panel!.x+panel!.width-card!.x-card!.width).toBeGreaterThanOrEqual(16)}
});
