import { localToday, isComplete, parseISO, flowerCountFor } from "./calendar.js";
import { createProgress } from "./progress.js";
import { FLOWERS } from "./flowerDefs.js";
import { createScene, createBouquet } from "./bouquet.js";
import { renderText, showFinal, setupTestPanel } from "./ui.js";
import { AsciiView } from "./asciiView.js";

const canvas = document.getElementById("scene");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Por defecto, vista ASCII como en el video; ?modo=3d muestra el render 3D directo.
const mode3d = new URLSearchParams(location.search).get("modo") === "3d";
const { renderer, scene, camera, bouquet: group, resize } = createScene(canvas);
const ascii = mode3d ? null : new AsciiView({ renderer, scene, camera });
const draw = () => (ascii ? ascii.render() : renderer.render(scene, camera));
const bouquet = createBouquet(group, FLOWERS);
const clock = () => performance.now() / 1000;

let finalPending = false;
let finalAt = Infinity;

function fit() {
  resize(window.innerWidth, window.innerHeight);
  ascii?.resize(window.innerWidth, window.innerHeight);
  draw();
}
fit();
window.addEventListener("resize", fit);

/* ---------- Estado real ---------- */
const today = localToday();
const progress = createProgress();
const visit = progress.visit(today);

function scheduleFinal(date, count) {
  finalPending = count === 29 && isComplete(date);
  showFinal(false);
  finalAt = finalPending ? Math.max(clock(), bouquet.endTime()) + 0.8 : Infinity;
}

function showReal({ entry }) {
  const now = clock() + 0.4;
  if (reducedMotion) {
    bouquet.show(visit.count, { now, instantBelow: visit.count });
  } else if (entry && visit.firstVisit) {
    // Primera apertura: el ramo crece flor a flor, acelerado si son muchas.
    bouquet.show(visit.count, { now, stagger: Math.min(0.45, 1.6 / Math.max(1, visit.count)), duration: 4.2 });
  } else if (entry) {
    // Vuelve otro día: las anteriores ya están; solo crecen las pendientes.
    bouquet.show(visit.count, { now, instantBelow: visit.newFrom, stagger: 0.45, duration: 2.8 });
    document.body.classList.add("fade-in");
  } else {
    // Salida del modo de prueba: vuelve suavemente al estado real.
    bouquet.show(visit.count, { now, stagger: 0.12, duration: 2.2 });
  }
  renderText({ date: today, count: visit.count, simulated: false });
  scheduleFinal(today, visit.count);
}

/* ---------- Modo de prueba ---------- */
let simDate = null;
const urlDate = parseISO(new URLSearchParams(location.search).get("fecha"));
const wantPanel = new URLSearchParams(location.search).has("prueba");

const panel = setupTestPanel({
  initial: urlDate,
  onChange(date) {
    simDate = date;
    if (!date) return showReal({ entry: false });
    const count = progress.simulate(date).count;
    bouquet.show(count, { now: clock(), stagger: 0.18, duration: 2.4 });
    renderText({ date, count, simulated: true });
    scheduleFinal(date, count);
  },
  onReplay() {
    const date = simDate || today;
    const count = flowerCountFor(date);
    bouquet.replay(count, clock() + 0.2, Math.min(0.45, 1.6 / Math.max(1, count)));
    scheduleFinal(date, count);
  }
});
if (wantPanel && !panel.isOpen()) document.getElementById("test-toggle").click();
if (!simDate) showReal({ entry: true });

/* ---------- Bucle ---------- */
let last = 0;
function frame(ms) {
  // window.__ramoFrozen = true detiene el bucle (para inspeccionar fotogramas en pruebas).
  if (window.__ramoFrozen) return requestAnimationFrame(frame);
  const t = ms / 1000;
  const active = bouquet.update(clock(), t, reducedMotion ? 0 : 1);
  if (finalPending && clock() >= finalAt) {
    finalPending = false;
    showFinal(true);
  }
  // En reposo solo hay una oscilación mínima: bastan ~30 fps.
  if (active || ms - last > 33) {
    draw();
    last = ms;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener("visibilitychange", () => { if (!document.hidden) last = 0; });

// Diagnóstico para pruebas manuales desde la consola.
window.__ramo = { bouquet, today, visit, renderer, scene, camera, draw };
