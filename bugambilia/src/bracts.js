// Brácteas: cómo se abren sobre la planta y cómo vuelan al soltarse.
//
// Cada bráctea es una función pura del tiempo. Mientras está unida, su pose sale de su
// tríada; al soltarse (en rel.tr) el vuelo arranca exactamente de esa pose: misma posición,
// orientación y escala, y su giro empieza con velocidad cero, así que no hay saltos.
// El vuelo es analítico (arrastre lineal hacia una velocidad de viento, más un vaivén lateral),
// por lo que no depende de cuántos cuadros se dibujen.
import { add, sub, mul, cross, norm, mix3, qAxis, qMul } from "./math.js";
import { TIMING, progress, easeOutCubic, lerp, smoothstep, windAt } from "./timeline.js";

const X = [1, 0, 0], Y = [0, 1, 0];
const BUD = [0.74, 0.76, 0.5]; // el capullo nace verde pálido y se va tiñendo
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

// Estado completo para dibujar: pose, color y si está volando. null = todavía no existe.
export function bractState(tri, b, t, timing = TIMING) {
  if (b.rel && t >= b.rel.tr) return { ...flightPose(b.rel, t - b.rel.tr), color: b.color, flying: true };
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
      const near = R() < 0.09; // algunas pasan cerca de la cámara
      const k = near ? rand(1.8, 2.4) : rand(0.8, 1.6);
      let vt;
      if (near) {
        const target = add(camPoint, [rand(-0.6, 0.6), rand(-0.3, 0.3), 0]);
        vt = mul(sub(target, a.pos), 1 / rand(2.2, 3.2));
      } else {
        vt = [rand(0.3, 1.15), -0.42 / k + rand(-0.05, 0.45), rand(-1.0, 0.85)];
      }
      const side = cross(vt, Y);
      const r = {
        tr, k, vt,
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
