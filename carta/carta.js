// Una carta en arte ASCII de colores que se quema y se vuelve una peonía, como en el video.
//
// Las formas (el sobre con su sello y la peonía con sus rayos de luz) se dibujan primero en un
// lienzo oculto; de ahí sale, por celda de la cuadrícula, el carácter (según el brillo) y su color.
// Los caracteres llegan volando a formar el sobre y el sello late. Al abrirse (sola a los pocos
// segundos o al tocarla) la carta se quema en su lugar: el fuego nace en el sello y se extiende
// hacia afuera; cada carácter se calienta, se vuelve una brasa redonda ( ) ( . o que brilla en
// amarillo y naranja, se enrojece y queda ardiendo bajito. De esas brasas aparece la peonía,
// en la misma cuadrícula, mientras lo demás se apaga. Un halo de luz difuminado da el brillo.
// Todo depende de un solo tiempo t, así que la animación no depende de los cuadros por segundo.

const RAMP = " .,:;i!lI?tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const EMBER = "(()).o°"; // caracteres de brasa, redondos como en el video
const canvas = document.getElementById("carta");
const ctx = canvas.getContext("2d");
const hint = document.getElementById("hint");
const glow = document.createElement("canvas"); // una celda por píxel: el halo de luz
const gctx = glow.getContext("2d");

let W = 0, H = 0, CW = 0, CH = 0, COLS = 0, ROWS = 0, DPR = 1;
let cells = [], stars = [], sparks = [];
let box = { x0: 0, x1: 0, y0: 0, y1: 0 }; // dónde está el sobre
let seal = { x: 0, y: 0 }, bloom = { x: 0, y: 0 };
let t0 = performance.now() / 1000, openAt = Infinity, formedAt = Infinity;
let glowData = null;

const AUTO_OPEN = 5.2; // segundos tras los que la carta se abre sola
const INTRO = 2.6;
const IGNITE = 0.5, SPREAD = 2.6; // el fuego prende en el sello y tarda SPREAD en llegar a las orillas
const BLOOM_AT = 3.6, BLOOM_SPREAD = 2.2; // la peonía empieza a aparecer y tarda en completarse

const rand = (a, b) => a + (b - a) * Math.random();
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (x) => 1 - (1 - x) ** 3;
const smooth = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };

// ---------- Formas ----------

function drawEnvelope(g, cx, cy, s) {
  const w = s * 1.7, h = s * 1.1, x = cx - w / 2, y = cy - h / 2;
  const body = g.createLinearGradient(0, y, 0, y + h);
  body.addColorStop(0, "#f6cf96");
  body.addColorStop(1, "#e09a5c");
  g.fillStyle = body;
  g.fillRect(x, y, w, h);
  // Solapas: la de arriba en V y las de abajo, con líneas más oscuras.
  g.strokeStyle = "#a55a2e";
  g.lineWidth = s * 0.03;
  g.beginPath();
  g.moveTo(x, y); g.lineTo(cx, cy + h * 0.08); g.lineTo(x + w, y);
  g.moveTo(x, y + h); g.lineTo(cx - w * 0.08, cy + h * 0.05);
  g.moveTo(x + w, y + h); g.lineTo(cx + w * 0.08, cy + h * 0.05);
  g.stroke();
  g.fillStyle = "rgba(255,235,200,0.55)";
  g.beginPath(); g.moveTo(x, y); g.lineTo(cx, cy + h * 0.08); g.lineTo(x + w, y); g.closePath(); g.fill();
  g.strokeStyle = "#8f4a24";
  g.lineWidth = s * 0.04;
  g.strokeRect(x, y, w, h);
  // Sello de lacre con un corazón.
  const r = s * 0.2, sy = cy + h * 0.06;
  const seal = g.createRadialGradient(cx - r * 0.3, sy - r * 0.3, r * 0.1, cx, sy, r);
  seal.addColorStop(0, "#ff6fae");
  seal.addColorStop(1, "#a8124f");
  g.fillStyle = seal;
  g.beginPath(); g.arc(cx, sy, r, 0, Math.PI * 2); g.fill();
  heartPath(g, cx, sy + r * 0.05, r * 0.55);
  g.fillStyle = "#ffd0e4";
  g.fill();
}

