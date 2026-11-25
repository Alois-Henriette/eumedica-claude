# Etiketten-Drucker

Etiketten für den **Brother QL-800** mit der Endlosrolle **DK-22205** (62 mm, weiss).
Die App läuft komplett im Browser. Sie braucht keine Installation und kein Internet, und es werden keine Daten verschickt.

## Etiketten-Arten (Umschalter oben)

| Art | Standard-Format | Inhalt |
|---|---|---|
| **Braunfläschchen** | 62 × 38 mm | Logo, Titel, Inhaltsstoffe, Menge, LOT, Datum, Hinweis |
| **Paketversand** | 62 × 100 mm | Logo, Absenderzeile, Empfänger, Hinweis (z. B. „Vorsicht Glas“) |
| **Freitext** | 62 × 30 mm | Überschrift und beliebiger Text |

Jede Art merkt sich ihre eigenen Eingaben und ihr Format.
Weitere Arten lassen sich in `app.js` unter `VORLAGEN` ergänzen.

## Starten

1. Ordner `etiketten-drucker` herunterladen (z. B. über „Code → Download ZIP“ auf GitHub).
2. `index.html` per Doppelklick in **Google Chrome** oder **Microsoft Edge** öffnen.

## Einmalig: Drucker einrichten

1. Brother-Treiber für den QL-800 installieren (support.brother.com).
2. Den Schalter „Editor Lite“ am Drucker **ausschalten** (die grüne Lampe ist aus).
3. Im Druckdialog des Browsers:
   - Drucker: **Brother QL-800**
   - Ränder: **Keine**
   - Skalierung: **Standard / 100 %**
   - **Kopf- und Fusszeilen** ausschalten
4. In den Brother-Druckeinstellungen „Automatisch schneiden“ auf **alle 1 Etikett(en)** stellen.

Falls die Etikettenlänge nicht stimmt: In den Druckeinstellungen des Brother-Treibers als Papierformat „62 mm“ (Endlos) wählen bzw. ein eigenes Format mit der gewünschten Länge anlegen.

## Funktionen

- **Logo**: eingebautes „Alois & Henriette group“-Logo oder eigene Logodatei (PNG/JPG/SVG). Farben werden automatisch in Schwarz umgewandelt, weil der Drucker nur Schwarz druckt.
- **Laborschrift**: Schreibmaschine (Courier Prime), technisch (IBM Plex Mono) oder Arial.
- **Automatisches Einpassen**: Zu langer Text wird verkleinert, bis er auf das Etikett passt.
- **Serien**: Mehrere Etiketten auf einmal, mit fortlaufender Nummer `{nr}` (z. B. für LOT-Nummern). `{datum}` setzt das heutige Datum ein.

## Lizenzen

Schriften: Courier Prime, IBM Plex Mono, Great Vibes (SIL Open Font License, siehe `fonts/`).
