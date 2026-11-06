'use client';
import { apiRequest } from './api-request';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, FileText, Upload, Eye, Trash2 } from 'lucide-react';
type RealSource = {
  id: string;
  title: string;
  source_type: string;
  status: string;
  byte_size: number | null;
  page_count: number | null;
};

export function Sources({
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
  const [retry, setRetry] = useState<{ file?: File; text?: string } | null>(null);
  const [viewer, setViewer] = useState<{
    title: string;
    chunks: Array<{ id: string; content: string; metadata: { page?: number; section?: string } }>;
  } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!notebookId) {
        setItems([]);
        return;
      }
      const r = await apiRequest('/api/notebooks/' + notebookId + '/sources', { signal });
      if (r.ok) setItems((await r.json()).sources);
    },
    [notebookId],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal).catch((error: unknown) => {
      if (!controller.signal.aborted)
        setError(error instanceof Error ? error.message : 'Laden fehlgeschlagen.');
    });
    return () => controller.abort();
  }, [load]);
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
    setRetry({ file, text });
    const name = file?.name ?? 'Eingefügter Text';
    setUploadStatus(name + ' · Wird hochgeladen und verarbeitet …');
    try {
      const form = new FormData();
      if (file) form.set('file', file);
      if (text !== undefined) form.set('text', text);
      const r = await apiRequest('/api/notebooks/' + notebookId + '/sources', {
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
      setRetry(null);
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
          {retry && (
            <button disabled={uploading} onClick={() => void upload(retry?.file, retry?.text)}>
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
export function SourcePanel({
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