function heartPath(g, cx, cy, s) {
  g.beginPath();
  for (let i = 0; i <= 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const x = 16 * Math.sin(a) ** 3, y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    const px = cx + (x / 16) * s, py = cy - (y / 16) * s;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
}

// Pétalo ondulado: base angosta en el centro y borde exterior con olanes.
function petal(g, cx, cy, ang, len, width, wobble, seed) {
  const pts = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const u = i / N - 0.5; // -0.5..0.5 a lo ancho del borde
    const ruffle = 1 + wobble * Math.sin(u * 9 + seed) * Math.cos(u * 5 + seed * 2);
    const a = ang + u * width;
    pts.push([cx + Math.cos(a) * len * ruffle, cy + Math.sin(a) * len * ruffle]);
  }
  g.beginPath();
  g.moveTo(cx, cy);
  g.quadraticCurveTo(cx + Math.cos(ang - width * 0.7) * len * 0.55, cy + Math.sin(ang - width * 0.7) * len * 0.55, pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.quadraticCurveTo(cx + Math.cos(ang + width * 0.7) * len * 0.55, cy + Math.sin(ang + width * 0.7) * len * 0.55, cx, cy);
  g.closePath();
}

function drawPeony(g, cx, cy, s) {
  // Rayos de luz suaves detrás de la flor.
  g.save();
  g.globalAlpha = 0.4;
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + 0.1;
    const grad = g.createLinearGradient(cx, cy, cx + Math.cos(a) * s * 2.4, cy + Math.sin(a) * s * 2.4);
    grad.addColorStop(0, "rgba(255,210,170,0.9)");
    grad.addColorStop(1, "rgba(150,120,255,0)");
    g.strokeStyle = grad;
    g.lineWidth = s * (i % 2 ? 0.03 : 0.06);
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * s * 2.4, cy + Math.sin(a) * s * 2.4); g.stroke();
  }
  g.restore();

  // Tallo y hojas (hojas de peonía: divididas en lóbulos alargados).
  g.strokeStyle = "#4c8a3a";
  g.lineWidth = s * 0.07;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(cx, cy + s * 0.5);
  g.bezierCurveTo(cx + s * 0.08, cy + s * 1.1, cx - s * 0.12, cy + s * 1.6, cx - s * 0.04, cy + s * 2.3);
  g.stroke();
  const leaf = (x, y, ang, len) => {
    for (const da of [-0.45, 0, 0.45]) {
      const a = ang + da, l = len * (da ? 0.75 : 1);
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a - 0.35) * l * 0.6, y + Math.sin(a - 0.35) * l * 0.6, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.quadraticCurveTo(x + Math.cos(a + 0.35) * l * 0.6, y + Math.sin(a + 0.35) * l * 0.6, x, y);
      const lg = g.createLinearGradient(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l);
      lg.addColorStop(0, "#3f7a32");
      lg.addColorStop(1, "#7cc05a");
      g.fillStyle = lg;
      g.fill();
    }
  };
  leaf(cx + s * 0.02, cy + s * 1.15, -0.5, s * 0.85);
  leaf(cx - s * 0.06, cy + s * 1.6, Math.PI + 0.45, s * 0.8);

  // Pétalos, de las capas de afuera (grandes y claras) a las de adentro (pequeñas, rizadas, más intensas).
  // Pocos pétalos grandes por capa y bordes oscuros entre ellos, para que en ASCII se distingan.
  const layers = [
    { n: 7, len: 1.0, width: 1.15, wob: 0.1, c0: "#b8336c", c1: "#ffd0e0" },
    { n: 7, len: 0.82, width: 1.1, wob: 0.13, c0: "#ad2c66", c1: "#ffb6cf" },
    { n: 8, len: 0.64, width: 1.0, wob: 0.16, c0: "#a02460", c1: "#ff9cbf" },
    { n: 8, len: 0.47, width: 0.95, wob: 0.2, c0: "#911c56", c1: "#ff82ae" },
    { n: 7, len: 0.31, width: 1.0, wob: 0.24, c0: "#80154b", c1: "#f76a9c" },
    { n: 5, len: 0.17, width: 1.2, wob: 0.3, c0: "#6e1040", c1: "#e8558a" },
  ];
  layers.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      const ang = (i / L.n) * Math.PI * 2 + li * 0.37 + Math.sin(i * 7.3 + li) * 0.12;
      const len = s * L.len * (0.92 + 0.12 * Math.sin(i * 3.1 + li * 2));
      // La flor se ve un poco de frente y desde arriba: la parte de abajo se aplana.
      const oy = cy + Math.sin(ang) * len * 0.08;
      const grad = g.createRadialGradient(cx, cy, len * 0.05, cx, cy, len);
      grad.addColorStop(0, L.c0);
      grad.addColorStop(1, L.c1);
      petal(g, cx, oy, ang, len, L.width, L.wob, i * 1.7 + li);
      g.fillStyle = grad;
      g.fill();
      g.strokeStyle = "rgba(60,6,28,0.85)";
      g.lineWidth = s * 0.028;
      g.stroke();
    }
  });
  // Brillo en el corazón de la flor.
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, s * 0.2);
  glow.addColorStop(0, "rgba(255,220,235,0.9)");
  glow.addColorStop(1, "rgba(255,220,235,0)");
  g.fillStyle = glow;
  g.beginPath(); g.arc(cx, cy, s * 0.2, 0, Math.PI * 2); g.fill();
}

