import {test,expect} from './test-fixture';
import {setupRealSource} from './real-source';
test('composer remains in viewport through long history, reload and reflow',async({page,isMobile},info)=>{
 test.setTimeout(90000);
 await setupRealSource(page,isMobile,'synthetic layout source');
 const bounds=async()=>{const geometry=await page.evaluate(()=>{const q=document.querySelector('#question')!.getBoundingClientRect();const c=document.querySelector('.composer-area')!.getBoundingClientRect();return {top:q.top,bottom:c.bottom,height:innerHeight,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,scrollY}});expect(geometry.top).toBeGreaterThan(0);expect(geometry.bottom).toBeLessThanOrEqual(geometry.height);expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);expect(geometry.scrollY).toBe(0)};
 await bounds();
 await page.getByLabel('Frage an deine Quellen').fill('LONG_CV_RESPONSE Layout');await page.getByRole('button',{name:'Frage senden'}).click();
 await expect(page.locator('.answer-text')).toContainText('ENDE DER VOLLSTÄNDIGEN ANTWORT');await expect(page.getByRole('button',{name:'Anfrage abbrechen'})).toHaveCount(0);
 await page.reload();await expect(page.locator('.answer-text')).toContainText('ENDE DER VOLLSTÄNDIGEN ANTWORT');await bounds();
 const distance=()=>page.locator('.conversation').evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop);
 await expect.poll(distance).toBeLessThan(5);
 await page.locator('.conversation').evaluate(el=>el.scrollTop=0);await expect(page.getByRole('button',{name:'Neueste Nachricht'})).toBeVisible();
 await page.waitForTimeout(400);expect(await page.locator('.conversation').evaluate(el=>el.scrollTop)).toBe(0);
 await page.getByRole('button',{name:'Neueste Nachricht'}).click();await expect.poll(distance).toBeLessThan(5);await bounds();
 await page.screenshot({path:info.outputPath('long-history.png')});
 for(const viewport of [{width:1280,height:600},{width:768,height:700},{width:640,height:400},{width:390,height:844},{width:844,height:390},{width:320,height:480}]){await page.setViewportSize(viewport);await bounds();}
 await page.screenshot({path:info.outputPath('reflow.png')});
 await page.setViewportSize(isMobile?{width:390,height:844}:{width:1440,height:900});
 const scope=isMobile?(await page.getByRole('button',{name:'Quellen',exact:true}).click(),page.getByRole('dialog',{name:'Quellen'})):page;
 await scope.getByRole('button',{name:'e2e-quelle.txt Bereit · Text',exact:true}).click();if(isMobile)await page.getByRole('button',{name:'Quellen schließen'}).click();
 await page.getByLabel('Frage an deine Quellen').fill('SLOW_LAYOUT_STREAM LONG_CV_RESPONSE');await page.getByRole('button',{name:'Frage senden'}).click();
 await expect(page.locator('.answer-text')).toHaveCount(2);
 await page.locator('.conversation').evaluate(el=>el.scrollTop=0);await page.waitForTimeout(700);
 expect(await page.locator('.conversation').evaluate(el=>el.scrollTop)).toBe(0);await expect(page.getByRole('button',{name:'Neueste Nachricht'})).toBeVisible();await bounds();
 await page.getByRole('button',{name:'Neueste Nachricht'}).click();await expect(page.getByRole('button',{name:'Anfrage abbrechen'})).toHaveCount(0);await expect.poll(distance).toBeLessThan(5);
 await page.getByLabel('Frage an deine Quellen').fill(('Mehrzeilige Frage'+String.fromCharCode(10)).repeat(20));await bounds();expect(await page.locator('#question').evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
 await page.locator('.citation').last().click();await expect(page.getByRole('dialog',{name:'Belegpassage'})).toBeVisible();await page.getByRole('dialog',{name:'Belegpassage'}).getByRole('button').click();await bounds();
 
 /* 200% browser zoom reflows into half the CSS viewport, unlike CSS zoom. */ await page.setViewportSize({width:640,height:400});await bounds();await page.setViewportSize({width:1280,height:800});
 await page.getByLabel('Frage an deine Quellen').fill('');await page.getByLabel('Frage an deine Quellen').focus();await page.keyboard.press('Shift+Tab');expect(await page.locator('#question').evaluate(el=>el===document.activeElement)).toBe(false);
 await page.getByText('Notebooks wechseln',{exact:true}).click();const notebookName=await page.locator('.notebook-menu li button').filter({hasText:'E2E synthetic layout source'}).first().innerText();await page.getByRole('button',{name:'Mein Notebook',exact:true}).click();await expect(page.locator('.answer-text')).toHaveCount(0);await bounds();await page.getByRole('button',{name:notebookName,exact:true}).click();await expect(page.locator('.answer-text')).toHaveCount(2);await expect.poll(distance).toBeLessThan(5);await bounds();

});
