// Respaldo 2D (Canvas) para navegadores sin WebGL.
// Usa las mismas flores y posiciones que el ramo 3D (vista frontal) y la misma
// secuencia de crecimiento; cada flor se dibuja con trazos 2D y el resultado se
// convierte en textura de caracteres, como la vista ASCII.
import { computeSlots } from "./bouquet.js?v=mvq5j85t";
import { LINKS } from "./links.js?v=mvq5j85t";
import { dateForFlower, formatDate } from "./calendar.js?v=mvq5j85t";

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);
const GLYPHS = "%#@&8$WMB*oahkbdpqwmZO0QLCJUYXzcvunxrjft";

function petalPath(ctx, L, W, round) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  if (round) {
    ctx.bezierCurveTo(W, -L * 0.3, W * 0.8, -L * 0.95, 0, -L);
    ctx.bezierCurveTo(-W * 0.8, -L * 0.95, -W, -L * 0.3, 0, 0);
  } else {
    ctx.quadraticCurveTo(W, -L * 0.42, 0, -L);
    ctx.quadraticCurveTo(-W, -L * 0.42, 0, 0);
  }
  ctx.closePath();
}

function fillPetal(ctx, L, base, tip) {
  const g = ctx.createLinearGradient(0, 0, 0, -L);
  g.addColorStop(0, base);
  g.addColorStop(1, tip);
  ctx.fillStyle = g;
  ctx.fill();
}

/** Corona de pétalos en 2D. o = apertura (0 capullo, 1 abierta). */
function crown(ctx, { count, L, W, round = false, spread = 1, base, tip, spin = 0, o }) {
  for (let k = 0; k < count; k++) {
    const open = spin + (k / count) * Math.PI * 2;
    // Capullo: todos los pétalos apuntan hacia arriba y se abren en abanico.
    // spread < 1: pétalos en copa (tulipán), repartidos a ambos lados de la vertical.
    const fan = ((k / Math.max(1, count - 1)) - 0.5);
    const a = spread < 1
      ? fan * 2 * spread * Math.PI * o + (1 - o) * fan * 0.3
      : o * open + (1 - o) * fan * 0.35;
    ctx.save();
    ctx.rotate(a);
    petalPath(ctx, L * (0.6 + 0.4 * o), W * (0.45 + 0.55 * o), round);
    fillPetal(ctx, L, base, tip);
    ctx.restore();
  }
}

function disc(ctx, r, color) {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawHead(ctx, cfg, s, o) {
  const [base, tip] = cfg.colors;
  const n = cfg.petalCount;
  switch (cfg.species) {
    case "lily":
      crown(ctx, { count: 6, L: 1.05 * s, W: 0.36 * s, base, tip, spin: cfg.spin, o });
      if (o > 0.6) {
        ctx.strokeStyle = "#e8f0b0";
        ctx.lineWidth = Math.max(1, s * 0.02);
        for (let k = 0; k < 6; k++) {
          const a = cfg.spin + k + 0.3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.sin(a) * s * 0.45, -Math.cos(a) * s * 0.45);
          ctx.stroke();
          ctx.save();
          ctx.translate(Math.sin(a) * s * 0.47, -Math.cos(a) * s * 0.47);
          disc(ctx, s * 0.04, cfg.center);
          ctx.restore();
        }
      }
      break;
    case "rose":
      [1, 0.75, 0.5].forEach((f, L) =>
        crown(ctx, { count: 5 + L, L: 0.62 * s * f, W: 0.5 * s * f, round: true, base: L ? base : tip, tip, spin: cfg.spin + L, o: o * (1 - L * 0.15) }));
      disc(ctx, s * 0.12 * (0.5 + o * 0.5), base);
      break;
    case "tulip":
      crown(ctx, { count: 5, L: 0.85 * s, W: 0.5 * s, round: true, spread: 0.12, base, tip, spin: -0.3, o });
      break;
    case "dahlia":
      [1, 0.78, 0.55].forEach((f, L) =>
        crown(ctx, { count: Math.round(n / 3), L: 0.55 * s * f, W: 0.16 * s * f, base, tip, spin: cfg.spin + L * 0.4, o }));
      disc(ctx, s * 0.09 * o, cfg.center);
      break;
    case "daisy":
      crown(ctx, { count: n, L: 0.72 * s, W: 0.1 * s, base: tip, tip, spin: cfg.spin, o });
      disc(ctx, s * 0.16 * o, cfg.center);
      break;
    case "anemone":
      crown(ctx, { count: n, L: 0.56 * s, W: 0.5 * s, round: true, base, tip, spin: cfg.spin, o });
      disc(ctx, s * 0.13 * o, cfg.center);
      break;
    case "cosmos":
      crown(ctx, { count: n, L: 0.62 * s, W: 0.32 * s, round: true, base, tip, spin: cfg.spin, o });
      disc(ctx, s * 0.09 * o, cfg.center);
      break;
    case "cluster":
      [[0, -0.18], [0.2, -0.04], [-0.2, -0.02], [0.07, 0.16], [-0.1, 0.14]].forEach(([x, y], k) => {
        ctx.save();
        ctx.translate(x * s, y * s);
        crown(ctx, { count: 5, L: 0.2 * s, W: 0.19 * s, round: true, base, tip, spin: cfg.spin + k, o });
        disc(ctx, s * 0.035 * o, cfg.center);
        ctx.restore();
      });
      break;
  }
}

