# Lumen

Lumen ist ein schlanker Notebook-Prototyp für quellengebundene Recherche: Dokumente importieren, Quellen auswählen, Fragen stellen und Antworten bis zur Originalpassage zurückverfolgen. Der Einstieg funktioniert ohne Registrierung über eine anonyme Browser-Sitzung. Lumen ist eine Demo, kein fertiges SaaS-Produkt.

## Funktionen

- Notebooks und Quellen verwalten
- TXT, Markdown und PDF importieren (kein OCR)
- Quellen auswählen und daraus suchen
- Gestreamte Chatantworten mit Originalbelegen
- Private Downloads sowie responsive Desktop-/Mobile-Oberfläche

## Stack

Next.js 16 (App Router), React 19, TypeScript und Tailwind CSS 4. Serverseitige API-Routen nutzen Supabase PostgreSQL/pgvector, Row Level Security und privaten Storage. Embeddings und Antworten kommen über OpenAI; das Vercel AI SDK streamt die Antworten. Vercel hostet die Anwendung, GitHub verwaltet Code und Pull Requests. Es gibt kein separates Backend.

## Lokal starten

Voraussetzungen: Node.js, pnpm 10, Docker (nur für den vollständigen Integrationstest).

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
# Supabase- und OpenAI-Werte in .env.local eintragen
pnpm dev
```

Für einen Produktionsbuild:

```sh
pnpm build
pnpm start --hostname 127.0.0.1
```

Secrets gehören ausschließlich in lokale oder serverseitige Umgebungsvariablen und nicht in Git.

## Tests

```sh
pnpm test          # Unit- und Routen-Tests, ohne Providerkosten
pnpm typecheck
pnpm test:visitor  # isolierte DB/Storage-, Build- und Browserprüfung
pnpm test:e2e      # gegen eine bereitgestellte isolierte Testumgebung
```

`test:visitor` benötigt Docker, installierte Playwright-Browser und freie lokale Ports. Der kostenpflichtige OpenAI-Test ist nur mit explizitem Opt-in verfügbar: `pnpm test:integration:openai`.

## Wichtige Grenzen

Die Anwendung verarbeitet Dokumenttexte und ausgewählte Passagen serverseitig bei OpenAI. Keine sensiblen Dokumente in öffentliche Demos laden; Provider-Schlüssel bleiben serverseitig. Die anonyme Sitzung ist browsergebunden: Cookie-Verlust bedeutet einen neuen leeren Bereich, ohne Cross-Device-Wiederherstellung. Rate-Limits sind kein garantierter Kostenschutz. Antworten sind nicht automatisch wahr; Belege zeigen gespeicherte Passagen, nicht deren semantische Richtigkeit.

Technische Betriebs-, Migrations- und Testdetails stehen in [`docs/`](docs/).
