import { CONFIG } from "./config.js?v=mvq5j85t";
import { TRANSLATIONS } from "./translations.js?v=mvq5j85t";
import { loadFonts, FONT_STACK } from "./fontManager.js?v=mvq5j85t";
import { createHeartMask } from "./heartGeometry.js?v=mvq5j85t";
import { layoutHeart, layoutMessage, measureFactory } from "./textLayout.js?v=mvq5j85t";
import { buildParticles, createTimeline, createSpatialHash } from "./particleSystem.js?v=mvq5j85t";
import { createRandom } from "./random.js?v=mvq5j85t";
import { AnimationController } from "./animationController.js?v=mvq5j85t";
import { Renderer } from "./renderer.js?v=mvq5j85t";
import { AudioManager } from "./audioManager.js?v=mvq5j85t";
import { savePNG, recordVideo, pickVideoFormat } from "./exportManager.js?v=mvq5j85t";
import { setupWordInteraction, setupAutoHide } from "./interaction.js?v=mvq5j85t";
import { getMessage, MESSAGE_LANGUAGES } from "./messages.js?v=mvq5j85t";

const $ = (id) => document.getElementById(id);
const canvas = $("stage");
const controls = $("controls");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

document.documentElement.style.setProperty("--bg", CONFIG.backgroundColor);
document.documentElement.style.setProperty("--primary", CONFIG.primaryColor);
document.documentElement.style.setProperty("--secondary", CONFIG.secondaryColor);

const timeline = createTimeline(CONFIG.animationDuration);
const renderer = new Renderer(canvas, CONFIG);
const audio = new AudioManager(CONFIG.audioEnabled);
let hash = null;
let scene = null;
let recording = false;

const controller = new AnimationController({
  duration: CONFIG.animationDuration,
  loop: CONFIG.loopAnimation,
  events: [
    { time: timeline.beatStart, name: "lub" },
    { time: timeline.beatStart + 400 * (CONFIG.animationDuration / 18000), name: "dub" }
  ],
  onFrame: (time, dt) => {
    renderer.render(time, dt);
    syncPlayButton();
  },
  onEvent: (name) => {
    if (!CONFIG.heartbeatEnabled || renderer.reducedMotion) return;
    audio.thump(name === "lub" ? 1 : 0.6);
  }
});

function computeBaseSize(mask) {
  const heartWidth = 32 * mask.scale;
  return Math.max(8, CONFIG.fontSize * Math.min(1.35, Math.max(0.8, heartWidth / 700)));
}

/** Calcula el layout; si caben más partículas que el objetivo, aumenta la fuente. */
function buildScene() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.resize(w, h);
  const mask = createHeartMask(w, h, w < 600 ? 0.94 : 0.88);
  const measure = measureFactory(renderer.ctx);
  let baseSize = computeBaseSize(mask);
  let layout;
  for (let attempt = 0; attempt < 10; attempt++) {
    layout = layoutHeart({
      mask, translations: TRANSLATIONS, measure, baseSize,
      rng: createRandom(CONFIG.randomSeed),
      finalMessage: CONFIG.finalMessage, finalScale: CONFIG.finalMessageScale
    });
    if (layout.slots.length <= CONFIG.targetParticleCount) break;
    baseSize *= 1.07;
  }
  const particles = buildParticles(layout, {
    rng: createRandom(CONFIG.randomSeed + 1),
    timeline,
    primary: CONFIG.primaryColor,
    secondary: CONFIG.secondaryColor
  });
  renderer.setScene({ particles, final: layout.final, mask, timeline, baseSize });
  hash = createSpatialHash(particles);
  scene = { mask, measure };
  // Datos de diagnóstico para pruebas manuales desde la consola.
  window.__love = { controller, renderer, w, h, particles: particles.length, baseSize, languages: new Set(particles.map((p) => p.language.id)).size };
}

/* ---------- Controles ---------- */
const btn = {
  play: $("btn-play"), restart: $("btn-restart"), sound: $("btn-sound"),
  full: $("btn-fullscreen"), png: $("btn-png"), video: $("btn-video")
};

function syncPlayButton() {
  const playing = controller.playing && !(controller.finished && !CONFIG.loopAnimation);
  const label = playing ? "Pausar" : "Reproducir";
  if (btn.play.dataset.state !== label) {
    btn.play.dataset.state = label;
    btn.play.setAttribute("aria-label", label);
    btn.play.title = `${label} (espacio)`;
    btn.play.querySelector("use").setAttribute("href", playing ? "#i-pause" : "#i-play");
  }
}

function togglePlay() {
  if (recording) return;
  if (controller.playing && !controller.finished) controller.pause();
  else if (controller.finished && !CONFIG.loopAnimation) controller.restart();
  else controller.play();
}

function toggleSound() {
  const on = audio.toggle();
  btn.sound.setAttribute("aria-pressed", String(on));
  btn.sound.querySelector("use").setAttribute("href", on ? "#i-sound" : "#i-mute");
  btn.sound.setAttribute("aria-label", on ? "Desactivar sonido" : "Activar sonido");
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
}

