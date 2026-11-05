# Lumen — Everlast-Testaufgabe

## Verbindlicher MVP (2026-11-04)

Diese Entscheidung ersetzt die bisherige Konto-/Demo-Seed-Planung. Die Anwendung selbst ist die Demo, kein künftiges SaaS. Ohne Startknopf oder Anmeldung öffnet sich ein leerer persönlicher Arbeitsbereich. Eigene TXT-/Markdown-/Text-PDF-Dateien oder eingefügter Text werden importiert, Quellen ausgewählt und quellengebunden befragt. Antworten streamen und enthalten überprüfbare Originalbelege; Notebooks, Quellen, Chat und Studio-Artefakte bleiben erhalten.

Persistentes zufälliges HttpOnly-Cookie, 30 Tage, SameSite=Lax, Secure unter HTTPS. Serverseitige Hash-Zuordnung, zusätzliche RLS-/Storage-Besitzprüfung, keine clientseitig behauptete Eigentümerschaft. Keine Supabase Auth-/Account-Voraussetzung, kein OAuth, keine Registrierung/E-Mail-Bestätigung, keine synthetischen Demo-Notebooks, kein Demo-Reset. Alte Auth-Daten bleiben unangetastet und werden nicht neu verteilt. Cookie-Verlust hat keine Recovery; kein Cross-Device-Sync. Details und Migration: README.

## Architektur und Umfang

Next.js/TypeScript, Supabase PostgreSQL/privater Storage, pgvector, Vercel AI SDK und ein direkter OpenAI-Provider. Browserzugriffe ausschließlich über App-APIs. Keine zusätzliche Provider-Abstraktion, kein Agentenframework. Dokumente sind untrusted Daten, keine Anweisungen. Zitier-ID-Prüfung ersetzt keine semantische Qualitätsprüfung.

Vorhandene Datei-/Requestlimits, Timeouts, Abbruch und einfache atomare Besucher-Rate-Limits erhalten; für vollständige Chatantworten wird der initiale 800-Token-Demowert durch ein weiterhin begrenztes 4096-Token-Budget mit Längensteuerung ersetzt (höheres mögliches Outputkostenvolumen, siehe README); kein Budget-/Billing-System. Guthaben ist kein garantierter Hard Cap. Providerlimits und Auto-Recharge vor öffentlicher Nutzung prüfen, keine automatischen Zahlungsänderungen. Keine sensiblen Dokumente für die öffentliche Demo empfehlen.

Audio, URL-Import, OCR, Sync, Kollaboration und echte Accounts bleiben außerhalb dieses MVP. Kein Zusatzumfang. Die früheren Anforderungen an Supabase Auth, persönliche Demo-Provisionierung und Beispieldokumente sind **ersetzt**, nicht zusätzlich umzusetzen.

## Abnahme

Unit-/RLS-/Storage-Prüfungen sowie Desktop/Mobile-Browserlauf: leerer Einstieg → eigener Upload → gestreamte Antwort → Beleg → Reload; zweite Sitzung bleibt getrennt; manipulierte Notebook-/Source-/Chat-/Artefakt-/Storage-IDs geben keine fremden Daten frei. Normale Tests nutzen ausschließlich lokalen Provider-Mock und eigene Testressourcen; echter Provider-Smoke nur separat autorisiert.

## Abgabe und Betrieb

GitHub-Repository, Live-Demo, Loom bis zehn Minuten. Start der Aufgabe 2026-11-03, sieben Tage verfügbar; rechnerisch 2026-11-10, genaue Uhrzeit offen. Kein Production-Deployment ohne ausdrückliche Freigabe. Migration und Staging-Konfiguration müssen vor Auslieferung abgestimmt werden; keine gemeinsame Datenbank für Tests migrieren/resetten.
