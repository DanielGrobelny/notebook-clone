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

Streaming über AI SDK/OpenAI Responses, nur ausgewählte eigene Quellen, maximal zwölf Abschnitte bzw. 12.000 Kontextzeichen. Belege verweisen auf gespeicherte Originalpassagen; ID-Validierung garantiert keine semantische Wahrheit. Upload-, Timeout- und Abbruchgrenzen bleiben erhalten; das gedeckelte Chat-Outputbudget beträgt 4096 Tokens. Zwölf Provideraufrufe pro Besucher und Stunde werden atomar in PostgreSQL gezählt. Neue Cookies können dieses einfache Limit umgehen; es ist **keine garantierte Kostenobergrenze**. Kleines Provider-Guthaben ist ein bewusstes Restrisiko. Providerlimits und deaktivierte automatische Aufladung vor öffentlicher Demo separat prüfen; die Anwendung ändert keine Zahlungseinstellungen.

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

### Vollständigkeit von Chatantworten

Das Chat-Outputbudget steigt von 800 auf 4096 Tokens (maximal 5,12-faches Outputvolumen pro Generierung; keine Aussage über unveränderte Kosten). Der initiale 800-Token-Demowert ließ bei deutschen Vergleichen und UUID-Zitaten zu wenig Raum. Die Versionshistorie dokumentiert keine numerische Nutzerbindung an 800. Die Systemanweisung zielt auf 250–450, maximal 550 Wörter mit abgeschlossenem Fazit; der Rest ist Reserve für Zitate und modellabhängige Reasoning-Tokens, keine Garantie. Der Abbruch bei 30 Sekunden, maxRetries=0 und die atomaren Besucherlimits bleiben unverändert. Keine automatischen Fortsetzungsaufrufe. Nur ein reguläres Modellende (stop) gilt als vollständig. Tokenlimit, Filter, Streamfehler und Abbruch behalten den erhaltenen Teiltext mit einem dauerhaften Unvollständigkeitshinweis; eine vorsorglich gespeicherte Unterbrechungsmeldung verhindert auch bei Prozessverlust einen scheinbaren Erfolg. Ein vollständiger Teiltext kann bei abruptem Prozessverlust nicht garantiert werden. Die Oberfläche bietet die vorige Frage zur gezielteren erneuten Eingabe an, ohne automatisch weitere kostenpflichtige Aufrufe auszulösen. Historische abgeschnittene Antworten werden nicht automatisch repariert; ihre unbekannten Abschlussgründe werden nicht erraten.

Chattext unterstützt sichere Überschriften, Fettdruck, Listenzeilen und erhaltene Zeilenumbrüche. Validierte Inline-Belege öffnen die Originalpassage; unbestätigte IDs erscheinen ausdrücklich als unbestätigt statt zu verschwinden. HTML wird nicht ausgeführt. Andere Markdown-Syntax bleibt Text. Abschlussgründe werden ohne Inhalte im Usage-Ereignis protokolliert. Neue Tests verwenden synthetische CV-/Stelleninhalte und den lokalen Provider-Mock, nicht OpenAI.

### Separater Budget-Realtest (explizites Opt-in)

`scripts/eval-answer-budget.mjs` vergleicht maximal zwei synthetische CV-/Stellenantworten (alter Prompt/800 gegen Produktionsprompt/4096), ohne Embeddings, Datenbankzugriff oder Produktionsdaten. Aufruf nur mit `RUN_ANSWER_BUDGET_EVAL=1`, explizitem `OPENAI_API_KEY_FILE` und `ANSWER_BUDGET_EVAL_OUTPUT`; kein automatischer Retry, 30 Sekunden pro Generierung und `store:false`. Abschlussgrund, Usage einschließlich modellabhängiger Reasoning-Nutzung und vollständiger synthetischer Text werden für die manuelle Prüfung gespeichert. Ein reguläres Ende allein beweist keine inhaltliche Vollständigkeit.

