import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadBudgetConfiguration } from '../scripts/eval-answer-budget-config.mjs';
function withFile(text: string, check: (path: string) => void) {
 const dir=mkdtempSync(join(tmpdir(),'budget-config-'));
 try { const path=join(dir,'provider.env');writeFileSync(path,text,{mode:0o600});check(path); } finally { rmSync(dir,{recursive:true}); }
}
describe('budget runner provider contract',()=>{
 it('uses the app model and trims direct keys',()=>{expect(loadBudgetConfiguration({OPENAI_API_KEY:' test '})).toEqual({configured:true,apiKey:'test',modelId:'gpt-5.6-luna'});});
 it.each(['"', "'"])('parses quoted env keys and endpoint (%s)',quote=>{withFile('OTHER=unused\nOPENAI_API_KEY='+quote+'test'+quote+'\nOPENAI_BASE_URL="http://127.0.0.1:4175/v1"',path=>{expect(loadBudgetConfiguration({OPENAI_API_KEY_FILE:path})).toMatchObject({apiKey:'test',baseURL:'http://127.0.0.1:4175/v1'});});});
 it('supports raw key files and explicit env precedence',()=>{withFile('file-key',path=>{expect(loadBudgetConfiguration({OPENAI_API_KEY_FILE:path}).apiKey).toBe('file-key');expect(loadBudgetConfiguration({OPENAI_API_KEY_FILE:path,OPENAI_API_KEY:'override',OPENAI_BASE_URL:'http://localhost/v1'})).toMatchObject({apiKey:'override',baseURL:'http://localhost/v1'});});});
 it('rejects missing keys and Vercel placeholders before requests',()=>{expect(()=>loadBudgetConfiguration({})).toThrow('Missing');withFile('OPENAI_API_KEY="[SENSITIVE]"',path=>expect(()=>loadBudgetConfiguration({OPENAI_API_KEY_FILE:path})).toThrow('placeholder'));});
});
