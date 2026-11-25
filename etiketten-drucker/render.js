/* Wandelt ein fertig gesetztes Etikett (HTML im Druckbereich, ohne Zoom) in ein
   Druckbild mit 300 dpi um: 696 Punkte breit (bedruckbarer Bereich der 62-mm-Rolle). */
(function (global) {
  'use strict';

  var PX_ZU_PUNKT = 300 / 96;                       // CSS-Pixel → Druckpunkte
  var RAND_MM = (62 - 696 / (300 / 25.4)) / 2;      // nicht bedruckbarer Rand links ≈ 1,5 mm
  var RAND_PX = RAND_MM / 25.4 * 96;

  function etikettZuCanvas(etikett) {
    var r0 = etikett.getBoundingClientRect();
    var canvas = document.createElement('canvas');
    canvas.width = 696;
    canvas.height = Math.max(1, Math.round(r0.height * PX_ZU_PUNKT));
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';

    function X(px) { return (px - r0.left - RAND_PX) * PX_ZU_PUNKT; }
    function Y(px) { return (px - r0.top) * PX_ZU_PUNKT; }

    // 1) Linien und Rahmen (alle Elemente mit Rahmenlinien)
    var alle = [etikett].concat(Array.prototype.slice.call(etikett.querySelectorAll('*')));
    alle.forEach(function (el) {
      var cs = getComputedStyle(el);
      var r = el.getBoundingClientRect();
      var o = parseFloat(cs.borderTopWidth) || 0, u = parseFloat(cs.borderBottomWidth) || 0;
      var l = parseFloat(cs.borderLeftWidth) || 0, re = parseFloat(cs.borderRightWidth) || 0;
      if (o && cs.borderTopStyle !== 'none') ctx.fillRect(X(r.left), Y(r.top), r.width * PX_ZU_PUNKT, o * PX_ZU_PUNKT);
      if (u && cs.borderBottomStyle !== 'none') ctx.fillRect(X(r.left), Y(r.bottom - u), r.width * PX_ZU_PUNKT, u * PX_ZU_PUNKT);
      if (l && cs.borderLeftStyle !== 'none') ctx.fillRect(X(r.left), Y(r.top), l * PX_ZU_PUNKT, r.height * PX_ZU_PUNKT);
      if (re && cs.borderRightStyle !== 'none') ctx.fillRect(X(r.right - re), Y(r.top), re * PX_ZU_PUNKT, r.height * PX_ZU_PUNKT);
    });

    // 2) Bilder (Logo)
    etikett.querySelectorAll('img').forEach(function (img) {
      var r = img.getBoundingClientRect();
      if (r.width && r.height && img.complete) {
        ctx.drawImage(img, X(r.left), Y(r.top), r.width * PX_ZU_PUNKT, r.height * PX_ZU_PUNKT);
      }
    });

    // 3) Text: jedes Wort an genau der Stelle zeichnen, an der es im Etikett steht
    var walker = document.createTreeWalker(etikett, NodeFilter.SHOW_TEXT);
    var range = document.createRange();
    var knoten;
    while ((knoten = walker.nextNode())) {
      var text = knoten.nodeValue;
      if (!/\S/.test(text)) continue;
      var eltern = knoten.parentElement;
      var cs = getComputedStyle(eltern);
      ctx.save();
      // an Elementen mit overflow:hidden abschneiden (wie in der Vorschau)
      for (var a = eltern; a && a !== etikett.parentElement; a = a.parentElement) {
        if (getComputedStyle(a).overflow === 'hidden') {
          var rc = a.getBoundingClientRect();
          ctx.beginPath();
          ctx.rect(X(rc.left), Y(rc.top), rc.width * PX_ZU_PUNKT, rc.height * PX_ZU_PUNKT);
          ctx.clip();
          break;
        }
      }
      ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + (parseFloat(cs.fontSize) * PX_ZU_PUNKT) + 'px ' + cs.fontFamily;
      var abstand = parseFloat(cs.letterSpacing);
      if ('letterSpacing' in ctx) ctx.letterSpacing = (isFinite(abstand) ? abstand * PX_ZU_PUNKT : 0) + 'px';
      ctx.textBaseline = 'alphabetic';
      var re2 = /\S+/g, m;
      while ((m = re2.exec(text))) {
        range.setStart(knoten, m.index);
        range.setEnd(knoten, m.index + m[0].length);
        var rects = range.getClientRects();
        if (rects.length === 1) {
          zeichne(m[0], rects[0]);
        } else {
          // Wort wurde umbrochen: Zeichen einzeln setzen
          for (var i = 0; i < m[0].length; i++) {
            range.setStart(knoten, m.index + i);
            range.setEnd(knoten, m.index + i + 1);
            var rz = range.getClientRects()[0];
            if (rz) zeichne(m[0][i], rz);
          }
        }
      }
      ctx.restore();
    }

    function zeichne(wort, rect) {
      var mass = ctx.measureText(wort);
      var oben = mass.fontBoundingBoxAscent;
      if (!isFinite(oben)) oben = rect.height * PX_ZU_PUNKT * 0.8;
      ctx.fillText(wort, X(rect.left), Y(rect.top) + oben);
    }
    return canvas;
  }

  global.EtikettRender = { etikettZuCanvas: etikettZuCanvas };
})(window);
