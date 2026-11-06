'use client';
<<<<<<< HEAD
import { Sources, SourcePanel } from './sources';
import { Studio } from './studio';
=======
import { Research } from './research';
>>>>>>> 4f8b1df (feat: add isolated public web research with inline citations)
import { AnswerText } from './answer-text';
import { useMemo, useState, FormEvent, useEffect, useLayoutEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { currentUserMessages } from './chat-contract';
import { DefaultChatTransport } from 'ai';
import { BookOpen, Send, Sparkles, Square, X } from 'lucide-react';
import { canSubmit, toggleSource } from './notebook';
import { Persistence } from './persistence';
import { Welcome } from './welcome';
import { isAssistantPersisted } from '../lib/chat-history-sync';
type RealSource = {
  id: string;
  title: string;
  source_type: string;
  status: string;
  byte_size: number | null;
  page_count: number | null;
};
function chatErrorMessage(message: string) {
  try {
    const value = JSON.parse(message);
    if (typeof value.message === 'string') return value.message;
  } catch {}
  return message || 'Die Anfrage konnte nicht verarbeitet werden. Bitte erneut versuchen.';
}
type Panel = 'sources' | 'studio' | null;
type Citation = {
  id: string;
  sourceId: string;
  page: number | null;
  section: string | null;
  excerpt: string;
};
type HistoryMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
};
function messageText(parts: Array<{ type: string; text?: string }>) {
  return parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('');
}
function CitationLink({
  citation,
  onOpen,
}: {
  citation: Citation;
  onOpen: (citation: Citation) => void;
}) {
  return (
    <button type="button" className="citation" onClick={() => onOpen(citation)}>
      Beleg{citation.page ? ' · Seite ' + citation.page : ''}
    </button>
  );
}

