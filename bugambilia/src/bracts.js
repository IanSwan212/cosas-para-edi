// Brácteas: cómo se abren sobre la planta y cómo vuelan al soltarse.
//
// Cada bráctea es una función pura del tiempo. Mientras está unida, su pose sale de su
// tríada; al soltarse (en rel.tr) el vuelo arranca exactamente de esa pose: misma posición,
// orientación y escala, y su giro empieza con velocidad cero, así que no hay saltos.
// El vuelo es analítico (arrastre lineal hacia una velocidad de viento, más un vaivén lateral),
// por lo que no depende de cuántos cuadros se dibujen.
//
// Después llega una ráfaga: parte de las brácteas que vuelan se juntan y escriben «Te amo»
// dentro de un corazón, en el orden en que se dibujaría. Cada una sale de donde va en su vuelo
// y se mezcla suavemente (posición y orientación) hacia su lugar en el mensaje, que siempre
// mira a la cámara (el marco `frame` llega desde la escena en cada cuadro). Al final otra
// ráfaga lo deshace de izquierda a derecha: cada bráctea parte de su lugar sin velocidad,
// sube, gira y se desvanece en el viento.
import { rng, add, sub, mul, cross, norm, mix3, qAxis, qMul, qBasis, qSlerp } from "./math.js";
import { TIMING, progress, easeOutCubic, lerp, smoothstep, windAt } from "./timeline.js";

const X = [1, 0, 0], Y = [0, 1, 0];
const BUD = [0.74, 0.76, 0.5]; // el capullo nace verde pálido y se va tiñendo
const LETTER = [0.74, 0.04, 0.34]; // las letras se oscurecen a carmín para leerse sobre el cielo claro
const GROUND = 0.006;

export function attachedPose(tri, b, t, timing = TIMING) {
  const raw = progress(t, tri.t0, tri.t1);
  if (raw <= 0) return null;
  const p = easeOutCubic(raw);
  const w = windAt(t, timing);
  const flutter = (Math.sin(t * 2.3 + b.phase) * (0.03 + 0.14 * w) + Math.sin(t * 5.1 + b.phase * 1.7) * 0.035 * w) * p;
  const twist = Math.sin(t * 1.7 + b.phase) * 0.06 * w;
  const q = qMul(tri.q, qMul(qAxis(Y, b.az + twist), qAxis(X, lerp(0.12, b.open, p) + flutter)));
  return { pos: tri.pos, q, scale: b.size * Math.pow(p, 0.6), p };
}

function flightPos(r, tau) {
  const t = Math.min(tau, r.contact);
  const drag = (1 - Math.exp(-r.k * t)) / r.k;
  const sway = Math.sin(r.ow * t) * (1 - Math.exp(-t / 0.6));
  return [0, 1, 2].map((i) => r.p0[i] + r.vt[i] * t + (r.v0[i] - r.vt[i]) * drag + r.osc[i] * sway);
}

export function flightPose(r, tau) {
  const t = Math.min(tau, r.contact);
  const angle = r.spin * (t - r.tau * (1 - Math.exp(-t / r.tau)));
  return { pos: flightPos(r, tau), q: qMul(qAxis(r.axis, angle), r.q0), scale: r.s0 };
}

const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const inFrame = (f, x, y, z) => add(f.c, add(mul(f.r, x * f.scale), add(mul(f.u, y * f.scale), mul(f.f, z * f.scale))));

// Lugar de la bráctea dentro del mensaje. No queda plana como una calcomanía: cada una
// tiene su inclinación y se mece con la brisa, como un pétalo que flota.
export function messagePose(m, t, frame) {
  const pos = inFrame(frame,
    m.x + 0.008 * Math.sin(t * 0.9 + m.ph) + 0.004 * Math.sin(t * 2.3 + m.ph * 2),
    m.y + 0.007 * Math.cos(t * 1.1 + m.ph),
    m.z + 0.02 * Math.sin(t * 0.7 + m.ph));
  const sway = Math.sin(t * 1.7 + m.ph);
  const q = qMul(qBasis(frame.r, frame.u, frame.f),
    qMul(qAxis([0, 0, 1], m.roll + 0.12 * sway), qMul(qAxis([1, 0, 0], m.tx + 0.15 * sway), qAxis([0, 1, 0], m.ty + 0.2 * Math.cos(t * 1.3 + m.ph)))));
  return { pos, q };
}

