// Generación procedural y determinista de la bugambilia (misma semilla = misma planta).
//
// Estructura, de lo más grueso a lo más fino:
//   0 tronco corto con base ensanchada
//   1 cañas leñosas que se arquean hacia afuera, como las de una bugambilia de arbusto
//   2 ramas secundarias
//   3 brotes jóvenes, verdosos
//   4 pedicelos diminutos que sostienen cada tríada de brácteas
// Cada rama nace en un punto de su madre y empieza a crecer cuando el frente de crecimiento
// de la madre pasa por ese punto, así que nada queda flotando.
import { rng, add, sub, mul, norm, perp, mix3, qAxis, qRot, frameY } from "./math.js";
import { TIMING } from "./timeline.js";
import { planRelease } from "./bracts.js";

export const SEED = 81026;

// Colores sRGB de las brácteas, con su peso: domina el fucsia.
const PALETTE = [
  [[0.89, 0.07, 0.55], 5], // fucsia
  [[0.78, 0.05, 0.5], 3], // magenta
  [[0.95, 0.16, 0.47], 2], // rosa intenso
  [[0.71, 0.18, 0.6], 2], // rosa violáceo
  [[0.96, 0.43, 0.7], 1], // rosa suave
];
const SPEED = [0.7, 0.8, 0.5, 0.32]; // unidades por segundo, por profundidad (antes de reescalar)

function randUnit(R) {
  const z = R() * 2 - 1, a = R() * Math.PI * 2, r = Math.sqrt(1 - z * z);
  return [r * Math.cos(a), z, r * Math.sin(a)];
}

function pickColor(R) {
  const total = PALETTE.reduce((s, [, w]) => s + w, 0);
  let x = R() * total;
  for (const [c, w] of PALETTE) if ((x -= w) < 0) return c;
  return PALETTE[0][0];
}

// Eje de una rama: avanza a pasos cortos doblándose con un ruido suave, la gravedad
// (que la arquea más hacia la punta) y la búsqueda de luz.
function spine(R, o) {
  const { origin, dir, length, r0, depth, droop = 0, photo = 0, wobble = 0, flare = 0 } = o;
  const n = depth >= 4 ? 4 : Math.max(6, Math.ceil(length / 0.035));
  const seg = length / n;
  const pts = [origin];
  let d = norm(dir), bend = [0, 0, 0], p = origin;
  for (let i = 1; i <= n; i++) {
    bend = mix3(bend, mul(randUnit(R), wobble), 0.3);
    d = norm(add(d, mul(add(bend, [0, photo - droop * (i / n), 0]), seg * 2.2)));
    if (p[1] < 0.12 && d[1] < 0.15) d = norm([d[0], 0.15, d[2]]);
    p = add(p, mul(d, seg));
    pts.push(p);
  }
  const tans = [], radii = [];
  for (let i = 0; i <= n; i++) {
    tans.push(norm(sub(pts[Math.min(n, i + 1)], pts[Math.max(0, i - 1)])));
    const s = i / n;
    radii.push(i === n ? 0 : r0 * (1 - 0.78 * s) * (1 + flare * Math.exp(-s * 9)));
  }
  return { pts, tans, radii, n, length, depth, t0: 0, t1: 0 };
}

function at(b, s) {
  const i = Math.round(s * b.n);
  return { p: b.pts[i], t: b.tans[i], r: b.radii[i] || b.radii[Math.max(0, i - 1)] * 0.5 };
}

