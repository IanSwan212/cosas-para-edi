// Una carta en arte ASCII de colores que se abre y se vuelve una peonía.
//
// Cada carácter es una partícula. Las formas (el sobre con su sello y la peonía con sus
// rayos de luz) se dibujan primero en un lienzo oculto; de ahí sale, por celda, el carácter
// (según el brillo) y su color. Las partículas llegan a formar el sobre, el sello late, y al
// abrirse (sola a los pocos segundos o al tocarla) estallan y se vuelven a juntar como peonía.
// Todo depende de un solo tiempo t, así que la animación no depende de los cuadros por segundo.

const RAMP = " .,:;i!lI?tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
const canvas = document.getElementById("carta");
const ctx = canvas.getContext("2d");
const hint = document.getElementById("hint");

let W = 0, H = 0, CW = 0, CH = 0, COLS = 0, ROWS = 0, DPR = 1;
let parts = [], stars = [];
let t0 = performance.now() / 1000, openAt = Infinity, formedAt = Infinity;

const AUTO_OPEN = 5.2; // segundos tras los que la carta se abre sola
const INTRO = 2.6, BURST = 1.1, GATHER = 2.4;

const rand = (a, b) => a + (b - a) * Math.random();
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOut = (x) => 1 - (1 - x) ** 3;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

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
function sample(draw) {
  const px = 6, py = 10; // píxeles por celda en el lienzo oculto
  const c = document.createElement("canvas");
  c.width = COLS * px; c.height = ROWS * py;
  const g = c.getContext("2d", { willReadFrequently: true });
  const s = Math.min(c.width / 2.6, c.height / 4.4);
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
      cells.push({ x: col * CW, y: row * CH, ch: RAMP[idx], c: [r, gg, b], a: Math.min(1, 0.35 + cover) });
    }
  }
  return cells;
}

// ---------- Partículas ----------

function build() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  if (!W || !H) return false;
  canvas.width = W * DPR; canvas.height = H * DPR;
  CH = Math.max(7, Math.min(13, Math.min(W * 1.5, H) / 95));
  CW = CH * 0.6;
  COLS = Math.ceil(W / CW); ROWS = Math.ceil(H / CH);
  const env = sample(drawEnvelope);
  const peo = sample(drawPeony);
  const N = Math.max(env.length, peo.length);
  const pick = (arr, i) => arr[Math.floor((i * arr.length) / N)];
  env.sort((a, b) => a.x - b.x || a.y - b.y);
  peo.sort((a, b) => a.x - b.x || a.y - b.y);
  parts = Array.from({ length: N }, (_, i) => {
    const e = i < env.length ? env[i] : { ...pick(env, i), ghost: true };
    const p = i < peo.length ? peo[i] : { ...pick(peo, i), ghost: true };
    const ang = Math.random() * Math.PI * 2;
    return {
      e, p,
      sx: rand(-0.1, 1.1) * W, sy: rand(-0.1, 1.1) * H, // de dónde llega al principio
      delay: (e.y / H) * 0.9 + rand(0, 0.5),
      bx: Math.cos(ang) * rand(0.15, 0.55) * Math.min(W, H), by: Math.sin(ang) * rand(0.15, 0.55) * Math.min(W, H),
      swirl: rand(-1, 1), late: rand(0, 0.6), ph: rand(0, 6.28),
    };
  });
  stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({ x: rand(0, W), y: rand(0, H), ph: rand(0, 6.28) }));
  return true;
}

const mix = (a, b, k) => a + (b - a) * k;

function draw(now) {
  frame(now / 1000 - t0);
  requestAnimationFrame(draw);
}

function frame(t) {
  if (t > AUTO_OPEN && openAt === Infinity) open(t);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = "#06040a";
  ctx.fillRect(0, 0, W, H);
  ctx.font = `700 ${CH}px "Courier New", ui-monospace, monospace`;
  ctx.textBaseline = "top";

  for (const s of stars) {
    ctx.fillStyle = `rgba(255,240,250,${0.12 + 0.12 * Math.sin(t * 1.3 + s.ph)})`;
    ctx.fillText(".", s.x, s.y);
  }

  const since = t - openAt;
  for (const q of parts) {
    let x, y, ch, c, a;
    if (since < 0) {
      // Llegada al sobre y latido del sello.
      const k = easeOut(clamp01((t - q.delay) / (INTRO - 0.9)));
      x = mix(q.sx, q.e.x, k); y = mix(q.sy, q.e.y, k);
      ch = q.e.ch; c = q.e.c; a = q.e.ghost ? 0 : q.e.a * k;
      if (c[0] > 200 && c[1] < 140) { // pétalo del sello: late
        const beat = 0.5 + 0.5 * Math.sin(t * 4);
        c = [c[0], c[1] + 60 * beat, c[2] + 40 * beat];
      }
    } else {
      // Estallido desde el sobre y vuelta a juntarse como peonía, con un remolino.
      const kb = easeOut(clamp01(since / BURST));
      const kg = easeInOut(clamp01((since - BURST * 0.6 - q.late) / GATHER));
      const ox = q.e.x + q.bx * kb, oy = q.e.y + q.by * kb;
      const sw = Math.sin(kg * Math.PI) * q.swirl * Math.min(W, H) * 0.12;
      x = mix(ox, q.p.x, kg) + sw * Math.cos(q.ph);
      y = mix(oy, q.p.y, kg) + sw * Math.sin(q.ph);
      ch = kg > 0.5 ? q.p.ch : q.e.ch;
      c = [mix(q.e.c[0], q.p.c[0], kg), mix(q.e.c[1], q.p.c[1], kg), mix(q.e.c[2], q.p.c[2], kg)];
      const ea = q.e.ghost ? 0 : q.e.a, pa = q.p.ghost ? 0 : q.p.a;
      a = mix(ea * (1 - 0.4 * kb), pa, kg);
      if (kg >= 1) {
        // Ya formada: destellos y un brillo que respira, como en el video.
        const tw = Math.sin(t * 2 + q.ph * 3);
        a *= 0.85 + 0.15 * tw;
        if (tw > 0.995) c = [255, 240, 248];
      }
    }
    if (a < 0.02) continue;
    ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(2)})`;
    ctx.fillText(ch, x, y);
  }
  if (since > BURST + GATHER + 0.6 && formedAt === Infinity) formedAt = t;
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

window.__carta = { open: () => open(performance.now() / 1000 - t0), restart, parts: () => parts.length,
  // Dibuja el momento `sec` (la carta se abre sola a los AUTO_OPEN segundos).
  render: (sec) => { t0 = performance.now() / 1000 - sec; openAt = Infinity; formedAt = Infinity; if (sec > AUTO_OPEN) open(AUTO_OPEN); frame(sec); } };
