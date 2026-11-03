export type Source={id:string;title:string;detail:string;tone:'violet'|'orange'};
export const demoSources:Source[]=[{id:'strategy',title:'Produktstrategie 2026',detail:'PDF · 24 Seiten · Demoquelle',tone:'violet'},{id:'interviews',title:'Interview-Notizen',detail:'Markdown · 8 KB · Demoquelle',tone:'orange'}];
export const modelBoundary='Die Modellanbindung ist noch nicht konfiguriert.';
export const toggleSource=(selected:string[],id:string)=>selected.includes(id)?selected.filter(x=>x!==id):[...selected,id];
export const canSubmit=(question:string,selected:string[])=>question.trim().length>0&&selected.length>0;
