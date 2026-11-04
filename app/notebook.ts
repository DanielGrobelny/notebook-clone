export type Source={id:string;title:string;detail:string;tone:'violet'|'orange'};
export const modelBoundary='Die Modellanbindung ist noch nicht konfiguriert.';
export const toggleSource=(selected:string[],id:string)=>selected.includes(id)?selected.filter(x=>x!==id):[...selected,id];
export const canSubmit=(question:string,selected:string[])=>question.trim().length>0&&selected.length>0;
