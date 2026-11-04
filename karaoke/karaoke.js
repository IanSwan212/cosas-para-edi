// El muñequito en versión karaoke: canta una canción original en un escenario de garabato.
// La música se toca en el navegador (Web Audio): melodía, acordes, bajo y una batería suave,
// todo programado de antemano; el reloj del audio manda, así la boca, las notitas y la letra
// van siempre a tiempo con lo que suena. El dibujo es como el del muñequito: 1 bit y trazos
// que tiemblan.
import { buildSong, BEAT } from "./song.js";

const W = 240, H = 160, FPS = 12, TAU = Math.PI * 2;
const canvas = document.getElementById("stage");
const g = canvas.getContext("2d", { willReadFrequently: true });
const playBtn = document.getElementById("play");
const againBtn = document.getElementById("again");
const lyricsEl = document.getElementById("lyrics");

const song = buildSong();
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

// ---------- Trazos de garabato (los mismos del muñequito) ----------

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
function note(x, y, id) { // notita musical: cabeza, plica y banderita
  circle(x, y, 2, id, true);
  line(x + 1.8, y, x + 1.8, y - 8, id + 3);
  line(x + 1.8, y - 8, x + 4.5, y - 5.5, id + 6);
}

// ---------- Audio ----------

let ac = null, startAt = 0, ended = false;

function songTime() { return ac ? ac.currentTime - startAt : 0; }

const hz = (m) => 440 * 2 ** ((m - 69) / 12);

function envelope(node, t, dur, peak, attack = 0.02, release = 0.15) {
  node.gain.setValueAtTime(0, t);
  node.gain.linearRampToValueAtTime(peak, t + attack);
  node.gain.setTargetAtTime(peak * 0.65, t + attack, dur * 0.4);
  node.gain.setTargetAtTime(0, t + dur, release / 3);
}

function tone(out, type, freq, t, dur, peak, attack, release) {
  const o = ac.createOscillator(), v = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  envelope(v, t, dur, peak, attack, release);
  o.connect(v).connect(out);
  o.start(t);
  o.stop(t + dur + release * 2 + 0.05);
}

function schedule() {
  const master = ac.createGain();
  master.gain.value = 0.75;
  const comp = ac.createDynamicsCompressor();
  master.connect(comp).connect(ac.destination);
  const T = (s) => startAt + s;
  // Melodía: triángulo con un brillo suave una octava arriba.
  for (const n of song.notes) {
    tone(master, "triangle", hz(n.midi), T(n.t), n.dur, 0.17, 0.02, 0.14);
    tone(master, "sine", hz(n.midi + 12), T(n.t), n.dur, 0.035, 0.02, 0.1);
  }
  // Acordes de fondo y bajo en el 1 y el 3 de cada compás.
  for (const c of song.chords) {
    for (const k of c.notes) tone(master, "sine", hz(48 + k), T(c.t), c.dur - 0.05, 0.03, 0.25, 0.4);
    for (const b of [0, 2]) if (b * BEAT < c.dur) tone(master, "triangle", hz(36 + (c.notes[0] % 12)), T(c.t + b * BEAT), BEAT * 0.9, 0.1, 0.01, 0.12);
  }
  // Batería suave: bombo en 1 y 3, chasquido en 2 y 4, platillo en los contratiempos.
  const noise = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const hit = (t, type, freq, gain, len) => {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), v = ac.createGain();
    s.buffer = noise; f.type = type; f.frequency.value = freq;
    v.gain.setValueAtTime(gain, t); v.gain.exponentialRampToValueAtTime(0.001, t + len);
    s.connect(f).connect(v).connect(master);
    s.start(t); s.stop(t + len + 0.02);
  };
  const beats = Math.floor(song.length / BEAT) - 4;
  for (let b = 0; b < beats; b++) {
    const t = T(b * BEAT);
    if (b % 2 === 0) {
      const o = ac.createOscillator(), v = ac.createGain();
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
      v.gain.setValueAtTime(0.28, t); v.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(v).connect(master); o.start(t); o.stop(t + 0.3);
    } else hit(t, "bandpass", 1800, 0.07, 0.12);
    hit(t + BEAT / 2, "highpass", 7000, 0.025, 0.04);
  }
}

