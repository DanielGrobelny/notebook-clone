# Testen

pnpm typecheck
pnpm test

Standardtests verwenden lokale Mocks. pnpm test:e2e läuft isoliert.

## Vollständiger Lauf

pnpm test:visitor

Erzeugt eigene temporäre DB-, Storage-, Netzwerk- und Testserver-Ressourcen und entfernt nur diese. Prüft Migrationen, RLS, Storage, Unit-Tests, Typecheck, Build und Desktop-/Mobile-Playwright. Voraussetzungen: Docker, Playwright-Browser und freie lokale Ports.

pnpm test:integration:openai ist ein separates kostenpflichtiges Opt-in.
