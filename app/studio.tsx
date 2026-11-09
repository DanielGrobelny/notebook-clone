'use client';
import { apiRequest } from './api-request';
import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
function messageText(parts: Array<{ type: string; text?: string }>) {
  return parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join('');
}

type Artifact = {
  id: string;
  kind: string;
  title: string;
  content: string;
  source_refs: Array<{ id: string; title: string }>;
  stale: boolean;
};
export function Studio({
  notebookId,
  selected,
  messages,
}: {
  notebookId: string | null;
  selected: string[];
  messages: Array<{
    id: string;
    role: string;
    parts: Array<{ type: string; text?: string }>;
    metadata?: unknown;
  }>;
}) {
  const [items, setItems] = useState<Artifact[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [open, setOpen] = useState<Artifact | null>(null);
  const fetchItems = useCallback(
    async (signal?: AbortSignal): Promise<Artifact[] | null> => {
      if (!notebookId) return null;
      const response = await apiRequest('/api/notebooks/' + notebookId + '/artifacts', { signal });
      if (!response.ok) throw Error('Laden fehlgeschlagen.');
      const data = await response.json();
      return (data.artifacts as Artifact[]).map((x) => ({
        ...x,
        title: x.kind === 'briefing' && x.title === 'Quellenbriefing' ? 'Zusammenfassung' : x.title,
      }));
    },
    [notebookId],
  );
  const load = async () => {
    const next = await fetchItems();
    if (next) setItems(next);
  };
  useEffect(() => {
    const controller = new AbortController();
    void fetchItems(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted && next) setItems(next);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : 'Laden fehlgeschlagen.');
      });
    return () => controller.abort();
  }, [fetchItems]);
  const briefing = async () => {
    if (!notebookId || busy) return;
    setBusy(true);
    setError('');
    try {
      const r = await apiRequest('/api/notebooks/' + notebookId + '/briefing', {
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
    const assistant = [...messages].reverse().find((m) => m.role === 'assistant');
    const content = assistant ? messageText(assistant.parts) : '';
    const answerId =
      (assistant?.metadata as { assistantMessageId?: string } | undefined)?.assistantMessageId ??
      assistant?.id;
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
      const r = await apiRequest('/api/notebooks/' + notebookId + '/artifacts', {
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
      const r = await apiRequest('/api/notebooks/' + notebookId + '/artifacts/' + id, {
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