function play() {
  if (!ac) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    ac = new Ctx();
    startAt = ac.currentTime + 0.15;
    ended = false;
    schedule();
  } else if (ac.state === "suspended") ac.resume();
  else { ac.suspend(); }
  syncButtons();
}
function again() {
  if (ac) ac.close();
  ac = null;
  play();
}
function syncButtons() {
  const on = ac && ac.state !== "suspended" && !ended;
  playBtn.textContent = on ? "pausa" : ended ? "cantar" : ac ? "seguir" : "cantar";
}
playBtn.addEventListener("click", () => (ended ? again() : play()));
againBtn.addEventListener("click", again);
canvas.addEventListener("click", () => (ended ? again() : play()));

// ---------- Escenario ----------

function drawStage(t, singing) {
  g.lineWidth = 1.3;
  // Telón: cenefa con ondas arriba y cortinas a los lados con pliegues.
  line(0, 6, 240, 6, 400);
  for (let k = 0; k < 12; k++) arc(10 + k * 20, 6, 10, 0, Math.PI, 410 + k);
  for (const side of [0, 1]) {
    const x0 = side ? 214 : 0, x1 = side ? 240 : 26;
    for (let k = 0; k < 4; k++) {
      const x = x0 + (k + 0.5) * ((x1 - x0) / 4);
      g.beginPath();
      for (let j = 0; j <= 10; j++) { const y = 14 + j * 11, xx = x + Math.sin(j * 0.9 + k) * 1.5; j ? g.lineTo(xx, y) : g.moveTo(xx, y); }
      g.stroke();
    }
    line(side ? 214 : 26, 14, side ? 210 : 30, 124, 430 + side);
  }
  // Tarima con tablones.
  line(20, 124, 220, 124, 440); line(10, 132, 230, 132, 441);
  for (let k = 0; k < 7; k++) line(34 + k * 28, 124, 30 + k * 29, 132, 445 + k);
  // Reflector: un cono de luz punteado desde arriba.
  if (singing) {
    g.setLineDash([2, 3]);
    line(120, 8, 72, 124, 460); line(120, 8, 168, 124, 461);
    g.setLineDash([]);
  }
  g.lineWidth = 1.7;
}

// ---------- El muñequito cantando ----------

function activeNote(t) {
  for (const n of song.notes) if (t >= n.t && t < n.t + n.dur) return n;
  return null;
}

function drawSinger(t, playing) {
  const beat = t / BEAT;
  const n = playing ? activeNote(t) : null;
  const cx = 112 + (playing ? Math.sin(beat * Math.PI) * 2.5 : 0);
  const cy = 92 - (playing ? Math.abs(Math.sin(beat * Math.PI)) * 1.6 : Math.sin(t * 2) * 1);
  const R = 18;
  g.fillStyle = "#fff"; circle(cx, cy, R, 1, true); g.fillStyle = "#000";
  circle(cx, cy, R, 1);
  // Ojos: cerrados de gusto en las notas largas; parpadea de vez en cuando.
  const held = n && n.dur > BEAT * 1.2 && t - n.t > 0.15;
  const blink = (t % 3.3) < 0.13;
  for (const s of [-1, 1]) {
    const x = cx + s * 7, y = cy - 4;
    if (held) arc(x, y + 1.5, 2.6, Math.PI * 1.15, Math.PI * 1.85, 30 + s);
    else if (blink) line(x - 2, y, x + 2, y, 20 + s);
    else circle(x, y, 1.5, 10 + s, true);
  }
  // Boca: se abre con cada sílaba.
  const my = cy + 7;
  if (n) {
    const open = 0.35 + 0.65 * Math.exp(-(t - n.t) * 5);
    g.beginPath(); g.ellipse(cx, my, 2.6 + open * 1.2, 1.6 + open * 3.2, 0, 0, TAU); g.stroke();
  } else arc(cx, my - 3, 4.5, Math.PI * 0.15, Math.PI * 0.85, 83);
  // Chapitas en el coro.
  const line0 = song.lines.find((l) => t >= l.t0 && t < l.t1);
  const chorus = line0 && /ven|tanto|poquito|aquí/.test(line0.words.map((w) => w.text).join(" "));
  if (chorus) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) line(cx + s * 13 - 2 + k * 1.6, cy + 3, cx + s * 13 - 3 + k * 1.6, cy + 5.5, 90 + k + s * 5);

  // Micrófono en su pedestal; la mano derecha lo sostiene.
  const sx = cx + 30, mx = cx + 21, my2 = cy + 5; // pie del pedestal y cabeza del micrófono, junto a la boca
  line(sx, 124, sx, cy + 14, 500);
  line(sx - 6, 124, sx + 6, 124, 501);
  line(sx, cy + 14, mx + 2, my2 + 2, 502);
  g.fillStyle = "#fff"; circle(mx, my2, 3.2, 503, true); g.fillStyle = "#000"; circle(mx, my2, 3.2, 503);
  line(mx - 2, my2 - 1.5, mx + 2, my2 + 1.5, 504); line(mx - 2, my2 + 1.5, mx + 2, my2 - 1.5, 505);
  const hR = [mx + 3, my2 + 9];
  // La otra mano: en el coro se levanta y se mece.
  const up = chorus ? Math.sin(beat * Math.PI) * 5 : 0;
  const hL = chorus ? [cx - 26, cy - 6 - Math.abs(up)] : [cx - 26, cy + 13];
  for (const [x, y, id] of [[hL[0], hL[1], 100], [hR[0], hR[1], 101]]) {
    g.fillStyle = "#fff"; circle(x, y, 4.2, id, true); g.fillStyle = "#000"; circle(x, y, 4.2, id);
  }
  // Notitas que salen flotando mientras canta.
  if (playing) for (let k = 0; k < 4; k++) {
    const ph = (t * 0.45 + k / 4) % 1;
    const born = t - ph / 0.45;
    if (!activeNote(born)) continue;
    note(cx + 22 + ph * 30 + Math.sin(ph * 6 + k) * 4, cy - 10 - ph * 40, 600 + k * 9);
  }
  return { cx, cy };
}

