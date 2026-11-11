'use client';
import { Research } from './research';
import { AnswerText } from './answer-text';
import { useMemo, useState, FormEvent, useEffect, useLayoutEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { currentUserMessages } from './chat-contract';
import { DefaultChatTransport } from 'ai';
import {
  BookOpen,
  Check,
  FileText,
  Send,
  Sparkles,
  Square,
  X,
  Upload,
  Trash2,
  Eye,
} from 'lucide-react';
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
function Sources({
  selected,
  onToggle,
  onRemove,
  onSelect,
  notebookId,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  notebookId: string | null;
}) {
  const [items, setItems] = useState<RealSource[]>([]);
  const [error, setError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const pending = useRef(false);
  const [retryRequest, setRetryRequest] = useState<{ file?: File; text?: string } | null>(null);
  const [viewer, setViewer] = useState<{
    title: string;
    chunks: Array<{ id: string; content: string; metadata: { page?: number; section?: string } }>;
  } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const load = async () => {
    if (!notebookId) {
      setItems([]);
      return;
    }
    const r = await fetch('/api/notebooks/' + notebookId + '/sources');
    if (r.ok) setItems((await r.json()).sources);
  };
  useEffect(() => {
    void load();
  }, [notebookId]);
  const upload = async (file?: File, text?: string) => {
    if (pending.current || (!file && text === undefined)) return;
    if (!notebookId) {
      setError('Bitte zuerst ein Notebook anlegen.');
      return;
    }
    pending.current = true;
    setUploading(true);
    window.dispatchEvent(new CustomEvent('source-processing', { detail: true }));
    setError('');
    setRetryRequest({ file, text });
    const name = file?.name ?? 'Eingefügter Text';
    setUploadStatus(name + ' · Wird hochgeladen und verarbeitet …');
    try {
      const form = new FormData();
      if (file) form.set('file', file);
      if (text !== undefined) form.set('text', text);
      const r = await fetch('/api/notebooks/' + notebookId + '/sources', {
        method: 'POST',
        body: form,
      });
      const result = await r.json();
      if (!r.ok) throw Error(result.message ?? 'Import fehlgeschlagen.');
      await load();
      if (result.source?.status === 'ready') onSelect(result.source.id);
      setUploadStatus(
        name +
          (result.duplicate ? ' · Bereits vorhanden und ausgewählt.' : ' · Bereit und ausgewählt.'),
      );
      setRetryRequest(null);
    } catch (e) {
      setUploadStatus('');
      setError(name + ' · ' + (e instanceof Error ? e.message : 'Import fehlgeschlagen.'));
    } finally {
      pending.current = false;
      setUploading(false);
      window.dispatchEvent(new CustomEvent('source-processing', { detail: false }));
    }
  };
  const paste = () => {
    const text = window.prompt('Text einfügen');
    if (text !== null) void upload(undefined, text);
  };
  const show = async (item: RealSource) => {
    if (!notebookId) return;
    const r = await fetch('/api/notebooks/' + notebookId + '/sources/' + item.id);
    if (r.ok) {
      const x = await r.json();
      setViewer({ title: x.source.title, chunks: x.chunks });
    }
  };
  const remove = async (item: RealSource) => {
    if (!notebookId || !window.confirm('Quelle löschen?')) return;
    const r = await fetch('/api/notebooks/' + notebookId + '/sources/' + item.id, {
      method: 'DELETE',
    });
    if (r.ok) {
      onRemove(item.id);
      await load();
    } else setError('Löschen fehlgeschlagen.');
  };
  if (!notebookId)
    return (
      <div className="initialization-card" role="status" aria-live="polite">
        <span className="status-spinner" />
        <strong>Arbeitsbereich wird eingerichtet</strong>
        <p>Deine Quellen stehen gleich bereit.</p>
      </div>
    );
  return (
    <div className="source-list" aria-label="Quellen">
      <input
        ref={input}
        className="sr-only"
        type="file"
        disabled={uploading}
        accept=".txt,.md,.markdown,.pdf,text/plain,text/markdown,application/pdf"
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.currentTarget.value = '';
        }}
      />
      <div className="source-actions">
        <button type="button" disabled={uploading} onClick={() => input.current?.click()}>
          <Upload size={14} /> Datei
        </button>
        <button type="button" disabled={uploading} onClick={paste}>
          Text einfügen
        </button>
      </div>
      <p className="upload-status" role="status" aria-live="polite" aria-atomic="true">
        {uploadStatus}
      </p>
      {items.map((item) => {
        const on = selected.includes(item.id);
        return (
          <div className={'source ' + (on ? 'active' : '')} key={item.id}>
            <button
              type="button"
              className="source-main"
              disabled={item.status !== 'ready'}
              aria-pressed={on}
              onClick={() => onToggle(item.id)}
            >
              <span className="doc-icon violet">
                <FileText size={17} />
              </span>
              <span className="source-copy">
                <strong>{item.title}</strong>
                <small>
                  {item.status === 'ready'
                    ? 'Bereit'
                    : item.status === 'error'
                      ? 'Neu importieren erforderlich'
                      : item.status}{' '}
                  · {item.page_count ? item.page_count + ' Seiten' : 'Text'}
                </small>
              </span>
              {on && <Check className="check" size={17} />}
            </button>
            <button
              aria-label={item.title + ' anzeigen'}
              className="source-tool"
              onClick={() => void show(item)}
            >
              <Eye size={14} />
            </button>
            <button
              aria-label={item.title + ' löschen'}
              className="source-tool"
              onClick={() => void remove(item)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
      {!items.length && (
        <p className="source-empty">Lade mindestens eine Quelle hoch, um Fragen zu stellen.</p>
      )}
      {error && (
        <p className="source-error" role="alert">
          {error}
          {retryRequest && (
            <button
              disabled={uploading}
              onClick={() => void upload(retryRequest.file, retryRequest.text)}
            >
              Import erneut versuchen
            </button>
          )}
        </p>
      )}
      {viewer && (
        <div className="viewer" role="dialog" aria-label="Quellenansicht">
          <div>
            <strong>{viewer.title}</strong>
            <button onClick={() => setViewer(null)}>×</button>
          </div>
          {viewer.chunks.map((c, i) => (
            <article key={i}>
              <small>
                {c.metadata?.page ? 'Seite ' + c.metadata.page : ''}
                {c.metadata?.section ? ' · ' + c.metadata.section : ''}
              </small>
              <p>{c.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
function SourcePanel({
  selected,
  onToggle,
  onRemove,
  onSelect,
  notebookId,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
  notebookId: string | null;
}) {
  return (
    <aside className="sources panel" aria-labelledby="sources-title">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Notebook {notebookId ? '· Eigene Quellen' : ''}</p>
          <h2 id="sources-title">Quellen</h2>
        </div>
      </div>
      <p className="demo-note">Lade eigene Dokumente hoch.</p>
      <Sources
        selected={selected}
        onToggle={onToggle}
        onRemove={onRemove}
        onSelect={onSelect}
        notebookId={notebookId}
      />
    </aside>
  );
}
type Artifact = {
  id: string;
  kind: string;
  title: string;
  content: string;
  source_refs: Array<{ id: string; title: string }>;
  stale: boolean;
};
function Studio({
  notebookId,
  selected,
  messages,
}: {
  notebookId: string | null;
  selected: string[];
  messages: any[];
}) {
  const [items, setItems] = useState<Artifact[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [open, setOpen] = useState<Artifact | null>(null);
  const load = async () => {
    if (!notebookId) {
      setItems([]);
      return;
    }
    const r = await fetch('/api/notebooks/' + notebookId + '/artifacts');
    if (r.ok)
      setItems(
        (await r.json()).artifacts.map((x: Artifact) => ({
          ...x,
          title:
            x.kind === 'briefing' && x.title === 'Quellenbriefing' ? 'Zusammenfassung' : x.title,
        })),
      );
  };
  useEffect(() => {
    void load();
  }, [notebookId]);
  const briefing = async () => {
    if (!notebookId || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/notebooks/' + notebookId + '/briefing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sourceIds: selected }),
      });
      if (!r.ok) {
        const x = await r.json().catch(() => null);
        throw Error(x?.message ?? 'Zusammenfassung konnte nicht erstellt werden.');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Zusammenfassung konnte nicht erstellt werden.');
    } finally {
      setBusy(false);
    }
  };
  const saveAnswer = async () => {
    if (!notebookId || busy) return;
    const assistant = [...messages].reverse().find((m: any) => m.role === 'assistant');
    const content = assistant ? messageText(assistant.parts) : '';
    const answerId = assistant?.metadata?.assistantMessageId ?? assistant?.id;
    if (!content) {
      setError('Noch keine Chatantwort zum Speichern vorhanden.');
      return;
    }
    if (!answerId) {
      setError('Die Antwort wird noch gespeichert. Bitte erneut versuchen.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/notebooks/' + notebookId + '/artifacts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Chatantwort als Notiz', content, answerId }),
      });
      if (!r.ok) throw Error('Notiz konnte nicht gespeichert werden. Bitte erneut versuchen.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Notiz konnte nicht gespeichert werden.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    if (!notebookId || busy || !confirm('Gespeichertes Ergebnis löschen?')) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/notebooks/' + notebookId + '/artifacts/' + id, {
        method: 'DELETE',
      });
      if (!r.ok) throw Error('Löschen fehlgeschlagen. Bitte erneut versuchen.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <aside className="studio panel" aria-labelledby="studio-title">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Arbeitsbereich</p>
          <h2 id="studio-title">Notizen &amp; Zusammenfassungen</h2>
        </div>
      </div>
      {!notebookId ? (
        <p className="studio-empty">
          Wähle ein Notebook, um Notizen und Zusammenfassungen zu speichern.
        </p>
      ) : (
        <>
          <p className="results-description">Notizen und Zusammenfassungen zu diesem Notebook.</p>
          <div className="studio-actions">
            <button
              type="button"
              aria-busy={busy}
              onClick={() => void briefing()}
              disabled={busy || !selected.length}
            >
              {busy ? 'Bitte warten …' : 'Zusammenfassung erstellen'}
            </button>
            <p className="action-help">
              Erstellt eine Zusammenfassung aus deinen ausgewählten Quellen.
            </p>
            <button
              type="button"
              disabled={busy || !messages.some((m) => m.role === 'assistant')}
              onClick={() => void saveAnswer()}
            >
              Chatantwort speichern
            </button>
          </div>
          {error && (
            <p className="source-error" role="alert">
              {error}
            </p>
          )}
          {!items.length ? (
            <p className="studio-empty">
              Noch keine Ergebnisse. Hier erscheinen deine gespeicherten Notizen und
              Zusammenfassungen.
            </p>
          ) : (
            <div className="artifact-list">
              {items.map((x) => (
                <article key={x.id} className="artifact" aria-label={x.title + ' ' + x.id}>
                  <div>
                    <strong>{x.title}</strong>
                    <small>
                      {x.kind === 'briefing' ? 'Zusammenfassung' : 'Notiz'} · {x.source_refs.length}{' '}
                      Quellen{x.stale ? ' · Veraltet: Quelle entfernt' : ''}
                    </small>
                  </div>
                  <button
                    disabled={busy}
                    aria-label={x.title + ' öffnen ' + x.id}
                    onClick={() => setOpen(x)}
                  >
                    Öffnen
                  </button>
                  <button
                    disabled={busy}
                    aria-label={x.title + ' löschen ' + x.id}
                    onClick={() => void remove(x.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {open && (
        <div
          className="viewer"
          role="dialog"
          aria-label="Gespeichertes Ergebnis"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(null);
          }}
        >
          <div>
            <strong>{open.title}</strong>
            <button aria-label="Ergebnis schließen" autoFocus onClick={() => setOpen(null)}>
              ×
            </button>
          </div>
          {open.stale && (
            <p className="source-error">
              Veraltet: Mindestens eine referenzierte Quelle wurde entfernt.
            </p>
          )}
          <article>
            <pre>{open.content}</pre>
          </article>
        </div>
      )}
    </aside>
  );
}
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
  const [sourceCount, setSourceCount] = useState(0);
  const [readyIds, setReadyIds] = useState<string[]>([]);
  useEffect(() => {
    let alive = true;
    if (!activeNotebook) {
      setSourceCount(0);
      setReadyIds([]);
      return;
    }
    fetch('/api/notebooks/' + activeNotebook.id + '/sources')
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
  }, [activeNotebook?.id, selected]);
  useEffect(() => {
    let alive = true;
    if (!activeNotebook) {
      setHistory([]);
      return;
    }
    fetch('/api/notebooks/' + activeNotebook.id + '/history')
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !data) return;
        const loaded = (data.chats ?? []).flatMap((chat: any) => chat.messages ?? []);
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
  }, [activeNotebook?.id, setMessages]);
  useEffect(() => {
    if (status !== 'ready' || !activeNotebook) return;
    const latest = [...messages].reverse().find((message: any) => message.role === 'assistant');
    const text = latest ? messageText(latest.parts) : '';
    if (!latest || !text) return;
    const messageId = latest.id;
    const assistantMessageId = (latest.metadata as { assistantMessageId?: string } | undefined)
      ?.assistantMessageId;
    setCitationSync({ messageId, state: 'pending' });
    if (!assistantMessageId) {
      setCitationSync({ messageId, state: 'failed' });
      return;
    }
    let active = true;
    const run = ++syncRun.current;
    const controller = new AbortController();
    const sync = async () => {
      let gotHistory = false;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const response = await fetch('/api/notebooks/' + activeNotebook.id + '/history', {
            signal: controller.signal,
          });
          const data = response.ok ? await response.json() : null;
          if (!active || syncRun.current !== run) return;
          if (data) {
            gotHistory = true;
            const loaded = (data.chats ?? []).flatMap(
              (chat: any) => chat.messages ?? [],
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
  }, [status, activeNotebook?.id, messages]);
  const openCitation = async (c: Citation) => {
    if (!activeNotebook || !c.sourceId || !c.id) return;
    const r = await fetch('/api/notebooks/' + activeNotebook.id + '/sources/' + c.sourceId);
    if (!r.ok) return;
    const data = await r.json();
    const found = (data.chunks ?? []).find((chunk: any) => chunk.id === c.id);
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
        <Research ready={!!activeNotebook} />
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
                          {citationSync?.messageId === message.id &&
                          citationSync.state === 'pending'
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