<<<<<<< HEAD
export default function Home() {
  const [activeNotebook, setActiveNotebook] = useState<{ id: string; title: string } | null>(null);
  const [bootstrapError, setBootstrapError] = useState('');
  const [processing, setProcessing] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => setProcessing((e as CustomEvent).detail);
    window.addEventListener('source-processing', handler);
    return () => window.removeEventListener('source-processing', handler);
  }, []);
  const [q, setQ] = useState(''),
    [selected, setSelected] = useState<string[]>([]),
    [panel, setPanel] = useState<Panel>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { ...body, messages: currentUserMessages(messages.slice(-1)) },
        }),
      }),
    [],
  );
  const { messages, setMessages, sendMessage, status, stop, error } = useChat({ transport });
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [citation, setCitation] = useState<Citation | null>(null);
  const [citationText, setCitationText] = useState('');
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [citationSync, setCitationSync] = useState<{
    messageId: string;
    state: 'pending' | 'saved' | 'timeout' | 'failed';
  } | null>(null);
  const syncRun = useRef(0);
  const conversation = useRef<HTMLDivElement>(null),
    questionInput = useRef<HTMLTextAreaElement>(null);
  const followLatest = useRef(true),
    initialScroll = useRef(false);
  const [showLatest, setShowLatest] = useState(false);
  const jumpToLatest = () => {
    const el = conversation.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      followLatest.current = true;
      setShowLatest(false);
    }
  };
  useLayoutEffect(() => {
    const el = conversation.current;
    if (!el) return;
    if (initialScroll.current || (followLatest.current && !citation)) {
      el.scrollTop = el.scrollHeight;
      initialScroll.current = false;
      setShowLatest(false);
    } else setShowLatest(el.scrollHeight - el.clientHeight - el.scrollTop > 80);
  }, [messages, history, citation]);
  useLayoutEffect(() => {
    const el = questionInput.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, [q]);
  const notebookId = activeNotebook?.id;
  const [sourceCount, setSourceCount] = useState(0);
  const [readyIds, setReadyIds] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    if (!notebookId) return;
    fetch('/api/notebooks/' + notebookId + '/sources')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!alive) return;
        setSourceCount(d.sources?.length ?? 0);
        setReadyIds(
          (d.sources ?? [])
            .filter((x: RealSource) => x.status === 'ready')
            .map((x: RealSource) => x.id),
        );
      })
      .catch(() => {
        if (alive) setReadyIds([]);
      });
    return () => {
      alive = false;
    };
  }, [notebookId, selected]);
  useEffect(() => {
    let alive = true;
    if (!notebookId) return;
    fetch('/api/notebooks/' + notebookId + '/history')
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        const loaded = (data.chats ?? []).flatMap(
          (chat: { messages?: HistoryMessage[] }) => chat.messages ?? [],
        );
        initialScroll.current = true;
        followLatest.current = true;
        setHistory(loaded);
        setMessages(
          loaded.map((m: HistoryMessage) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: 'text', text: m.content }],
          })),
        );
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [notebookId, setMessages]);
  useEffect(() => {
    if (status !== 'ready' || !notebookId) return;
    const latest = [...messages].reverse().find((message) => message.role === 'assistant');
    const text = latest ? messageText(latest.parts) : '';
    if (!latest || !text) return;
    const messageId = latest.id;
    const assistantMessageId = (latest.metadata as { assistantMessageId?: string } | undefined)
      ?.assistantMessageId;
    // Persisted history has no stream metadata and needs no reconciliation.
    if (!assistantMessageId) return;
    let active = true;
    const run = ++syncRun.current;
    const controller = new AbortController();
    const sync = async () => {
      let gotHistory = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const response = await fetch('/api/notebooks/' + notebookId + '/history', {
            signal: controller.signal,
          });
          const data = response.ok ? await response.json() : null;
          if (!active || syncRun.current !== run) return;
          if (data) {
            gotHistory = true;
            const loaded = (data.chats ?? []).flatMap(
              (chat: { messages?: HistoryMessage[] }) => chat.messages ?? [],
            ) as HistoryMessage[];
            if (isAssistantPersisted(loaded, assistantMessageId, text)) {
              setHistory(loaded);
              setCitationSync({ messageId, state: 'saved' });
              return;
            }
          }
        } catch {
          if (controller.signal.aborted) return;
        }
        if (attempt < 4)
          await new Promise<void>((resolve) => {
            const timer = setTimeout(resolve, 250);
            controller.signal.addEventListener(
              'abort',
              () => {
                clearTimeout(timer);
                resolve();
              },
              { once: true },
            );
          });
        if (controller.signal.aborted) return;
      }
      if (active && syncRun.current === run)
        setCitationSync({ messageId, state: gotHistory ? 'timeout' : 'failed' });
    };
    void sync();
    return () => {
      active = false;
      controller.abort();
    };
  }, [status, notebookId, messages]);
  const openCitation = async (c: Citation) => {
    if (!activeNotebook || !c.sourceId || !c.id) return;
    const r = await fetch('/api/notebooks/' + activeNotebook.id + '/sources/' + c.sourceId);
    if (!r.ok) return;
    const data = await r.json();
    const found = (data.chunks ?? []).find(
      (chunk: { id: string; content: string }) => chunk.id === c.id,
    );
    setCitation(c);
    setCitationText(found?.content ?? c.excerpt);
  };
  const toggle = (id: string) => setSelected((x) => toggleSource(x, id));
  const usable = selected.filter((id) => readyIds.includes(id));
  const openUpload = () => {
    if (window.innerWidth <= 760) setPanel('sources');
    else document.querySelector<HTMLInputElement>('.sources input[type=file]')?.click();
  };
  const isSending = status === 'submitted' || status === 'streaming';
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const question = q.trim();
    if (activeNotebook && canSubmit(question, usable) && !isSending) {
      setLastQuestion(question);
      void sendMessage(
        { text: question },
        { body: { notebookId: activeNotebook?.id, sourceIds: usable } },
      );
      setQ('');
    }
  };
  const hasMessage = messages.length > 0;
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brandmark">
            <Sparkles size={16} />
          </span>
          Lumen
        </div>
        <div className="notebook">
          <BookOpen size={16} />
          {activeNotebook?.title ?? 'Mein Notebook'}{' '}
        </div>
        <nav className="mobile-nav" aria-label="Arbeitsbereiche">
          <button onClick={() => setPanel('sources')}>Quellen</button>
          <button onClick={() => setPanel('studio')}>Ergebnisse</button>
        </nav>
        <Persistence
          onError={setBootstrapError}
          onNotebook={(notebook) => {
            if (notebook?.id === activeNotebook?.id) {
              setActiveNotebook(notebook);
              return;
            }
            void stop();
            setMessages([]);
            setHistory([]);
            setSourceCount(0);
            setReadyIds([]);
            setCitationSync(null);
            setProcessing(false);
            setLastQuestion(null);
            setCitation(null);
            followLatest.current = true;
            setShowLatest(false);
            setActiveNotebook(notebook);
            setSelected([]);
          }}
        />
      </header>
      <div className="workspace">
        <div className="source-column">
          {bootstrapError ? (
            <div className="initialization-card" role="alert">
              <strong>Arbeitsbereich nicht verfügbar</strong>
              <p>{bootstrapError}</p>
              <button onClick={() => window.dispatchEvent(new Event('retry-workspace'))}>
                Arbeitsbereich erneut laden
              </button>
            </div>
          ) : (
            <SourcePanel
              key={'sources-' + activeNotebook?.id}
              selected={selected}
              onToggle={toggle}
              onRemove={(id) => setSelected((current) => current.filter((value) => value !== id))}
              onSelect={(id) => setSelected((current) => [...new Set([...current, id])])}
              notebookId={activeNotebook?.id ?? null}
            />
          )}
        </div>
        <section className="chat panel">
          {/* demo onboarding removed */}
          <div className="chat-head">
            <div>
              <p className="eyebrow notebook-heading" title={activeNotebook?.title}>
                {activeNotebook?.title ?? 'Dein Notebook'}
              </p>
              <h1>Was möchtest du herausfinden?</h1>
            </div>
          </div>
          {hasMessage ? (
            <div
              className="conversation"
              ref={conversation}
              tabIndex={0}
              aria-label="Chatverlauf"
              onScroll={(e) => {
                const el = e.currentTarget;
                const near = el.scrollHeight - el.clientHeight - el.scrollTop <= 80;
                followLatest.current = near;
                setShowLatest(!near);
              }}
            >
              {messages.map((message) => {
                const persistedAssistantId = (
                  message.metadata as { assistantMessageId?: string } | undefined
                )?.assistantMessageId;
                const saved = history.find(
                  (item) =>
                    item.id === message.id ||
                    (message.role === 'assistant' &&
                      !!persistedAssistantId &&
                      item.id === persistedAssistantId),
                );
                return message.role === 'user' ? (
                  <div key={message.id} className="bubble user">
                    {messageText(message.parts)}
                  </div>
                ) : message.role === 'assistant' ? (
                  <div key={message.id} className="answer">
                    <div className="answer-icon">
                      <Sparkles size={16} />
                    </div>
                    <div>
                      <AnswerText
                        text={saved?.content ?? messageText(message.parts)}
                        citations={saved?.citations ?? []}
                        onOpen={openCitation}
                      />
                      {(message.metadata as { persisted?: boolean } | undefined)?.persisted ===
                        false && (
                        <p role="alert">
                          Die Antwort konnte nicht gespeichert werden. Bitte vor dem Neuladen
                          kopieren.
                        </p>
                      )}
                      {!saved && (message.metadata as { notice?: string } | undefined)?.notice && (
                        <p role="alert">{(message.metadata as { notice: string }).notice}</p>
                      )}
                      {(saved?.content.includes('Antwort unvollständig') ||
                        (message.metadata as { notice?: string } | undefined)?.notice) && (
                        <button
                          type="button"
                          className="retry"
                          disabled={isSending || !usable.length}
                          onClick={() => {
                            const index = messages.findIndex((m) => m.id === message.id);
                            const previous = messages
                              .slice(0, index)
                              .reverse()
                              .find((m) => m.role === 'user');
                            if (previous) setQ(messageText(previous.parts));
                          }}
                        >
                          Frage gezielter erneut stellen
                        </button>
                      )}
                      {saved?.citations?.length ? (
                        <div className="citations">
                          {saved.citations
                            .filter(
                              (c) =>
                                c.id &&
                                c.sourceId &&
                                !(saved?.content ?? messageText(message.parts))
                                  .toLowerCase()
                                  .includes('[citation:' + c.id.toLowerCase() + ']'),
                            )
                            .map((c) => (
                              <CitationLink key={c.id} citation={c} onOpen={openCitation} />
                            ))}
                        </div>
                      ) : (
                        <small className="evidence-note">
                          {persistedAssistantId && citationSync?.messageId !== message.id
                            ? 'Belege werden noch gespeichert.'
                            : citationSync?.messageId === message.id &&
                                citationSync.state === 'timeout'
                              ? 'Belege konnten noch nicht bestätigt werden. Bitte später erneut laden.'
                              : citationSync?.messageId === message.id &&
                                  citationSync.state === 'failed'
                                ? 'Belege konnten nicht bestätigt werden.'
                                : 'Keine überprüfbaren Belege gespeichert.'}
                        </small>
                      )}
                    </div>
                  </div>
                ) : null;
              })}
              {isSending && <div className="notice">Anfrage wird vorbereitet …</div>}
              {error && (
                <div className="answer" role="alert">
                  <div className="answer-icon">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <strong>Anfrage fehlgeschlagen</strong>
                    <p>
                      {chatErrorMessage(error.message)} Eine angezeigte Teilantwort kann
                      unvollständig sein.
                    </p>
                    <div className="notice">Bitte erneut versuchen oder die Frage eingrenzen.</div>
                    {lastQuestion && usable.length > 0 && (
                      <button
                        type="button"
                        className="retry"
                        onClick={() =>
                          void sendMessage(
                            { text: lastQuestion },
                            { body: { notebookId: activeNotebook?.id, sourceIds: selected } },
                          )
                        }
                      >
                        Erneut versuchen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="welcome">
              <div className="welcome-orb">
                <Sparkles size={27} />
              </div>
              <h2>
                {bootstrapError
                  ? 'Arbeitsbereich nicht verfügbar'
                  : !activeNotebook
                    ? 'Dein Arbeitsbereich wird eingerichtet …'
                    : processing
                      ? 'Deine Quelle wird verarbeitet …'
                      : !sourceCount
                        ? 'Lade zuerst mindestens eine Quelle hoch'
                        : !usable.length
                          ? 'Wähle eine nutzbare Quelle aus'
                          : 'Was möchtest du aus deinen Quellen erfahren?'}
              </h2>
              <p>
                Lade eigene Dokumente hoch, wähle Quellen aus und stelle eine Frage. Antworten
                werden mit Originalpassagen belegt.
              </p>
              {!selected.length && (
                <button className="upload-callout" disabled={!activeNotebook} onClick={openUpload}>
                  {activeNotebook ? 'Quelle hochladen' : 'Upload nach Einrichtung verfügbar'}
                </button>
              )}
              <div className="suggestions" hidden={!usable.length}>
                <button onClick={() => setQ('Was sind die wichtigsten Erkenntnisse?')}>
                  Wichtigste Erkenntnisse ↗
                </button>
                <button onClick={() => setQ('Fasse die Strategie zusammen')}>
                  Strategie zusammenfassen ↗
                </button>
              </div>
            </div>
          )}
          <div className="composer-area">
            {showLatest && (
              <button type="button" className="jump-latest" onClick={jumpToLatest}>
                Neueste Nachricht ↓
              </button>
            )}
            <form className="composer" onSubmit={submit}>
              <label className="sr-only" htmlFor="question">
                Frage an deine Quellen
              </label>
              <textarea
                ref={questionInput}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                id="question"
                disabled={!activeNotebook || !usable.length}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Frage deine Quellen …"
              />
              <button
                aria-label={isSending ? 'Anfrage abbrechen' : 'Frage senden'}
                type={isSending ? 'button' : 'submit'}
                onClick={
                  isSending
                    ? () => {
                        void stop();
                        setMessages((current) =>
                          current.map((m, i) =>
                            i === current.length - 1 && m.role === 'assistant'
                              ? {
                                  ...m,
                                  metadata: {
                                    ...(m.metadata as object),
                                    notice:
                                      'Antwort unvollständig: Anfrage abgebrochen. Bitte erneut versuchen.',
                                  },
                                }
                              : m,
                          ),
                        );
                      }
                    : undefined
                }
                disabled={!isSending && (!activeNotebook || !canSubmit(q, usable))}
              >
                {isSending ? <Square size={14} /> : <Send size={17} />}
              </button>
            </form>
            <p className="disclaimer">
              {!selected.length
                ? sourceCount
                  ? 'Wähle mindestens eine vorhandene Quelle aus, um Fragen zu stellen.'
                  : 'Lade mindestens eine Quelle hoch, um Fragen zu stellen.'
                : 'Ausgewählte eigene Quellen werden begrenzt und serverseitig als Kontext verarbeitet.'}{' '}
              {selected.length} Quellen ausgewählt.
            </p>
          </div>
        </section>
        <Studio
          key={'results-' + activeNotebook?.id}
          notebookId={activeNotebook?.id ?? null}
          selected={selected}
          messages={messages}
        />
      </div>
      {panel && (
        <div className="drawer-backdrop" onClick={() => setPanel(null)}>
          <section
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={panel === 'sources' ? 'Quellen' : 'Ergebnisse'}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <h2>{panel === 'sources' ? 'Quellen' : 'Ergebnisse'}</h2>
              <button
                className="icon-button"
                aria-label={(panel === 'sources' ? 'Quellen' : 'Ergebnisse') + ' schließen'}
                onClick={() => setPanel(null)}
              >
                <X size={20} />
              </button>
            </div>
            {panel === 'sources' ? (
              <>
                <p className="demo-note">
                  Lade eigene Dokumente hoch. Wähle Quellen für deine Frage aus.
                </p>
                <Sources
                  key={activeNotebook?.id}
                  selected={selected}
                  onToggle={toggle}
                  onRemove={(id) =>
                    setSelected((current) => current.filter((value) => value !== id))
                  }
                  onSelect={(id) => setSelected((current) => [...new Set([...current, id])])}
                  notebookId={activeNotebook?.id ?? null}
                />
              </>
            ) : (
              <Studio
                key={'results-' + activeNotebook?.id}
                notebookId={activeNotebook?.id ?? null}
                selected={selected}
                messages={messages}
              />
            )}
          </section>
        </div>
      )}
      {citation && (
        <div className="viewer" role="dialog" aria-label="Belegpassage">
          <div>
            <strong>Originalpassage{citation.page ? ' · PDF-Seite ' + citation.page : ''}</strong>
            <button onClick={() => setCitation(null)}>×</button>
          </div>
          <article>
            <small>{citation.section ?? 'Gespeicherter Quellenauszug'}</small>
            <p>{citationText || 'Die ursprüngliche Passage ist nicht mehr verfügbar.'}</p>
          </article>
        </div>
      )}
      <Welcome ready={!!activeNotebook} onUpload={openUpload} />
    </main>
  );
}
=======
export default function Home(){const[activeNotebook,setActiveNotebook]=useState<{id:string;title:string}|null>(null);const[bootstrapError,setBootstrapError]=useState('');const[processing,setProcessing]=useState(false);useEffect(()=>{const handler=(e:Event)=>setProcessing((e as CustomEvent).detail);window.addEventListener('source-processing',handler);return()=>window.removeEventListener('source-processing',handler)},[]);const[q,setQ]=useState(''),[selected,setSelected]=useState<string[]>([]),[panel,setPanel]=useState<Panel>(null);const transport=useMemo(()=>new DefaultChatTransport({api:'/api/chat',prepareSendMessagesRequest:({messages,body})=>({body:{...body,messages:currentUserMessages(messages.slice(-1))}})}),[]);const {messages,setMessages,sendMessage,status,stop,error}=useChat({transport});const [history,setHistory]=useState<HistoryMessage[]>([]);const [citation,setCitation]=useState<Citation|null>(null);const [citationText,setCitationText]=useState('');const [lastQuestion,setLastQuestion]=useState<string|null>(null);const [citationSync,setCitationSync]=useState<{messageId:string;state:'pending'|'saved'|'timeout'|'failed'}|null>(null);const syncRun=useRef(0);
const conversation=useRef<HTMLDivElement>(null), questionInput=useRef<HTMLTextAreaElement>(null);
const followLatest=useRef(true), initialScroll=useRef(false);
const [showLatest,setShowLatest]=useState(false);
const jumpToLatest=()=>{const el=conversation.current;if(el){el.scrollTop=el.scrollHeight;followLatest.current=true;setShowLatest(false)}};
useLayoutEffect(()=>{const el=conversation.current;if(!el)return;if(initialScroll.current||followLatest.current&&!citation){el.scrollTop=el.scrollHeight;initialScroll.current=false;setShowLatest(false)}else setShowLatest(el.scrollHeight-el.clientHeight-el.scrollTop>80)},[messages,history,citation]);
useLayoutEffect(()=>{const el=questionInput.current;if(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,120)+'px'}},[q]);const [sourceCount,setSourceCount]=useState(0);const [readyIds,setReadyIds]=useState<string[]>([]);useEffect(()=>{let alive=true;if(!activeNotebook){setSourceCount(0);setReadyIds([]);return}fetch('/api/notebooks/'+activeNotebook.id+'/sources').then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(!alive)return;setSourceCount(d.sources?.length??0);setReadyIds((d.sources??[]).filter((x:RealSource)=>x.status==='ready').map((x:RealSource)=>x.id))}).catch(()=>{if(alive)setReadyIds([])});return()=>{alive=false}},[activeNotebook?.id,selected]);
useEffect(()=>{let alive=true;if(!activeNotebook){setHistory([]);return}fetch('/api/notebooks/'+activeNotebook.id+'/history').then(async r=>r.ok?r.json():null).then(data=>{if(!alive||!data)return;const loaded=(data.chats??[]).flatMap((chat:any)=>chat.messages??[]);initialScroll.current=true;followLatest.current=true;setHistory(loaded);setMessages(loaded.map((m:HistoryMessage)=>({id:m.id,role:m.role,parts:[{type:'text',text:m.content}]})));}).catch(()=>undefined);return()=>{alive=false}},[activeNotebook?.id,setMessages]);
useEffect(()=>{if(status!=='ready'||!activeNotebook)return;const latest=[...messages].reverse().find((message:any)=>message.role==='assistant');const text=latest?messageText(latest.parts):'';if(!latest||!text)return;const messageId=latest.id;const assistantMessageId=(latest.metadata as {assistantMessageId?:string}|undefined)?.assistantMessageId;setCitationSync({messageId,state:'pending'});if(!assistantMessageId){setCitationSync({messageId,state:'failed'});return}let active=true;const run=++syncRun.current;const controller=new AbortController();const sync=async()=>{let gotHistory=false;for(let attempt=0;attempt<5;attempt++){try{const response=await fetch('/api/notebooks/'+activeNotebook.id+'/history',{signal:controller.signal});const data=response.ok?await response.json():null;if(!active||syncRun.current!==run)return;if(data){gotHistory=true;const loaded=(data.chats??[]).flatMap((chat:any)=>chat.messages??[]) as HistoryMessage[];if(isAssistantPersisted(loaded,assistantMessageId,text)){setHistory(loaded);setCitationSync({messageId,state:'saved'});return}}}catch{if(controller.signal.aborted)return}if(attempt<4)await new Promise<void>(resolve=>{const timer=setTimeout(resolve,250);controller.signal.addEventListener('abort',()=>{clearTimeout(timer);resolve()},{once:true})});if(controller.signal.aborted)return}if(active&&syncRun.current===run)setCitationSync({messageId,state:gotHistory?'timeout':'failed'})};void sync();return()=>{active=false;controller.abort()}},[status,activeNotebook?.id,messages]);
const openCitation=async(c:Citation)=>{if(!activeNotebook||!c.sourceId||!c.id)return;const r=await fetch('/api/notebooks/'+activeNotebook.id+'/sources/'+c.sourceId);if(!r.ok)return;const data=await r.json();const found=(data.chunks??[]).find((chunk:any)=>chunk.id===c.id);setCitation(c);setCitationText(found?.content??c.excerpt)};const toggle=(id:string)=>setSelected(x=>toggleSource(x,id));const usable=selected.filter(id=>readyIds.includes(id));const openUpload=()=>{if(window.innerWidth<=760)setPanel('sources');else document.querySelector<HTMLInputElement>('.sources input[type=file]')?.click()};const isSending=status==='submitted'||status==='streaming';const submit=(e:FormEvent)=>{e.preventDefault();const question=q.trim();if(activeNotebook&&canSubmit(question,usable)&&!isSending){setLastQuestion(question);void sendMessage({text:question},{body:{notebookId:activeNotebook?.id,sourceIds:usable}});setQ('')}};const hasMessage=messages.length>0;return <main className="shell"><header className="topbar"><div className="brand"><span className="brandmark"><Sparkles size={16}/></span>Lumen</div><Research ready={!!activeNotebook}/><div className="notebook"><BookOpen size={16}/>{activeNotebook?.title??'Mein Notebook'} </div><nav className="mobile-nav" aria-label="Arbeitsbereiche"><button onClick={()=>setPanel('sources')}>Quellen</button><button onClick={()=>setPanel('studio')}>Ergebnisse</button></nav><Persistence onError={setBootstrapError} onNotebook={notebook=>{if(notebook?.id===activeNotebook?.id){setActiveNotebook(notebook);return;}void stop();setMessages([]);setHistory([]);setCitation(null);followLatest.current=true;setShowLatest(false);setActiveNotebook(notebook);setSelected([])}}/></header><div className="workspace"><div className="source-column">{bootstrapError?<div className="initialization-card" role="alert"><strong>Arbeitsbereich nicht verfügbar</strong><p>{bootstrapError}</p><button onClick={()=>window.dispatchEvent(new Event('retry-workspace'))}>Arbeitsbereich erneut laden</button></div>:<SourcePanel key={"sources-"+activeNotebook?.id} selected={selected} onToggle={toggle} onRemove={id=>setSelected(current=>current.filter(value=>value!==id))} onSelect={id=>setSelected(current=>[...new Set([...current,id])])} notebookId={activeNotebook?.id??null}/>}</div><section className="chat panel">{/* demo onboarding removed */}<div className="chat-head"><div><p className="eyebrow notebook-heading" title={activeNotebook?.title}>{activeNotebook?.title??'Dein Notebook'}</p><h1>Was möchtest du herausfinden?</h1></div></div>{hasMessage?<div className="conversation" ref={conversation} tabIndex={0} aria-label="Chatverlauf" onScroll={e=>{const el=e.currentTarget;const near=el.scrollHeight-el.clientHeight-el.scrollTop<=80;followLatest.current=near;setShowLatest(!near)}}>{messages.map(message=>{const persistedAssistantId=(message.metadata as {assistantMessageId?:string}|undefined)?.assistantMessageId;const saved=history.find(item=>item.id===message.id||(message.role==='assistant'&&!!persistedAssistantId&&item.id===persistedAssistantId));return message.role==='user'?<div key={message.id} className="bubble user">{messageText(message.parts)}</div>:message.role==='assistant'?<div key={message.id} className="answer"><div className="answer-icon"><Sparkles size={16}/></div><div><AnswerText text={saved?.content??messageText(message.parts)} citations={saved?.citations??[]} onOpen={openCitation}/>{(message.metadata as {persisted?:boolean}|undefined)?.persisted===false&&<p role="alert">Die Antwort konnte nicht gespeichert werden. Bitte vor dem Neuladen kopieren.</p>}{!saved&&(message.metadata as {notice?:string}|undefined)?.notice&&<p role="alert">{(message.metadata as {notice:string}).notice}</p>}{(saved?.content.includes('Antwort unvollständig')||(message.metadata as {notice?:string}|undefined)?.notice)&&<button type="button" className="retry" disabled={isSending||!usable.length} onClick={()=>{const index=messages.findIndex(m=>m.id===message.id);const previous=messages.slice(0,index).reverse().find(m=>m.role==='user');if(previous)setQ(messageText(previous.parts))}}>Frage gezielter erneut stellen</button>}{saved?.citations?.length?<div className="citations">{saved.citations.filter(c=>c.id&&c.sourceId&&!((saved?.content??messageText(message.parts)).toLowerCase().includes('[citation:'+c.id.toLowerCase()+']'))).map(c=><CitationLink key={c.id} citation={c} onOpen={openCitation}/>)}</div>:<small className="evidence-note">{citationSync?.messageId===message.id&&citationSync.state==='pending'?'Belege werden noch gespeichert.':citationSync?.messageId===message.id&&citationSync.state==='timeout'?'Belege konnten noch nicht bestätigt werden. Bitte später erneut laden.':citationSync?.messageId===message.id&&citationSync.state==='failed'?'Belege konnten nicht bestätigt werden.':'Keine überprüfbaren Belege gespeichert.'}</small>}</div></div>:null})}{isSending&&<div className="notice">Anfrage wird vorbereitet …</div>}{error&&<div className="answer" role="alert"><div className="answer-icon"><Sparkles size={16}/></div><div><strong>Anfrage fehlgeschlagen</strong><p>{chatErrorMessage(error.message)} Eine angezeigte Teilantwort kann unvollständig sein.</p><div className="notice">Bitte erneut versuchen oder die Frage eingrenzen.</div>{lastQuestion&&usable.length>0&&<button type="button" className="retry" onClick={()=>void sendMessage({text:lastQuestion},{body:{notebookId:activeNotebook?.id,sourceIds:selected}})}>Erneut versuchen</button>}</div></div>}</div>:<div className="welcome"><div className="welcome-orb"><Sparkles size={27}/></div><h2>{bootstrapError?'Arbeitsbereich nicht verfügbar':!activeNotebook?'Dein Arbeitsbereich wird eingerichtet …':processing?'Deine Quelle wird verarbeitet …':!sourceCount?'Lade zuerst mindestens eine Quelle hoch':!usable.length?'Wähle eine nutzbare Quelle aus':'Was möchtest du aus deinen Quellen erfahren?'}</h2><p>Lade eigene Dokumente hoch, wähle Quellen aus und stelle eine Frage. Antworten werden mit Originalpassagen belegt.</p>{!selected.length&&<button className="upload-callout" disabled={!activeNotebook} onClick={openUpload}>{activeNotebook?'Quelle hochladen':'Upload nach Einrichtung verfügbar'}</button>}<div className="suggestions" hidden={!usable.length}><button onClick={()=>setQ('Was sind die wichtigsten Erkenntnisse?')}>Wichtigste Erkenntnisse ↗</button><button onClick={()=>setQ('Fasse die Strategie zusammen')}>Strategie zusammenfassen ↗</button></div></div>}<div className="composer-area">{showLatest&&<button type="button" className="jump-latest" onClick={jumpToLatest}>Neueste Nachricht ↓</button>}<form className="composer" onSubmit={submit}><label className="sr-only" htmlFor="question">Frage an deine Quellen</label><textarea ref={questionInput} rows={1} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();e.currentTarget.form?.requestSubmit()}}} id="question" disabled={!activeNotebook||!usable.length} value={q} onChange={e=>setQ(e.target.value)} placeholder="Frage deine Quellen …"/><button aria-label={isSending?'Anfrage abbrechen':'Frage senden'} type={isSending?'button':'submit'} onClick={isSending?()=>{void stop();setMessages(current=>current.map((m,i)=>i===current.length-1&&m.role==='assistant'?{...m,metadata:{...m.metadata as object,notice:'Antwort unvollständig: Anfrage abgebrochen. Bitte erneut versuchen.'}}:m))}:undefined} disabled={!isSending&&(!activeNotebook||!canSubmit(q,usable))}>{isSending?<Square size={14}/>:<Send size={17}/>}</button></form><p className="disclaimer">{!selected.length?(sourceCount?'Wähle mindestens eine vorhandene Quelle aus, um Fragen zu stellen.':'Lade mindestens eine Quelle hoch, um Fragen zu stellen.'):'Ausgewählte eigene Quellen werden begrenzt und serverseitig als Kontext verarbeitet.'} {selected.length} Quellen ausgewählt.</p></div></section><Studio key={"results-"+activeNotebook?.id} notebookId={activeNotebook?.id??null} selected={selected} messages={messages}/></div>{panel&&<div className="drawer-backdrop" onClick={()=>setPanel(null)}><section className="drawer" role="dialog" aria-modal="true" aria-label={panel==='sources'?'Quellen':'Ergebnisse'} onClick={e=>e.stopPropagation()}><div className="drawer-head"><h2>{panel==='sources'?'Quellen':'Ergebnisse'}</h2><button className="icon-button" aria-label={(panel==='sources'?'Quellen':'Ergebnisse')+' schließen'} onClick={()=>setPanel(null)}><X size={20}/></button></div>{panel==='sources'?<><p className="demo-note">Lade eigene Dokumente hoch. Wähle Quellen für deine Frage aus.</p><Sources selected={selected} onToggle={toggle} onRemove={id=>setSelected(current=>current.filter(value=>value!==id))} onSelect={id=>setSelected(current=>[...new Set([...current,id])])} notebookId={activeNotebook?.id??null}/></>:<Studio key={"results-"+activeNotebook?.id} notebookId={activeNotebook?.id??null} selected={selected} messages={messages}/>}</section></div>}{citation&&<div className="viewer" role="dialog" aria-label="Belegpassage"><div><strong>Originalpassage{citation.page?' · PDF-Seite '+citation.page:''}</strong><button onClick={()=>setCitation(null)}>×</button></div><article><small>{citation.section??'Gespeicherter Quellenauszug'}</small><p>{citationText||'Die ursprüngliche Passage ist nicht mehr verfügbar.'}</p></article></div>}<Welcome ready={!!activeNotebook} onUpload={openUpload}/></main>}
>>>>>>> 4f8b1df (feat: add isolated public web research with inline citations)
