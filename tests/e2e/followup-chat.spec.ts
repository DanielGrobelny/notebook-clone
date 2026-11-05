import {expect,test} from './test-fixture';
import {setupRealSource} from './real-source';
test('drei SDK-Fragen nach langer Antwort und weitere Frage nach Reload',async({page,isMobile},testInfo)=>{
 test.setTimeout(90000);
 await setupRealSource(page,isMobile,'synthetischer CV: TypeScript und Projektarbeit');
 const payloads:unknown[]=[];
 page.on('request',request=>{if(request.url().endsWith('/api/chat'))payloads.push(request.postDataJSON());});
 for(let turn=1;turn<=3;turn++){
  await page.getByLabel('Frage an deine Quellen').fill(turn===1?'LONG_CV_RESPONSE Vergleiche CV und Stelle':'Welche Stärken bleiben? Frage '+turn);
  const response=page.waitForResponse(r=>r.url().endsWith('/api/chat'));
  await page.getByRole('button',{name:'Frage senden'}).click();expect((await response).status()).toBe(200);
  await expect(page.locator('.answer-text')).toHaveCount(turn);
  await expect(page.locator('.answer-text').last()).toContainText('ENDE DER VOLLSTÄNDIGEN ANTWORT');
  await expect(page.getByRole('button',{name:'Anfrage abbrechen'})).toHaveCount(0);
 }
 expect((await page.locator('.answer-text').first().innerText()).length).toBeGreaterThan(4000);
 await page.reload();await expect(page.locator('.answer-text')).toHaveCount(3);
 const scope=isMobile?(await page.getByRole('button',{name:'Quellen',exact:true}).click(),page.getByRole('dialog',{name:'Quellen'})):page;await scope.getByRole('button',{name:'e2e-quelle.txt Bereit · Text',exact:true}).click();if(isMobile)await page.getByRole('button',{name:'Quellen schließen'}).click();
 await page.getByLabel('Frage an deine Quellen').fill('Und nach dem Neuladen?');
 const response=page.waitForResponse(r=>r.url().endsWith('/api/chat'));await page.getByRole('button',{name:'Frage senden'}).click();expect((await response).status()).toBe(200);
 await expect(page.locator('.answer-text')).toHaveCount(4);await expect(page.locator('.answer-text').last()).toContainText('ENDE DER VOLLSTÄNDIGEN ANTWORT');
 for(const payload of payloads as any[]){expect(payload.messages).toHaveLength(1);expect(payload.messages[0].role).toBe('user');expect(Object.keys(payload.messages[0].parts[0]).sort()).toEqual(['text','type']);}
 await testInfo.attach('actual-sdk-payloads',{body:JSON.stringify(payloads,null,2),contentType:'application/json'});
});