btn.play.addEventListener("click", togglePlay);
btn.restart.addEventListener("click", () => { if (recording) return; showMessage(undefined); controller.restart(); });
btn.sound.addEventListener("click", toggleSound);

// El navegador no permite sonar sin interacción: la música empieza con el primer toque, clic o tecla.
// (Si ese primer gesto es el propio botón de sonido, este ya se encarga.)
const firstGesture = (e) => {
  window.removeEventListener("pointerdown", firstGesture, true);
  window.removeEventListener("keydown", firstGesture, true);
  if (!audio.enabled && !btn.sound.contains(e.target)) toggleSound();
};
window.addEventListener("pointerdown", firstGesture, true);
window.addEventListener("keydown", firstGesture, true);
btn.full.addEventListener("click", toggleFullscreen);
if (!document.documentElement.requestFullscreen) btn.full.hidden = true;
if (audio.enabled) { audio.enabled = false; toggleSound(); }

if (CONFIG.exportEnabled) {
  btn.png.addEventListener("click", () => savePNG(canvas));
  if (pickVideoFormat()) {
    btn.video.addEventListener("click", async () => {
      if (recording) return;
      await recordVideo({
        canvas, controller,
        audioTrack: audio.getStreamTrack(),
        onState: (on) => {
          recording = on;
          document.body.classList.toggle("recording", on);
          btn.video.setAttribute("aria-label", on ? "Grabando…" : "Exportar vídeo");
        }
      });
    });
  } else {
    btn.video.hidden = true;
  }
} else {
  btn.png.hidden = btn.video.hidden = true;
}

// Mensaje dentro del corazón
const live = $("message-live");
let messageFor = undefined; // entrada de idioma, null = «TE AMO» (original), undefined = sin mensaje
let pumping = false;

/** Mantiene vivos los fotogramas de la animación del mensaje aunque la línea temporal esté pausada. */
function pump() {
  if (!controller.playing) renderer.render(controller.time, 0);
  if (renderer.messageAnimating) requestAnimationFrame(pump);
  else pumping = false;
}
function startPump() {
  if (!pumping) { pumping = true; requestAnimationFrame(pump); }
}

function showMessage(t) {
  if (t === undefined) {
    messageFor = undefined;
    renderer.clearMessage();
    live.textContent = "";
    return startPump();
  }
  messageFor = t;
  const msg = getMessage(t ? t.id : "es");
  const { tokens, size } = layoutMessage({
    mask: scene.mask,
    lines: msg.lines,
    chorusFrom: msg.lines.length - 10,
    lang: msg.lang,
    measure: scene.measure,
    reserved: renderer.final.box,
    rtl: msg.dir === "rtl"
  });
  const caption = t
    ? `${t.language} · ${t.nativeName}${msg.translated ? "" : " — original en español"}`
    : "";
  renderer.setMessage({ tokens, size, caption, lang: msg.lang, dir: msg.dir });
  live.lang = msg.lang;
  live.textContent = msg.lines.join(". ");
  startPump();
}


window.addEventListener("keydown", (e) => {
  if (e.target.closest?.("button") && (e.key === " " || e.key === "Enter")) return;
  const k = e.key.toLowerCase();
  if (k === "escape" && renderer.messageActive) return showMessage(undefined);
  if (k === " ") { e.preventDefault(); togglePlay(); }
  else if (k === "r") !recording && controller.restart();
  else if (k === "m") toggleSound();
  else if (k === "f") toggleFullscreen();
});

setupAutoHide(controls);
setupWordInteraction({
  canvas,
  tooltip: $("tooltip"),
  renderer,
  getHash: () => hash,
  onSelect: showMessage,
  isEnabled: () => CONFIG.interactionEnabled && controller.time >= renderer.settledAt && !recording
});

/* ---------- Arranque ---------- */
function applyReducedMotion() {
  renderer.reducedMotion = reducedMotion.matches;
  if (reducedMotion.matches) {
    controller.seek(CONFIG.animationDuration);
    controller.pause();
  }
}

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    buildScene();
    if (messageFor !== undefined) showMessage(messageFor);
    renderer.render(controller.time, 0);
  }, 180);
});
reducedMotion.addEventListener?.("change", applyReducedMotion);

async function start() {
  renderer.resize(window.innerWidth, window.innerHeight);
  const messageText = MESSAGE_LANGUAGES.map((id) => getMessage(id).lines.join(""));
  await loadFonts(TRANSLATIONS.map((t) => t.text).concat(CONFIG.finalMessage, "·—", messageText));
  document.documentElement.style.setProperty("--font-stack", FONT_STACK);
  buildScene();
  // Si la ventana aún no tenía tamaño (pestaña o vista abriéndose), el corazón sale vacío: se reintenta.
  for (let i = 0; i < 10 && renderer.particles.length === 0; i++) {
    await new Promise((r) => setTimeout(r, 300));
    buildScene();
  }
  document.body.classList.add("ready");
  if (reducedMotion.matches) applyReducedMotion();
  else controller.play();
}

start();
