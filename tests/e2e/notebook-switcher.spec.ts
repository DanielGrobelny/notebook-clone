import {test,expect} from './test-fixture';
test('notebook title and readable navigation survive switch rename delete and reflow',async({page})=>{
 await page.goto('/');await expect(page.locator('.notebook-heading')).toHaveText('Mein Notebook');
 const title='Mein Notebook test mit einem sehr langen lesbaren Titel für mobile Ansichten';
 page.once('dialog',d=>d.accept(title));await page.getByRole('button',{name:'+ Notebook',exact:true}).click();await expect(page.locator('.notebook-heading')).toHaveText(title);
 for(const viewport of [{width:320,height:480},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]){
 await page.setViewportSize(viewport);await page.getByText('Notebooks wechseln',{exact:true}).click();const choice=page.locator('.notebook-choice').filter({hasText:title});await expect(choice).toHaveAttribute('aria-current','true');
 const g=await choice.evaluate(e=>{const r=e.getBoundingClientRect();return {width:r.width,right:r.right,height:r.height,viewport:innerWidth}});expect(g.width).toBeGreaterThan(200);expect(g.right).toBeLessThanOrEqual(g.viewport);expect(g.height).toBeGreaterThanOrEqual(44);
 await page.keyboard.press('Escape');await expect(page.locator('summary')).toBeFocused();expect(await page.locator('.composer-area').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.getByText('Notebooks wechseln',{exact:true}).click();page.once('dialog',d=>d.accept('Umbenanntes aktives Notebook'));await page.getByRole('button',{name:title+' umbenennen',exact:true}).click();await expect(page.locator('.notebook-heading')).toHaveText('Umbenanntes aktives Notebook');
 await page.locator('.notebook-choice').filter({hasText:'Mein Notebook'}).first().click();await expect(page.locator('.notebook-heading')).toHaveText('Mein Notebook');
 await page.getByText('Notebooks wechseln',{exact:true}).click();await page.locator('.notebook-choice').filter({hasText:'Umbenanntes aktives Notebook'}).click();await expect(page.locator('.notebook-heading')).toHaveText('Umbenanntes aktives Notebook');
 await page.getByText('Notebooks wechseln',{exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Umbenanntes aktives Notebook löschen',exact:true}).click();await expect(page.locator('.notebook-heading')).toHaveText('Mein Notebook');await page.locator('.chat-head').click();await expect(page.locator('.notebook-menu')).not.toHaveAttribute('open','');
});