export function buildPlant({ seed = SEED, timing = TIMING } = {}) {
  const R = rng(seed);
  const rand = (a, b) => a + (b - a) * R();
  const branches = [], leaves = [], thorns = [], triads = [];

  const trunk = spine(R, { origin: [0, 0, 0], dir: [0.08, 1, 0.04], length: 0.5, r0: 0.075, depth: 0, wobble: 0.35, photo: 0.05, flare: 0.9 });
  Object.assign(trunk, { parent: null, attach: 0, cane: -1 });
  branches.push(trunk);

  // Cañas: una baja y el resto desde lo alto del tronco, repartidas sin simetría.
  const canes = [];
  const az0 = R() * Math.PI * 2;
  const N_CANES = 7;
  for (let i = 0; i < N_CANES; i++) {
    const s = i < 2 ? rand(0.2, 0.45) : rand(0.6, 1);
    const a = at(trunk, s);
    const az = az0 + (i * Math.PI * 2) / N_CANES + rand(-0.4, 0.4);
    const el = i < 2 ? rand(0.9, 1.15) : rand(0.35, 1.0);
    const c = spine(R, {
      origin: a.p, dir: [Math.sin(el) * Math.cos(az), Math.cos(el), Math.sin(el) * Math.sin(az)],
      length: rand(1.35, 2.3), r0: a.r * 0.66, depth: 1, droop: rand(0.9, 1.35), photo: 0.35, wobble: 0.5,
    });
    Object.assign(c, { parent: trunk, attach: s, cane: i });
    branches.push(c);
    canes.push(c);
  }

  function sprout(parent, depth, count, [s0, s1], [a0, a1], lenFn, cfg) {
    const out = [];
    const ss = Array.from({ length: count }, () => rand(s0, s1)).sort((x, y) => x - y);
    let az = R() * Math.PI * 2;
    for (const s of ss) {
      const a = at(parent, s);
      az += 2.4 + rand(-0.5, 0.5);
      const side = qRot(qAxis(a.t, az), perp(a.t));
      const ang = rand(a0, a1);
      const b = spine(R, {
        origin: a.p, dir: add(mul(a.t, Math.cos(ang)), mul(side, Math.sin(ang))),
        length: lenFn(s), r0: Math.max(0.0045, a.r * 0.72), depth, ...cfg,
      });
      Object.assign(b, { parent, attach: s, cane: parent.cane });
      branches.push(b);
      out.push(b);
    }
    return out;
  }
  const d2 = canes.flatMap((c) =>
    sprout(c, 2, 4 + Math.floor(R() * 3), [0.22, 0.95], [0.6, 1.0], (s) => rand(0.5, 0.95) * (1 - 0.35 * s), { droop: 0.65, photo: 0.5, wobble: 0.7 }));
  d2.forEach((b) =>
    sprout(b, 3, 2 + Math.floor(R() * 3), [0.3, 0.92], [0.5, 0.95], () => rand(0.18, 0.4), { droop: 0.2, photo: 0.9, wobble: 0.9 }));

  // Tiempos de crecimiento: cada hija arranca cuando su madre llega al punto de unión;
  // después todo se reescala para que las ramas terminen dentro de su ventana.
  trunk.t1 = trunk.length / SPEED[0];
  for (const b of branches) {
    if (!b.parent) continue;
    const p = b.parent;
    b.t0 = p.t0 + b.attach * (p.t1 - p.t0) + R() * 0.06;
    b.t1 = b.t0 + (b.length / SPEED[b.depth]) * rand(0.85, 1.15);
  }
  const B = timing.branches;
  const k = (B.end - B.start) / Math.max(...branches.map((b) => b.t1));
  for (const b of branches) { b.t0 = B.start + b.t0 * k; b.t1 = B.start + b.t1 * k; }
  const pass = (b, s) => b.t0 + s * (b.t1 - b.t0);
  const along = (tp) => (tp - B.start) / (B.end - B.start);

  const L = timing.leaves, F = timing.bloom;
  const caneColor = canes.map(() => pickColor(R));

  function addLeaf(b, s, a, rad) {
    const young = b.depth === 3 || s > 0.82;
    const base = b.depth === 1 ? rand(0.16, 0.22) : b.depth === 2 ? rand(0.13, 0.19) : rand(0.09, 0.14);
    const ang = rand(0.75, 1.15);
    const axis = norm(add(mul(a.t, Math.cos(ang)), mul(rad, Math.sin(ang))));
    const tp = pass(b, s);
    const t0 = Math.max(L.start + along(tp) * (L.end - L.start - 1.5) + R() * 0.5, tp + 0.25);
    leaves.push({
      pos: add(a.p, mul(rad, a.r * 0.8)),
      q: frameY(axis, add([0, 1, 0], mul(rad, 0.4))),
      size: base * (1 - 0.35 * Math.max(0, s - 0.7) / 0.3),
      t0, t1: t0 + rand(0.9, 1.4),
      color: young ? [rand(0.36, 0.46), rand(0.58, 0.68), rand(0.16, 0.24)] : [rand(0.11, 0.18), rand(0.3, 0.4), rand(0.08, 0.13)],
      phase: R() * Math.PI * 2,
    });
  }

  function addThorn(b, s, a, rad) {
    const tp = pass(b, s) + 0.05;
    thorns.push({
      pos: add(a.p, mul(rad, a.r * 0.7)),
      q: frameY(sub(rad, mul(a.t, 0.5)), a.t),
      size: rand(0.018, 0.03) * (b.depth === 1 ? 1.25 : 1),
      t0: tp, t1: tp + 0.4,
    });
  }

  // Una agrupación: varias tríadas (tres brácteas con su florecita) sobre pedicelos cortos.
  function addCluster(b, s, a, rad) {
    const base = s >= 1 ? a.t : norm(add(mul(a.t, 0.55), mul(rad, 0.85)));
    const cs = F.start + along(pass(b, s)) * (F.end - F.start - 2) + R() * 0.6;
    const col = R() < 0.65 && b.cane >= 0 ? caneColor[b.cane] : pickColor(R);
    const nTri = 1 + Math.floor(R() * 3) + (s >= 1 ? 1 : 0);
    const openness = rand(0.55, 1.25), size = rand(0.07, 0.095);
    let az = R() * Math.PI * 2;
    for (let i = 0; i < nTri; i++) {
      az += 2.4;
      const spread = nTri === 1 ? rand(0, 0.25) : rand(0.25, 0.85);
      const dir = add(mul(base, Math.cos(spread)), mul(qRot(qAxis(base, az), perp(base)), Math.sin(spread)));
      const t0 = cs + rand(0, 0.35);
      const ped = spine(R, { origin: a.p, dir, length: rand(0.03, 0.065), r0: 0.0038, depth: 4, photo: 0.4, wobble: 0.3 });
      Object.assign(ped, { parent: b, attach: s, cane: b.cane, t0: t0 - 0.5, t1: t0 + 0.05 });
      branches.push(ped);
      const tdir = ped.tans[ped.n];
      const l = rand(0.9, 1.08);
      triads.push({
        pos: ped.pts[ped.n], q: frameY(tdir, perp(tdir)),
        t0, t1: t0 + rand(1.1, 1.5),
        bracts: [0, 1, 2].map((j) => ({
          az: az * 1.3 + (j * Math.PI * 2) / 3 + rand(-0.18, 0.18),
          open: openness * rand(0.85, 1.15),
          size: size * rand(0.85, 1.15),
          color: col.map((c) => Math.min(1, c * l * rand(0.95, 1.05))),
          phase: R() * Math.PI * 2,
        })),
        flower: R() < 0.7 ? { size: rand(0.024, 0.032), lean: rand(-0.2, 0.2) } : null,
      });
    }
  }

  for (const b of branches.slice()) {
    if (b.depth === 0 || b.depth === 4) continue;
    const spacing = b.depth === 1 ? 0.1 : 0.065;
    let az = R() * Math.PI * 2;
    for (let d = (b.depth === 1 ? 0.38 : 0.1) * b.length; d < b.length * 0.94; d += spacing * rand(0.75, 1.25)) {
      const s = d / b.length, a = at(b, s);
      az += 2.4 + rand(-0.3, 0.3);
      const rad = qRot(qAxis(a.t, az), perp(a.t));
      addLeaf(b, s, a, rad);
      if (b.depth <= 2 && R() < 0.4) addThorn(b, s, a, mul(rad, -1));
      if ((b.depth === 2 && R() < 0.2) || (b.depth === 3 && R() < 0.12) || (b.depth === 1 && s > 0.6 && R() < 0.12)) addCluster(b, s, a, rad);
    }
    if (b.depth >= 2) { const a = at(b, 1); addCluster(b, 1, a, perp(a.t)); }
  }

  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const grow = (p, pad = 0) => { for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p[i] - pad); max[i] = Math.max(max[i], p[i] + pad); } };
  branches.forEach((b) => b.pts.forEach((p) => grow(p)));
  leaves.forEach((l) => grow(l.pos, l.size));
  triads.forEach((t) => grow(t.pos, 0.08));
  const center = mix3(min, max, 0.5);
  const plant = {
    seed, timing, branches, leaves, thorns, triads,
    bounds: { min, max, center, radius: Math.hypot(...sub(max, min)) / 2 },
  };
  planRelease(plant, R, timing);
  return plant;
}
