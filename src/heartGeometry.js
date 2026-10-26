// Geometría del corazón: x(t) = 16 sin³t, y(t) = 13cos t − 5cos 2t − 2cos 3t − cos 4t.
// La curva solo define el contorno; la pertenencia al interior se calcula con
// intervalos de cruce por fila (regla par-impar sobre el polígono muestreado).

export function heartPoint(t) {
  const s = Math.sin(t);
  return {
    x: 16 * s * s * s,
    y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
  };
}

const SAMPLES = 900;
const RAW = Array.from({ length: SAMPLES }, (_, i) => heartPoint((i / SAMPLES) * Math.PI * 2));
export const HEART_BOUNDS = RAW.reduce(
  (b, p) => ({
    minX: Math.min(b.minX, p.x), maxX: Math.max(b.maxX, p.x),
    minY: Math.min(b.minY, p.y), maxY: Math.max(b.maxY, p.y)
  }),
  { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
);

/**
 * Crea la máscara en coordenadas de pantalla (px CSS).
 * @param {number} width  ancho del viewport
 * @param {number} height alto del viewport
 * @param {number} fill   fracción del viewport que ocupa el corazón
 */
export function createHeartMask(width, height, fill = 0.86) {
  const hw = HEART_BOUNDS.maxX - HEART_BOUNDS.minX;
  const hh = HEART_BOUNDS.maxY - HEART_BOUNDS.minY;
  const scale = Math.min((width * fill) / hw, (height * fill) / hh);
  const cx = width / 2;
  // Centra verticalmente la caja delimitadora (y crece hacia arriba en la ecuación).
  const cy = height / 2 + ((HEART_BOUNDS.maxY + HEART_BOUNDS.minY) / 2) * scale;

  const toScreen = (p) => ({ x: cx + p.x * scale, y: cy - p.y * scale });
  const polygon = RAW.map(toScreen);
  const top = Math.floor(cy - HEART_BOUNDS.maxY * scale);
  const bottom = Math.ceil(cy - HEART_BOUNDS.minY * scale);

  // Intervalos interiores por fila de 1 px.
  const rows = [];
  for (let y = top; y <= bottom; y++) {
    const yy = y + 0.5;
    const xs = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i];
      const b = polygon[(i + 1) % polygon.length];
      if ((a.y <= yy && b.y > yy) || (b.y <= yy && a.y > yy)) {
        xs.push(a.x + ((yy - a.y) / (b.y - a.y)) * (b.x - a.x));
      }
    }
    xs.sort((m, n) => m - n);
    const intervals = [];
    for (let k = 0; k + 1 < xs.length; k += 2) intervals.push([xs[k], xs[k + 1]]);
    rows.push(intervals);
  }

  const rowAt = (y) => rows[Math.round(y - 0.5) - top] || [];

  function spanInside(y, x0, x1, inset) {
    for (const [a, b] of rowAt(y)) if (x0 >= a + inset && x1 <= b - inset) return true;
    return false;
  }

  return {
    scale, cx, cy, top, bottom, polygon, toScreen,
    rowIntervals: rowAt,
    contains: (x, y) => spanInside(y, x, x, 0),
    /** Caja completamente dentro de la silueta (muestreo en 5 filas). */
    boxInside(x0, y0, x1, y1, inset = 0) {
      for (let k = 0; k <= 4; k++) {
        if (!spanInside(y0 + ((y1 - y0) * k) / 4, x0, x1, inset)) return false;
      }
      return true;
    },
    /** Distancia aproximada al contorno y parámetro t del punto más cercano. */
    nearestContour(x, y) {
      let best = Infinity, idx = 0;
      for (let i = 0; i < polygon.length; i += 3) {
        const dx = polygon[i].x - x, dy = polygon[i].y - y;
        const d = dx * dx + dy * dy;
        if (d < best) { best = d; idx = i; }
      }
      return { distance: Math.sqrt(best), t: (idx / polygon.length) * Math.PI * 2 };
    }
  };
}
