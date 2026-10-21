/* ============================================
   LIGHTBOX - Visor de imagenes y video con zoom
   Consultoria Sanitaria CORSO
   Sin dependencias externas
   ============================================ */
(function () {
  'use strict';

  var MIN_SCALE = 1;
  var MAX_SCALE = 4;

  var root, stage, mediaEl, imgEl, videoEl;
  var titleEl, capEl, cntEl, zoomBox, levelEl;
  var items = [];
  var idx = 0;
  var scale = 1, tx = 0, ty = 0;
  var maxScale = MAX_SCALE;
  var curEl = null;
  var lastFocus = null;
  var opened = false;

  var pointers = {};
  var pointerCount = 0;
  var dragging = false, moved = 0;
  var lastX = 0, lastY = 0;
  var pinchDist = 0, pinchScale = 1;
  var startX = 0, startY = 0;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Estructura del visor ---------- */
  function build() {
    root = document.createElement('div');
    root.className = 'lightbox';
    root.id = 'lightbox';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Visor de imagenes');
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML =
      '<div class="lightbox-header">' +
        '<div class="lightbox-title" id="lightboxTitle"></div>' +
        '<div class="lightbox-counter" id="lightboxCounter"></div>' +
        '<button type="button" class="lb-btn" id="lightboxClose" aria-label="Cerrar visor">&times;</button>' +
      '</div>' +
      '<div class="lightbox-stage" id="lightboxStage">' +
        '<div class="lightbox-media" id="lightboxMedia">' +
          '<img class="lightbox-img" id="lightboxImg" src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'/%3E" alt="">' +
          '<video class="lightbox-video" id="lightboxVideo" controls playsinline preload="metadata"></video>' +
        '</div>' +
        '<button type="button" class="lb-btn lightbox-nav prev" id="lightboxPrev" aria-label="Anterior">&lsaquo;</button>' +
        '<button type="button" class="lb-btn lightbox-nav next" id="lightboxNext" aria-label="Siguiente">&rsaquo;</button>' +
      '</div>' +
      '<div class="lightbox-footer">' +
        '<div class="lightbox-zoom" id="lightboxZoom">' +
          '<button type="button" class="lb-btn" id="lightboxZoomOut" aria-label="Alejar">&minus;</button>' +
          '<span class="lightbox-zoom-level" id="lightboxZoomLevel">100%</span>' +
          '<button type="button" class="lb-btn" id="lightboxZoomIn" aria-label="Acercar">+</button>' +
          '<button type="button" class="lb-btn" id="lightboxReset" aria-label="Restablecer zoom" style="width:auto;padding:0 .7rem;font-size:.78rem;">1:1</button>' +
        '</div>' +
        '<p class="lightbox-caption" id="lightboxCaption"></p>' +
      '</div>';

    document.body.appendChild(root);

    stage = $('#lightboxStage', root);
    mediaEl = $('#lightboxMedia', root);
    imgEl = $('#lightboxImg', root);
    videoEl = $('#lightboxVideo', root);
    titleEl = $('#lightboxTitle', root);
    capEl = $('#lightboxCaption', root);
    cntEl = $('#lightboxCounter', root);
    zoomBox = $('#lightboxZoom', root);
    levelEl = $('#lightboxZoomLevel', root);
  }

  /* ---------- Galería: se arma con los [data-zoom] del documento ---------- */
  function collect() {
    items = $$('[data-zoom]').map(function (btn) {
      return {
        src: btn.getAttribute('data-zoom'),
        type: btn.getAttribute('data-zoom-type') || 'image',
        title: btn.getAttribute('data-zoom-title') || '',
        caption: btn.getAttribute('data-zoom-caption') || '',
        trigger: btn
      };
    });
  }

  /* ---------- Zoom ---------- */
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

  function applyTransform() {
    if (!curEl) return;
    curEl.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    levelEl.textContent = Math.round(scale * 100) + '%';
  }

  /* No se permite ampliar mas alla de la resolucion original del archivo:
     por encima de esa escala la imagen se veria pixeleada. */
  function updateMaxScale() {
    if (!curEl || curEl === videoEl || !curEl.naturalWidth || !curEl.offsetWidth) {
      maxScale = MAX_SCALE;
      return;
    }
    maxScale = Math.max(1, Math.min(MAX_SCALE, curEl.naturalWidth / curEl.offsetWidth));
    levelEl.title = 'Maximo ' + Math.round(maxScale * 100) + '% (resolucion original)';
  }

  function clampTranslate() {
    if (scale <= 1) { tx = 0; ty = 0; return; }
    var w = (curEl ? curEl.offsetWidth : 0) * scale;
    var h = (curEl ? curEl.offsetHeight : 0) * scale;
    var maxX = Math.max(0, (w - stage.clientWidth) / 2);
    var maxY = Math.max(0, (h - stage.clientHeight) / 2);
    tx = clamp(tx, -maxX, maxX);
    ty = clamp(ty, -maxY, maxY);
  }

  /* zoomTo mantiene fijo el punto (ox,oy) de la pantalla */
  function zoomTo(target, ox, oy) {
    var prev = scale;
    var next = clamp(target, MIN_SCALE, maxScale);
    if (next === prev) return;
    var r = stage.getBoundingClientRect();
    var cx = (ox === undefined ? r.width / 2 : ox - r.left);
    var cy = (oy === undefined ? r.height / 2 : oy - r.top);
    var px = (cx - r.width / 2 - tx) / prev;
    var py = (cy - r.height / 2 - ty) / prev;
    scale = next;
    tx = cx - r.width / 2 - px * scale;
    ty = cy - r.height / 2 - py * scale;
    clampTranslate();
    applyTransform();
    stage.classList.toggle('is-zoomed', scale > 1);
  }

  function zoomBy(factor, ox, oy) {
    zoomTo(scale * factor, ox, oy);
  }

  function resetZoom() {
    scale = 1; tx = 0; ty = 0;
    if (curEl) curEl.style.transform = '';
    if (levelEl) levelEl.textContent = '100%';
    stage.classList.remove('is-zoomed');
  }

  /* ---------- Render ---------- */
  function render() {
    var it = items[idx];

    if (it.type === 'video') {
      curEl = videoEl;
      imgEl.style.display = 'none';
      videoEl.style.display = 'block';
      videoEl.src = it.src;
      videoEl.currentTime = 0;
      videoEl.muted = false;
      resetZoom();
      var p = videoEl.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          // Si el navegador bloquea el arranque con sonido, se reproduce mudo
          videoEl.muted = true;
          var p2 = videoEl.play();
          if (p2 && typeof p2.catch === 'function') { p2.catch(function () { /* no se pudo reproducir */ }); }
        });
      }
    } else {
      curEl = imgEl;
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
      videoEl.style.display = 'none';
      imgEl.style.display = 'block';
      imgEl.src = it.src;
      imgEl.alt = it.title;
      resetZoom();
      updateMaxScale();
    }

    titleEl.textContent = it.title;
    capEl.textContent = it.caption;
    cntEl.textContent = (idx + 1) + ' / ' + items.length;
    zoomBox.style.display = it.type === 'video' ? 'none' : '';
  }

  /* ---------- Abrir / cerrar / navegar ---------- */
  function open(i, trigger) {
    if (!items.length) return;
    lastFocus = trigger || document.activeElement;
    idx = i;
    render();
    root.classList.add('active');
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    opened = true;
    $('#lightboxClose', root).focus();
  }

  function close() {
    if (!opened) return;
    videoEl.pause();
    root.classList.remove('active');
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    opened = false;
    if (lastFocus && typeof lastFocus.focus === 'function') { lastFocus.focus(); }
  }

  function go(step) {
    if (!items.length) return;
    idx = (idx + step + items.length) % items.length;
    render();
  }

  /* ---------- Foco atrapado ---------- */
  function focusables() {
    return $$('button, [href], video[controls]', root).filter(function (el) {
      return el.offsetParent !== null && !el.disabled;
    });
  }

  /* ---------- Puntero: arrastre, pinch y swipe ---------- */
  function dist() {
    var pts = Object.keys(pointers).map(function (k) { return pointers[k]; });
    if (pts.length < 2) return 0;
    var dx = pts[0].x - pts[1].x;
    var dy = pts[0].y - pts[1].y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function mid() {
    var pts = Object.keys(pointers).map(function (k) { return pointers[k]; });
    if (pts.length < 2) return null;
    return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
  }

  function onPointerDown(e) {
    if (!opened) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    pointerCount = Object.keys(pointers).length;

    if (pointerCount === 1) {
      dragging = true;
      moved = 0;
      lastX = startX = e.clientX;
      lastY = startY = e.clientY;
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* no soportado */ }
    } else if (pointerCount === 2) {
      dragging = false;
      pinchDist = dist();
      pinchScale = scale;
    }
  }

  function onPointerMove(e) {
    if (!opened || !pointers[e.pointerId]) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };

    if (pointerCount === 2) {
      var d = dist();
      if (pinchDist > 0) {
        var m = mid();
        zoomTo(pinchScale * (d / pinchDist), m.x, m.y);
      }
      return;
    }

    if (!dragging) return;
    var dx = e.clientX - lastX;
    var dy = e.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX;
    lastY = e.clientY;

    if (scale > 1) {
      tx += dx; ty += dy;
      clampTranslate();
      applyTransform();
    }
  }

  function onPointerUp(e) {
    if (!opened) return;
    delete pointers[e.pointerId];
    pointerCount = Object.keys(pointers).length;

    if (pointerCount < 2) { pinchDist = 0; }
    if (pointerCount === 0) {
      dragging = false;
      stage.classList.remove('is-panning');
      // Swipe hacia abajo para cerrar (solo si no se arrastró una imagen ampliada)
      var dy = e.clientY - startY;
      var dx = e.clientX - startX;
      if (scale <= 1 && Math.abs(dy) > 100 && Math.abs(dx) < 60 && moved > 100) {
        close();
      }
    }
  }

  /* ---------- Teclado ---------- */
  function onKeyDown(e) {
    if (!opened) return;

    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); return; }

    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(1.25); return; }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(0.8); return; }
    if (e.key === '0') { e.preventDefault(); resetZoom(); return; }

    // Foco atrapado dentro del dialogo
    if (e.key === 'Tab') {
      var f = focusables();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  }

  /* ---------- Arranque ---------- */
  function init() {
    build();
    collect();

    // Al cargar la imagen se recalcula el limite de zoom (resolucion original)
    imgEl.addEventListener('load', function () {
      updateMaxScale();
      applyTransform();
    });

    // Clic en cualquier elemento con data-zoom abre el visor
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest ? e.target.closest('[data-zoom]') : null;
      if (!trigger) return;
      e.preventDefault();
      var i = items.findIndex(function (it) { return it.trigger === trigger; });
      if (i > -1) open(i, trigger);
    });

    // Enter o Espacio sobre un elemento zoomable (teclado)
    document.addEventListener('keydown', function (e) {
      if (opened) return;
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      var t = document.activeElement;
      if (!t || !t.hasAttribute || !t.hasAttribute('data-zoom')) return;
      e.preventDefault();
      var i = items.findIndex(function (it) { return it.trigger === t; });
      if (i > -1) open(i, t);
    });

    $('#lightboxClose', root).addEventListener('click', close);
    $('#lightboxPrev', root).addEventListener('click', function () { go(-1); });
    $('#lightboxNext', root).addEventListener('click', function () { go(1); });
    $('#lightboxZoomIn', root).addEventListener('click', function () { zoomBy(1.25); });
    $('#lightboxZoomOut', root).addEventListener('click', function () { zoomBy(0.8); });
    $('#lightboxReset', root).addEventListener('click', resetZoom);

    // Click fuera del contenido cierra
    stage.addEventListener('click', function (e) {
      if (e.target === stage) close();
    });

    // Rueda del mouse: zoom en el punto del cursor
    stage.addEventListener('wheel', function (e) {
      if (!opened) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
    }, { passive: false });

    // Doble click: alterna 1x / 2.5x
    stage.addEventListener('dblclick', function (e) {
      if (!opened) return;
      if (scale > 1) { resetZoom(); } else { zoomTo(2.5, e.clientX, e.clientY); }
    });

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', onPointerUp);
    stage.addEventListener('pointercancel', onPointerUp);

    document.addEventListener('keydown', onKeyDown);

    // Al cerrar el navegador se detiene el video
    window.addEventListener('beforeunload', function () { videoEl.pause(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