// Despedida: desplazamiento (en unidades del mensaje) que arranca con velocidad cero.
function farewellPose(m, t, frame) {
  const tau = t - m.td;
  const base = messagePose(m, t, frame);
  const ramp = tau - (1 - Math.exp(-1.6 * tau)) / 1.6;
  const curl = Math.sin(m.cw * tau + m.ph) - Math.sin(m.ph) - m.cw * Math.cos(m.ph) * tau * Math.exp(-tau);
  const pos = add(base.pos, sub(inFrame(frame, m.wx * ramp, m.wy * ramp + 0.06 * curl, m.wz * ramp), frame.c));
  const angle = m.spin * (tau - 0.6 * (1 - Math.exp(-tau / 0.6)));
  return { pos, q: qMul(qAxis(m.axis, angle), base.q), fade: 1 - smoothstep(0.25, m.fade, tau) };
}

// Estado completo para dibujar: pose, color y si está volando. null = todavía no existe.
export function bractState(tri, b, t, timing = TIMING, frame = null) {
  if (b.rel && t >= b.rel.tr) {
    const fl = flightPose(b.rel, t - b.rel.tr);
    const m = b.msg;
    if (m && frame && t > m.td) {
      const f = farewellPose(m, t, frame);
      return { pos: f.pos, q: f.q, scale: fl.scale * m.k * f.fade, color: m.text ? LETTER : b.color, flying: true };
    }
    if (m && frame && t > m.t0) {
      const e = easeInOut(progress(t, m.t0, m.t1));
      const goal = messagePose(m, t, frame);
      // La ráfaga los lleva en curva y con remolinos, no en línea recta.
      const arc = Math.sin(Math.PI * e), swirl = Math.sin(2 * Math.PI * e) * (1 - e);
      const off = inFrame(frame, m.sr * arc + m.sw * swirl, m.su * arc + 0.5 * m.sw * Math.cos(3 * Math.PI * e) * arc, m.sf * arc);
      return {
        pos: add(mix3(fl.pos, goal.pos, e), sub(off, frame.c)),
        q: qSlerp(fl.q, goal.q, e),
        scale: fl.scale * lerp(1, m.k, e),
        color: m.text ? mix3(b.color, LETTER, e) : b.color, flying: true,
      };
    }
    return { ...fl, color: b.color, flying: true };
  }
  const a = attachedPose(tri, b, t, timing);
  if (!a) return null;
  return { ...a, color: mix3(BUD, b.color, smoothstep(0.15, 0.85, a.p)), flying: false };
}

// Florecitas verdaderas: blancas, diminutas, en el centro de cada tríada; se quedan en la planta.
export function flowerState(tri, t) {
  if (!tri.flower) return null;
  const k = smoothstep(0.55, 1, easeOutCubic(progress(t, tri.t0, tri.t1)));
  if (k <= 0) return null;
  return { pos: tri.pos, q: qMul(tri.q, qAxis(X, tri.flower.lean)), scale: tri.flower.size * k };
}

function solveContact(r) {
  const y = (tau) => flightPos({ ...r, contact: Infinity }, tau)[1];
  let prev = 0;
  for (let tau = 0.05; tau < 40; tau += 0.05) {
    if (y(tau) <= GROUND) {
      let lo = prev, hi = tau;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (y(mid) <= GROUND) hi = mid; else lo = mid;
      }
      return hi;
    }
    prev = tau;
  }
  return Infinity;
}

// Decide qué brácteas se sueltan, cuándo y cómo vuelan. El desprendimiento barre la planta
// con el viento (de izquierda a derecha y de arriba abajo), no todo a la vez.
export function planRelease(plant, R, timing = TIMING) {
  const { min, max, center, radius } = plant.bounds;
  const w = max[0] - min[0], h = max[1] - min[1];
  const camPoint = add(center, [0, 0.1, radius * 2.1]);
  const rand = (a, b) => a + (b - a) * R();
  for (const tri of plant.triads) {
    for (const b of tri.bracts) {
      const free = R() < timing.release.fraction;
      const sweep = Math.min(1, 0.55 * (tri.pos[0] - min[0]) / w + 0.3 * (1 - (tri.pos[1] - min[1]) / h) + 0.15 * R());
      if (!free) { b.rel = null; continue; }
      const tr = lerp(timing.release.start, timing.release.end, sweep);
      const a = attachedPose(tri, b, tr, timing);
      const out = norm([tri.pos[0] - center[0], 0, tri.pos[2] - center[2]]);
      const near = R() < 0.05; // algunas pasan cerca de la cámara, por los lados
      const k = near ? rand(1.8, 2.4) : rand(0.8, 1.6);
      let vt;
      if (near) {
        const target = add(camPoint, [(R() < 0.5 ? -1 : 1) * rand(0.9, 1.7), rand(-0.4, 0.3), 0]);
        vt = mul(sub(target, a.pos), 1 / rand(2.2, 3.2));
      } else {
        vt = [rand(0.3, 1.15), -0.42 / k + rand(-0.05, 0.45), rand(-1.0, 0.85)];
      }
      const side = cross(vt, Y);
      const r = {
        tr, k, vt, near,
        v0: add(mul(out, rand(0.08, 0.18)), [0, rand(0.02, 0.1), 0]),
        p0: a.pos, q0: a.q, s0: a.scale,
        osc: mul(Math.hypot(...side) > 1e-6 ? norm(side) : X, rand(0.05, 0.14)),
        ow: rand(1.4, 2.8),
        axis: norm([rand(-1, 1), rand(-1, 1), rand(-1, 1)]),
        spin: rand(2, 5.5) * (R() < 0.5 ? -1 : 1),
        tau: rand(0.5, 0.9),
        contact: Infinity,
      };
      r.contact = solveContact(r);
      b.rel = r;
    }
  }
}

