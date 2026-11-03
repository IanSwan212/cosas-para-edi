// Uso: node --test bugambilia/tests
import test from "node:test";
import assert from "node:assert/strict";
import { buildPlant } from "../src/plant.js";
import { bractState, attachedPose, assignMessage, heartPoints, messagePose } from "../src/bracts.js";
import { TIMING, PHASES, phaseAt } from "../src/timeline.js";
import { len, sub, qRot } from "../src/math.js";

const plant = buildPlant();

test("la misma semilla produce la misma planta", () => {
  const again = buildPlant();
  assert.deepEqual(again.bounds, plant.bounds);
  assert.equal(again.triads.length, plant.triads.length);
  assert.deepEqual(again.triads[7].bracts[1].rel, plant.triads[7].bracts[1].rel);
  assert.notDeepEqual(buildPlant({ seed: 7 }).bounds, plant.bounds);
});

test("tiene un tamaño razonable", () => {
  assert.ok(plant.triads.length >= 60 && plant.triads.length <= 1400, `tríadas: ${plant.triads.length}`);
  assert.ok(plant.leaves.length >= 150, `hojas: ${plant.leaves.length}`);
  assert.ok(plant.bounds.min[1] > -0.01, "nada bajo el suelo");
});

test("cada rama nace sobre su madre y crece después de que el frente pasa por ahí", () => {
  for (const b of plant.branches) {
    if (!b.parent) continue;
    const p = b.parent;
    const i = Math.round(b.attach * p.n);
    assert.ok(len(sub(b.pts[0], p.pts[i])) < 1e-9, "punto de unión");
    assert.ok(b.t0 >= p.t0 + b.attach * (p.t1 - p.t0) - 1e-9, "empieza tras el paso del frente");
  }
});

test("las ramas leñosas terminan en su ventana y las brácteas abren a tiempo", () => {
  for (const b of plant.branches) if (b.depth < 4) assert.ok(b.t1 <= TIMING.branches.end + 1e-9);
  for (const t of plant.triads) {
    assert.ok(t.t0 >= TIMING.bloom.start - 1e-9 && t.t1 <= TIMING.peak.end, `tríada ${t.t0}-${t.t1}`);
  }
  for (const l of plant.leaves) assert.ok(l.t0 >= TIMING.leaves.start - 1e-9 && l.t1 < 9);
});

test("al soltarse, la bráctea no salta: misma pose antes y después", () => {
  let checked = 0;
  for (const tri of plant.triads) {
    for (const b of tri.bracts) {
      if (!b.rel) continue;
      const before = attachedPose(tri, b, b.rel.tr - 1e-4);
      const after = bractState(tri, b, b.rel.tr + 1e-4);
      assert.ok(len(sub(before.pos, after.pos)) < 1e-3, "posición");
      const tip = (q, s) => qRot(q, [0, s, 0]);
      assert.ok(len(sub(tip(before.q, before.scale), tip(after.q, after.scale))) < 2e-3, "orientación y escala");
      checked++;
    }
  }
  assert.ok(checked > 100);
});

test("se suelta cerca del 70 % de las brácteas, dentro de la fase de liberación", () => {
  const all = plant.triads.flatMap((t) => t.bracts);
  const free = all.filter((b) => b.rel);
  const share = free.length / all.length;
  assert.ok(share > 0.6 && share < 0.8, `proporción ${share}`);
  for (const b of free) assert.ok(b.rel.tr >= TIMING.release.start && b.rel.tr <= TIMING.release.end);
});

test("las que caen se quedan en el suelo", () => {
  const tri = plant.triads.find((t) => t.bracts.some((b) => b.rel && Number.isFinite(b.rel.contact)));
  const b = tri.bracts.find((x) => x.rel && Number.isFinite(x.rel.contact));
  const s1 = bractState(tri, b, b.rel.tr + b.rel.contact + 1);
  const s2 = bractState(tri, b, b.rel.tr + b.rel.contact + 5);
  assert.ok(s1.pos[1] >= 0 && len(sub(s1.pos, s2.pos)) < 1e-9);
});

test("fases", () => {
  assert.equal(PHASES.length, 8);
  assert.equal(phaseAt(0).id, "aparicion");
  assert.equal(phaseAt(11).id, "plenitud");
  assert.equal(phaseAt(14).id, "liberacion");
  assert.equal(phaseAt(18).id, "mensaje");
  assert.equal(phaseAt(24).id, "despedida");
});

test("la ráfaga lleva las brácteas al mensaje sin saltos y las deja en su lugar", () => {
  const p = buildPlant();
  const pts = heartPoints();
  const n = assignMessage(p, pts);
  assert.equal(n, pts.length);
  const frame = { c: [0, 1.5, 3], r: [1, 0, 0], u: [0, 1, 0], f: [0, 0, 1], scale: 1.2 };
  let checked = 0;
  for (const tri of p.triads) for (const b of tri.bracts) {
    if (!b.msg) continue;
    assert.ok(b.msg.t0 >= b.rel.tr && b.msg.t1 <= TIMING.gust.end + 0.25 + TIMING.gust.travel[1] + 1e-9);
    const a = bractState(tri, b, b.msg.t0 - 1e-4, TIMING, frame);
    const c = bractState(tri, b, b.msg.t0 + 1e-4, TIMING, frame);
    assert.ok(len(sub(a.pos, c.pos)) < 1e-3, "sin salto al empezar la ráfaga");
    assert.ok(b.msg.t1 < b.msg.td, "termina de llegar antes de que el viento se lo lleve");
    const end = bractState(tri, b, b.msg.t1 + 0.1, TIMING, frame);
    const goal = messagePose(b.msg, b.msg.t1 + 0.1, frame);
    assert.ok(len(sub(end.pos, goal.pos)) < 1e-9, "llega a su lugar");
    const d0 = bractState(tri, b, b.msg.td - 1e-4, TIMING, frame);
    const d1 = bractState(tri, b, b.msg.td + 1e-4, TIMING, frame);
    assert.ok(len(sub(d0.pos, d1.pos)) < 1e-3 && Math.abs(d0.scale - d1.scale) < 1e-3, "sin salto al irse");
    assert.equal(bractState(tri, b, b.msg.td + b.msg.fade + 0.01, TIMING, frame).scale, 0, "se desvanece");
    checked++;
  }
  assert.equal(checked, n);
});
