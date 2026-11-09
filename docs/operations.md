# Betrieb und Migration

Lumen läuft auf Vercel als Next.js-Anwendung. Supabase stellt PostgreSQL/pgvector und privaten Storage bereit; OpenAI wird nur serverseitig angesprochen. Secrets gehören nie in Client-Code, Logs oder Git.

Die anonyme Sitzung nutzt ein HttpOnly-/SameSite-Cookie; Cookie-Verlust erzeugt einen neuen leeren Bereich. Provider-Rate-Limits sind keine garantierte Kostenobergrenze.

## Migrationen
Migrationen vor dem Deployment separat prüfen und sichern. Besucher-Sitzungen, RLS, Storage-Policies, Retrieval, Rate-Limits und Notebook-Bootstrap gemeinsam ausrollen. Keine Produktionsdatenbank lokal zurücksetzen.

## Grenzen
PDF-Import unterstützt kein OCR. Belege zeigen Passagen, nicht automatisch Wahrheit. Mobile Tests emulieren Chromium.
