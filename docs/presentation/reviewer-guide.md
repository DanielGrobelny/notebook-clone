# Reviewerübersicht

Production-Code 257f24fa5b56fa723b8a2054f9e6dab0bd358f2e, geprüft am 06.11.2026. [Live](https://notebook-clone-preview.vercel.app) · [Repo](https://github.com/DanielGrobelny/notebook-clone) · [Matrix](acceptance-matrix.md). Repo privat: Reviewerberechtigung vor Abgabe prüfen. Loom noch offen.

## Architekturentscheidung
Next.js/React/TypeScript verbindet UI und Serverrouten; Supabase liefert Postgres/pgvector und privaten Storage. Browser nur App-API. 256-Bit-Besuchertoken als HttpOnly-Cookie, SHA256-Hash/Ablauf in Sessiontabelle; Datenclient unprivilegiert mit Besucherheader, RLS prüft erneut. Service Role nur Sessionauflösung. Originprüfung für Mutationen. Kein Accountsystem, Cookieverlust ohne Recovery/Cross-Device.

Import synchron: Validierung → PDF.js/Text → seitenbezogene Chunks (1800 Zeichen, ohne Overlap) → Embeddings text-embedding-3-small/1536 → ready. Dateien in privatem Storage. Fingerprint/Uniqueindex für Deduplikation. Kein dauerhafter Worker; Cleanup best effort, kein expliziter Importtimeout.

Retrieval: Besitzer+Notebook+ausgewählte ready Quellen vor exakter Distanz, source_rank für faire Abdeckung. Maximal acht Quellen, zwölf Chunks/12000 Zeichen. RAG statt Vollkontext begrenzt Kosten/Laufzeit, aber Recall ungemessen. Kein semantischer Schwellenwert als Beweis für Relevanz. Serverhistory ist Gesprächskontext, nicht aktuelle Evidenz. Responses streamt; persistente Abschlusswarnungen bei Nicht-stop. Gültige Zitier-ID beweist nicht semantische Wahrheit.

## Datenmodell
VisitorSession → Notebooks → Sources → SourceChunks; Notebooks → Chats → Messages; Notebooks → Artifacts. Sources referenzieren private Blobpfade; Messages enthalten Zitiermetadaten. Historische Auth-Eigentümerschaft bleibt erhalten, wird nicht an Besucher umverteilt. Migrationen/Indizes im Repo, DB-Cascades ersetzen keine Storagebereinigung. Rate-FK ohne Cascade, kein automatischer Sessioncleanup.

## Belegregister
Jüngster Releasebericht 06.11.2026: Previewbaum 97bfa4a identisch zu Production 257f24f: 105 Unit/DB, 72 Chromium Desktop/Mobile, zwei Storage, Build/Typecheck. Zwei optionale externe PDF-Fixtures übersprungen. Navigation-Production-Smoke ohne Provider. Historischer Vierturn-Provider-Smoke auf cc29f2e; späterer Composer-Smoke 259ea51 mit drei kurzen echten Antworten. Keine Addition von Testzahlen, kein neuer Vollsuite-/Modelllauf für dieses Dokumentationspaket.
Reale Budget-Eval 05.11. in evals/answer-budget: 800/alter Prompt length vs 4096/neuer Prompt stop (1270 tatsächlich). Zwei Variablen geändert, kein kausaler Budgetvergleich. Qualitäts-v1 historisch 5/6 fehlgeschlagen, v2 unvollständig/pending manual review. Kein aktueller semantischer Qualitätsgate.

## Betrieb und Kosten: Vorschlag, nicht implementiert
SLO-Kandidaten vor Lasttest vereinbaren: Chat-TTFB/Ende, Importdauer je Größe, Fehlerraten, Kosten je Import/Chat. Keine erfundenen Sollwerte oder 1000-Nutzer-Garantie. 1000 registrierte Nutzer wäre ohnehin falsche Metrik für Besucher-MVP: aktive Parallelität, Dokumentgrößen und Anfragen je Minute festlegen. Engpässe: exakte Scoped-Suche, DB-Verbindungen, synchroner PDFimport, Providerquoten und Serverless-Laufzeit. Getrennten Testdatenbestand, Ramp-up, Abbruchschwellen und Budget autorisieren.
Kostenformel: Import=Embeddingtokens×Preis; Chat=Queryembedding+Input/Output/Reasoning nach tatsächlichem Modelltarif. Usage erfassen, keine ungeprüften Eurobeträge. 12 Claims/Stunde, zwei pro Chat, neue Cookies umgehen Quote. Provider-Spendlimit/Auto-Recharge separat prüfen; kein hartes Budget behaupten. CI/Alerts nicht nachgewiesen; Rollback releasebezogen, Migrationen separat sichern, keine automatischen DB-Downgrades.

## KI-Review und Junior-Einstieg
PR24 korrigiert SDK-Vertragsfehler (Assistant-Metadaten in Folgefragen); PR26 korrigiert zu schmale Notebooknamen und Stream-Mocksplitter. Belegte Iterationen statt erfundener TDD-/Pairinghistorie. Checkliste: Scope/Ownership, negative Tests, Secrets, Mock vs Real, Persistenz/Fehler, Previewbaum und Rückrollweg. Vorgeschlagene erste Junior-Aufgabe: OCR-Nichtziel mit synthetischer Fehlerfixture und verständlicher UI-Meldung belegen; isolierter Branch, kein Productionzugriff.

## Abgabeentwurf – nicht gesendet
Hallo, hier sind Repository und Live-Demo meines Notebook-Klons. Das Loom ergänze ich nach der Aufnahme. Die Reviewerunterlagen enthalten Architektur, Tests und offen ausgewiesene Grenzen. Bitte zuvor privaten Repositoryzugriff bestätigen.
