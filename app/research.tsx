'use client';
import { useEffect, useRef, useState } from 'react';
import type { ResearchResult } from '../lib/web-research';
export function Research({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [result, setResult] = useState<ResearchResult | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function search() {
    if (busy || !query.trim()) return;
    const c = new AbortController();
    controller.current = c;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
        signal: c.signal,
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.message ?? 'Recherche fehlgeschlagen.');
      setResult(data);
    } catch (e) {
      setError(
        c.signal.aborted
          ? 'Recherche abgebrochen.'
          : e instanceof Error
            ? e.message
            : 'Recherche fehlgeschlagen.',
      );
    } finally {
      setBusy(false);
    }
  }
  const nodes = [];
  let cursor = 0;
  if (result) {
    for (const [i, c] of result.citations.entries()) {
      if (c.start < cursor) continue;
      nodes.push(result.text.slice(cursor, c.start));
      nodes.push(
        <a
          className="citation"
          key={i}
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          title={c.title}
        >
          {result.text.slice(c.start, c.end)} ↗
        </a>,
      );
      cursor = c.end;
    }
    nodes.push(result.text.slice(cursor));
  }
  return (
    <>
      <button
        type="button"
        className="research-launch"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Webrecherche
      </button>
      {open && (
        <section className="research-panel" aria-label="Webrecherche">
          <header>
            <h2>Webrecherche</h2>
            <button onClick={() => setOpen(false)} aria-label="Webrecherche schließen">
              ×
            </button>
          </header>
          <p>
            Nur deine Suchfrage wird an den Suchanbieter gesendet. Keine Dokumente, Notebookdaten
            oder Chatverläufe. Ergebnisse bleiben nur bis zum Neuladen in diesem Tab – kein
            Quellenimport.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void search();
            }}
          >
            <label htmlFor="research-query">Öffentliche Suchfrage</label>
            <textarea
              id="research-query"
              maxLength={2000}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Was erklärt MDN zu Array.prototype.map()?"
            />
            <button disabled={!ready || busy || !query.trim()}>Im Web recherchieren</button>
            {busy && (
              <button type="button" onClick={() => controller.current?.abort()}>
                Recherche abbrechen
              </button>
            )}
          </form>
          {busy && <p role="status">Web wird durchsucht …</p>}
          {error && <p role="alert">{error}</p>}
          {result && (
            <article>
              {(!result.complete || !result.searched || !result.citations.length) && (
                <p role="alert">
                  {!result.searched ? 'Keine Websuche bestätigt. ' : ''}
                  {!result.citations.length ? 'Keine überprüfbaren Inline-Belege erhalten. ' : ''}
                  {!result.complete ? 'Antwort unvollständig.' : ''}
                </p>
              )}
              <div className="research-answer">{nodes}</div>
              <h3>Webquellen ({result.sources.length})</h3>
              <p>
                Webinhalte können fehlerhaft sein. Links öffnen externe Seiten; die Antwort ist
                keine importierte Originalquelle.
              </p>
              <ul>
                {result.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title} ↗
                    </a>
                    <small>{s.url}</small>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </section>
      )}
    </>
  );
}
