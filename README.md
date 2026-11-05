# Lumen — Notebook-Klon

Everlast-Testaufgaben-Demo, kein SaaS: öffnen → eigene Dokumente importieren → Quellen auswählen → quellengebunden chatten → Originalbelege prüfen. Keine Registrierung, Anmeldung, Supabase Anonymous Auth oder automatisch erzeugten Beispielinhalte. Audio bleibt zurückgestellt.

## Besuchersitzung und Daten

Der automatische Bootstrap erzeugt ein zufälliges 256-Bit-Token. Das persistente Cookie ist HttpOnly, SameSite=Lax, unter HTTPS Secure und 30 Tage gültig. In PostgreSQL liegt ausschließlich sein SHA-256-Hash. Reload und weitere Tabs desselben Browsers behalten eigene Notebooks, Quellen, Chats und Artefakte. Cookie-Verlust/-Ablauf erzeugt einen neuen leeren Bereich; keine Wiederherstellung, kein Cross-Device-Zugriff und kein Fingerprinting. Keine sensiblen Dokumente in die öffentliche Demo laden.

Der Browser verwendet ausschließlich App-APIs, keinen direkten Supabase-Client. Der Server prüft die Sitzung und verwendet für Daten/Storage einen **nicht privilegierten** Client mit dem geheimen Sitzungstoken im Header. PostgreSQL validiert dessen Hash und Ablauf erneut; RLS begrenzt Notebooks, Quellen/Chunks, Chats/Messages, Artefakte, Retrieval und private Dateien. Client-IDs sind niemals ein Berechtigungsnachweis. Der Service-Role-Schlüssel ist ausschließlich für die serverseitige Session-Tabelle vorgesehen und darf nie öffentlich sein. Mutierende App-Endpunkte prüfen Origin; SameSite schützt zusätzlich.

## Konfiguration

Die Variablennamen stehen in .env.example. Benötigt: Supabase-URL, öffentlicher Anon-Key, **serverseitiger** SUPABASE_SERVICE_ROLE_KEY und OPENAI_API_KEY. Optional ist eine explizit konfigurierte Schlüsseldatei über OPENAI_API_KEY_FILE; keine automatische Suche nach Host-Credentials. HTTPS-Deployments müssen den korrekten X-Forwarded-Proto und Host weitergeben. Keine Secrets committen oder protokollieren.

Installation: pnpm install --frozen-lockfile. Build: pnpm build. Start: pnpm start --hostname 127.0.0.1. Der Build verwendet Webpack und unterstützt damit auch isolierte Worktrees mit extern aufgelösten Dependencies. Backendfehler werden als Fehler mit Retry dargestellt, nicht als Offline-Erfolg.

## Migration bestehender Installationen

Vor Änderung sichern und die Migration zunächst in einer separaten Testdatenbank prüfen. Die neuen Migrationen ab 20261104160000 addieren Besucher-Sitzungen und notebooks.visitor_id. owner_id wird nullable; der historische Auth-Default bleibt für ältere Previews erhalten und ergibt bei Besuchern NULL; der historische auth.users-FK bleibt erhalten. Genau eine Eigentümerart ist zulässig. Alte Auth-Notebooks und Dateien werden **weder gelöscht noch Besuchern zugewiesen**; sie sind im neuen Besucher-UI nicht erreichbar. Keine automatische Übernahme oder Recovery. Historische is_demo-Spalten und Migrationen bleiben als Bestand erhalten, werden aber nicht mehr verwendet.

Session-RLS, Storage-Policies, visitor-scoped Retrieval, atomare Rate-Limits und idempotenter Erst-Notebook-RPC werden gemeinsam installiert. Schemaänderung und neue App müssen abgestimmt ausgerollt werden. Keine gemeinsame/produktive Datenbank resetten. Ein Rollback muss Besucherzeilen erhalten bzw. vorher sichern; nicht einfach Spalten droppen. Dieses Repository führt keine automatische Migration beim App-Start aus.

## Modellgrenzen

Streaming über AI SDK/OpenAI Responses, nur ausgewählte eigene Quellen, maximal zwölf Abschnitte bzw. 12.000 Kontextzeichen. Belege verweisen auf gespeicherte Originalpassagen; ID-Validierung garantiert keine semantische Wahrheit. Bestehende Upload-, Output-, Timeout- und Abbruchgrenzen bleiben erhalten. Zwölf Provideraufrufe pro Besucher und Stunde werden atomar in PostgreSQL gezählt. Neue Cookies können dieses einfache Limit umgehen; es ist **keine garantierte Kostenobergrenze**. Kleines Provider-Guthaben ist ein bewusstes Restrisiko. Providerlimits und deaktivierte automatische Aufladung vor öffentlicher Demo separat prüfen; die Anwendung ändert keine Zahlungseinstellungen.

## Tests ohne Providerkosten

