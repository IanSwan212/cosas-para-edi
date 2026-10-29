// Empaquetado tipográfico dentro de la máscara del corazón.
//
// Estrategia: filas adaptativas. El corazón se divide en bandas horizontales;
// en cada banda se avanza un cursor y se coloca la siguiente traducción del
// «mazo» equilibrado cuya caja medida cabe por completo dentro de la silueta,
// fuera de la zona central reservada y sin solaparse con lo ya colocado.
// Una segunda pasada con tamaño menor rellena los huecos de los bordes.

import { fontString } from "./fontManager.js?v=mvt7cftc";

const SIZE_STEPS = [0.88, 1, 1, 1, 1.12, 1.25];
const RECENT_WINDOW = 10; // no repetir una expresión entre las últimas N colocadas

export function measureFactory(ctx) {
  const cache = new Map();
  return function measure(text, size, direction = "ltr") {
    const key = `${size}|${text}`;
    let m = cache.get(key);
    if (!m) {
      ctx.font = fontString(size);
      ctx.direction = direction;
      const r = ctx.measureText(text);
      const ascent = Math.max(r.actualBoundingBoxAscent || 0, size * 0.72);
      const descent = Math.max(r.actualBoundingBoxDescent || 0, size * 0.18);
      m = { width: r.width, ascent, descent, height: ascent + descent };
      cache.set(key, m);
    }
    return m;
  };
}

/** Mazo equilibrado: cada idioma aparece una vez por ronda, en orden barajado. */
function createDeck(translations, rng) {
  let order = [];
  let pointer = 0;
  const recent = [];
  const refill = () => {
    const round = rng.shuffle(translations.slice());
    order = order.slice(pointer).concat(round);
    pointer = 0;
  };
  refill();
  return {
    /** Devuelve la primera entrada (dentro de una ventana) que acepte `fits`. */
    take(fits, lookahead = 40) {
      if (order.length - pointer < lookahead + 1) refill();
      for (let i = 0; i < lookahead; i++) {
        const entry = order[pointer + i];
        if (recent.includes(entry.id)) continue;
        const result = fits(entry);
        if (result) {
          [order[pointer], order[pointer + i]] = [order[pointer + i], order[pointer]];
          pointer++;
          recent.push(entry.id);
          if (recent.length > RECENT_WINDOW) recent.shift();
          return { entry, ...result };
        }
      }
      return null;
    }
  };
}

const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

export function layoutHeart({ mask, translations, measure, baseSize, rng, finalMessage, finalScale }) {
  const slots = [];
  const gapMin = baseSize * 0.4;
  const gapMax = baseSize * 0.85;
  const rowH = baseSize * 1.42;

  // Zona central reservada para el mensaje final.
  const finalSize = baseSize * finalScale * 1.5;
  const fm = measure(finalMessage, finalSize);
  const fcx = mask.cx;
  const fcy = mask.cy - 1.5 * mask.scale; // ligeramente por encima del centro geométrico
  const pad = baseSize * 0.9;
  const reserved = {
    x0: fcx - fm.width * 0.58 - pad, x1: fcx + fm.width * 0.58 + pad,
    y0: fcy - fm.height / 2 - pad, y1: fcy + fm.height / 2 + pad
  };

  const deck = createDeck(translations, rng);
  const inset = baseSize * 0.25;
  const bands = [];
  const startY = mask.top + rng.range(0.1, 0.5) * rowH;
  for (let y0 = startY; y0 + rowH <= mask.bottom; y0 += rowH) bands.push({ y0, y1: y0 + rowH, placed: [] });

  /** Intenta colocar una palabra anclada por su borde izquierdo (o derecho). */
  function tryPlace(band, anchor, alignRight, sizeFor, gapScale) {
    return deck.take((entry) => {
      const size = sizeFor();
      const m = measure(entry.text, size, entry.direction);
      const slack = rowH - m.height;
      if (slack < 0) return null;
      const yTop = band.y0 + slack * (0.2 + rng.next() * 0.6);
      const x0 = alignRight ? anchor - m.width : anchor;
      const box = { x0, x1: x0 + m.width, y0: yTop, y1: yTop + m.height };
      if (!mask.boxInside(box.x0, box.y0, box.x1, box.y1, inset)) return null;
      if (overlaps(box, reserved)) return null;
      const g = gapMin * gapScale;
      for (const p of band.placed) if (overlaps({ ...box, x0: box.x0 - g, x1: box.x1 + g }, p)) return null;
      return { size, m, box };
    }, 40);
  }

  function commit(pick, band) {
    const { entry, size, m, box } = pick;
    band.placed.push(box);
    const cx = (box.x0 + box.x1) / 2;
    const cy = (box.y0 + box.y1) / 2;
    const near = mask.nearestContour(cx, cy);
    slots.push({
      entry, size, box,
      x: cx,
      baseline: box.y0 + m.ascent,
      edge: near.distance < baseSize * 2.6,
      contourT: near.t,
      distance: near.distance
    });
  }

  /** Primero se fijan palabras pegadas al contorno: definen la silueta. */
  function anchorEdges(band) {
    const ivs = mask.rowIntervals((band.y0 + band.y1) / 2);
    const sizeFor = () => baseSize * rng.pick(SIZE_STEPS);
    for (const [a, b] of ivs) {
      for (const right of [false, true]) {
        // Se desliza hacia dentro hasta que la caja (en toda la altura de la banda) quepa.
        for (let step = 0; step < 14; step++) {
          const anchor = right ? b - inset - step * baseSize * 0.35 : a + inset + step * baseSize * 0.35;
          const pick = tryPlace(band, anchor, right, sizeFor, 1);
          if (pick) { commit(pick, band); break; }
        }
      }
    }
  }

  function fillBand(band, sizeFor, gapScale) {
    const mid = (band.y0 + band.y1) / 2;
    const ivs = mask.rowIntervals(mid);
    if (!ivs.length) return;
    let x = ivs[0][0] + rng.range(0, gapMax * 0.6);
    const xEnd = ivs[ivs.length - 1][1];
    while (x < xEnd) {
      const pick = tryPlace(band, x, false, sizeFor, gapScale);
      if (!pick) { x += baseSize * 0.4; continue; }
      commit(pick, band);
      x = pick.box.x1 + rng.range(gapMin, gapMax) * gapScale;
    }
  }

  for (const band of bands) anchorEdges(band);
  for (const band of bands) fillBand(band, () => baseSize * rng.pick(SIZE_STEPS), 1);
  // Segunda pasada: palabras más pequeñas en los huecos sobrantes.
  for (const band of bands) fillBand(band, () => baseSize * 0.74, 0.6);

  return {
    slots,
    final: { text: finalMessage, size: finalSize, x: fcx, baseline: fcy - fm.height / 2 + fm.ascent, box: reserved }
  };
}