// Reparte los puntos del mensaje (coordenadas del corazón: x de -1 a 1; `order` de 0 a 1 es
// el orden de escritura) entre las brácteas que vuelan. Las de la izquierda van a la izquierda,
// para que los recorridos no se crucen de más.
export function assignMessage(plant, points, timing = TIMING, seed = 2611) {
  const R = rng(seed);
  const rand = (a, b) => a + (b - a) * R();
  const pool = [];
  for (const tri of plant.triads) for (const b of tri.bracts) { b.msg = null; if (b.rel && !b.rel.near) pool.push(b); }
  const n = Math.min(points.length, pool.length);
  const pick = (arr) => Array.from({ length: n }, (_, i) => arr[Math.floor((i * arr.length) / n)]);
  const chosen = pick(pool.slice().sort((a, b) => a.rel.p0[0] - b.rel.p0[0]));
  const pts = pick(points.slice().sort((a, b) => a.x - b.x));
  const G = timing.gust, F = timing.farewell;
  chosen.forEach((b, i) => {
    const p = pts[i];
    const t0 = Math.max(b.rel.tr + 0.5, lerp(G.start, G.end, p.order) + rand(0, 0.15));
    const sweep = Math.min(1, ((p.x + 1) / 2) * 0.8 + R() * 0.2); // el viento lo deshace de izquierda a derecha
    b.msg = {
      x: p.x, y: p.y, z: rand(-0.04, 0.04), ph: R() * Math.PI * 2,
      roll: rand(-0.7, 0.7) * (p.text ? 0.5 : 1), tx: rand(-0.45, 0.45), ty: rand(-0.5, 0.5),
      sr: rand(-0.35, 0.35), su: rand(0.1, 0.45), sf: rand(-0.25, 0.25), sw: rand(-0.18, 0.18),
      k: p.k ? p.k * rand(0.9, 1.1) : p.text ? rand(0.36, 0.44) : rand(0.8, 0.95), text: !!p.text,
      t0, t1: t0 + rand(G.travel[0], G.travel[1]),
      td: lerp(F.start, F.end, sweep),
      wx: rand(0.5, 1.1), wy: rand(0.12, 0.5), wz: rand(-0.35, 0.35), cw: rand(1.5, 3),
      axis: norm([rand(-1, 1), rand(-1, 1), rand(-1, 1)]), spin: rand(2, 5) * (R() < 0.5 ? -1 : 1),
      fade: rand(F.fade[0], F.fade[1]),
    };
  });
  return n;
}

// Contorno de corazón (dos filas para que la línea se vea llena), en coordenadas del mensaje.
export function heartPoints(perRow = 190) {
  const curve = (a) => [Math.sin(a) ** 3, (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16 + 0.15];
  const fine = Array.from({ length: 2001 }, (_, i) => curve((i / 2000) * Math.PI * 2));
  const acc = [0];
  for (let i = 1; i < fine.length; i++) acc.push(acc[i - 1] + Math.hypot(fine[i][0] - fine[i - 1][0], fine[i][1] - fine[i - 1][1]));
  const total = acc[acc.length - 1], out = [];
  for (const [row, k] of [[0, 1], [1, 0.95]]) {
    for (let j = 0; j < perRow; j++) {
      const d = ((j + row * 0.5) / perRow) * total;
      let i = acc.findIndex((v) => v >= d);
      if (i < 0) i = fine.length - 1;
      const [x, y] = fine[i];
      out.push({ x: x * k, y: 0.15 + (y - 0.15) * k, order: (d / total) * 0.55 });
    }
  }
  return out;
}
