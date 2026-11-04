'use client';
import {useEffect,useState,useRef} from 'react';
type Notebook={id:string;title:string};
let bootstrap:Promise<Notebook[]>|null=null;
async function initial(){
 if(!bootstrap){const start=async()=>{const boot=await fetch('/api/session',{method:'POST'});if(!boot.ok)throw Error();const r=await fetch('/api/notebooks');if(!r.ok)throw Error();return (await r.json()).notebooks as Notebook[];};bootstrap=(navigator.locks?navigator.locks.request('notebook-session',start):start()).finally(()=>{bootstrap=null});}return bootstrap;
}
export function Persistence({onNotebook}:{onNotebook?:(notebook:Notebook|null)=>void}){
 const menu=useRef<HTMLDetailsElement>(null);useEffect(()=>{const close=(e:PointerEvent)=>{if(menu.current&&!menu.current.contains(e.target as Node))menu.current.open=false};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&menu.current)menu.current.open=false};document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape)}},[]);const [items,setItems]=useState<Notebook[]>([]),[error,setError]=useState('');
 const load=async()=>{try{setError('');const notebooks=await initial();setItems(notebooks);onNotebook?.(notebooks[0]??null)}catch{setError('Arbeitsbereich nicht verfügbar. Bitte Backend-Konfiguration prüfen und erneut versuchen.')}};
 useEffect(()=>{void load()},[]);
 const create=async()=>{const title=prompt('Name des Notebooks');if(!title)return;const r=await fetch('/api/notebooks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title})});if(!r.ok){setError('Notebook konnte nicht erstellt werden.');return}const n=(await r.json()).notebook;setItems(x=>[...x,n]);onNotebook?.(n)};
 const rename=async(n:Notebook)=>{const title=prompt('Neuer Name',n.title);if(!title)return;const r=await fetch('/api/notebooks/'+n.id,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({title})});if(!r.ok)setError('Umbenennen fehlgeschlagen.');else await load()}; const remove=async(n:Notebook)=>{if(!confirm('Notebook inklusive Quellen und Chat löschen?'))return;const r=await fetch('/api/notebooks/'+n.id,{method:'DELETE'});if(!r.ok)setError('Löschen fehlgeschlagen.');else await load()};
 return <div className="notebook-store"><button onClick={()=>void create()}>+ Notebook</button><details ref={menu} className="notebook-menu"><summary>Notebooks wechseln</summary><ul aria-label="Meine Notebooks">{items.map(n=><li key={n.id}><button onClick={()=>onNotebook?.(n)}>{n.title}</button><button aria-label={n.title+' umbenennen'} onClick={()=>void rename(n)}>Umbenennen</button><button aria-label={n.title+' löschen'} onClick={()=>void remove(n)}>×</button></li>)}</ul></details>{error&&<div role="alert">{error}<button onClick={()=>void load()}>Erneut versuchen</button></div>}</div>;
}
