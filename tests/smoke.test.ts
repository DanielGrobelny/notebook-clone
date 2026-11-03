import {describe,expect,it} from 'vitest';
import {modelBoundary,sources} from '../app/content';

describe('notebook content contract',()=>{
  it('provides two selectable source entries',()=>{
    expect(sources).toHaveLength(2);
    expect(sources.map(([name])=>name)).toEqual(['Produktstrategie 2026','Interview-Notizen']);
  });
  it('states the unconfigured model boundary honestly',()=>{
    expect(modelBoundary).toContain('nicht konfiguriert');
  });
});
