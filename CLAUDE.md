# Eumedica Claude – Arbeitsregeln für Claude

## Sprache
- Mit dem Nutzer immer auf **Deutsch** kommunizieren, kurz und ohne Fachjargon.

## Deployment (immer selbst erledigen)
- Die Apps laufen über **GitHub Pages** (Quelle: GitHub Actions, Workflow `.github/workflows/pages.yml`, startet bei jedem Push auf `main`):
  https://alois-henriette.github.io/eumedica-claude/
- Nach jeder fertigen und getesteten Änderung **selbst nach `main` pushen**. Damit ist das Deployment erledigt, GitHub Pages veröffentlicht automatisch in 1–2 Minuten.
- Der Nutzer hat ausdrücklich gewünscht, dass Claude das Deployment immer übernimmt. Nicht nachfragen, nicht auf einem separaten Branch liegen lassen.
- Vor dem Push testen (z. B. Playwright/Chromium: Seite laden, keine Konsolenfehler, Druck-PDF im richtigen Format).

## Etiketten-Drucker (`etiketten-drucker/`)
- Drucker: Brother QL-800, Rolle DK-22205 (62 mm Endlos, nur Schwarz).
- Braunfläschchen-Etikett: höchstens 60 mm breit (Nutzerwunsch). Wird quer gedruckt, Höhe = 62 mm Rollenbreite.
- Reines HTML/CSS/JS ohne Build-Schritt und ohne externe Abhängigkeiten. Schriften liegen lokal in `fonts/`.
- Neue Etiketten-Arten in `app.js` unter `VORLAGEN` ergänzen (erscheinen automatisch im Umschalter).
- Kein QR-Code und kein Barcode (vom Nutzer nicht gewünscht).
- Keine Daten an Server schicken; Eingaben bleiben im Browser (localStorage).
