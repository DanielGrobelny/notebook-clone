'use client';
import {useEffect,useRef,useState} from 'react';
const KEY='lumen.welcome.v1';
let dismissed=false;
export function Welcome({ready,onUpload}:{ready:boolean;onUpload:()=>void}){
 const [open,setOpen]=useState(false);const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{let seen=dismissed;try{seen=seen||localStorage.getItem(KEY)==='seen'}catch{}if(!seen)setOpen(true);const sync=(e:StorageEvent)=>{if(e.key===KEY&&e.newValue==='seen')setOpen(false)};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync)},[]);
 useEffect(()=>{if(!open||!ready)return;const previous=document.activeElement as HTMLElement|null;dialog.current?.showModal();return()=>{dialog.current?.close();previous?.focus()}},[open,ready]);
 const close=(upload=false)=>{dismissed=true;try{localStorage.setItem(KEY,'seen')}catch{}setOpen(false);if(upload)onUpload()};
 if(!open||!ready)return null;
 return <dialog ref={dialog} className="welcome-dialog" aria-labelledby="welcome-title" aria-describedby="welcome-description" onKeyDown={e=>{if(e.key!=='Tab')return;const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}} onCancel={e=>{e.preventDefault();close()}}><button className="welcome-close" aria-label="Willkommen schließen" onClick={()=>close()} autoFocus>×</button><p className="eyebrow">Willkommen bei Lumen</p><h2 id="welcome-title">Deine Quellen. Deine Erkenntnisse.</h2><p id="welcome-description">Diese Demo für die Everlast-Testaufgabe zeigt NotebookLM-ähnliche Funktionen: Quellen hochladen, quellenbelegte Fragen stellen und Zusammenfassungen oder Notizen speichern.</p><p>Dein persönlicher Arbeitsbereich wurde automatisch eingerichtet – ohne Account oder Registrierung.</p><p>Ein Cookie erkennt diesen Browser wieder. Nach Cookie-Verlust gibt es keine Wiederherstellung und keinen geräteübergreifenden Zugriff. Bitte lade keine sensiblen Dokumente hoch.</p><button className="upload-callout" onClick={()=>close(true)}>Erste Quelle hochladen</button><button className="welcome-later" onClick={()=>close()}>Erst einmal umsehen</button></dialog>
}
