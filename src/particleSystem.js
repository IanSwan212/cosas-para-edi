// Partículas tipográficas. Cada palabra es una LoveParticle renderizada en Canvas.

import { fontString } from "./fontManager.js?v=mvq4ne1g";

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixColor(a, b, k) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(",")})`;
}

export class LoveParticle {
  constructor({ text, language, x, y, targetX, targetY, delay, duration, fontSize, opacity, brightness, direction, color, box }) {
    this.text = text;
    this.language = language; // entrada completa de la base de datos
    this.x = x; // posición inicial (desplazada unos px)
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.delay = delay; // ms de la línea temporal en que empieza a aparecer
    this.duration = duration;
    this.fontSize = fontSize;
    this.opacity = opacity; // opacidad máxima (profundidad)
    this.brightness = brightness;
    this.direction = direction;
    this.color = color;
    this.font = fontString(fontSize);
    this.box = box;
    this.width = box.x1 - box.x0;
    this.height = box.y1 - box.y0;
    this.startScale = 0.9 + 0.06 * brightness;
    this.hovered = false;
    // Estado calculado
    this.alpha = 0;
    this.cx = x;
    this.cy = y;
    this.scale = this.startScale;
  }

  /** Estado puro en función del tiempo: reproducible en cualquier instante. */
  update(time) {
    const k = Math.min(1, Math.max(0, (time - this.delay) / this.duration));
    const e = easeOutCubic(k);
    this.alpha = e * this.opacity;
    this.cx = this.x + (this.targetX - this.x) * e;
    this.cy = this.y + (this.targetY - this.y) * e;
    this.scale = this.startScale + (1 - this.startScale) * e;
    return k >= 1;
  }

  render(ctx) {
    if (this.alpha <= 0.002) return;
    ctx.globalAlpha = this.alpha;
    ctx.font = this.font;
    ctx.direction = this.direction;
    ctx.fillStyle = this.color;
    if (this.scale !== 1) {
      ctx.save();
      ctx.translate(this.cx, this.cy);
      ctx.scale(this.scale, this.scale);
      ctx.fillText(this.text, 0, 0);
      ctx.restore();
    } else {
      ctx.fillText(this.text, this.cx, this.cy);
    }
  }
}

/** Línea temporal de fases (ms), escalada a CONFIG.animationDuration. */
export function createTimeline(duration) {
  const k = duration / 18000;
  return {
    firstWord: 1800 * k,
    edgeEnd: 10600 * k,
    innerStart: 6200 * k,
    innerEnd: 14600 * k,
    finalStart: 15000 * k,
    finalDuration: 1100 * k,
    beatStart: 16150 * k,
    end: duration
  };
}

/**
 * Convierte los huecos del layout en partículas con tiempos de aparición:
 * primero el contorno (en el orden del parámetro t: lóbulo derecho, punta,
 * lóbulo izquierdo, como en el vídeo de referencia) y después el interior
 * en orden aleatorio sembrado, con comienzo lento y aceleración progresiva.
 */
export function buildParticles(layout, { rng, timeline, primary, secondary }) {
  const edges = layout.slots.filter((s) => s.edge).sort((a, b) => a.contourT - b.contourT);
  const inner = rng.shuffle(layout.slots.filter((s) => !s.edge));
  const T = timeline;
  const schedule = [];
  edges.forEach((s, i) => {
    const u = edges.length > 1 ? i / (edges.length - 1) : 0;
    schedule.push([s, T.firstWord + (T.edgeEnd - T.firstWord) * Math.pow(u, 0.72)]);
  });
  inner.forEach((s, i) => {
    const u = inner.length > 1 ? i / (inner.length - 1) : 0;
    schedule.push([s, T.innerStart + (T.innerEnd - T.innerStart) * Math.pow(u, 0.85)]);
  });

  const scaleK = T.end / 18000;
  return schedule.map(([s, t], i) => {
    const brightness = rng.range(0.55, 1);
    const angle = rng.range(0, Math.PI * 2);
    const drift = rng.range(1.5, 5) * (s.size / 11);
    const ty = s.baseline;
    return new LoveParticle({
      text: s.entry.text,
      language: s.entry,
      x: s.x + Math.cos(angle) * drift,
      y: ty + Math.sin(angle) * drift,
      targetX: s.x,
      targetY: ty,
      // el primer elemento aparece exactamente en firstWord; el resto con jitter orgánico
      delay: i === 0 ? t : Math.max(T.firstWord, t + rng.range(-160, 160) * scaleK),
      duration: rng.range(650, 1050) * scaleK,
      fontSize: s.size,
      opacity: 0.72 + 0.28 * brightness,
      brightness,
      direction: s.entry.direction,
      color: mixColor(secondary, primary, 0.35 + 0.65 * brightness),
      box: s.box
    });
  });
}

/** Índice espacial para hit-testing rápido. */
export function createSpatialHash(particles, cell = 48) {
  const grid = new Map();
  const key = (i, j) => i * 73856093 ^ j * 19349663;
  for (const p of particles) {
    for (let i = Math.floor(p.box.x0 / cell); i <= Math.floor(p.box.x1 / cell); i++) {
      for (let j = Math.floor(p.box.y0 / cell); j <= Math.floor(p.box.y1 / cell); j++) {
        const k = key(i, j);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(p);
      }
    }
  }
  return {
    query(x, y) {
      const list = grid.get(key(Math.floor(x / cell), Math.floor(y / cell))) || [];
      for (const p of list) if (x >= p.box.x0 - 2 && x <= p.box.x1 + 2 && y >= p.box.y0 - 2 && y <= p.box.y1 + 2) return p;
      return null;
    }
  };
}
