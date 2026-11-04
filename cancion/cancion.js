// El muñequito escribe a mano, frase por frase, mientras suena una parte de la canción,
// como en la ventanita del video. Qué parte suena y qué escribe sale de frases.txt, para
// poder cambiarlo sin tocar el código. Dibujo a 1 bit con trazos que tiemblan.

const W = 180, H = 150, FPS = 12, TAU = Math.PI * 2;
const canvas = document.getElementById("doodle");
const g = canvas.getContext("2d", { willReadFrequently: true });
const audio = new Audio("assets/cancion.mp3");
audio.preload = "auto";

let clip = { start: 60, end: 105 };
let lines = []; // { t, text, face }
let playing = false, done = false;

// ---------- frases.txt ----------

const toSec = (s) => { const [m, sec] = s.split(":").map(Number); return (m || 0) * 60 + (sec || 0); };

async function loadPhrases() {
  let txt = "";
  try { txt = await (await fetch("frases.txt", { cache: "no-cache" })).text(); } catch (e) {}
  for (const raw of txt.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l || l.startsWith("#")) continue;
    let m = l.match(/^inicio\s+(\d+:\d{1,2})/i);
    if (m) { clip.start = toSec(m[1]); continue; }
    m = l.match(/^fin\s+(\d+:\d{1,2})/i);
    if (m) { clip.end = toSec(m[1]); continue; }
    // Renglón con tiempo («0:05 texto [carita]») o sin tiempo («texto [carita]»).
    m = l.match(/^(?:(\d+:\d{1,2}(?:\.\d+)?)\s+)?(.+?)\s*(?:\[(\w+)\])?$/);
    if (m) lines.push({ t: m[1] ? toSec(m[1]) : null, text: m[2], face: (m[3] || "feliz").toLowerCase() });
  }
  // Los renglones sin tiempo se reparten parejos entre sus vecinos con tiempo (o en toda la parte).
  const dur = Math.max(1, clip.end - clip.start);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].t !== null) continue;
    let j = i;
    while (j < lines.length && lines[j].t === null) j++;
    const a = i > 0 ? lines[i - 1].t : 0.5, b = j < lines.length ? lines[j].t : dur - 2;
    for (let k = i; k < j; k++) lines[k].t = a + ((b - a) * (k - i + (i > 0 ? 1 : 0))) / (j - i + (i > 0 ? 1 : 0));
    i = j - 1;
  }
  lines.sort((a, b) => a.t - b.t);
}

// ---------- Trazos de garabato ----------

