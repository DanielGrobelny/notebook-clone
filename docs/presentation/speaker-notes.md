# Recording Guide – Lumen in neun Minuten

[Deck](../../public/presentation/index.html) · [Reviewer](reviewer-guide.md) · [21 Prüfthemen](acceptance-matrix.md) · [Live-App](https://notebook-clone-preview-pqdwehnkq-daniel-grobelnys-projects.vercel.app)

## Prüfstand und Previewzugang

Preview 1124615: 112 Unit-/DB-Tests, 74 E2E, 2 Storage; 2 optionale PDF-Fixtures übersprungen. 63 verbleibende any-Stellen, 0 bekannte Dependency-Befunde; negativer Client-Build gegen Server-only-Import bestanden. Echter TXT-Upload (4,09 s), Chat, Zitate und History bestanden. Kein Live-PDF-, Last- oder Performancegewinn-Nachweis. Übernommener Refactor-Prüfbericht; dieses Dokumentationspaket startet keine Provider-/DB-Tests.

Demo ist Preview 1124615 (pqdwehnkq), nicht Production 257f24f. Vercel-Login/Projektberechtigung vor der Aufnahme prüfen; der App-Besucherzugang selbst hat kein Konto.

## Vor der Aufnahme: einmal wirklich durchspielen

UI-/Codebezug: Preview 11246153df8c9740ae79dce28927d5284e2bba4d (06.11.2026). Die Codebeispiele bleiben auf diesen Stand festgelegt; vor der Aufnahme mit der dann aktuellen App abgleichen. Dieses Paket ändert die App nicht. Umfang aus PROJECT.md: PDF/Text, Quellenwahl, belegter Chat, Persistenz. OCR, Audio, URLimport, Sync und Accounts sind außerhalb des MVP. Fixtures werden manuell importiert, nicht automatisch geseedet.

- Browser mindestens 1280×720, 100 % Zoom. Benachrichtigungen aus, keine privaten Tabs oder Dokumente sichtbar. Nur Aufnahmefenster teilen.
- Tabs: 1 Deck, 2 Live-App, 3 vorbereitetes Notebook, 4 Zitier-ID-Code, 5 RLS-Code, 6 Mehrturn-Test. Code-Links unten vorab öffnen; privaten GitHubzugriff prüfen.
- Pfeile/Space navigieren, Escape Übersicht, S Speaker Notes (Popup zulassen). Guide auf zweitem Bildschirm. Reveal braucht Internet/jsDelivr. HTML-Guide, Reviewer und Matrix funktionieren lokal ohne JavaScript/CDN; externe Links brauchen Netz.
- Dateien: [mission.pdf](../../public/presentation/fixtures/mission.pdf), [mission.txt](../../public/presentation/fixtures/mission.txt), [update.txt](../../public/presentation/fixtures/update.txt). mission.pdf ist ein einseitiges Text-PDF; mission.txt derselbe Inhalt als Alternative. Nicht beide Briefingvarianten gleichzeitig importieren.
- Nur eigene autorisierte Vorführsitzung und synthetische Daten. Echte Imports/Antworten benötigen Providerbudget. Vorbereitung und Aufnahme können 12 Claims/Stunde erreichen (Chat zwei Claims, Import zusätzlich). Genügend Abstand planen; niemals Limits durch neue Cookies umgehen.
- App: „Notebooks wechseln“ → „+ Notebook“ → „AURORA – vorbereitet“. mission.pdf und update.txt per Datei-Upload hinzufügen. Auf „Bereit“ warten, beide Quellen auswählen. Die drei Fragen unten wirklich stellen, Antworten und Belege mit den Dateien abgleichen. Keine Antworttexte injizieren, keine Mockroute verwenden.
- Vorbereitetes Notebook im gleichen Browserprofil in Tab 3 öffnen. Cookie behalten; nach Reload Quellen erneut auswählen. Gespeicherten Verlauf und Belegöffnung prüfen. Dies ist ein vorbereiteter echter Lauf, keine garantierte Musterantwort.
- Tab 2: weiteres Notebook „AURORA – Aufnahme“ anlegen, leer lassen. Alternativ Imports vorab vorbereiten und dies ausdrücklich sagen. Kein automatischer Production-Seed. Fehlt Providerfreigabe, keine erfolgreiche Live-Modellvorführung behaupten.
- Mikrofon, Loom-Fenster, sichtbare Maus und Lesbarkeit testen. 9:00 Inhalt + 1:00 Reserve. Reviewerfreigabe und Loom-Link vor Abgabe separat prüfen.

## 0:00–0:45 · Folie 1 · Aufgabe

Klick: Deck, Folie 1. Den Weg von den Dokumenten zur Antwort zeigen.

Sprechvorschlag: „Lumen macht aus eigenen Dokumenten einen Dialog, bei dem ich die Antwort am Original nachprüfen kann. Ich zeige den Weg vom PDF zur Frage und zum Beleg. Im MVP bleiben Quellen und Gespräch erhalten. OCR, Audio und ein Accountsystem sind bewusst nicht Teil dieser Version. Das zeige ich jetzt in der Anwendung.“

## 0:45–3:45 · Folie 2 → Tab 2 · echte Demo

0:45–1:15: Folie 2 kurz zeigen, zur Live-App wechseln. Im Notebook „AURORA – Aufnahme“ mission.pdf per Datei-Upload wählen. „Das ist ein synthetisches Projektbriefing für einen Kundenservice-Piloten, keine Kundendatei.“ Dann update.txt importieren. Alternativ exakt den Dateiinhalt per Texteingabe als Quelle speichern, nicht als Chatfrage. Beide Quellen müssen „Bereit“ und ausgewählt sein.

1:15–2:10: Feld „Frage an deine Quellen“ → Frage 1 → „Frage senden“. Während Stream nicht hektisch klicken. Zitat der Antwort öffnen und Originalpassage/Dateiname zeigen.

Frage 1: „Welcher Pilotstart gilt nach der Änderungsnotiz, und welches Budget bleibt bestehen?“

Erwartungsprüfung, kein vorgegebener Antworttext: 23. November 2026 und 18.000 Euro. update.txt Abschnitt 1/2. Ursprünglicher 16. November: mission.pdf Seite 1, Abschnitt 2. Textquelle hat keine garantierte PDF-Seitennummer.

Sprechvorschlag: „Ich möchte nicht nur eine plausible Zahl. Ich öffne den Beleg und prüfe, ob Termin und Budget wirklich in der Änderungsnotiz stehen.“ Nur behaupten, was sichtbar ist.

2:10–2:45: Beleg schließen. Rückfrage im selben Gespräch: „Wer verantwortet das?“ Erwartung: Mira Sommer, update.txt Abschnitt 2 oder mission.pdf Seite 1 Abschnitt 3. „Die Rückfrage nutzt den Gesprächskontext; die Aussage braucht trotzdem einen aktuellen Beleg.“

2:45–3:45: update.txt per Quellenbutton abwählen, mission.pdf ausgewählt lassen. Frage 3: „Welcher ursprüngliche Pilotstart steht im ausgewählten Projektbriefing? Antworte nur aus dieser Quelle.“ Erwartung: 16. November 2026, mission.pdf Seite 1 Abschnitt 2. „Jetzt verändere ich bewusst den Quellenraum. Nur das ursprüngliche Briefing ist ausgewählt. Der Verlauf darf die aktuelle Quelle nicht ersetzen.“ Antwort und Dateiname im Beleg prüfen, nicht automatisch Erfolg behaupten.

Optional nur bei Reserve: „Ist eine Jahresfinanzierung beschlossen?“ Beide Dokumente verneinen dies; Pilotbudget nicht hochrechnen. Keine vierte Frage nötig.

### Ehrlicher Timeout- und Fehlerfallback

Import nach etwa 20 Sekunden oder Chat nach 30-Sekunden-Timeout nicht mehrfach neu senden. Sagen: „Der aktuelle Lauf wartet beziehungsweise ist fehlgeschlagen. Ich wechsle zu einem vorher vorbereiteten echten Lauf, damit ich den Ablauf und den Originalbeleg zeigen kann.“ Tab 3: gespeicherte Antwort und Beleg öffnen, ausdrücklich als vorher erzeugt benennen. Bei falschem Inhalt: „Diese Antwort deckt die Quelle nicht korrekt ab. Genau deshalb bleibt der Originalbeleg wichtig.“ Kein Standbild als live, kein verdeckter Schnitt zur fingierten Antwort. Gibt es keinen geprüften echten Lauf, nur Dokumente/UI zeigen und fehlenden Live-Nachweis nennen. Reserve nicht mit neuen Provideranfragen verbrauchen.

## 3:45–5:15 · Tab 1, Folie 3 · Architektur

Sprechvorschlag: „Wir folgen demselben Weg technisch. PDF und Text werden extrahiert und in kleine Abschnitte zerlegt; die Seitenherkunft bleibt erhalten. Embeddings helfen, passende Abschnitte zu finden. Zuerst gelten Besitz und Quellenauswahl, erst danach die Suche. Das Modell bekommt begrenzten Kontext, die Oberfläche den Stream und den Originalbeleg. Der Browser spricht nur mit der Next.js-API. Postgres mit pgvector hält die Daten, ein privater Speicher die Dateien. Die API ruft den Modellprovider auf. Zugriffskontrolle entscheidet nicht das Modell. Das hält die Architektur für den MVP überschaubar; begrenztes Retrieval kann aber relevante Details übersehen.“

## 5:15–6:15 · Folie 4 → Tab 4 · Entscheidung 1

Klick: [Zitier-ID-Prüfung](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/lib/retrieval.ts#L97-L103), Zeilen 97–103. Optional [Scoped Retrieval](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/supabase/migrations/20261105090000_exact_scoped_retrieval.sql#L9-L26), Zeilen 9–26. Codezoom bei Bedarf erhöhen; nicht durch Imports scrollen.

Sprechvorschlag: „Das erste Problem ist eine plausible, aber unbelegte Antwort. Deshalb begrenze ich die Antwort auf den gewählten Quellenraum und verknüpfe sie mit Originalpassagen. Hier werden nur Beleg-IDs akzeptiert, die tatsächlich aus dem aktuellen Retrieval stammen. In der Suche werden Notebook, Besitzer und ausgewählte bereite Quellen zuerst eingeschränkt. Die Suche wählt passende Abschnitte aus, statt jedes Mal alle Dokumente zu senden. Dabei kann sie Details übersehen. Eine erlaubte ID beweist noch nicht, dass der Satz inhaltlich richtig ist.“

## 6:15–7:15 · Folie 5 → Tab 5 · Entscheidung 2

Klick: [RLS- und Storage-Policies](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/supabase/migrations/20261104163000_visitor_rls.sql#L13-L20), Zeilen 13–20. Bei Bedarf [Datenclient](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/lib/supabase/server.ts#L4-L15), Zeilen 4–15.

Sprechvorschlag: „Das zweite Problem ist ein einfacher Einstieg ohne gemeinsamen Datenraum. Der Nutzer braucht keinen Account, bekommt aber einen getrennten Arbeitsbereich. Ein zufälliges HttpOnly-Cookie wird serverseitig zugeordnet. Die Datenbank bekommt einen unprivilegierten Client mit Besuchertoken und prüft den Besitz über RLS erneut. Hier sieht man die Notebookregel und darunter die Regel für private Dateien. Die Grenze ist klar: Wenn das Cookie verloren geht, gibt es keine Wiederherstellung und keinen geräteübergreifenden Sync.“

## 7:15–8:15 · Folie 6 → Tab 6 · KI-Workflow & Prüfung

Klick: [Request-Fix](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/app/api/chat/route.ts#L55-L82), Zeilen 55–82; [Regressionstest](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/tests/e2e/followup-chat.spec.ts#L13-L49), Zeilen 13–49. Historie: [PR 24](https://github.com/DanielGrobelny/notebook-clone/pull/24), [PR 25](https://github.com/DanielGrobelny/notebook-clone/pull/25), [PR 26](https://github.com/DanielGrobelny/notebook-clone/pull/26).

Sprechvorschlag: „An einem konkreten Fehler lässt sich der Qualitätsanspruch zeigen. Bei einer Rückfrage enthielt die SDK-History Assistant-Metadaten; die strikte Anfrageprüfung antwortete mit 400. Die Korrektur verarbeitet nur die neue Nutzerfrage und lädt den zugehörigen Verlauf vom Server. Dieser Test sendet mehrere Fragen, lädt die Seite neu und prüft das Anfrageformat. KI-Unterstützung kann Code und Tests vorschlagen; Review muss den tatsächlichen Vertrag und die Fehlerfälle prüfen. Die PRs zeigen solche Korrekturschleifen, nicht eine perfekte Erstimplementierung. Der Test verwendet einen Mock: Er belegt Technik, nicht Modellqualität. Eine systematische Prüfung der aktuellen Antworten und Belege steht noch aus.“

Bei Eval-Rückfrage: Historischer v1-Lauf hatte 5/6 Fehlschläge. v2 war unvollständig und nicht vollständig manuell bewertet. Das ist kein gemessener Fehleranteil der heutigen App. Details im Reviewer Guide. Keine neuen Suite-/Providerläufe durch dieses Paket behaupten. Persönliche Erfahrungen nur ergänzen, wenn sie wirklich stattgefunden haben.

## 8:15–9:00 · Folie 7 · Fazit

Sprechvorschlag: „Der Nutzen ist der kurze Weg vom eigenen Dokument zur überprüfbaren Antwort. Import, Dialog und Originalbeleg bilden den Kern. Die relevante Grenze bleibt die semantische Richtigkeit: Eine technisch gültige Referenz reicht nicht. Als nächsten Schritt würde ich die aktuelle Version mit festen Fragen und manueller Belegbewertung evaluieren. Produkt und Repository sind hier verlinkt; die detaillierten 21 Prüfthemen liegen separat für das Review bereit.“

## 9:00–10:00 · Reserve, kein zusätzlicher Inhalt

Für Ladezeit und Tabwechsel. Bei 9:45 abschließen. Loom-Link nach Aufnahme ergänzen; keine Mail automatisch senden. Weitere offene Punkte (WebKit/A11y, Betrieb/Spendlimit, Importresilienz, unabhängiges Setup) bleiben in Reviewer und Matrix erhalten.


## Code-Lernnotizen · sechs Deckanker vollständig erklärt

Identisch in den S-Speaker-Notes. Nur zwei kurze Sprechtexte je Folie (zusammen etwa 50 Sekunden) sprechen, nicht zusätzlich den bisherigen Sprechvorschlag. Deep-Dive ist Vorbereitung. Neun Minuten plus Reserve; 21 Audit-Themen bleiben separat.

### Folie 4 · Zitier-IDs gegen Kontextpassagen prüfen

[lib/retrieval.ts · L97-L103](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/lib/retrieval.ts#L97-L103)

**Sprechtext · 20–30 Sekunden:** Die Antwort darf nur IDs nennen, die wir ihr wirklich mitgegeben haben. permitted sammelt diese IDs. Der Filter entfernt fremde IDs und andere Datentypen; ein zweites Set entfernt Wiederholungen. Zurück bleiben prüfbare Referenzen. Das verhindert fremde Verweise, beweist aber nicht, dass der Satz zur Passage passt.

**Code-Deep-Dive · Lernnotiz, nicht vorlesen**

Nutzerablauf/Vertrag: Nach der Antwort prüft validateCitationIds(ids, passages) die extrahierten IDs. Eingaben: ids: unknown und RetrievedPassage[]. Ausgabe: eindeutige erlaubte Strings.

Z. 97–98: Ist ids kein Array, folgt sofort return []. Das ist eine Laufzeitprüfung, keine bloße TypeScript-Annahme.

Z. 99: passages.map((p) => p.id) liest IDs tatsächlich gelieferter Passagen. new Set bildet permitted. Genau diesen Schritt zeigt der markierte Folienausschnitt; allein filtert er noch nichts.

Z. 100–103: ids.filter akzeptiert nur typeof id === string UND permitted.has(id). id is string präzisiert den Typ. Das äußere Set entfernt doppelte IDs, der Spread liefert ein Array zurück.

Warum/Grenze: Deterministische Referenzprüfung statt Modellvertrauen. Keine semantische Wahrheit, Vollständigkeit oder richtige Verwendung einer erlaubten Passage. Besitzprüfung erfolgt vorher; dies ersetzt weder RLS noch Schutz vor manipulativen Dokumentinhalten.

### Folie 4 · Eigene ausgewählte Quellen vor dem Ranking filtern

[supabase/migrations/20261105090000_exact_scoped_retrieval.sql · L9-L26](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/supabase/migrations/20261105090000_exact_scoped_retrieval.sql#L9-L26)

**Sprechtext · 20–30 Sekunden:** scoped verbindet Abschnitte mit Quelle und Notebook und filtert Besitzer, Auswahl und Bereitstatus. Erst daraus berechnet ranked Vektorabstände. Die Ausgabe wechselt nach Quellenrang, damit ein langes Dokument das andere nicht verdrängt. Höchstens zwölf Passagen kommen zurück. Die Suche findet ähnliche Bedeutung, garantiert aber weder Wahrheit noch vollständige Details.

**Code-Deep-Dive · Lernnotiz, nicht vorlesen**

Nutzerablauf: Ein Embedding übersetzt die Frage in einen Zahlenvektor für näherungsweise Bedeutungsvergleiche. db.rpc(match_source_chunks, …) ruft diese Datenbankfunktion auf; RPC ist hier ein benannter Funktionsaufruf, kein KI-Agent.

Eingaben im Kopf: p_notebook_id, p_user_id, p_source_ids, p_query_embedding (1536 Dimensionen), p_match_count. Ausgabe: id, source_id, content, page, section, similarity. security invoker bedeutet Rechte des Aufrufers, keine automatische RLS-Umgehung.

Z. 9–13: scoped AS MATERIALIZED erzeugt eine feste Zwischentabelle. c sind source_chunks, s sources, n notebooks. Joins ordnen Abschnitte dem Notebook zu.

Z. 14–16: n.id = p_notebook_id; Besucher-ID muss sowohl zum Notebook als auch current_visitor_id() passen. Der historische Accountzweig vergleicht owner_id mit auth.uid(). Dazu ready, c.source_id = any(p_source_ids), vorhandenes embedding und nichtleerer Text. Eine behauptete Besitzer-ID reicht nicht.

Z. 17–21: embedding <=> p_query_embedding ist Kosinusdistanz. row_number partitioniert nach source_id und sortiert je Quelle nach Abstand und id. Materialisierung verhindert, dass ungefilterte approximative Indexsuche die kleine erlaubte Teilmenge verdrängt.

Z. 22–26: page/section kommen aus metadata, similarity ist 1 - distance. ORDER BY source_rank, distance, source_id, id liefert erst den besten Treffer je Quelle. LIMIT greatest(1, least(p_match_count, 12)) begrenzt auf 1 bis 12, selbst bei Eingabe 0.

Warum: Quellenvergleich statt Dominanz eines langen Dokuments. Danach verteilt buildGroundedContext maximal 12.000 Zeichen fair auf Quellen. Kein gemessener Performancegewinn; exakte Suche kann teurer sein.

Fehlergrenze im Aufrufer: scopedSimilaritySearch prüft vollständige Quellenliste und ready, erzeugt das Frage-Embedding und reicht AbortSignal weiter. Abbruch wird vor/nach RPC geprüft; RPC-Fehler werden geworfen, sonst return data ?? []. Kein garantierter sofortiger DB-Stopp. Ähnlichkeit ist keine Wahrheit; keine Mindestschwelle oder vollständige Detailabdeckung.

### Folie 5 · Besuchertoken an unprivilegierten Datenclient binden

[lib/supabase/server.ts · L4-L15](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/lib/supabase/server.ts#L4-L15)

**Sprechtext · 20–30 Sekunden:** createClient lädt die Besuchersitzung. Der Datenclient verwendet den öffentlichen anon-Key, nicht den privilegierten Service-Key. Das geheime Besuchertoken geht serverseitig im Header mit; die Datenbank prüft es erneut. visitor.id hilft bei Anwendungsfiltern, verleiht aber selbst keine Berechtigung. Ein gestohlenes gültiges Cookie bleibt ein Risiko.

**Code-Deep-Dive · Lernnotiz, nicht vorlesen**

Nutzerablauf/Vertrag: Eine App-API braucht eigene Quellen. createClient() hat keine Parameter und liefert einen Supabase-Client mit visitor.id. Der Browser spricht nur mit App-APIs.

Z. 4–5: getVisitorSession() lädt/erstellt id und token. Ein getrennter Adminclient im Helfer löst ausschließlich gehashte Sitzungen auf bzw. legt sie an; außerhalb der Markierung.

Z. 6–9: supabase(URL, ANON_KEY, Optionen) nutzt die öffentliche unprivilegierte Rolle. anon-Key ist weder individueller Besitznachweis noch geheimer Service-Role-Key.

Z. 10: persistSession: false und autoRefreshToken: false verhindern Supabase-Auth-Persistenz/Refresh dieses Clients, nicht das eigene Besucher-Cookie.

Z. 11–13: global.headers sendet x-visitor-token: session.token. current_visitor_id() prüft dessen SHA-256-Hash und Ablauf erneut. Das rohe Token ist geheim, nicht loggen.

Z. 14–15: Object.assign(db, { visitor: { id: session.id } }) ergänzt Metadaten und gibt db zurück. Diese JavaScript-Eigenschaft umgeht keine Policy.

Warum/Sicherheitsgrenze: Daten/Storage bleiben RLS-pflichtig. Der separate Service-Role-Adminclient kann RLS umgehen, darf keine normalen Notebookabfragen übernehmen und nie in den Browser gelangen. App-Filter begrenzen Auswahl; DB-Policies erzwingen Besitz zusätzlich.

Nicht garantiert: HttpOnly verhindert JavaScript-Lesen, nicht jede missbräuchliche Anfrage bei XSS. Gültiger Tokendiebstahl kann die Sitzung übernehmen. Cookieverlust hat keine Recovery/Sync. Sessionfehler führen nicht in einen gemeinsamen Datenraum.

### Folie 5 · Besitz für Datenzeilen und private Dateien erzwingen

[supabase/migrations/20261104163000_visitor_rls.sql · L13-L20](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/supabase/migrations/20261104163000_visitor_rls.sql#L13-L20)

**Sprechtext · 20–30 Sekunden:** RLS heißt: Die Datenbank entscheidet je Zeile, ob die Besucherrolle sie verwenden darf. USING schützt bestehende Zeilen, WITH CHECK neue oder geänderte Werte. Quellen und Chats hängen am eigenen Notebook; Dateien brauchen zusätzlich richtigen Bucket und Pfad. Das schützt diesen Datenzugriff, nicht vor privilegierten Administratoren.

**Code-Deep-Dive · Lernnotiz, nicht vorlesen**

Nutzerablauf/Vertrag: Daten und Dateien lesen/schreiben/löschen. Eingaben: SQL-Zugriff, Zeilenwerte, Besuchertoken; Ergebnis: erlaubte oder ausgeblendete/abgewiesene Zeilen, keine Modellantwort.

Voraussetzung außerhalb der Markierung: current_visitor_id() vergleicht Tokenhash und expires_at > now(). Dieser eng begrenzte security-definer-Helfer darf die Sitzungstabelle lesen; normale Abfragen werden nicht zu Adminabfragen. Aktivierte RLS aus früheren Migrationen ist Voraussetzung.

Z. 13: visitor_notebooks FOR ALL TO anon: USING verlangt visitor_id = current_visitor_id(); WITH CHECK zusätzlich owner_id IS NULL. Neue/geänderte Zeilen dürfen keinen fremden Besucher oder historischen Account eintragen.

Z. 14–15: visitor_sources prüft das eigene Notebook. visitor_chunks verlangt eine sichtbare Quelle; deren RLS führt die Besitzkette fort, nicht nur Existenz einer beliebigen ID.

Z. 16–18: visitor_chats und visitor_artifacts prüfen Notebookbesitz. visitor_messages verlangt einen sichtbaren Chat. USING schützt bestehende Zeilen, WITH CHECK neue/geänderte Werte.

Z. 19: GRANT gibt anon grundsätzliche SQL-Rechte auf storage.objects; erst Policies begrenzen die erlaubten Zeilen.

Z. 20: visitor_files verlangt bucket_id = source-files, erstes Pfadsegment = current_visitor_id() und zweites Segment = eigenes Notebook. Beide Ausdrücke stehen in USING/WITH CHECK. Privater Bucket und Storage-Konfiguration gehören zur Schutzkette.

Warum/Grenze: Besitz wird in der DB erneut geprüft, nicht durch Modell oder versteckte UI. Service-Role/BYPASSRLS kann normale RLS umgehen. Zusätzliche Policies, Sessiongeheimnis und Endpunkte bleiben prüfpflichtig: kein allgemeiner Sicherheitsfreibrief.

### Folie 6 · Aktuelle Nutzerfrage statt SDK-History validieren

[app/api/chat/route.ts · L55-L82](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/app/api/chat/route.ts#L55-L82)

**Sprechtext · 20–30 Sekunden:** Der Handler liest JSON und antwortet bei kaputtem JSON mit 400. Er übernimmt Notebook und Quellen, aber aus messages nur die aktuelle Nutzerfrage. safeParse prüft den bereinigten Vertrag; Fehler werden wieder 400. So stören Assistant-Metadaten die Rückfrage nicht mehr. Besitzprüfung und gespeicherter Verlauf kommen erst danach.

**Code-Deep-Dive · Lernnotiz, nicht vorlesen**

Nutzerablauf: Die zweite Frage soll auch nach langer Antwort funktionieren. Eingang: Request mit notebookId, sourceIds, messages. Ausgabe hier: JSON-400 bei Fehler oder parsed.data für den weiteren Ablauf, noch kein Stream.

Z. 55–64: POST(request) deklariert body: unknown. request.json() kann scheitern; catch liefert invalid_request und Status 400. TypeScript allein validiert keinen HTTP-Body.

Z. 65–74: chatRequestSchema.safeParse bekommt notebookId, sourceIds und currentUserMessages(input.messages), nicht komplette SDK-History. Der Helfer akzeptiert begrenzte User-/Assistant-Verläufe alter Tabs, verlangt abschließend user und projiziert Parts auf type/text; System-/Toolrollen werden abgewiesen.

Das importierte Schema verlangt UUIDs, 1–8 Quellen und genau einen Textpart je Usernachricht. Getrimmter Text: 1–4000 Zeichen. SDK-Metadaten werden nicht als Modellhistorie vertraut.

Z. 75–82: !parsed.success liefert invalid_request/400; der schließende Aufruf folgt in Z. 83. Bei Erfolg läuft der Handler weiter. Der Ausschnitt prüft noch keinen Besitz.

Warum: SDK-Anzeigeformat und API-Vertrag sind verschieden. savedHistory(db, notebook.id) lädt später besitzgeschützten gespeicherten Verlauf, begrenzt auf acht Nachrichten. Aktuelle Quellenauswahl gilt weiterhin.

Abbruch außerhalb der Markierung: AbortSignal.timeout(chatLimits.timeoutMs) und AbortSignal.any([request.signal, timeout]) verbinden 30 Sekunden mit Clientabbruch. Vorab abgebrochen ergibt 499; Retrieval/Provider bekommen das Signal. Keine Garantie gegen bereits angefallene Kosten oder sofortigen DB-Stopp.

Grenze: Formatvalidierung beweist weder Richtigkeit noch Berechtigung. Notebook/RLS, Retrieval, Quoten und Streamfehler sind eigene spätere Schritte.

### Folie 6 · Vier Fragen über lange Antwort und Reload prüfen

[tests/e2e/followup-chat.spec.ts · L13-L49](https://github.com/DanielGrobelny/notebook-clone/blob/11246153df8c9740ae79dce28927d5284e2bba4d/tests/e2e/followup-chat.spec.ts#L13-L49)

**Sprechtext · 20–30 Sekunden:** Der Test stellt drei Fragen und erwartet HTTP 200 sowie vollständige Mockausgabe. Die erste Antwort ist länger als 4000 Zeichen. Nach Reload wählt er die Quelle erneut und stellt Frage vier. Jede Anfrage soll nur eine Usernachricht mit Textpart enthalten. Das belegt den Transportvertrag, nicht echte Modellqualität.

**Code-Deep-Dive · Lernnotiz, nicht vorlesen**

Aufbau außerhalb der Markierung: setupRealSource erstellt eine synthetische Quelle; page.on(request) sammelt /api/chat-JSON in payloads. Fixture: lokaler Provider-Mock. Eingang: synthetischer CV, vier Fragen, Desktop/Mobile-UI; Ergebnis: Assertions und JSON-Artefakt.

Z. 13–20: for turn = 1 bis 3 füllt das Feld. LONG_CV_RESPONSE in Frage eins ist Mocktrigger für lange Ausgabe. Folgefragen verwenden turn im Text.

Z. 21–28: waitForResponse wird vor dem Klick registriert. Erwartet: HTTP 200, genau turn Antwortblöcke, Endmarker ENDE DER VOLLSTÄNDIGEN ANTWORT und kein Abbruchbutton. Das prüft Test-UI-Abschluss, nicht echten Modell-Finishgrund.

Z. 30–36: Erste Antwort über 4000 Zeichen. Nach reload bleiben drei Antworten. isMobile öffnet den Quellendialog, Desktop verwendet page. e2e-quelle.txt wird erneut ausgewählt, mobiler Dialog geschlossen.

Z. 37–42: Frage vier nach Reload; wieder 200, vier Antwortblöcke und Endmarker. Persistenz und erneutes Fragen sind in dieser Konfiguration geprüft.

Z. 43–47: payload.messages hat Länge 1 und role user. Sortierte Schlüssel des ersten Parts sind genau text und type. Das erkennt mitgesendete Assistant-History/Part-Metadaten, nicht jedes denkbare bösartige Feld.

Z. 48–49: testInfo.attach beginnt actual-sdk-payloads mit JSON.stringify(payloads, null, 2); contentType/Abschluss folgen außerhalb der Markierung. Der tatsächliche Vertrag bleibt nachlesbar.

Warum/Grenze: Regression am konkreten Folgefragenfehler statt nur Erstturn. Kein Live-OpenAI-, Last-, vollständiger Sicherheits- oder semantischer Qualitätsnachweis. Mobile ist Emulation, keine Garantie für jede Handytastatur.