- pnpm test: Unit-Tests; reale DB-Tests ohne explizites Opt-in übersprungen.
- pnpm test:visitor: vollständiger reproduzierbarer Prüflauf. Eigene temporäre Docker-Netzwerk-/Containerinstanzen; PostgreSQL/pgvector und Storage-Daten nur im RAM; alle Migrationen, Bestandserhalt, echte RLS-/Storage-Isolation, Unit/Typecheck/Build und Playwright Desktop/Mobile. Danach ausschließlich eigene Testcontainer entfernen. Benötigt Docker, Browserinstallation und freie lokale Ports 4385/4386/56821/56823/56824; keine bestehende Datenbank oder Secrets werden übernommen. Gepinnte Container-Tags werden bei Bedarf heruntergeladen.
- pnpm test:e2e: für eine explizit bereitgestellte isolierte Datenbank; Testserver und lokaler Provider-Mock werden gestartet. Keine externen Modellaufrufe.
- pnpm test:storage: separater realer Datei-/Chunk-Import-/Löschtest auf derselben isolierten Testkonfiguration.
- pnpm test:integration:openai: **kostenpflichtiger**, separat zu autorisierender Opt-in-Smoke. Keine Ausführung als Teil normaler Tests.

Browsernachweise: leerer Einstieg → Datei/Text/PDF → Chatstream → Originalbeleg → Reload; zweiter Browser, fremde IDs, Schreib-/Löschversuche, Cookie-Verlust/-Manipulation, private Downloads, Providerfehler/Retry, Quellenauswahl und mobile Darstellung. Synthetische Inhalte existieren ausschließlich als Testfixtures.

## Abgabe

Repository, funktionsfähige Live-Demo und Loom-Video bis zehn Minuten. Staging benötigt separat bereitgestellte Backend-Konfiguration und die geprüften neuen Migrationen. Kein Production-Deployment ohne ausdrückliche Freigabe.

### Grenzen der Sitzungsnachweise

Gleichzeitige Erstbesuche werden in den Chromium-Desktop-/Mobile-Tests mit Web Locks geprüft. Ohne Web-Locks-Unterstützung ist der Erstbesuch tabübergreifend nicht atomar; eine allgemeine race-freie Garantie wird nicht gegeben. Der Notebook-Bootstrap selbst ist pro bestehender Besucherkennung datenbankseitig serialisiert.

HTTPS/Secure ist per Unit-Test über den weitergegebenen HTTPS-Header geprüft. Zusätzlich wurde die bestehende Preview am 2026-11-04 über echtes HTTPS im Browser geprüft: Secure/HttpOnly/SameSite-Cookie, leerer Einstieg, eigener Upload, echte quellengebundene Antwort, Originalbeleg, Download, Reload und getrennte zweite Sitzung. Normale lokale Browsertests bleiben providerkostenfrei und verwenden HTTP.

Es gibt keinen automatischen Session-Cleanup. Der FK von visitor_provider_limits auf visitor_sessions hat kein ON DELETE CASCADE: Eine spätere administrative Bereinigung muss zunächst die zugehörigen Rate-Zeilen entfernen und bestehende Dateien/Notebooks gezielt berücksichtigen. Cookie-Ablauf löscht keine Bestandsdaten.

### PDF-Prüfumfang und Fehlergrenzen

Der frühere TXT-Deployment-Smoke belegte keine funktionierende PDF-Verarbeitung. Der PDF.js-Worker muss ausdrücklich importiert werden, damit er im serverlosen Build enthalten ist; ein Parser-/Worker-Ausfall wird als Serverfehler (503), nicht als beschädigte Datei gemeldet. Defekte und passwortgeschützte PDFs sowie PDFs ohne extrahierbaren Text haben getrennte Meldungen. OCR bleibt nicht unterstützt.

Zusätzlich zu kleinen deterministischen PDF-Fixtures können über REAL_PDF_FIXTURES zwei unabhängig erstellte Dokumente geprüft werden: bitcoin.pdf (9 Seiten, OpenOffice; bitcoin.org/bitcoin.pdf) und tracemonkey.pdf (14 Seiten, TeX; Mozilla PDF.js compressed.tracemonkey-pldi-09.pdf). Diese Dokumente liegen außerhalb des Repositorys. Das ist gezielte Format-/Deployment-Abdeckung, keine Garantie für sämtliche PDFs. Erfolgreich importierte Quellen werden automatisch ausgewählt; ohne ausgewählte Quellen erklärt die Oberfläche, warum kein Chat gesendet wird.

### Quellen-zuerst und Willkommen

Der Chat ist erst mit mindestens einer ausgewählten, fertig verarbeiteten Quelle bedienbar (Eingabe, Senden und Enter). Nach Import wird die fertige Quelle ausgewählt; Abwahl oder Löschen sperrt wieder. Initialisierung, Uploadverarbeitung und fehlende Auswahl sind getrennte Zustände.

Ein zugänglicher Willkommensdialog erscheint nach erfolgreichem Bootstrap beim ersten Besuch. Erst Schließen/Escape/CTA setzt den versionierten lokalen Browsermarker `lumen.welcome.v1`. Weitere Tabs übernehmen das Schließen über das Storage-Ereignis. Ohne verfügbaren Browserstorage bleibt die App benutzbar; nach einem Reload kann das Willkommen erneut erscheinen. Der Marker ist keine Anmeldung und ersetzt nicht das HttpOnly-Sitzungscookie. Backendfehler werden ohne vorgeschaltetes Modal mit Retry angezeigt.

### Quellenvergleich

Die Vektorsuche materialisiert ausschließlich autorisierte ausgewählte fertige Quellen vor exakter Distanzberechnung. Besucher- und historische Auth-Scopes bleiben erhalten. Quellenweise Rangfolge und faire Kontextbudgets verhindern Verdrängung (maximal zwölf Abschnitte/12.000 Zeichen). Leere Auswahl ruft keinen Provider auf; ungültige Quellen bleiben sources_unavailable. Migration 20261105090000 und App gemeinsam ausrollen.
