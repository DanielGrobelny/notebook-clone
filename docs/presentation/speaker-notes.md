# Recording Guide – Lumen in neun Minuten

[Deck](../../public/presentation/index.html) · [Reviewer](reviewer-guide.md) · [21 Prüfthemen](acceptance-matrix.md) · [Live-App](https://notebook-clone-preview-pqdwehnkq-daniel-grobelnys-projects.vercel.app)

## Prüfstand und Previewzugang

Preview 1124615: 112 Unit-/DB-Tests, 74 E2E, 2 Storage; 2 optionale PDF-Fixtures übersprungen. 63 verbleibende any-Stellen, 0 bekannte Dependency-Befunde; negativer Client-Build gegen Server-only-Import bestanden. Echter TXT-Upload (4,09 s), Chat, Zitate und History bestanden. Kein Live-PDF-, Last- oder Performancegewinn-Nachweis. Übernommener Refactor-Prüfbericht; dieses Dokumentationspaket startet keine Provider-/DB-Tests.

Demo ist Preview 1124615, nicht Production. Vercel-Login/Projektberechtigung vor der Aufnahme prüfen; der App-Besucherzugang selbst hat kein Konto.

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
