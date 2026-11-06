'use client';
import { useEffect, useState, useRef } from 'react';
type Notebook = { id: string; title: string };
let bootstrap: Promise<Notebook[]> | null = null;
async function initial() {
  if (!bootstrap) {
    const start = async () => {
      const boot = await fetch('/api/session', { method: 'POST' });
      if (!boot.ok) throw Error();
      const r = await fetch('/api/notebooks');
      if (!r.ok) throw Error();
      return (await r.json()).notebooks as Notebook[];
    };
    bootstrap = (
      navigator.locks ? navigator.locks.request('notebook-session', start) : start()
    ).finally(() => {
      bootstrap = null;
    });
  }
  return bootstrap;
}
export function Persistence({
  onNotebook,
  onError,
}: {
  onNotebook?: (notebook: Notebook | null) => void;
  onError?: (error: string) => void;
}) {
  const activeId = useRef<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const choose = (n: Notebook | null) => {
    activeId.current = n?.id ?? null;
    setActive(n?.id ?? null);
    onNotebook?.(n);
  };
  const menu = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => {
    if (menu.current) {
      menu.current.open = false;
      menu.current.querySelector('summary')?.focus();
    }
  };
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) menu.current.open = false;
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menu.current?.open) closeMenu();
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  const [items, setItems] = useState<Notebook[]>([]),
    [error, setError] = useState('');
  const load = async () => {
    try {
      setError('');
      onError?.('');
      const notebooks = await initial();
      setItems(notebooks);
      choose(notebooks.find((n) => n.id === activeId.current) ?? notebooks[0] ?? null);
    } catch {
      const message =
        'Arbeitsbereich nicht verfügbar. Bitte Backend-Konfiguration prüfen und erneut versuchen.';
      setError(message);
      onError?.(message);
    }
  };
  useEffect(() => {
    void load();
    const retry = () => void load();
    window.addEventListener('retry-workspace', retry);
    return () => window.removeEventListener('retry-workspace', retry);
  }, []);
  const create = async () => {
    const title = prompt('Name des Notebooks');
    if (!title) return;
    const r = await fetch('/api/notebooks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!r.ok) {
      setError('Notebook konnte nicht erstellt werden.');
      return;
    }
    const n = (await r.json()).notebook;
    setItems((x) => [...x, n]);
    choose(n);
    closeMenu();
  };
  const rename = async (n: Notebook) => {
    const title = prompt('Neuer Name', n.title);
    if (!title) return;
    const r = await fetch('/api/notebooks/' + n.id, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!r.ok) setError('Umbenennen fehlgeschlagen.');
    else await load();
  };
  const remove = async (n: Notebook) => {
    if (!confirm('Notebook inklusive Quellen und Chat löschen?')) return;
    const r = await fetch('/api/notebooks/' + n.id, { method: 'DELETE' });
    if (!r.ok) setError('Löschen fehlgeschlagen.');
    else await load();
  };
  return (
    <div className="notebook-store">
      <button onClick={() => void create()}>+ Notebook</button>
      <details ref={menu} className="notebook-menu">
        <summary>Notebooks wechseln</summary>
        <ul aria-label="Meine Notebooks">
          {items.map((n) => (
            <li key={n.id}>
              <button
                className="notebook-choice"
                aria-label={n.title}
                aria-current={active === n.id ? 'true' : undefined}
                title={n.title}
                onClick={() => {
                  choose(n);
                  closeMenu();
                }}
              >
                <span>{n.title}</span>
                {active === n.id && <small>Aktiv</small>}
              </button>
              <div className="notebook-actions">
                <button aria-label={n.title + ' umbenennen'} onClick={() => void rename(n)}>
                  Umbenennen
                </button>
                <button aria-label={n.title + ' löschen'} onClick={() => void remove(n)}>
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </details>
      {error && (
        <div role="alert">
          {error}
          <button onClick={() => void load()}>Erneut versuchen</button>
        </div>
      )}
    </div>
  );
}
