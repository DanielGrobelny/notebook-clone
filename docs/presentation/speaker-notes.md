# Sprechertext / Ablauf

8:50 Inhalt + 0:30 Puffer = 9:20. Anhang nur Review.

## 0:00 Aufgabe & Scope

Everlast NotebookLM-Klon: Upload → Frage → Originalbeleg. KI erwünscht, Ergebnisse überprüfbar.

Production-Code 257f24f · 06.11.2026. Kein SaaS. Sieben Tage ab 03.11.

## 0:30 Bewusst priorisiert

PDF/Text, Quellenfilter, belegter Chat, Persistenz. Notizen/Briefings als Zusatz.

Nicht Production: Accounts, OCR, Audio, URL/Websuche, Sync. Next/React/TS + Supabase + AI SDK statt unnötiger Frameworks.

## 1:05 Live: Quelle → Antwort → Original

mission.txt importieren. „Wann startet AURORA, mit welchem Budget?“ Zitat öffnen. „Wer verantwortet das?“ „Was ist noch offen?“ Reload und Quelle erneut auswählen.

Nur autorisierte eigene synthetische Vorführsitzung. Drei Antworten kosten sechs Claims plus Import. Keine privaten Daten, kein Fake-Erfolg.

## 3:20 Grenzfall: fehlende Evidenz

„Wie hoch ist die Jahresfinanzierung?“ Die Quelle entscheidet das nicht.

Pilotbudget ist nicht Jahresfinanzierung. Optional update.txt für Versionskonflikt; kein Webwissen-Fallback.

## 3:55 Architektur & Trust Boundaries

Browser → Next.js API → Supabase RLS/pgvector/privater Storage. API → OpenAI.

HttpOnly/Secure/SameSite-Cookie, Hash/30 Tage. Service Role nur Sessiontabelle; Datenclient anon+Token. Autorisierung außerhalb Modell.

## 4:50 Import: Herkunft erhalten

PDF/Text → Extraktion → 1800-Zeichen-Chunks → Embeddings/Persistenz.

5 MiB/100 Seiten/500k Zeichen; kein OCR. SHA256+Uniqueindex. Synchron statt Queue, Prozessverlust/Cleanupfehler und Importtimeout offen.

## 5:35 Retrieval: erst Scope, dann Distanz

Auswahl/Besitz/ready → materialisierte exakte SQL-Suche → quellenfaire Rangfolge → Kontext → Stream/Zitat.

8 Quellen, 12 Chunks, 12000 Zeichen. RAG begrenzt Kosten, kann Details verlieren. ID-Validität nicht semantische Wahrheit; historische IVFFlat-Ursache nur plausibel.

## 6:30 Tests: Vertrag ≠ Modellqualität

105 Unit/DB · 72 Chromium · 2 Storage · Typecheck/Build. Identischer aktueller Appbaum, 06.11.

Zwei optionale PDF-Fixtures übersprungen. Kein neuer Vollsuite-Lauf. Historische echte Mehrturn-Smokes getrennt. WebKit/Recall offen; v1 5/6 fehlgeschlagen, v2 unvollständig.

## 7:15 Limits ≠ hartes Gesamtbudget

12 Provider-Claims je Besucher/Stunde. Chat zwei Claims. 4096 Outputtokens, 30 Sekunden, keine Auto-Retries.

Cookie-Neuanlage umgeht Quote. Spendlimit unbestätigt. Importembedding vs Chatinput/output/queryembedding getrennt kalkulieren, keine erfundenen Eurobeträge.

## 7:55 KI-Workflow: konkrete Korrektur

SDK-History mit Assistant-Metadaten → Folgefrage 400. Fix: aktueller Userturn und autorisierte Serverhistory.

PR24: reproduzierter Vertrag/Regression, isolierter Lauf, realer Vierturn-Smoke. Keine erfundenen TDD/Junior-Sessions. Junior-Vorschlag: OCR-Fehlerfixture ohne Productionrechte.

## 8:30 Kern liefern, Grenzen zeigen

21 Prüfthemen mit Codebelegen. Nächste Schritte: semantische/Recall-Evals, WebKit/A11y, Importresilienz, Betrieb und Spendprüfung.

1000 Nutzer nicht getestet. Private Repozugriffe vor Versand freigeben. Loom noch aufnehmen; Antwortmail nur Entwurf. Anhang nicht mitsprechen.