// Dibuja una forma en un lienzo oculto y la convierte en celdas: carácter, color y posición.
function sample(draw, scale = 1) {
  const px = 6, py = 10; // píxeles por celda en el lienzo oculto
  const c = document.createElement("canvas");
  c.width = COLS * px; c.height = ROWS * py;
  const g = c.getContext("2d", { willReadFrequently: true });
  const s = Math.min(c.width / 2.6, c.height / 4.4) * scale;
  draw(g, c.width / 2, c.height * 0.38, s);
  const data = g.getImageData(0, 0, c.width, c.height).data;
  const cells = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      let r = 0, gg = 0, b = 0, a = 0;
      for (let y = 1; y < py; y += 3) for (let x = 1; x < px; x += 2) {
        const k = ((row * py + y) * c.width + col * px + x) * 4;
        const al = data[k + 3] / 255;
        r += data[k] * al; gg += data[k + 1] * al; b += data[k + 2] * al; a += al;
      }
      const cover = a / 9;
      if (cover < 0.12) continue;
      r /= a; gg /= a; b /= a;
      const lum = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
      // Como en el ramo: el color se lleva a su brillo máximo (conservando el tono) y la
      // luminosidad se expresa con la densidad del carácter; las sombras se quedan oscuras.
      const boost = Math.min(1.7, 255 / Math.max(r, gg, b, 1)) * Math.min(1, 0.45 + lum);
      r *= boost; gg *= boost; b *= boost;
      const idx = Math.max(1, Math.min(RAMP.length - 1, Math.floor(Math.pow(lum, 0.85) * cover * (RAMP.length - 1) * 1.1)));
      cells.push({ col, row, x: col * CW, y: row * CH, ch: RAMP[idx], c: [r, gg, b], a: Math.min(1, 0.35 + cover) });
    }
  }
  return cells;
}

// ---------- Celdas ----------

const mix = (a, b, k) => a + (b - a) * k;
const mix3 = (a, b, k) => [mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k)];

// Color de una brasa según su edad: amarillo encendido, naranja, rojo y rojo oscuro.
function emberColor(k) {
  return k < 0.3 ? mix3([255, 238, 160], [255, 160, 55], k / 0.3)
    : k < 0.7 ? mix3([255, 160, 55], [230, 70, 35], (k - 0.3) / 0.4)
    : mix3([230, 70, 35], [150, 30, 25], (k - 0.7) / 0.3);
}

