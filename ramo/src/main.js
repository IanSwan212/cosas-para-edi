import { localToday, isComplete, parseISO } from "./calendar.js?v=mvt7cftc";
import { createProgress } from "./progress.js?v=mvt7cftc";
import { FLOWERS } from "./flowerDefs.js?v=mvt7cftc";
import { createScene, createBouquet } from "./bouquet.js?v=mvt7cftc";
import { renderText, showFinal } from "./ui.js?v=mvt7cftc";
import { AsciiView } from "./asciiView.js?v=mvt7cftc";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { startMusic } from "./music.js?v=mvt7cftc";
import { setupFlowerLinks } from "./flowerLinks.js?v=mvt7cftc";

const canvas = document.getElementById("scene");


const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Por defecto, vista ASCII como en el video; ?modo=3d muestra el render 3D directo.
const mode3d = new URLSearchParams(location.search).get("modo") === "3d";
const { renderer, scene, camera, bouquet: group, resize, view } = createScene(canvas);
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
/* ---------- Cámara orbital: arrastrar para girar, rueda o pellizco para acercar ---------- */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.rotateSpeed = 0.7;
controls.minPolarAngle = 0.2;            // no pasar por encima del todo
controls.maxPolarAngle = Math.PI * 0.62; // ni muy por debajo del ramo

const baseFit = fit;
function fitAll() {
  baseFit();
  controls.target.copy(view.target);
  controls.minDistance = view.distance * 0.45;
  controls.maxDistance = view.distance * 1.6;
  controls.update();
}
fitAll();
window.addEventListener("resize", fitAll);
// Si la página cargó sin tamaño (pestaña en segundo plano), encuadrar al hacerse visible.
document.addEventListener("visibilitychange", () => { if (!document.hidden) fitAll(); });
setupFlowerLinks({ canvas, camera, group, label: document.getElementById("flower-label") });
// Doble clic / doble toque: volver a la vista frontal.
canvas.addEventListener("dblclick", () => {
  camera.position.set(0, 3.6, view.distance);
  controls.target.copy(view.target);
  controls.update();
});

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
    bouquet.show(visit.count, { now, stagger: Math.min(0.5, 7 / Math.max(1, visit.count)), duration: 3 });
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

/* ---------- Fecha simulada (solo por URL, sin interfaz) ---------- */
// ?fecha=2026-11-10 muestra el ramo de ese día sin guardar nada (útil para revisar etapas).
const simDate = parseISO(new URLSearchParams(location.search).get("fecha"));
if (simDate) {
  const count = progress.simulate(simDate).count;
  bouquet.show(count, { now: clock() + 0.4, stagger: Math.min(0.5, 7 / Math.max(1, count)), duration: 3 });
  renderText({ date: simDate, count, simulated: true });
  scheduleFinal(simDate, count);
} else {
  showReal({ entry: true });
}

startMusic();

/* ---------- Bucle ---------- */
let last = 0;
function frame(ms) {
  // window.__ramoFrozen = true detiene el bucle (para inspeccionar fotogramas en pruebas).
  if (window.__ramoFrozen) return requestAnimationFrame(frame);
  const t = ms / 1000;
  const active = bouquet.update(clock(), t, reducedMotion ? 0 : 1);
  const moved = controls.update(); // inercia del giro
  if (finalPending && clock() >= finalAt) {
    finalPending = false;
    showFinal(true);
  }
  // En reposo solo hay una oscilación mínima: bastan ~30 fps.
  if (active || moved || ms - last > 33) {
    draw();
    last = ms;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener("visibilitychange", () => { if (!document.hidden) last = 0; });

// Diagnóstico para pruebas manuales desde la consola.
window.__ramo = { bouquet, today, visit, renderer, scene, camera, draw, controls };
