# Lumen — Notebook-Klon

## Echte OpenAI-Anbindung

POST /api/chat verlangt Anmeldung, ein per RLS zugängliches Notebook und mindestens eine ausgewählte eigene Quelle. Browser senden nur Nutzertext sowie IDs; Modell, Systemanweisung, Tokenlimit und Quelltextbegrenzung bleiben serverseitig. Höchstens zwölf gespeicherte Abschnitte bzw. 12.000 Zeichen werden als untrusted Kontext verarbeitet.

Die Route streamt mit AI SDK über die OpenAI Responses API. Festes Modell: gpt-5.6-luna, ohne Fallback. Das Geheimnis wird ausschließlich serverseitig aus OPENAI_API_KEY oder der lokalen Datei ~/.config/notebook-clone/openai.env gelesen; es wird weder an den Browser noch in Logs ausgegeben. store:false, ein 30-Sekunden-Timeout, Client-Abbruchweitergabe, Outputlimit 800 und maxRetries:0 begrenzen Einzelaufrufe. 429- und Timeoutfehler werden getrennt behandelt.

Bei erfolgreichem Stream protokolliert der Server ausschließlich Modellkennung und die vom Provider gemeldeten Token-Zähler (inputTokens, outputTokens, totalTokens); weder API-Key noch Prompt oder Quellinhalt werden geloggt. Dieselben Zähler werden als minimale Finish-Metadaten gestreamt. Es gibt absichtlich kein Budgetverwaltungssystem und keine automatische Aufladung. Für gpt-5.6-luna ist in diesem Projekt kein offizieller Preisbeleg hinterlegt; aus Usage-Zählern wird keine Kostenschätzung abgeleitet.

## Tests

- pnpm test – Unit-Tests
- pnpm test:e2e – normale Desktop-/Mobile-Browsersuite mit echten Auth-, Notebook- und Quellenfixtures, aber gemocktem Chattransport; keine Providerkosten
- pnpm test:storage – explizite Storage-/Chunk-Integrationsprüfung; keine Providerkosten
- pnpm test:integration:openai – einziger explizit opt-in echter Browser → App → OpenAI → UI-Smoke (RUN_OPENAI_INTEGRATION=1); nur bei bewusst autorisiertem Lauf

Die Serverkonfiguration ist portabel: Deployment-Umgebungen setzen OPENAI_API_KEY; eine Schlüsseldatei ist nur über das explizite OPENAI_API_KEY_FILE-Opt-in erlaubt und gehört nicht ins Repository.

### Provider-Isolation in der normalen E2E-Suite

Die Playwright-Konfiguration setzt nur für den gestarteten Testprozess OPENAI_BASE_URL auf den lokalen Mock 127.0.0.1:4186/v1. Der Mock akzeptiert ausschließlich /v1/embeddings; sein Teardown verlangt mindestens einen echten Import-Aufruf. Source-Imports durchlaufen damit App- und Datenbankroute ohne externe Provideraufrufe. Echte Provider-Smokes bleiben pnpm test:integration:openai mit explizitem Opt-in.