function build() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  if (!W || !H) return false;
  canvas.width = W * DPR; canvas.height = H * DPR;
  CH = Math.max(7, Math.min(13, Math.min(W * 1.5, H) / 95));
  CW = CH * 0.6;
  COLS = Math.ceil(W / CW); ROWS = Math.ceil(H / CH);
  glow.width = COLS; glow.height = ROWS;
  glowData = gctx.createImageData(COLS, ROWS);

  const env = sample(drawEnvelope, 1.45);
  const peo = sample(drawPeony);
  box = {
    x0: Math.min(...env.map((c) => c.x)), x1: Math.max(...env.map((c) => c.x)),
    y0: Math.min(...env.map((c) => c.y)), y1: Math.max(...env.map((c) => c.y)),
  };
  // El fuego prende donde está el sello (más o menos al centro del sobre) y la peonía nace
  // desde su propio centro.
  seal = { x: (box.x0 + box.x1) / 2, y: box.y0 + (box.y1 - box.y0) * 0.56 };
  const pinks = peo.filter((c) => c.c[0] > 150 && c.c[1] < 150);
  bloom = pinks.length ? { x: pinks.reduce((s, c) => s + c.x, 0) / pinks.length, y: pinks.reduce((s, c) => s + c.y, 0) / pinks.length } : seal;

  // Una celda por lugar de la cuadrícula, con lo que es en el sobre y lo que será en la peonía.
  const map = new Map();
  const key = (c) => c.row * COLS + c.col;
  for (const c of env) map.set(key(c), { col: c.col, row: c.row, x: c.x, y: c.y, e: c, p: null });
  for (const c of peo) {
    const k = key(c);
    if (map.has(k)) map.get(k).p = c;
    else map.set(k, { col: c.col, row: c.row, x: c.x, y: c.y, e: null, p: c });
  }
  const rx = (box.x1 - box.x0) / 2, ry = (box.y1 - box.y0) / 2;
  const far = Math.hypot(Math.max(W, H), Math.max(W, H));
  cells = [...map.values()].map((c) => {
    // El fuego avanza como una mancha irregular desde el sello hacia las orillas.
    const d = Math.hypot((c.x - seal.x) / rx, (c.y - seal.y) / ry);
    // Irregularidad que depende del lugar (como el papel que se quema disparejo), no del ángulo.
    const u = c.x / CW, v = c.y / CH;
    const ragged = 0.11 * Math.sin(u * 0.13 + 1.3) * Math.sin(v * 0.21 + 0.7) + 0.08 * Math.sin(u * 0.29 + v * 0.17 + 2.2)
      + 0.05 * Math.sin(u * 0.71 - v * 0.53) + rand(-0.05, 0.05);
    const db = Math.hypot(c.x - bloom.x, c.y - bloom.y) / (far * 0.35);
    return {
      ...c,
      burn: IGNITE + clamp01(d / 1.35 + ragged) * SPREAD,
      life: rand(0.9, 1.5),
      show: BLOOM_AT + clamp01(db) * BLOOM_SPREAD + rand(0, 0.25),
      sx: rand(-0.1, 1.1) * W, sy: rand(-0.1, 1.1) * H, // de dónde llega al principio
      delay: (c.y / H) * 0.9 + rand(0, 0.5),
      ph: rand(0, 6.28),
    };
  });
  sparks = Array.from({ length: Math.round(env.length / 30) }, () => ({
    x: rand(box.x0, box.x1), y: rand(box.y0, box.y1), born: IGNITE + rand(0.2, SPREAD + 0.8),
    vx: rand(-15, 15), vy: -rand(30, 90), life: rand(1, 2.2), ph: rand(0, 6.28),
  }));
  stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({ x: rand(0, W), y: rand(0, H), ph: rand(0, 6.28) }));
  return true;
}

function draw(now) {
  frame(now / 1000 - t0);
  requestAnimationFrame(draw);
}

