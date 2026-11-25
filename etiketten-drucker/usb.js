/* Direktdruck auf den Brother QL-800 über WebUSB (Chrome/Edge).
   Erzeugt Brother-Rasterbefehle (wie die Open-Source-Bibliothek brother_ql) für
   Endlosrolle DK-22205 (62 mm), schwarz, 300 dpi, Abschneiden nach jedem Etikett. */
(function (global) {
  'use strict';

  var VENDOR_BROTHER = 0x04f9;
  var PUNKTE_PRO_ZEILE = 720;        // Druckkopf QL-800: 90 Bytes pro Rasterzeile
  var BYTES_PRO_ZEILE = PUNKTE_PRO_ZEILE / 8;
  var DRUCKBREITE = 696;             // bedruckbare Punkte bei 62-mm-Rolle
  var RAND_RECHTS = 12;              // Versatz rechts in Punkten (62-mm-Rolle)
  var VORSCHUB_RAND = 35;            // Rand oben/unten in Punkten (≈ 3 mm, Minimum bei Endlos)
  var PUNKTE_PRO_MM = 300 / 25.4;

  function zusammenfuegen(teile) {
    var laenge = 0;
    teile.forEach(function (t) { laenge += t.length; });
    var aus = new Uint8Array(laenge);
    var pos = 0;
    teile.forEach(function (t) { aus.set(t, pos); pos += t.length; });
    return aus;
  }

  /* seiten: [{ hoehe: Zeilen, pixel: Uint8Array(696 * hoehe), 1 = schwarz }] */
  function rasterDaten(seiten) {
    var t = [];
    t.push(new Uint8Array([0x1b, 0x69, 0x61, 0x01]));    // ESC i a 1 Rastermodus
    t.push(new Uint8Array(200));                         // Invalidate
    t.push(new Uint8Array([0x1b, 0x40]));                // ESC @ Initialisieren
    t.push(new Uint8Array([0x1b, 0x69, 0x61, 0x01]));    // ESC i a 1 Rastermodus
    seiten.forEach(function (seite, index) {
      var zeilen = seite.hoehe;
      t.push(new Uint8Array([0x1b, 0x69, 0x53]));        // ESC i S Statusabfrage
      t.push(new Uint8Array([
        0x1b, 0x69, 0x7a,                                // ESC i z Druckinformationen
        0x80 | 0x40 | 0x08 | 0x04 | 0x02,                // gültig: Wiederherstellung, Qualität, Länge, Breite, Medientyp
        0x0a,                                            // Endlosrolle
        62,                                              // Breite in mm
        0,                                               // Länge (Endlos = 0)
        zeilen & 0xff, (zeilen >> 8) & 0xff, (zeilen >> 16) & 0xff, (zeilen >> 24) & 0xff,
        0,                                               // Seitenkennung (wie brother_ql)
        0
      ]));
      t.push(new Uint8Array([0x1b, 0x69, 0x4d, 0x40]));  // ESC i M: automatisch schneiden
      t.push(new Uint8Array([0x1b, 0x69, 0x41, 0x01]));  // ESC i A: nach jedem Etikett
      t.push(new Uint8Array([0x1b, 0x69, 0x4b, 0x08]));  // ESC i K: am Ende schneiden, einfarbig
      t.push(new Uint8Array([0x1b, 0x69, 0x64, VORSCHUB_RAND & 0xff, VORSCHUB_RAND >> 8])); // Rand
      var raster = new Uint8Array(zeilen * (3 + BYTES_PRO_ZEILE));
      var p = 0;
      for (var y = 0; y < zeilen; y++) {
        raster[p++] = 0x67; raster[p++] = 0x00; raster[p++] = BYTES_PRO_ZEILE;
        var zeile = raster.subarray(p, p + BYTES_PRO_ZEILE);
        for (var x = 0; x < DRUCKBREITE; x++) {
          if (seite.pixel[y * DRUCKBREITE + x]) {
            // Bild wird rechtsbündig mit RAND_RECHTS platziert und gespiegelt (Druckkopf-Richtung)
            var spalte = PUNKTE_PRO_ZEILE - 1 - (PUNKTE_PRO_ZEILE - DRUCKBREITE - RAND_RECHTS + x);
            zeile[spalte >> 3] |= 0x80 >> (spalte & 7);
          }
        }
        p += BYTES_PRO_ZEILE;
      }
      t.push(raster);
      t.push(new Uint8Array([0x1a]));                      // drucken (wie brother_ql nach jeder Seite)
    });
    return zusammenfuegen(t);
  }

  /* Canvas (Breite = 696 Punkte) in Druckpixel umwandeln: dunkel = schwarz. */
  function canvasZuSeite(canvas) {
    var ctx = canvas.getContext('2d');
    var bild = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var pixel = new Uint8Array(DRUCKBREITE * canvas.height);
    for (var y = 0; y < canvas.height; y++) {
      for (var x = 0; x < DRUCKBREITE && x < canvas.width; x++) {
        var i = (y * canvas.width + x) * 4;
        var hell = 0.299 * bild[i] + 0.587 * bild[i + 1] + 0.114 * bild[i + 2];
        pixel[y * DRUCKBREITE + x] = hell < 150 ? 1 : 0;
      }
    }
    return { hoehe: canvas.height, pixel: pixel };
  }

  // ---------- USB ----------
  var geraet = null;
  var ausgang = null;
  var eingang = null;

  function verfuegbar() { return !!(global.navigator && navigator.usb); }

  function bekanntesGeraet() {
    if (!verfuegbar()) return Promise.resolve(null);
    return navigator.usb.getDevices().then(function (liste) {
      return liste.filter(function (d) { return d.vendorId === VENDOR_BROTHER; })[0] || null;
    });
  }

  function oeffnen(d) {
    return d.open()
      .then(function () { return d.configuration ? null : d.selectConfiguration(1); })
      .then(function () {
        var schnittstellen = d.configuration.interfaces;
        for (var i = 0; i < schnittstellen.length; i++) {
          var alt = schnittstellen[i].alternates[0];
          var aus = alt.endpoints.filter(function (e) { return e.type === 'bulk' && e.direction === 'out'; })[0];
          if (aus) {
            var ein = alt.endpoints.filter(function (e) { return e.type === 'bulk' && e.direction === 'in'; })[0];
            ausgang = aus.endpointNumber;
            eingang = ein ? ein.endpointNumber : null;
            return d.claimInterface(schnittstellen[i].interfaceNumber);
          }
        }
        throw new Error('Am Drucker wurde keine Druck-Schnittstelle gefunden.');
      })
      .then(function () { geraet = d; return d; });
  }

  /* Muss aus einem Klick heraus aufgerufen werden, wenn noch kein Drucker freigegeben ist. */
  function verbinden(nachfragen) {
    if (!verfuegbar()) return Promise.reject(new Error('Dieser Browser unterstützt keinen USB-Direktdruck. Bitte Chrome oder Edge verwenden.'));
    if (geraet && geraet.opened) return Promise.resolve(geraet);
    return bekanntesGeraet().then(function (d) {
      if (d) return d;
      if (!nachfragen) return null;
      return navigator.usb.requestDevice({ filters: [{ vendorId: VENDOR_BROTHER }] });
    }).then(function (d) { return d ? oeffnen(d) : null; });
  }

  function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function statusLesen(versuche) {
    if (eingang === null) return Promise.resolve(null);
    var n = 0;
    function versuch() {
      return geraet.transferIn(eingang, 32).then(function (r) {
        if (r.data && r.data.byteLength >= 32) return new Uint8Array(r.data.buffer);
        if (++n >= versuche) return null;
        return warte(100).then(versuch);
      });
    }
    return versuch();
  }

  var FEHLER = [
    [8, 0x01, 'Keine Etikettenrolle eingelegt.'],
    [8, 0x02, 'Ende der Etikettenrolle erreicht.'],
    [8, 0x04, 'Die Schneideeinheit klemmt.'],
    [8, 0x10, 'Der Drucker ist noch beschäftigt.'],
    [8, 0x80, 'Der Drucker hat ein Problem (Hochspannung/Hardware).'],
    [9, 0x01, 'Falsche Etikettenrolle eingelegt (bitte DK-22205, 62 mm).'],
    [9, 0x10, 'Die Abdeckung ist offen.'],
    [9, 0x20, 'Etikettenstau.']
  ];
  function fehlerText(s) {
    if (!s) return null;
    var texte = FEHLER.filter(function (f) { return s[f[0]] & f[1]; }).map(function (f) { return f[2]; });
    return texte.length ? texte.join(' ') : null;
  }

  function senden(daten) {
    var STUECK = 16384;
    var kette = Promise.resolve();
    for (var i = 0; i < daten.length; i += STUECK) {
      (function (teil) {
        kette = kette.then(function () { return geraet.transferOut(ausgang, teil); });
      })(daten.subarray(i, i + STUECK));
    }
    return kette;
  }

  /* Druckt die Seiten; liefert eine Meldung oder wirft einen Fehler mit verständlichem Text. */
  function drucken(seiten) {
    return verbinden(true).then(function (d) {
      if (!d) throw new Error('Kein Drucker ausgewählt.');
      // Vorab Status prüfen (Rolle, Abdeckung)
      return senden(new Uint8Array(200)).then(function () {
        return senden(new Uint8Array([0x1b, 0x40, 0x1b, 0x69, 0x53]));
      }).then(function () { return statusLesen(20); }).then(function (s) {
        var f = fehlerText(s);
        if (f) throw new Error(f);
        if (s && s[10] && s[10] !== 62) throw new Error('Im Drucker liegt eine ' + s[10] + '-mm-Rolle. Bitte DK-22205 (62 mm) einlegen.');
        return senden(rasterDaten(seiten));
      }).then(function () { return statusLesen(80); }).then(function (s) {
        var f = fehlerText(s);
        if (f) throw new Error(f);
        return seiten.length === 1 ? 'Etikett gedruckt.' : seiten.length + ' Etiketten gedruckt.';
      });
    }).catch(function (e) {
      // Verbindung bei Fehlern schließen, damit der nächste Versuch neu verbindet
      var d = geraet; geraet = null;
      if (d && d.opened) d.close().catch(function () {});
      if (e && e.name === 'NotFoundError') throw new Error('Kein Drucker ausgewählt.');
      if (e && (e.name === 'SecurityError' || e.name === 'NetworkError' || e.name === 'InvalidStateError')) {
        throw new Error('Der Drucker ist belegt oder nicht erreichbar. Bitte USB-Kabel prüfen, Editor Lite ausschalten (grüne Lampe aus) und erneut versuchen.');
      }
      throw e;
    });
  }

  global.BrotherQL = {
    PUNKTE_PRO_MM: PUNKTE_PRO_MM,
    DRUCKBREITE: DRUCKBREITE,
    verfuegbar: verfuegbar,
    bekanntesGeraet: bekanntesGeraet,
    verbinden: verbinden,
    rasterDaten: rasterDaten,
    canvasZuSeite: canvasZuSeite,
    drucken: drucken
  };
})(typeof window !== 'undefined' ? window : globalThis);
