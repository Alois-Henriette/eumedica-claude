/* Etiketten-Drucker für Brother QL-800 mit DK-22205 (62 mm Endlosrolle).
   Läuft komplett lokal im Browser – es werden keine Daten verschickt. */
(function () {
  'use strict';

  var BREITE_MM = 62;
  var SPEICHER_KEY = 'etiketten-drucker-v1';

  // ---------- Vorlagen ----------
  var VORLAGEN = {
    flaeschchen: {
      titel: 'Braunfläschchen',
      // Standard für Flaschen: Breite fest (Rolle 62 mm, bedruckt ca. 59 mm),
      // Höhe passt sich automatisch an die Menge der Inhaltsstoffe an.
      einstellungen: { ausrichtung: 'hoch', hoehe: '63', fest: true, auto: true },
      felder: [
        { id: 'name', label: 'Titel', placeholder: 'z. B. Arnika-Öl', standard: 'Arnika-Öl' },
        { id: 'listenTitel', label: 'Überschrift der Liste', placeholder: 'z. B. Inhaltsstoffe:', standard: 'Inhaltsstoffe:' },
        { id: 'zusatz', label: 'Inhaltsstoffe / Zutaten', typ: 'textarea',
          placeholder: 'z. B. Mandelöl*, Arnikablüten-Auszug*, Vitamin E\n* aus kontrolliert biologischem Anbau',
          standard: 'Mandelöl*, Arnikablüten-Auszug*, Tocopherol (Vitamin E)' },
        { id: 'menge', label: 'Menge', placeholder: 'z. B. 10 ml', standard: '10 ml', halb: true },
        { id: 'lot', label: 'Charge / LOT', placeholder: 'z. B. 2611-{nr}', halb: true },
        { id: 'hergestellt', label: 'Hergestellt am', typ: 'date', standard: 'heute', halb: true },
        { id: 'haltbar', label: 'Verwendbar bis', placeholder: 'z. B. 11/2027', halb: true },
        { id: 'hinweis', label: 'Hinweis', placeholder: 'z. B. Vor Licht geschützt lagern' }
      ],
      zeilen: function (w) {
        var z = [];
        if (w.name) z.push(zeile(w.name, 12, 'e-eine e-fett e-mitte e-titel'));
        if (w.listenTitel) z.push(zeile(w.listenTitel, 6.5, 'e-eine e-fett'));
        if (w.zusatz) z.push(zeile(w.zusatz, 6.5, 'e-mehr'));
        var p1 = paar([['Menge', w.menge], ['LOT', w.lot]]);
        var p2 = paar([['Herg.', datumText(w.hergestellt)], ['Verw. bis', w.haltbar]]);
        if (p1 || p2) z.push('<div class="e-trenn"></div>');
        if (p1) z.push(zeileHtml(p1, 6.5, 'e-paar'));
        if (p2) z.push(zeileHtml(p2, 6.5, 'e-paar'));
        if (w.hinweis) z.push(zeile(w.hinweis, 6, 'e-mehr e-kursiv'));
        return z;
      }
    },
    paket: {
      titel: 'Paketversand',
      einstellungen: { ausrichtung: 'hoch', hoehe: '100' },
      felder: [
        { id: 'absender', label: 'Absender (eine Zeile)', placeholder: 'z. B. Alois & Henriette group · Musterstr. 1 · 8000 Zürich',
          standard: 'Alois & Henriette group · Musterstrasse 1 · 8000 Zürich' },
        { id: 'empfaenger', label: 'Empfänger', typ: 'textarea',
          placeholder: 'Name\nStrasse Nr.\nPLZ Ort\nLand' },
        { id: 'hinweis', label: 'Hinweis auf dem Paket', placeholder: 'z. B. Vorsicht Glas – nicht stürzen',
          standard: 'Vorsicht Glas' }
      ],
      zeilen: function (w) {
        var z = [];
        if (w.absender) z.push(zeile('Abs.: ' + w.absender, 6.5, 'e-eine e-absender'));
        if (w.empfaenger) z.push(zeile(w.empfaenger, 13, 'e-mehr e-empfaenger'));
        if (w.hinweis) z.push(zeile(w.hinweis, 10, 'e-eine e-fett e-mitte e-kasten'));
        return z;
      }
    },
    freitext: {
      titel: 'Freitext',
      einstellungen: { ausrichtung: 'hoch', hoehe: '63' },
      felder: [
        { id: 'ueberschrift', label: 'Überschrift', placeholder: 'z. B. Muster' },
        { id: 'text', label: 'Text', typ: 'textarea', placeholder: 'Beliebiger Text, mehrere Zeilen möglich' },
        { id: 'groesse', label: 'Schriftgröße', typ: 'select', halb: true, standard: '9',
          optionen: [['7', 'Klein'], ['9', 'Mittel'], ['12', 'Groß'], ['16', 'Sehr groß']] },
        { id: 'ausrichtung', label: 'Ausrichtung', typ: 'select', halb: true, standard: 'e-mitte',
          optionen: [['', 'Links'], ['e-mitte', 'Zentriert'], ['e-rechts', 'Rechts']] }
      ],
      zeilen: function (w) {
        var z = [];
        var pt = parseFloat(w.groesse) || 9;
        if (w.ueberschrift) z.push(zeile(w.ueberschrift, pt * 1.35, 'e-eine e-fett ' + w.ausrichtung));
        if (w.text) z.push(zeile(w.text, pt, 'e-mehr ' + w.ausrichtung));
        return z;
      }
    }
  };

  // ---------- Hilfsfunktionen ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function zeile(text, pt, klassen) { return zeileHtml(esc(text), pt, klassen); }
  function zeileHtml(html, pt, klassen) {
    return '<div class="e-zeile ' + klassen + '" style="--pt:' + pt + '">' + html + '</div>';
  }
  function paar(liste) {
    var teile = liste.filter(function (p) { return p[1]; })
      .map(function (p) { return '<span>' + esc(p[0]) + ': <b>' + esc(p[1]) + '</b></span>'; });
    return teile.join('');
  }
  function heuteIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function datumText(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '.' + m[2] + '.' + m[1] : (iso || '');
  }
  function ersetzen(text, nr, werte) {
    return String(text || '').replace(/\{(\w+)\}/g, function (ganz, k) {
      if (k === 'nr') return nr;
      if (k === 'datum') return datumText(heuteIso());
      if (werte && Object.prototype.hasOwnProperty.call(werte, k)) return werte[k];
      return ganz;
    });
  }
  // Fehlt ein Element (z. B. alte Seite noch im Browser-Cache), wird ein leeres Ersatz-Element geliefert.
  function $(id) { return document.getElementById(id) || document.createElement('div'); }

  // ---------- Zustand ----------
  var zustand = {
    vorlage: 'flaeschchen',
    werte: {},
    logoArt: 'original',  // 'original' | 'bild' | 'kein'
    logoBild: '',         // Data-URL einer hochgeladenen Datei
    logoGroesse: '6',     // Höhe in mm
    schrift: 'schreibmaschine',
    hoehe: '60',
    freiHoehe: 63,
    anzahl: 1,
    start: 1,
    stellen: 3,
    rahmen: false
  };
  try {
    var gespeichert = JSON.parse(localStorage.getItem(SPEICHER_KEY) || 'null');
    if (gespeichert && typeof gespeichert === 'object') Object.assign(zustand, gespeichert);
  } catch (e) { /* ohne Speicher weiterarbeiten */ }
  if (!VORLAGEN[zustand.vorlage]) zustand.vorlage = 'flaeschchen';
  if (zustand.logoArt === 'text') zustand.logoArt = 'original';
  // Das Format wird je Etiketten-Art getrennt gemerkt.
  var PRO_VORLAGE = ['hoehe', 'freiHoehe'];
  zustand.proVorlage = zustand.proVorlage || {};
  Object.keys(VORLAGEN).forEach(function (k) {
    var alt = zustand.proVorlage[k];
    var gueltig = ['63', '75', '100', '150', 'frei'];
    var hoehe = alt && gueltig.indexOf(String(alt.hoehe)) >= 0 ? alt.hoehe : VORLAGEN[k].einstellungen.hoehe;
    zustand.proVorlage[k] = Object.assign({}, alt, { hoehe: hoehe, freiHoehe: Math.max(63, (alt && alt.freiHoehe) || 63) });
    if (VORLAGEN[k].einstellungen.fest) zustand.proVorlage[k].hoehe = VORLAGEN[k].einstellungen.hoehe;
  });
  PRO_VORLAGE.forEach(function (p) { zustand[p] = zustand.proVorlage[zustand.vorlage][p]; });
  Object.keys(VORLAGEN).forEach(function (k) {
    zustand.werte[k] = zustand.werte[k] || {};
    VORLAGEN[k].felder.forEach(function (f) {
      if (zustand.werte[k][f.id] === undefined) {
        zustand.werte[k][f.id] = f.standard === 'heute' ? heuteIso() : (f.standard || '');
      }
    });
  });
  function speichern() {
    PRO_VORLAGE.forEach(function (p) { zustand.proVorlage[zustand.vorlage][p] = zustand[p]; });
    try { localStorage.setItem(SPEICHER_KEY, JSON.stringify(zustand)); } catch (e) { /* egal */ }
  }

  function format() { return VORLAGEN[zustand.vorlage].einstellungen; }
  function istQuer() { return format().ausrichtung === 'quer'; }

  var AUTO_S = 1.4;          // Grund-Schriftgröße bei automatischer Höhe
  // Chrome/macOS drehen Seiten, die breiter als hoch sind, ins Querformat – der Brother-Treiber
  // druckt sie dann um 90° gedreht. Deshalb ist jedes Etikett mindestens so lang wie die Rolle breit.
  var MIN_LAENGE = 63;
  var letzteAutoHoehe = 40;  // zuletzt gemessene Höhe in mm

  function hoeheMm() {
    if (format().auto) return letzteAutoHoehe;
    if (format().fest) return parseFloat(format().hoehe);
    var h = zustand.hoehe === 'frei' ? parseFloat(zustand.freiHoehe) : parseFloat(zustand.hoehe);
    if (!isFinite(h)) h = MIN_LAENGE;
    return Math.min(300, Math.max(MIN_LAENGE, h));
  }

  // ---------- Formular aufbauen ----------
  function vorlagenTabs() {
    var box = $('vorlagen');
    box.innerHTML = '';
    Object.keys(VORLAGEN).forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = VORLAGEN[k].titel;
      b.setAttribute('aria-pressed', String(k === zustand.vorlage));
      b.addEventListener('click', function () {
        PRO_VORLAGE.forEach(function (p) {
          zustand.proVorlage[zustand.vorlage][p] = zustand[p];
          zustand[p] = zustand.proVorlage[k][p];
          var el = $(p);
          if (el) el.value = zustand[p];
        });
        zustand.vorlage = k;
        speichern();
        vorlagenTabs();
        felderBauen();
        aktualisieren();
      });
      box.appendChild(b);
    });
  }

  function felderBauen() {
    var box = $('felder');
    box.innerHTML = '';
    var werte = zustand.werte[zustand.vorlage];
    var reihe = null;
    VORLAGEN[zustand.vorlage].felder.forEach(function (f) {
      var label = document.createElement('label');
      label.appendChild(document.createTextNode(f.label));
      var el;
      if (f.typ === 'textarea') {
        el = document.createElement('textarea');
        el.rows = 2;
      } else if (f.typ === 'select') {
        el = document.createElement('select');
        f.optionen.forEach(function (o) {
          var opt = document.createElement('option');
          opt.value = o[0]; opt.textContent = o[1];
          el.appendChild(opt);
        });
      } else {
        el = document.createElement('input');
        el.type = f.typ === 'date' ? 'date' : 'text';
      }
      if (f.placeholder) el.placeholder = f.placeholder;
      el.value = werte[f.id];
      el.addEventListener('input', function () {
        werte[f.id] = el.value;
        speichern();
        aktualisieren();
      });
      label.appendChild(el);
      if (f.halb) {
        if (!reihe) { reihe = document.createElement('div'); reihe.className = 'zeile'; box.appendChild(reihe); }
        reihe.appendChild(label);
        if (reihe.children.length === 2) reihe = null;
      } else {
        reihe = null;
        box.appendChild(label);
      }
    });
  }

  function einstellungenVerbinden() {
    $('logoDatei').addEventListener('change', function (ev) {
      if (ev.target.files && ev.target.files[0]) logoLaden(ev.target.files[0]);
      ev.target.value = '';
    });
    [['logoArt', 'value'], ['logoGroesse', 'value'], ['schrift', 'value'], ['hoehe', 'value'], ['freiHoehe', 'value'],
     ['anzahl', 'value'], ['start', 'value'], ['stellen', 'value'], ['rahmen', 'checked']].forEach(function (p) {
      var el = $(p[0]);
      el[p[1]] = zustand[p[0]];
      var ev = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
      el.addEventListener(ev, function () {
        zustand[p[0]] = el[p[1]];
        speichern();
        aktualisieren();
      });
    });
    $('drucken').addEventListener('click', drucken);
    window.addEventListener('resize', vorschauSkalieren);
  }

  // ---------- Etikett erzeugen ----------
  function nummer(i) {
    var n = (parseInt(zustand.start, 10) || 0) + i;
    var stellen = Math.min(8, Math.max(1, parseInt(zustand.stellen, 10) || 1));
    return String(n).padStart(stellen, '0');
  }

  function etikettErzeugen(i) {
    var nr = nummer(i);
    var roh = zustand.werte[zustand.vorlage];
    var werte = {};
    Object.keys(roh).forEach(function (k) { werte[k] = ersetzen(roh[k], nr, null); });

    var div = document.createElement('div');
    div.className = 'etikett schrift-' + zustand.schrift + (zustand.rahmen ? ' mit-rahmen' : '');
    var quer = istQuer();
    if (quer) div.classList.add('quer');
    if (format().auto) {
      div.classList.add('auto');
      div.style.width = BREITE_MM + 'mm';
    } else {
      div.style.width = (quer ? hoeheMm() : BREITE_MM) + 'mm';
      div.style.height = (quer ? BREITE_MM : hoeheMm()) + 'mm';
    }

    var html = zustand.rahmen ? '<div class="rahmen"></div>' : '';
    html += '<div class="inhalt"><div class="textspalte"><div class="stapel">' +
      logoHtml() +
      VORLAGEN[zustand.vorlage].zeilen(werte).join('') +
      '</div></div></div>';
    div.innerHTML = html;
    return div;
  }

  function logoHtml() {
    var h = parseFloat(zustand.logoGroesse) || 6;
    var stil = ' style="--lh:' + h + '"';
    if (zustand.logoArt === 'bild' && zustand.logoBild) {
      return '<div class="e-logo"' + stil + '><img alt="" src="' + esc(zustand.logoBild) + '"></div>';
    }
    if (zustand.logoArt === 'original') {
      return '<div class="e-logo"' + stil + '><img alt="Alois & Henriette group" src="logo-druck.png"></div>';
    }
    return '';
  }

  // Hochgeladenes Logo verkleinern und in Graustufen umwandeln (Drucker druckt nur Schwarz).
  function logoLaden(datei) {
    var leser = new FileReader();
    leser.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 900;
        var f = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * f);
        c.height = Math.round(img.height * f);
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        var px = ctx.getImageData(0, 0, c.width, c.height);
        var d = px.data;
        for (var i = 0; i < d.length; i += 4) {
          var g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          // Farbige Teile (z. B. Türkis) kräftig abdunkeln, damit sie schwarz gedruckt werden
          var v = g > 235 ? 255 : Math.max(0, Math.round((g - 120) * 1.4));
          d[i] = d[i + 1] = d[i + 2] = v;
        }
        ctx.putImageData(px, 0, 0);
        zustand.logoBild = c.toDataURL('image/png');
        zustand.logoArt = 'bild';
        $('logoArt').value = 'bild';
        speichern();
        aktualisieren();
      };
      img.src = leser.result;
    };
    leser.readAsDataURL(datei);
  }

  // Text verkleinern, bis alles auf das Etikett passt (Element muss im DOM sein).
  function einpassen(etikett) {
    var inhalt = etikett.querySelector('.inhalt');
    var spalte = etikett.querySelector('.textspalte');
    var stapel = etikett.querySelector('.stapel');
    var s = 1;
    inhalt.style.setProperty('--s', s);
    var einzeilig = etikett.querySelectorAll('.e-eine');
    // Einzeilige Texte (Titel usw.) dürfen sich etwas verkleinern, aber nur bis minF,
    // damit die Rangfolge der Schriftgrößen erhalten bleibt.
    var minF = 0.8;
    function breiteEinpassen() {
      var ok = true;
      einzeilig.forEach(function (el) {
        var f = 1;
        el.style.setProperty('--f', f);
        while (el.scrollWidth > el.clientWidth + 0.5 && f > 0.4) {
          f -= 0.03;
          el.style.setProperty('--f', f.toFixed(3));
        }
        // Der Titel darf stärker schrumpfen (bleibt aber größer als der übrige Text).
        var grenze = el.classList.contains('e-titel') ? Math.min(minF, 0.62) : minF;
        if (f < grenze || el.scrollWidth > el.clientWidth + 0.5) ok = false;
      });
      return ok;
    }
    function logoEinpassen() {
      etikett.querySelectorAll('.e-logo').forEach(function (el) {
        var innen = el.firstChild;
        var f = 1;
        el.style.setProperty('--lf', f);
        while (innen.offsetWidth > el.clientWidth + 0.5 && f > 0.3) {
          f -= 0.03;
          el.style.setProperty('--lf', f.toFixed(3));
        }
      });
    }
    var mehrzeilig = etikett.querySelectorAll('.e-mehr, .e-paar');
    // Passt alles bei Schriftfaktor s? (Höhe reicht, kein Wort ragt seitlich hinaus)
    function passt(wert) {
      inhalt.style.setProperty('--s', wert.toFixed(3));
      var breiteOk = breiteEinpassen();
      logoEinpassen();
      if (!breiteOk) return false;
      if (stapel.offsetHeight > spalte.clientHeight + 0.5) return false;
      for (var i = 0; i < mehrzeilig.length; i++) {
        if (mehrzeilig[i].scrollWidth > mehrzeilig[i].clientWidth + 0.5) return false;
      }
      return true;
    }
    if (etikett.classList.contains('auto')) {
      // Feste Schriftgröße; Höhe = Inhalt + schmaler Rand.
      minF = 0;
      inhalt.style.setProperty('--s', AUTO_S);
      breiteEinpassen();
      logoEinpassen();
      for (var m = 0; m < mehrzeilig.length; m++) {
        if (mehrzeilig[m].scrollWidth > mehrzeilig[m].clientWidth + 0.5) etikett.classList.add('umbruch');
      }
      var mm = etikett.getBoundingClientRect().height * 25.4 / 96;
      var h = Math.ceil(mm * 2) / 2;
      if (h >= MIN_LAENGE) {
        etikett.style.height = h + 'mm';
        etikett.dataset.hoehe = h;
        return AUTO_S;
      }
      // Zu kurz: Mindestlänge nehmen, Schrift bleibt gleich groß, Text steht oben.
      etikett.style.height = MIN_LAENGE + 'mm';
      etikett.dataset.hoehe = MIN_LAENGE;
      return AUTO_S;
    }
    // Größten Faktor suchen, damit der Text das Etikett möglichst ausfüllt.
    var lo = 0.3, hi = 3.5;
    if (passt(1)) lo = 1; else hi = 1;
    for (var n = 0; n < 12; n++) {
      var mitte = (lo + hi) / 2;
      if (passt(mitte)) lo = mitte; else hi = mitte;
    }
    s = lo;
    if (!passt(s)) {
      // Selbst ganz klein passt es nicht: Titel stärker verkleinern, lange Wörter umbrechen.
      minF = 0;
      etikett.classList.add('umbruch');
      passt(s);
    }
    return s;
  }

  // ---------- Vorschau ----------
  function aktualisieren() {
    try {
      aktualisierenIntern();
    } catch (e) {
      $('vorschauInfo').textContent = 'Die Vorschau konnte nicht erstellt werden. Bitte Seite neu laden (Cmd+Shift+R bzw. Strg+F5). Fehler: ' + e.message;
    }
  }
  function aktualisierenIntern() {
    $('freiHoeheLabel').hidden = zustand.hoehe !== 'frei' || !!format().fest;
    $('logoHinweis').hidden = !(zustand.logoArt === 'bild' && !zustand.logoBild);
    $('logoDateiLabel').hidden = zustand.logoArt !== 'bild';
    var quer = istQuer();
    $('festFormat').hidden = !format().fest;
    $('formatWahl').hidden = !!format().fest;

    var box = $('vorschauSkala');
    box.innerHTML = '';
    box.style.zoom = 1; // ohne Zoom messen
    var e = etikettErzeugen(0);
    box.appendChild(e);
    var s = einpassen(e);
    if (format().auto) letzteAutoHoehe = parseFloat(e.dataset.hoehe) || 40;
    vorschauSkalieren();

    var h = hoeheMm();
    $('masse').textContent = '· ' + (quer ? h + ' mm breit × ' + BREITE_MM + ' mm hoch' :
      BREITE_MM + ' mm breit × ' + h + ' mm hoch' + (format().auto ? ' (automatisch)' : ''));
    $('seitenformat').textContent = '@page { size: ' + BREITE_MM + 'mm ' + h + 'mm; margin: 0; }';

    var anzahl = Math.max(1, parseInt(zustand.anzahl, 10) || 1);
    var info = anzahl === 1 ? '1 Etikett wird gedruckt.' : anzahl + ' Etiketten werden gedruckt.';
    var nutztNr = JSON.stringify(zustand.werte[zustand.vorlage]).indexOf('{nr}') >= 0;
    if (nutztNr && anzahl > 1) info += ' Nummern ' + nummer(0) + ' bis ' + nummer(anzahl - 1) + '.';
    if (s < 0.7 && !format().auto) info += ' Hinweis: Der Text wurde stark verkleinert. Etikett größer wählen oder Text kürzen.';
    $('vorschauInfo').textContent = info;
  }

  function vorschauSkalieren() {
    var flaeche = $('vorschauFlaeche');
    var box = $('vorschauSkala');
    var e = box.firstChild;
    if (!e) return;
    box.style.zoom = 1;
    var verfuegbar = flaeche.clientWidth - 32;
    var faktor = Math.max(1, Math.min(3.5, verfuegbar / e.offsetWidth, 520 / e.offsetHeight));
    box.style.zoom = faktor;
  }

  // ---------- Drucken ----------
  function drucken() {
    var anzahl = Math.min(500, Math.max(1, parseInt(zustand.anzahl, 10) || 1));
    var bereich = $('druckbereich');
    bereich.innerHTML = '';
    for (var i = 0; i < anzahl; i++) {
      // Jede Druckseite ist ein Stück Rolle: 62 mm breit, Länge = gewählte Höhe bzw. Breite.
      var seite = document.createElement('div');
      seite.className = 'seite';
      seite.style.width = BREITE_MM + 'mm';
      seite.style.height = hoeheMm() + 'mm';
      var e = etikettErzeugen(i);
      seite.appendChild(e);
      bereich.appendChild(seite);
      einpassen(e);
    }
    if (format().auto) {
      // Alle Etiketten bekommen die Höhe des längsten (eine Seitengröße pro Druckauftrag).
      var max = MIN_LAENGE;
      bereich.querySelectorAll('.etikett').forEach(function (el) { max = Math.max(max, parseFloat(el.dataset.hoehe) || MIN_LAENGE); });
      letzteAutoHoehe = max;
      bereich.querySelectorAll('.seite, .etikett').forEach(function (el) { el.style.height = max + 'mm'; });
      $('seitenformat').textContent = '@page { size: ' + BREITE_MM + 'mm ' + max + 'mm; margin: 0; }';
    }
    // Erst drucken, wenn alle Logo-Bilder geladen sind.
    var bilder = Array.prototype.map.call(bereich.querySelectorAll('img'), function (img) {
      return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
    });
    Promise.all(bilder).then(function () { window.print(); });
  }
  window.addEventListener('afterprint', function () { $('druckbereich').innerHTML = ''; });

  // ---------- Start ----------
  vorlagenTabs();
  felderBauen();
  einstellungenVerbinden();
  aktualisieren();
  // Schriften vorab laden, danach neu einpassen (Textbreiten ändern sich mit der Schrift).
  if (document.fonts && document.fonts.load) {
    Promise.all(['400 10px "Courier Prime"', '700 10px "Courier Prime"', 'italic 400 10px "Courier Prime"',
      '400 10px "IBM Plex Mono"', '700 10px "IBM Plex Mono"', 'italic 400 10px "IBM Plex Mono"'].map(function (f) { return document.fonts.load(f).catch(function () {}); }))
      .then(aktualisieren);
  }
})();