/**
 * Hace fluir un texto (el mensaje) por las filas del corazón, como un párrafo
 * con forma. Busca por bisección el mayor tamaño de fuente con el que todo cabe.
 * Respeta la zona central reservada para «TE AMO».
 */
export function layoutMessage({ mask, lines, chorusFrom, lang, measure, reserved, rtl = false, minSize = 5, maxSize = 34 }) {
  const seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(lang, { granularity: "word" }) : null;
  const tokens = [];
  lines.forEach((line, li) => {
    const kind = li >= chorusFrom ? "chorus" : "body";
    const parts = seg ? [...seg.segment(line)].map((s) => s.segment) : line.split(/(\s+)/);
    for (const p of parts) {
      if (!p) continue;
      const space = /^\s+$/.test(p);
      const last = tokens[tokens.length - 1];
      // La puntuación se pega a la palabra anterior para no empezar fila con ella.
      if (!space && last && !last.space && /^[\p{P}]+$/u.test(p)) { last.text += p; continue; }
      tokens.push({ text: space ? " " : p, space, kind });
    }
    if (li < lines.length - 1) tokens.push({ text: " · ", space: true, sep: true, kind });
  });

  // La última frase («Te amo tanto») se repite para rellenar el espacio sobrante.
  const lastSep = tokens.map((t) => !!t.sep).lastIndexOf(true);
  const filler = lastSep >= 0 ? tokens.slice(lastSep) : tokens.slice();
  const tokAt = (i) => (i < tokens.length ? tokens[i] : filler[(i - tokens.length) % filler.length]);

  const fit = (size, fillRest = false) => {
    const more = (i) => fillRest || i < tokens.length;
    const rowH = size * 1.38;
    const inset = size * 0.3;
    const placed = [];
    let ti = 0;
    for (let y0 = mask.top + size * 0.3; y0 + rowH <= mask.bottom && more(ti); y0 += rowH) {
      const y1 = y0 + rowH;
      const segs = [];
      for (const [a, b] of mask.rowIntervals((y0 + y1) / 2)) {
        if (y1 > reserved.y0 && y0 < reserved.y1 && reserved.x0 < b && reserved.x1 > a) {
          if (reserved.x0 > a) segs.push([a, reserved.x0]);
          if (reserved.x1 < b) segs.push([reserved.x1, b]);
        } else segs.push([a, b]);
      }
      // En escrituras de derecha a izquierda, cada fila se llena desde el borde derecho.
      for (const [a, b] of rtl ? segs.slice().reverse() : segs) {
        let x = rtl ? b - inset : a + inset;
        let lineStart = true;
        while (more(ti)) {
          const t = tokAt(ti);
          if (t.space && lineStart) { ti++; continue; }
          const m = measure(t.text, size);
          let ok = false;
          let x0 = rtl ? x - m.width : x;
          while (rtl ? x0 >= a + inset : x0 + m.width <= b - inset) {
            if (mask.boxInside(x0, y0 + rowH * 0.12, x0 + m.width, y1 - rowH * 0.12, 0)) { ok = true; break; }
            x0 += rtl ? -size * 0.4 : size * 0.4;
          }
          if (!ok) {
            // Un separador que no cabe no debe bloquear el resto de la fila.
            if (t.space) { ti++; continue; }
            break;
          }
          if (!t.space || t.sep) placed.push({ text: t.text, kind: t.sep ? "sep" : t.kind, x: x0, w: m.width, baseline: y0 + (rowH - m.height) / 2 + m.ascent, cy: (y0 + y1) / 2 });
          x = rtl ? x0 : x0 + m.width;
          lineStart = false;
          ti++;
        }
      }
    }
    return ti >= tokens.length ? placed : null;
  };

  let lo = minSize, hi = maxSize, best = null, bestSize = minSize;
  for (let i = 0; i < 12; i++) {
    const size = Math.round(((lo + hi) / 2) * 4) / 4;
    const r = fit(size);
    if (r) { best = r; bestSize = size; lo = size; } else hi = size;
  }
  best = fit(bestSize, true) || best || fit(minSize, true) || [];
  return { tokens: best, size: bestSize };
}