export function startFallback2d({ canvas, flowers, count, instantBelow, stagger, duration, onReady }) {
  const ctx = canvas.getContext("2d");
  const slots = computeSlots(flowers);
  const low = document.createElement("canvas");
  const lctx = low.getContext("2d");
  const glyphLayer = document.createElement("canvas");
  let W = 0, H = 0, cell = 5, cols = 0, rows = 0;
  let scale = 1, ox = 0, oy = 0;

  // Animación: misma regla que el 3D (las ya vistas aparecen abiertas).
  const t0 = performance.now() / 1000 + 0.4;
  const starts = flowers.map((_, i) => (i < instantBelow ? -Infinity : t0 + Math.max(0, i - instantBelow) * stagger));
  const growthAt = (i, now) => (i >= count ? 0 : clamp01((now - starts[i]) / duration));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = Math.max(3.6, Math.min(6, Math.min(W, H) / 200));
    cols = Math.ceil(W / (cell * 0.62));
    rows = Math.ceil(H / cell);
    low.width = cols;
    low.height = rows;
    // Capa de caracteres: glifos claros sobre gris, que multiplica al color.
    glyphLayer.width = Math.round(W * dpr);
    glyphLayer.height = Math.round(H * dpr);
    const g = glyphLayer.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "#6b6b6b";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#ffffff";
    g.font = `700 ${cell}px "Courier New", monospace`;
    g.textBaseline = "top";
    let seed = 11;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        seed = (seed * 16807) % 2147483647;
        g.fillText(GLYPHS[seed % GLYPHS.length], x * cell * 0.62, y * cell);
      }
    }
    // Encuadre frontal del ramo (mundo: x ±3.3, y −1.3…6).
    scale = Math.min(W / 7.4, (H - 110) / 7.8);
    ox = W / 2;
    oy = 110 + 6.1 * scale;
    draw(performance.now() / 1000);
  }

  // Coordenadas de mundo → píxeles de la textura baja.
  const px = (v) => ((ox + v.x * scale) / W) * cols;
  const py = (v) => ((oy - v.y * scale) / H) * rows;

  function drawScene(now) {
    const k = cols / W;
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.fillStyle = "#000";
    lctx.fillRect(0, 0, cols, rows);
    lctx.lineCap = "round";

    const order = slots.map((s, i) => i).sort((a, b) => slots[a].head.z - slots[b].head.z);
    // Tallos y hojas primero.
    for (const i of order) {
      const p = growthAt(i, now);
      if (p <= 0) continue;
      const curve = slots[i].curve;
      const stemP = easeOut(p / 0.45);
      lctx.strokeStyle = "#4f9a44";
      lctx.lineWidth = Math.max(1, flowers[i].stemThickness * scale * k * 2.2);
      lctx.beginPath();
      const steps = 24;
      for (let j = 0; j <= steps * stemP; j++) {
        const v = curve.getPointAt(j / steps);
        j ? lctx.lineTo(px(v), py(v)) : lctx.moveTo(px(v), py(v));
      }
      lctx.stroke();
      for (let l = 0; l < flowers[i].leafCount; l++) {
        const u = 0.08 + (l / flowers[i].leafCount) * 0.3;
        const a = smooth((stemP - u) / 0.25);
        if (a <= 0) continue;
        const v = curve.getPointAt(u);
        lctx.save();
        lctx.translate(px(v), py(v));
        lctx.rotate((l % 2 ? 1 : -1) * (0.5 + 0.2 * (l % 3)));
        petalPath(lctx, 1.1 * scale * k * a, 0.12 * scale * k, false);
        fillPetal(lctx, 1.1 * scale * k, "#24692b", "#7cc95f");
        lctx.restore();
      }
    }
    // Cabezas, de atrás hacia delante.
    for (const i of order) {
      const p = growthAt(i, now);
      const bud = smooth((p - 0.3) / 0.25);
      if (bud <= 0) continue;
      const o = easeOut((p - 0.6) / 0.38);
      const tip = slots[i].curve.getPointAt(easeOut(p / 0.45));
      lctx.save();
      lctx.translate(px(tip), py(tip));
      drawHead(lctx, flowers[i], flowers[i].size * scale * k * bud * 0.68, o);
      lctx.restore();
    }
  }

  function draw(now) {
    drawScene(now);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
    ctx.filter = "brightness(1.35) saturate(1.3)";
    ctx.drawImage(low, 0, 0, W, H);
    ctx.filter = "none";
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(glyphLayer, 0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  }

  const end = Math.max(...starts.filter(Number.isFinite), 0) + duration;
  function loop() {
    const now = performance.now() / 1000;
    draw(now);
    if (now < end + 0.1) requestAnimationFrame(loop);
  }

  // Enlaces: clic sobre una cabeza abierta.
  canvas.addEventListener("click", (e) => {
    const now = performance.now() / 1000;
    for (let i = count - 1; i >= 0; i--) {
      if (growthAt(i, now) < 0.9 || !LINKS[i + 1]) continue;
      const h = slots[i].head;
      const d = Math.hypot(e.clientX - (ox + h.x * scale), e.clientY - (oy - h.y * scale));
      if (d < flowers[i].size * scale) { location.href = LINKS[i + 1].url; return; }
    }
  });
  canvas.title = Object.entries(LINKS).map(([d, l]) => `${l.title} · ${formatDate(dateForFlower(+d))}`).join("\n");

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(loop);
  onReady?.({ end, draw });
}
