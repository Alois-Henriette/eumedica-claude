# Etiketten-Drucker

Etiketten für den **Brother QL-800** mit der Endlosrolle **DK-22205** (62 mm, weiss).
Die App läuft komplett im Browser. Sie braucht keine Installation und kein Internet, und es werden keine Daten verschickt.

## Etiketten-Arten (Umschalter oben)

| Art | Standard-Format | Inhalt |
|---|---|---|
| **Braunfläschchen** | Breite fest 62 mm, Höhe automatisch je nach Inhalt | Logo, Titel, Inhaltsstoffe, Menge, LOT, Datum, Hinweis |
| **Paketversand** | 62 × 100 mm | Logo, Absenderzeile, Empfänger, Hinweis (z. B. „Vorsicht Glas“) |
| **Freitext** | 62 × 30 mm | Überschrift und beliebiger Text |

Jede Art merkt sich ihre eigenen Eingaben und ihr Format.
Weitere Arten lassen sich in `app.js` unter `VORLAGEN` ergänzen.

## Starten

1. Ordner `etiketten-drucker` herunterladen (z. B. über „Code → Download ZIP“ auf GitHub).
2. `index.html` per Doppelklick in **Google Chrome** oder **Microsoft Edge** öffnen.

## Drucken

Die App druckt **direkt über USB** auf den QL-800 (Chrome oder Edge). Mac-Druckfenster und Treiber-Einstellungen sind dafür nicht nötig.
Das Etikett wird genau so lang wie der Inhalt und danach automatisch abgeschnitten.

1. Den Drucker per USB anschliessen und einschalten.
2. Die Taste **„Editor Lite“** gedrückt halten, bis die grüne Lampe **aus** ist.
3. Auf **Drucken** klicken. Beim ersten Mal fragt Chrome nach dem Drucker: **QL-800** wählen und auf **Verbinden** klicken.

Notweg: Unter „Hilfe & Notweg“ wird über den normalen Druckdialog gedruckt. Dabei ist das Etikett mindestens 63 mm lang, und der Treiber kann Ränder hinzufügen.

## Funktionen

- **Logo**: Original-Logo „Alois & Henriette group“ (`logo.jpg`, Druckversion `logo-druck.png`) oder eigene Logodatei (PNG/JPG/SVG). Farben werden automatisch in Schwarz umgewandelt, weil der Drucker nur Schwarz druckt.
- **Laborschrift**: Schreibmaschine (Courier Prime), technisch (IBM Plex Mono) oder Arial.
- **Automatisches Einpassen**: Zu langer Text wird verkleinert, bis er auf das Etikett passt.
- **Serien**: Mehrere Etiketten auf einmal, mit fortlaufender Nummer `{nr}` (z. B. für LOT-Nummern). `{datum}` setzt das heutige Datum ein.

## Lizenzen

Schriften: Courier Prime, IBM Plex Mono (SIL Open Font License, siehe `fonts/`).
