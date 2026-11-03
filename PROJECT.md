# Notebook-Klon – Probeaufgabe

## Auftrag
NotebookLM-Klon; Umsetzung, Umfang und Struktur frei. AI-Tools ausdrücklich erlaubt. Abgabe: GitHub-Repository, Live-Deployment und Loom-Video (maximal 10 Minuten) mit Vorgehen und Live-Test.

## Zeitrahmen
Start 2026-11-03. Sieben Tage verfügbar; rechnerische Deadline 2026-11-10, genaue Uhrzeit offen. Vorschlag: abgabefähiger Kern in 3–4 fokussierten Arbeitstagen, Rest Puffer.

## Status
Planung dokumentiert; technische Basis und Priorisierung bestätigt. Implementierung noch nicht gestartet.

## Produktkern
Quellen pro Notebook sammeln und auswählen; quellengebundener Chat mit überprüfbaren Zitaten; Inhalte in Studio-Artefakte transformieren. Wiedererkennbare Drei-Spalten-Oberfläche: Quellen, Chat, Studio.

## MVP-Vorschlag
Notebooks; PDF (Text-PDF), TXT/Markdown und eingefügter Text; Importstatus und Fehlerbehandlung; Quellenauswahl; Streaming-Chat; klickbare Belege mit Originalpassage/Seite; ehrliche Antwort bei fehlender Evidenz; gespeicherte Chats; Notizen und Zusammenfassungs-/Briefing-Artefakt; persistente Daten und getrennte Benutzer; isolierter Demo-Einstieg mit Beispieldokumenten.

## Optional
Ein Audio-Overview als Wiedererkennungsmerkmal, erst nach stabilem Kern. Alternativ Quiz. URL-Import nur mit SSRF-Schutz und begrenztem Parser-Aufwand.

## Nicht im ersten Umfang
Google-Drive-Sync, YouTube/Audio-Import, OCR, Video, Folien, Web-Recherche-Agent, Code-Sandbox, Echtzeit-Kollaboration, Billing.

## Architekturüberblick
Next.js/TypeScript/Tailwind; Supabase Auth/PostgreSQL/Storage mit RLS; pgvector-Retrieval mit Quellenauswahl und serverseitiger Autorisierung; Vercel AI SDK als Modellanbindung; keine zusätzliche generische Provider-Abstraktion. Vitest und Playwright. Keine zusätzliche NestJS-App ohne Bedarf. Zitier-IDs werden serverseitig auf tatsächlich abgerufene Passagen validiert; das allein beweist keine semantische Richtigkeit.

## Qualitätsnachweise
Upload bis Antwort bis Quellenbeleg; nicht beantwortbare Frage; widersprüchliche Quellen; Quellen-Abwahl; Tenant-Isolation; ungültige/zu große Dateien; Prompt-Injection aus Dokumenten; Persistenz nach Reload; mobile Darstellung. Kleine feste Evaluationssammlung. Kosten-/Rate-Limits und serverseitige Secrets.

## Quellen (abgerufen 2026-11-03)
- https://blog.google/innovation-and-ai/products/gemini-notebook/notebooklm-gemini-notebook/ (Umbenennung 2026-07-16)
- https://support.google.com/gemininotebook/answer/16164461
- https://support.google.com/gemininotebook/answer/16206563
- https://blog.google/innovation-and-ai/products/notebooklm/better-research-notebooklm/

## Nächste Entscheidung
Provider, konkrete Modelle, API-Budget und Demo-Zugang klären. Audio bleibt optional.

## Priorisierung vom 2026-11-03
Audio bleibt ausdrücklich optional. Zuerst App-Gerüst und echter serverseitiger Modellaufruf mit Streaming, Abbruch und Fehlerbehandlung. Danach Auth/Persistenz, Quellenimport und belegbarer Chat; anschließend Studio, Demo, Evaluation und Abgabe. Provider/Modell und Budget vor Betrieb prüfen. Tests begleiten jedes Arbeitspaket.

## Architekturentscheidung: Vercel AI SDK (2026-11-03)
Bestätigt: Next.js + TypeScript + Vercel AI SDK + Zod + Supabase/pgvector. AI SDK UI (@ai-sdk/react, useChat) für Chatstatus und Streaming; AI SDK Core (ai, streamText) im serverseitigen Next.js-Route-Handler. Ein direkter Provider über dessen SDK-Paket; Vercel AI Gateway optional, nicht erforderlich. Keine zusätzliche generische Provider-Abstraktion, kein LangChain und kein autonomes Agentenframework im MVP; zentrale Modellkonfiguration genügt.

Ablauf: Frage → Benutzer-/Notebook-Zugriff prüfen → ausschließlich erlaubte und ausgewählte Quellenstellen suchen → Modellaufruf → gestreamte Antwort mit validierten Belegverweisen. Auth, RLS, PDF-Extraktion, Chunking, Retrieval, Persistenz, Zitatprüfung und Kosten-/Rate-Limits bleiben Anwendungslogik; das SDK ersetzt diese nicht. Dokumentinhalt gilt als Daten, nicht als Systemanweisung.

Erster Durchstich: echter Modellaufruf mit eingegebenem Quelltext; danach Dokument-Retrieval integrieren, ohne den Chat neu zu bauen. Schlüssel nur serverseitig; Abbruch, Timeout und Providerfehler testen. Konkreter Provider, Chat-/Embedding-Modell, SDK-Version und API-Budget sind noch offen und vor Implementierung zu prüfen/festzulegen. Audio ausdrücklich optional.

Referenz: https://ai-sdk.dev/docs/getting-started/nextjs-app-router

## Betriebsentscheidung: API-Ausgabenbegrenzung (2026-11-03)
OpenAI ist der gewählte Modellanbieter. Eine harte monetäre Nutzungsgrenze soll beim API-Anbieter verwaltet werden, nicht als eigene Budgetverwaltung in dieser Anwendung. In der aktuell geprüften Kontooberfläche war keine solche einstellbare Grenze verfügbar; Usage Limits führte zu den Organisations-Limits mit Rate-/Tier-Einstellungen. Dies ist eine beobachtete Konto-/UI-Einschränkung, keine Behauptung, dass OpenAI generell keine Spend Limits unterstützt. Dokumentation und sichtbare Optionen stimmten nicht überein; die Ursache ist ungeklärt.
Rate Limits (Anfragen/Tokens pro Zeit) und einzelne Output-Tokenlimits sind kein Gesamtbudget. Normale Anwendungs-Schutzmaßnahmen gegen Missbrauch und unkontrollierte Aufrufschleifen bleiben im Scope, ein eigenes Abrechnungssystem nicht. Vor öffentlichem Betrieb muss die anbieterseitige Kostenbegrenzung erneut geprüft werden. Keine automatische Aufladung oder Zahlungsänderung ohne Freigabe.