function frame(t) {
  if (t > AUTO_OPEN && openAt === Infinity) open(t);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#06040a";
  ctx.fillRect(0, 0, W, H);
  ctx.font = `700 ${CH}px "Courier New", ui-monospace, monospace`;
  ctx.textBaseline = "top";

  for (const s of stars) {
    ctx.fillStyle = `rgba(255,240,250,${0.12 + 0.12 * Math.sin(t * 1.3 + s.ph)})`;
    ctx.fillText(".", s.x, s.y);
  }

  const since = t - openAt;
  const gd = glowData.data;
  gd.fill(0);
  for (const q of cells) {
    let x = q.x, y = q.y, ch, c, a, light = 0;
    if (since < 0) {
      // Llegada al sobre y latido del sello.
      if (!q.e) continue;
      const k = easeOut(clamp01((t - q.delay) / (INTRO - 0.9)));
      x = mix(q.sx, q.x, k); y = mix(q.sy, q.y, k);
      ch = q.e.ch; c = q.e.c; a = q.e.a * k;
      if (c[0] > 200 && c[1] < 140) {
        const beat = 0.5 + 0.5 * Math.sin(t * 4);
        c = [c[0], c[1] + 60 * beat, c[2] + 40 * beat];
        light = 0.25 * beat * k;
      }
    } else {
      const fl = (since - q.burn) / q.life; // edad de la brasa
      const pk = q.p ? smooth(q.show, q.show + 0.9, since) : 0; // cuánto se ve ya la peonía
      if (q.e && fl < 0) {
        // Papel todavía: se calienta cuando el fuego se acerca.
        ch = q.e.ch; c = q.e.c; a = q.e.a;
        const heat = clamp01(1 + (fl * q.life) / 0.4);
        if (heat > 0) { c = mix3(c, [255, 180, 80], heat); light = heat * 0.5; }
      } else if (q.e) {
        // Brasa: brilla, se enrojece y se queda ardiendo bajito, parpadeando.
        const k = clamp01(fl);
        const flick = 0.75 + 0.25 * Math.sin(t * 11 + q.ph * 4);
        ch = EMBER[((t * 6 + q.ph * 5) | 0) % EMBER.length];
        c = emberColor(k);
        const embers = fl < 1 ? 1 : mix(1, 0.4, clamp01(fl - 1)); // rescoldo
        a = embers * flick * (q.p ? 1 - pk : 1 - smooth(q.show, q.show + 1.6, since + 1));
        light = (1 - k) * 1.1 * flick + 0.15;
        light *= q.p ? 1 - pk : 1;
      }
      if (q.p && pk > 0) {
        // La peonía aparece sobre las brasas (o sola, fuera del sobre).
        const base = c && a > 0 ? c : q.p.c;
        c = mix3(base, q.p.c, pk);
        ch = pk > 0.4 ? q.p.ch : ch || q.p.ch;
        a = mix(a || 0, q.p.a, pk);
        if (pk >= 1) {
          const tw = Math.sin(t * 2 + q.ph * 3);
          a *= 0.86 + 0.14 * tw;
          if (tw > 0.995) c = [255, 240, 248];
        }
      }
      if (!c || !(a > 0.02)) continue;
    }
    if (light > 0) {
      const gi = (q.row * COLS + q.col) * 4;
      gd[gi] = Math.min(255, c[0] * light); gd[gi + 1] = Math.min(255, c[1] * light * 0.85); gd[gi + 2] = Math.min(255, c[2] * light * 0.6); gd[gi + 3] = 255;
    }
    ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(2)})`;
    ctx.fillText(ch, x, y);
  }

  // Halo de luz: las celdas encendidas, difuminadas y sumadas encima.
  gctx.putImageData(glowData, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.imageSmoothingEnabled = true;
  ctx.filter = `blur(${(CH * 0.9).toFixed(1)}px)`;
  ctx.globalAlpha = 0.85;
  ctx.drawImage(glow, 0, 0, W, H);
  ctx.filter = "none";
  ctx.globalAlpha = 0.35;
  ctx.drawImage(glow, 0, 0, W, H);
  ctx.restore();

  if (since >= 0) {
    // La franja encendida del borde de abajo, mientras arde.
    const on = smooth(IGNITE, IGNITE + 0.6, since) * (1 - smooth(IGNITE + SPREAD + 1.2, IGNITE + SPREAD + 2.4, since));
    if (on > 0) {
      for (let x = box.x0; x <= box.x1 + CW * 0.5; x += CW) {
        const flick = 0.8 + 0.2 * Math.sin(t * 17 + x * 0.9);
        ctx.fillStyle = `rgba(235,40,35,${(on * flick).toFixed(2)})`;
        ctx.fillText("_", x, box.y1 + CH * 0.7);
      }
    }
    // Unas cuantas chispas que suben.
    for (const sp of sparks) {
      const age = since - sp.born;
      if (age < 0 || age > sp.life) continue;
      const k = age / sp.life;
      ctx.fillStyle = `rgba(255,${(225 - 120 * k) | 0},${(140 - 100 * k) | 0},${(0.9 * (1 - k)).toFixed(2)})`;
      ctx.fillText(".", sp.x + sp.vx * age + Math.sin(age * 5 + sp.ph) * CW, sp.y + sp.vy * age);
    }
  }
  if (since > BLOOM_AT + BLOOM_SPREAD + 1.4 && formedAt === Infinity) formedAt = t;
}

function open(t) {
  openAt = t;
  hint.classList.add("gone");
}

function restart() {
  t0 = performance.now() / 1000;
  openAt = Infinity; formedAt = Infinity;
  hint.classList.remove("gone");
}

// Tocar la carta la abre; tocar la peonía ya formada vuelve a empezar.
canvas.addEventListener("click", () => {
  const t = performance.now() / 1000 - t0;
  if (openAt === Infinity) { if (t > INTRO * 0.6) open(t); }
  else if (formedAt !== Infinity) restart();
});

let resizeTimer;
window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 200); });

if (build()) requestAnimationFrame(draw);
else window.addEventListener("resize", function once() { if (build()) { window.removeEventListener("resize", once); requestAnimationFrame(draw); } });

window.__carta = { open: () => open(performance.now() / 1000 - t0), restart, cells: () => cells.length,
  // Dibuja el momento `sec` (la carta se abre sola a los AUTO_OPEN segundos).
  render: (sec) => { t0 = performance.now() / 1000 - sec; openAt = Infinity; formedAt = Infinity; if (sec > AUTO_OPEN) open(AUTO_OPEN); frame(sec); } };
