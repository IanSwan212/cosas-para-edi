// Ejecutar con: node --test ramo/tests
import test from "node:test";
import assert from "node:assert/strict";
import {
  START, END, TOTAL_FLOWERS, flowerCountFor, dateForFlower, localToday,
  daysFromCivil, civilFromDays, parseISO, toISO, isComplete
} from "../src/calendar.js";
import { FLOWERS } from "../src/flowerDefs.js";
import { createProgress } from "../src/progress.js";

const d = (iso) => parseISO(iso);

test("el periodo tiene 29 días contando ambos extremos", () => {
  assert.equal(TOTAL_FLOWERS, 29);
});

test("número de flores por fecha (tabla del enunciado)", () => {
  const expected = {
    "2026-10-25": 0, "2026-10-26": 1, "2026-10-27": 2, "2026-10-30": 5, "2026-10-31": 6,
    "2026-11-01": 7, "2026-11-05": 11, "2026-11-10": 16, "2026-11-15": 21, "2026-11-20": 26,
    "2026-11-22": 28, "2026-11-23": 29, "2026-11-24": 29
  };
  for (const [iso, n] of Object.entries(expected)) assert.equal(flowerCountFor(d(iso)), n, iso);
});

test("la fecha inicial incluye la primera flor y la final la número 29", () => {
  assert.equal(flowerCountFor(START), 1);
  assert.equal(flowerCountFor(END), 29);
  assert.deepEqual(dateForFlower(1), START);
  assert.deepEqual(dateForFlower(29), END);
});

test("el resultado nunca baja de 0 ni pasa de 29", () => {
  for (let off = -800; off <= 800; off++) {
    const n = flowerCountFor(civilFromDays(daysFromCivil(START) + off));
    assert.ok(n >= 0 && n <= 29);
  }
  assert.equal(flowerCountFor(d("2020-01-01")), 0);
  assert.equal(flowerCountFor(d("2030-01-01")), 29);
});

test("cada flor tiene una fecha consecutiva y única", () => {
  const seen = new Set();
  for (let i = 1; i <= 29; i++) {
    const iso = toISO(dateForFlower(i));
    assert.ok(!seen.has(iso));
    seen.add(iso);
    assert.equal(flowerCountFor(dateForFlower(i)), i);
  }
  assert.equal(toISO(dateForFlower(7)), "2026-11-01"); // cruce de mes
});

test("usa la fecha local, no UTC, también cerca de la medianoche", () => {
  // 23:59 y 00:01 locales: la fecha de calendario es la que marca el reloj local.
  assert.deepEqual(localToday(new Date(2026, 9, 26, 23, 59, 59)), { y: 2026, m: 10, d: 26 });
  assert.deepEqual(localToday(new Date(2026, 9, 27, 0, 0, 1)), { y: 2026, m: 10, d: 27 });
  // Cambio de horario (en muchos países cae entre el 25 oct y el 1 nov): no salta ni repite días.
  for (let i = 0; i < 29; i++) {
    const date = new Date(2026, 9, 26 + i, 12);
    assert.equal(flowerCountFor(localToday(date)), i + 1);
  }
});

test("el proyecto funciona después del 23 de noviembre", () => {
  assert.ok(isComplete(d("2026-11-23")));
  assert.ok(isComplete(d("2027-03-01")));
  assert.ok(!isComplete(d("2026-11-22")));
});

test("parseISO rechaza fechas imposibles", () => {
  assert.equal(parseISO("2026-02-31"), null);
  assert.equal(parseISO("hola"), null);
});

test("las 29 flores son distintas y estables", () => {
  assert.equal(FLOWERS.length, 29);
  const json = JSON.stringify(FLOWERS);
  // Se generan de forma determinista: volver a importar da exactamente lo mismo.
  return import("../src/flowerDefs.js?again").then((m) => {
    assert.equal(JSON.stringify(m.FLOWERS), json);
    const signatures = new Set(FLOWERS.map((f) => `${f.species}|${f.colors.join()}|${f.petalCount}`));
    assert.equal(signatures.size, 29, "no puede haber dos flores idénticas");
    assert.deepEqual(FLOWERS.map((f) => f.day), Array.from({ length: 29 }, (_, i) => i + 1));
  });
});

/* ---------- Progreso visto / animación de entrada ---------- */

function memoryStorage() {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)) };
}

test("abrir varias veces el mismo día no incrementa las flores", () => {
  const storage = memoryStorage();
  const today = d("2026-11-05");
  const a = createProgress(storage).visit(today);
  const b = createProgress(storage).visit(today);
  const c = createProgress(storage).visit(today);
  assert.equal(a.count, 11);
  assert.equal(b.count, 11);
  assert.equal(c.count, 11);
  assert.equal(a.firstVisit, true);
  assert.equal(b.newFrom, 11); // nada nuevo que animar
});

test("al volver días después se animan solo las flores pendientes", () => {
  const storage = memoryStorage();
  createProgress(storage).visit(d("2026-11-05"));
  const later = createProgress(storage).visit(d("2026-11-09"));
  assert.equal(later.count, 15);
  assert.equal(later.newFrom, 11); // flores 12..15 nuevas
  assert.equal(later.firstVisit, false);
});

test("el modo de prueba no modifica el progreso real guardado", () => {
  const storage = memoryStorage();
  const progress = createProgress(storage);
  progress.visit(d("2026-11-05"));
  const sim = progress.simulate(d("2026-11-23"));
  assert.equal(sim.count, 29);
  assert.equal(createProgress(storage).visit(d("2026-11-05")).newFrom, 11);
  assert.equal(JSON.parse(storage.getItem("ramo.visto")).count, 11);
});

test("un almacenamiento dañado o ausente no rompe el cálculo", () => {
  const broken = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); } };
  const r = createProgress(broken).visit(d("2026-11-10"));
  assert.equal(r.count, 16);
  const junk = memoryStorage();
  junk.setItem("ramo.visto", "{no json");
  assert.equal(createProgress(junk).visit(d("2026-11-10")).count, 16);
  assert.equal(createProgress(null).visit(d("2026-11-10")).count, 16);
});