let boil = 0;
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const wob = (i, amp = 0.6) => (hash(i + boil * 17.3) - 0.5) * 2 * amp;
function circle(cx, cy, r, id, fill = false) {
  const n = Math.max(10, Math.round(r * 1.8));
  g.beginPath();
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * TAU, rr = r + wob(id * 31 + (k % n), Math.min(0.7, r * 0.08 + 0.25));
    k ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.closePath();
  fill ? g.fill() : g.stroke();
}
function line(x1, y1, x2, y2, id) {
  g.beginPath();
  g.moveTo(x1 + wob(id), y1 + wob(id + 1));
  g.quadraticCurveTo((x1 + x2) / 2 + wob(id + 2, 0.8), (y1 + y2) / 2 + wob(id + 3, 0.8), x2 + wob(id + 4), y2 + wob(id + 5));
  g.stroke();
}
function arc(cx, cy, r, a0, a1, id) {
  g.beginPath();
  for (let k = 0; k <= 10; k++) {
    const a = a0 + ((a1 - a0) * k) / 10, rr = r + wob(id * 7 + k, 0.35);
    k ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.stroke();
}
function heart(cx, cy, s, id) {
  g.beginPath();
  for (let k = 0; k <= 24; k++) {
    const a = (k / 24) * TAU;
    const x = 16 * Math.sin(a) ** 3, y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    k ? g.lineTo(cx + (x / 16) * s, cy - (y / 16) * s) : g.moveTo(cx + (x / 16) * s, cy - (y / 16) * s);
  }
  g.closePath();
  g.stroke();
}

// ---------- El muñequito ----------

function drawFace(face, t) {
  const cx = 58, cy = 80 + Math.sin(t * 2.2) * 1.2, R = 17;
  g.lineWidth = 1.6;
  circle(cx, cy, R, 1);
  const blink = (t % 3.4) < 0.13;
  for (const s of [-1, 1]) {
    const x = cx + s * 6.5, y = cy - 4;
    if (face === "amor" || face === "feliz" && blink) arc(x, y + 1.5, 2.4, Math.PI * 1.15, Math.PI * 1.85, 30 + s);
    else if (face === "llora" || face === "triste") { circle(x, y + 1, 1.3, 10 + s, true); line(x - 3 * s, y - 4, x + 2 * s, y - 2.5, 65 + s); }
    else if (face === "sorpresa") circle(x, y, 2, 12 + s);
    else circle(x, y, 1.4, 10 + s, true);
  }
  const my = cy + 7;
  if (face === "feliz" || face === "amor") arc(cx, my - 3, 4.5, Math.PI * 0.15, Math.PI * 0.85, 83);
  else if (face === "sorpresa") circle(cx, my, 2.6, 84);
  else arc(cx, my + 4, 4, Math.PI * 1.2, Math.PI * 1.8, 86);
  if (face === "llora") for (const s of [-1, 1]) { const k = (t * 1.5 + (s > 0 ? 0.5 : 0)) % 1; circle(cx + s * 7, cy + k * 10, 1, 90 + s, true); }
  if (face === "amor") for (const s of [-1, 1]) for (let k = 0; k < 3; k++) line(cx + s * 12 - 2 + k * 1.6, cy + 3, cx + s * 12 - 3 + k * 1.6, cy + 5.5, 95 + k + s * 5);
  // Manitas: con una escribe (se mueve mientras salen las palabras).
  circle(cx - 24, cy + 12, 3.8, 100);
  const writing = playing && current() && t - current().t < current().text.split(" ").length * 0.35;
  circle(cx + 25 + (writing ? Math.sin(t * 20) * 1.5 : 0), cy + 10 + (writing ? Math.cos(t * 17) : 0), 3.8, 101);
  if (face === "amor") heart(cx + 4, cy - R - 9 - (t % 1.2) * 6, 3, 120);
}

// ---------- Lo que escribe ----------

const songTime = () => (playing || done ? audio.currentTime - clip.start : 0);
function current() {
  const t = songTime();
  let cur = null;
  for (const l of lines) if (t >= l.t) cur = l;
  return cur;
}

function drawWords(t) {
  const cur = current();
  if (!cur) return;
  const words = cur.text.split(" ");
  const shown = Math.floor((t - cur.t) / 0.35) + 1;
  // Letra grande para las frases cortas, como en el video; más chica si es larga.
  const size = cur.text.length > 22 ? 11 : cur.text.length > 12 ? 13 : 16;
  g.font = `${size}px "Gochi Hand", cursive`;
  let x = 88, y = 58;
  for (let i = 0; i < Math.min(shown, words.length); i++) {
    const w = words[i], ww = g.measureText(w + " ").width;
    if (x + ww > 176 && x > 88) { x = 88; y += size + 2; }
    g.fillText(w, x + wob(300 + i, 0.4), y + wob(320 + i, 0.4));
    x += ww;
  }
}

// ---------- Cuadro completo ----------

function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
  g.strokeStyle = g.fillStyle = "#000";
  g.lineCap = g.lineJoin = "round";
  const cur = current();
  drawFace(cur ? cur.face : "feliz", t);
  if (!playing && !done) {
    g.font = '13px "Gochi Hand", cursive';
    g.fillText("tócame", 92, 62);
    g.fillText("para escuchar", 92, 76);
  } else drawWords(songTime());
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const c = d[i] < 150 ? [17, 17, 17] : [239, 237, 232];
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

// ---------- Reproducción: solo la parte elegida, con entrada y salida suaves ----------

function start() {
  done = false;
  audio.currentTime = clip.start;
  audio.volume = 0;
  audio.play().then(() => { playing = true; }).catch(() => {});
}
canvas.addEventListener("click", () => { if (playing) { audio.pause(); playing = false; } else start(); });

let clock = 0, last = performance.now(), lastFrame = -1;
function loop(now) {
  clock += (now - last) / 1000;
  last = now;
  if (playing) {
    const p = audio.currentTime;
    const fade = Math.min(1, (p - clip.start) / 1.2, (clip.end - p) / 2.5);
    audio.volume = Math.max(0, Math.min(1, fade)) * 0.8;
    if (p >= clip.end) { audio.pause(); playing = false; done = true; }
  }
  const f = Math.floor(clock * FPS);
  if (f !== lastFrame) { lastFrame = f; boil = Math.floor(f / 2); render(clock); }
  requestAnimationFrame(loop);
}

// ---------- Modo para marcar tiempos (cancion/?marcar) ----------
// Suena la parte elegida y cada toque (o la barra espaciadora) marca cuándo empieza el
// siguiente renglón de frases.txt. Al final arma el archivo con los tiempos para copiarlo.

const MARK = new URLSearchParams(location.search).has("marcar");
const fmt = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r < 10 ? "0" : ""}${r.toFixed(1)}`; };

function setupMarking() {
  const css = document.createElement("style");
  css.textContent = `.mark { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); width: min(92vw, 560px);
    font: 15px ui-sans-serif, system-ui, sans-serif; color: #eee; background: rgba(20, 20, 26, 0.92); border-radius: 10px; padding: 12px 14px; }
    .mark b { color: #ff9ac0; } .mark textarea { width: 100%; height: 40vh; margin-top: 8px; font: 13px ui-monospace, monospace; }
    .mark button { margin-top: 8px; font: inherit; padding: 6px 14px; border-radius: 8px; border: 0; cursor: pointer; }`;
  document.head.appendChild(css);
  const box = document.createElement("div");
  box.className = "mark";
  document.body.appendChild(box);
  let next = 0, started = false;
  const marks = [];
  const show = () => {
    box.innerHTML = !started
      ? "Modo para marcar tiempos: toca aquí o la barra espaciadora para empezar la canción."
      : next < lines.length
        ? `Toca cuando empiece: <b>${lines[next].text.replace(/</g, "&lt;")}</b> (${next + 1} de ${lines.length})`
        : "Listo.";
  };
  const finish = () => {
    audio.pause(); playing = false;
    const out = [`inicio ${fmt(clip.start).replace(/\.\d$/, "")}`, `fin ${fmt(clip.end).replace(/\.\d$/, "")}`]
      .concat(lines.map((l, i) => `${fmt(marks[i] ?? l.t)} ${l.text} [${l.face}]`)).join("\n");
    box.innerHTML = "Copia esto y pégalo en frases.txt en lugar de lo que tenía:";
    const ta = document.createElement("textarea");
    ta.value = out;
    const copy = document.createElement("button");
    copy.textContent = "copiar";
    copy.onclick = () => { ta.select(); navigator.clipboard?.writeText(out).catch(() => {}); copy.textContent = "copiado"; };
    box.append(ta, copy);
  };
  const tap = () => {
    if (!started) { started = true; start(); show(); return; }
    if (next >= lines.length) return;
    marks[next++] = Math.max(0, audio.currentTime - clip.start);
    next >= lines.length ? finish() : show();
  };
  window.addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); tap(); } });
  canvas.addEventListener("click", (e) => { e.stopImmediatePropagation(); tap(); }, true);
  box.addEventListener("click", () => { if (next < lines.length) tap(); });
  audio.addEventListener("pause", () => { if (started && next < lines.length && audio.currentTime >= clip.end - 0.1) finish(); });
  show();
}

Promise.all([loadPhrases(), document.fonts.load('15px "Gochi Hand"').catch(() => {})]).then(() => {
  if (MARK) setupMarking();
  requestAnimationFrame(loop);
});

// Para revisar desde la consola: dibuja el segundo `sec` de la parte sin sonar.
window.__cancion = { lines, clip, at: (sec) => { done = true; Object.defineProperty(audio, "currentTime", { value: clip.start + sec, configurable: true, writable: true }); render(clock); } };