// ---------- Letra estilo karaoke ----------

const rows = [document.createElement("p"), document.createElement("p")];
rows.forEach((r, i) => { r.className = i ? "next" : "now"; lyricsEl.appendChild(r); });
let shownLine = -2;

function lineSpans(l) {
  return l ? l.words.map((w) => `<span class="w">${w.text}</span>`).join(" ") : "&nbsp;";
}

function updateLyrics(t, playing) {
  let idx = song.lines.findIndex((l) => t < l.t1 - 0.25);
  if (!playing && !ac) idx = -1;
  if (idx !== shownLine) {
    shownLine = idx;
    if (idx < 0) {
      rows[0].innerHTML = ac ? "gracias por cantar conmigo" : "toca «cantar»";
      rows[1].innerHTML = "&nbsp;";
    } else {
      rows[0].innerHTML = lineSpans(song.lines[idx]);
      rows[1].innerHTML = lineSpans(song.lines[idx + 1]);
    }
  }
  if (idx < 0) return;
  const spans = rows[0].querySelectorAll(".w");
  song.lines[idx].words.forEach((w, i) => {
    const p = clamp01((t - w.t0) / Math.max(0.05, w.t1 - w.t0));
    spans[i].style.setProperty("--p", `${(p * 100).toFixed(1)}%`);
  });
}

// ---------- Cuadro completo ----------

function render(t) {
  const playing = ac && ac.state === "running" && t >= 0 && !ended;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
  g.strokeStyle = g.fillStyle = "#000";
  g.lineCap = g.lineJoin = "round";
  drawStage(t, playing || (ac && !ended));
  drawSinger(Math.max(0, t), playing);
  if (ended) { g.font = '15px "Gochi Hand", cursive'; g.fillText("¡gracias!", 140, 50); }
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const c = d[i] < 150 ? [17, 17, 17] : [239, 237, 232];
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

let lastFrame = -1, idleClock = 0, lastReal = performance.now();
function loop(now) {
  idleClock += (now - lastReal) / 1000;
  lastReal = now;
  let t = ac ? songTime() : idleClock;
  if (ac && !ended && songTime() > song.length) { ended = true; syncButtons(); }
  if (!ac) t = idleClock;
  const f = Math.floor((ac ? songTime() : idleClock) * FPS);
  if (f !== lastFrame) { lastFrame = f; boil = Math.floor(f / 2); render(ac ? t : idleClock); }
  updateLyrics(ac ? t : -1, ac && ac.state === "running");
  requestAnimationFrame(loop);
}

document.fonts.load('15px "Gochi Hand"').catch(() => {}).finally(() => requestAnimationFrame(loop));

// Para revisar desde la consola: dibuja el momento `sec` de la canción sin sonar.
window.__karaoke = {
  song,
  at: (sec) => {
    const fake = { currentTime: sec + 10, state: "running", close() {}, suspend() {}, resume() {} };
    ac = fake; startAt = 10; ended = false; boil = Math.floor(sec * FPS / 2);
    render(sec); updateLyrics(sec, true);
  },
};