Realtest vom 2026-11-05: Genau zwei synthetische Generierungen mit vorhandenem explizitem lokalem Provider-Key, App-Modell und OpenAI-Responses-Standardendpunkt. 800/alter Prompt: finishReason=length, 800 Outputtokens (143 Reasoning), Abbruch mitten im Beleg, kein Fazit. 4096/aktueller Prompt: finishReason=stop, tatsächlich 1270 Outputtokens (225 Reasoning), 3808 Zeichen und abgeschlossenes Fazit nach Muss-/Wunschkriterien, Stärken und Interviewfragen. Manuell geprüft: fehlende Nachweise werden von tatsächlichen Defiziten unterschieden; Mentoring wird nicht mit Teamleitung gleichgesetzt. Einzelne zusammenfassende Aussagen sind nicht unmittelbar vollständig belegt; kein umfassender Zitationsqualitätsnachweis. Prompt und Budget variieren gemeinsam: kein isolierter kausaler Budgetvergleich oder allgemeine Vollständigkeitsgarantie. Rohbeleg: evals/answer-budget/2026-11-05.json.

Ursache der früheren 401: Die Vercel-Env-Exporte enthalten nur [SENSITIVE]-Platzhalter; auch ein aktueller readonly Production-Pull bestätigt dies. Kein Nachweis eines ungültigen echten Production-Keys. Der verborgene Production-Key lässt sich nicht mit dem lokalen Key vergleichen; keine Production-App-Aufrufe oder Änderungen. Der Runner verweigert Platzhalter vor Requests, parst einfache/doppelte Env-Anführungszeichen und Raw-Keydateien, akzeptiert alternativ OPENAI_API_KEY direkt, berücksichtigt OPENAI_BASE_URL und verwendet die tatsächliche App-Konfiguration statt eigener Modell-Defaults. Benötigt Node mit node:util.parseEnv und node:module.stripTypeScriptTypes (geprüft: Node 24).

### Folgefragen und SDK-Vertrag

Der Browser sendet nur die aktuelle Nutzerfrage (höchstens 4000 Zeichen), nicht den UI-Verlauf mit Assistant-Metadaten, Reasoning-/Step-Parts oder langen Antworten. Bereits geöffnete ältere Clients dürfen weiterhin begrenzte User-/Assistant-Verläufe senden; der Server verwirft deren Historie und validiert ausschließlich die abschließende Text-Nutzerfrage. System-/Toolrollen, ungültige Parts, leere oder zu lange Fragen werden abgewiesen. Modellkontext kommt unverändert ausschließlich aus dem besitzgeprüften gespeicherten Verlauf und der aktuellen Quellenauswahl. Mehrturn-Regressionen prüfen zweite/dritte Fragen nach Antworten über 4000 Zeichen und eine weitere Frage nach Reload; beim Reload müssen Quellen erneut ausgewählt werden.

### Viewport-Arbeitsbereich

Der Chat nutzt die verbleibende dynamische Viewporthöhe unter der globalen Navigation. Verlauf und Desktop-Seitenleisten scrollen unabhängig; die mehrzeilige Eingabe samt Quellenstatus bleibt als eigene Layoutzeile sichtbar (kein Overlay). Enter sendet, Shift+Enter erzeugt eine neue Zeile. Lange Eingaben scrollen intern. Auf kleinen Displays bleiben Quellen und Ergebnisse über die vorhandenen Drawer erreichbar. Die Viewport-Metadaten bitten unterstützende Browser beim Öffnen der Bildschirmtastatur um eine Inhaltsgrößenänderung; Zoom wird nicht eingeschränkt.

Geladene Verläufe starten am Ende ohne Fokuswechsel. Weitere Streamteile folgen nur, solange der Verlauf höchstens 80 Pixel vom Ende entfernt ist; ansonsten bleibt die Leseposition erhalten und „Neueste Nachricht“ führt zurück. Ein geöffnetes Belegfenster pausiert das automatische Folgen. Browserregressionen prüfen leere/lange Verläufe, Reload, schmale und niedrige Viewports, mehrzeilige Eingabe und verzögertes Streaming. Mobile-Automation ist Chromium-Emulation, keine Zusicherung für reale iOS-Tastaturen.

### Notebook-Navigation

Der Chatheader zeigt den aktiven Notebooknamen auch mobil und aktualisiert ihn nach Wechsel und Umbenennung. Lange Namen sind auf zwei Zeilen begrenzt, bleiben aber vollständig als zugänglicher Name bzw. Titel erhalten. Das mobile Notebookmenü orientiert sich an der Viewportbreite; Auswahl und Aktionen haben getrennte Zeilen. Die aktive Auswahl ist markiert. Escape schließt mit Fokusrückgabe, Auswahl schließt das Menü, ein Klick außerhalb schließt ohne Fokusentzug vom angeklickten Ziel. Umbenennen erhält die aktive Notebookauswahl; beim Löschen des aktiven Notebooks wird ein verbleibendes ausgewählt.
