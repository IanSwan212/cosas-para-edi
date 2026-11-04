// El muñequito en versión karaoke, en un escenario de garabato. Se elige una canción
// (assets/*.mp3) y su letra sale de letras/<id>.txt en formato LRC («[mm:ss.xx] texto»).
// El muñequito canta al ritmo de esa letra: abre la boca con cada palabra del renglón que suena
// (y más o menos según el volumen de la voz) y la cierra cuando nadie canta. La letra se pinta de
// rosa palabra por palabra. El dibujo es como el del muñequito: 1 bit y trazos que tiemblan.

const W = 240, H = 160, FPS = 12, TAU = Math.PI * 2;
const canvas = document.getElementById("stage");
const g = canvas.getContext("2d", { willReadFrequently: true });
const playBtn = document.getElementById("play");
const againBtn = document.getElementById("again");
const lyricsEl = document.getElementById("lyrics");
const pickEl = document.getElementById("songs");

const SONGS = [
  { id: "vinculo", name: "vínculo", audio: "assets/vinculo.mp3", letra: "letras/vinculo.txt" },
  { id: "camara-de-faltas", name: "cámara de faltas", audio: "assets/camara-de-faltas.mp3", letra: "letras/camara-de-faltas.txt" },
  { id: "my-one-and-only-love", name: "my one and only love", audio: "assets/my-one-and-only-love.mp3", letra: "letras/my-one-and-only-love.txt" },
];

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

// ---------- Canción en archivo, con su letra LRC ----------

function parseLrc(txt) {
  const raw = [];
  for (const l0 of txt.split(/\r?\n/)) {
    const l = l0.trim();
    if (!l || l.startsWith("#") || /^\[[a-z]+:/i.test(l)) continue;
    const m = l.match(/^((?:\[\d+:\d{1,2}(?:[.:]\d+)?\])+)\s*(.*)$/);
    if (!m || !m[2].trim()) continue;
    for (const tag of m[1].match(/\d+:\d{1,2}(?:[.:]\d+)?/g)) {
      const [mm, rest] = tag.split(/:(.*)/s);
      raw.push({ t: Number(mm) * 60 + Number(rest.replace(":", ".")), text: m[2].trim() });
    }
  }
  raw.sort((a, b) => a.t - b.t);
  // Cada renglón dura hasta el siguiente (a lo mucho 7 s); sus palabras se reparten en ese tiempo.
  return raw.map((r, i) => {
    const t1 = Math.min(i + 1 < raw.length ? raw[i + 1].t : r.t + 5, r.t + 7);
    const words = r.text.split(/\s+/);
    const span = (t1 - r.t) * 0.85, total = words.reduce((s, w) => s + w.length + 1, 0);
    let acc = 0;
    return {
      t0: r.t, t1,
      words: words.map((w) => { const a = r.t + (acc / total) * span; acc += w.length + 1; return { text: w, t0: a, t1: r.t + (acc / total) * span }; }),
    };
  });
}

// La palabra que se está cantando en el segundo t (o null).
function wordAt(lines, t) {
  for (const l of lines) {
    if (t < l.t0) return null;
    if (t < l.t1) return l.words.find((w) => t >= w.t0 && t < w.t1) || null;
  }
  return null;
}

function fileTrack(def) {
  const audio = new Audio();
  let ctx = null, analyser = null, buf = null, level = 0, peak = 0.05, heldSince = -1;
  const tr = {
    lines: [],
    ready: Promise.all([
      fetch(def.letra, { cache: "no-cache" }).then((r) => r.text()).then((t) => { tr.lines.push(...parseLrc(t)); }).catch(() => {}),
      // Se carga completa en memoria, así se puede adelantar aunque el servidor no lo permita.
      fetch(def.audio).then((r) => r.blob()).then((b) => { audio.src = URL.createObjectURL(b); }).catch(() => { audio.src = def.audio; }),
    ]),
    started: () => !!ctx,
    time: () => audio.currentTime,
    running: () => !audio.paused && !audio.ended,
    ended: () => audio.ended,
    toggle() {
      if (!ctx) {
        // El volumen de la voz mueve la boca: se mide la energía en la banda donde canta una voz.
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const src = ctx.createMediaElementSource(audio);
        const band = ctx.createBiquadFilter();
        band.type = "bandpass"; band.frequency.value = 1100; band.Q.value = 0.8;
        analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        buf = new Float32Array(analyser.fftSize);
        src.connect(ctx.destination);
        src.connect(band).connect(analyser);
      }
      if (ctx.state === "suspended") ctx.resume();
      if (audio.paused) audio.play().catch(() => {}); else audio.pause();
    },
    stop() { audio.pause(); audio.currentTime = 0; },
    seek(s) { audio.currentTime = s; }, // para revisar desde la consola
    // Nivel de la voz (0..1), suavizado y relativo a lo más fuerte que ha sonado.
    sample() {
      if (!analyser || audio.paused) { level *= 0.85; return; }
      analyser.getFloatTimeDomainData(buf);
      let s = 0;
      for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      const rms = Math.sqrt(s / buf.length);
      peak = Math.max(peak * 0.9995, rms);
      level += (clamp01(rms / peak) - level) * 0.5;
    },
    // Boca: se abre al empezar cada palabra del renglón que suena y se va cerrando; el volumen de
    // la voz la abre más o menos. Si no hay renglón sonando, se queda cerrada.
    mouth(t) {
      const w = wordAt(tr.lines, t);
      if (!w) return 0;
      const pulse = 0.35 + 0.65 * Math.exp(-(t - w.t0) * 6);
      return Math.min(1, pulse * (0.55 + 0.6 * level));
    },
    // Ojitos cerrados de gusto cuando una palabra se sostiene.
    held(t) { const w = wordAt(tr.lines, t); return !!w && w.t1 - w.t0 > 0.7 && t - w.t0 > 0.3; },
    // Mano arriba cuando canta y la canción sube.
    chorus(t) { return !!wordAt(tr.lines, t) && level > 0.75; },
    beat: 0.6,
  };
  return tr;
}

// ---------- Selección de canción ----------

let def = SONGS[0], track = fileTrack(def);

function choose(d) {
  if (track) track.stop();
  def = d;
  track = fileTrack(d);
  shownLine = -2;
  [...pickEl.children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === d.id)));
  syncButtons();
}

pickEl.innerHTML = SONGS.map((s) => `<button type="button" data-id="${s.id}" aria-pressed="${s === def}">${s.name}</button>`).join("");
pickEl.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) choose(SONGS.find((s) => s.id === b.dataset.id)); });

function toggle() { track.ready.then(() => { if (track.ended()) { track.stop(); } track.toggle(); syncButtons(); }); }
function again() { const d = def; choose(d); toggle(); }
function syncButtons() {
  const on = track.started() && track.running();
  playBtn.textContent = on ? "pausa" : track.started() && !track.ended() ? "seguir" : "cantar";
}
playBtn.addEventListener("click", toggle);
againBtn.addEventListener("click", again);
canvas.addEventListener("click", toggle);

// ---------- Escenario ----------

function drawStage(singing) {
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

// ---------- La tele de la letra ----------
// Una tele de garabato colgada sobre el escenario. Muestra el renglón que se canta: cada palabra
// aparece cuando le toca y la que suena va subrayada. Si no hay renglón, solo una notita.

function wrapWords(words, maxW) {
  const rowsOut = [[]];
  let w0 = 0;
  for (const w of words) {
    const ww = g.measureText(w.text + " ").width;
    if (w0 + ww > maxW && rowsOut[rowsOut.length - 1].length) { rowsOut.push([]); w0 = 0; }
    rowsOut[rowsOut.length - 1].push({ ...w, ww });
    w0 += ww;
  }
  return rowsOut;
}

function drawTV(t) {
  const x = 64, y = 15, w = 112, h = 44;
  g.lineWidth = 1.4;
  // Cables que la cuelgan de la cenefa.
  line(x + 18, 8, x + 22, y, 700); line(x + w - 18, 8, x + w - 22, y, 701);
  // Caja de la tele, pantalla con esquinas redondeadas y dos perillas.
  g.fillStyle = "#fff"; g.fillRect(x, y, w, h); g.fillStyle = "#000";
  line(x, y, x + w, y, 702); line(x + w, y, x + w, y + h, 708); line(x + w, y + h, x, y + h, 714); line(x, y + h, x, y, 720);
  g.beginPath(); g.roundRect(x + 4, y + 4, w - 20, h - 8, 5); g.stroke();
  circle(x + w - 8, y + 12, 2.2, 726); circle(x + w - 8, y + 21, 2.2, 727);
  for (let k = 0; k < 3; k++) line(x + w - 11, y + 30 + k * 3, x + w - 5, y + 30 + k * 3, 728 + k);
  g.lineWidth = 1.7;

  const sx = x + 8, sw = w - 28, sy = y + 6, sh = h - 12;
  const lines = track.lines;
  const idx = track.started() ? lines.findIndex((l) => t >= l.t0 && t < l.t1) : -1;
  if (idx < 0) { note(sx + sw / 2 - 2, sy + sh / 2 + 5, 740); return; }
  // Letra a mano: lo más grande que quepa en la pantalla (hasta tres renglones).
  let size = 11, rws;
  for (; size >= 7; size--) {
    g.font = `${size}px "Gochi Hand", cursive`;
    rws = wrapWords(lines[idx].words, sw);
    if (rws.length * (size + 1) <= sh) break;
  }
  const lh = size + 1, top = sy + (sh - rws.length * lh) / 2 + size - 1;
  rws.forEach((row, r) => {
    const rowW = row.reduce((a, wd) => a + wd.ww, 0);
    let cx = sx + (sw - rowW) / 2;
    for (const wd of row) {
      if (t >= wd.t0) {
        g.fillText(wd.text, cx, top + r * lh);
        if (t < wd.t1) line(cx, top + r * lh + 2, cx + wd.ww - 3, top + r * lh + 2, 760 + r); // la que suena
      }
      cx += wd.ww;
    }
  });
}

// ---------- El muñequito cantando ----------

function drawSinger(t, playing) {
  const beat = t / track.beat;
  const open = playing ? track.mouth(t) : 0;
  const cx = 112 + (playing ? Math.sin(beat * Math.PI) * 2.5 : 0);
  const cy = 92 - (playing ? Math.abs(Math.sin(beat * Math.PI)) * 1.6 : Math.sin(t * 2) * 1);
  const R = 18;
  g.fillStyle = "#fff"; circle(cx, cy, R, 1, true); g.fillStyle = "#000";
  circle(cx, cy, R, 1);
  // Ojos: cerrados de gusto en las notas largas; parpadea de vez en cuando.
  const held = playing && track.held(t);
  const blink = (t % 3.3) < 0.13;
  for (const s of [-1, 1]) {
    const x = cx + s * 7, y = cy - 4;
    if (held) arc(x, y + 1.5, 2.6, Math.PI * 1.15, Math.PI * 1.85, 30 + s);
    else if (blink) line(x - 2, y, x + 2, y, 20 + s);
    else circle(x, y, 1.5, 10 + s, true);
  }
  // Boca: se abre con cada sílaba (o con la voz de la canción).
  const my = cy + 7;
  if (open > 0) { g.beginPath(); g.ellipse(cx, my, 2.6 + open * 1.2, 1.6 + open * 3.2, 0, 0, TAU); g.stroke(); }
  else arc(cx, my - 3, 4.5, Math.PI * 0.15, Math.PI * 0.85, 83);
  // Chapitas en el coro.
  const chorus = playing && track.chorus(t);
  if (chorus) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) line(cx + s * 13 - 2 + k * 1.6, cy + 3, cx + s * 13 - 3 + k * 1.6, cy + 5.5, 90 + k + s * 5);

  // Micrófono en su pedestal; la mano derecha lo sostiene.
  const sx = cx + 30, mx = cx + 21, my2 = cy + 5;
  line(sx, 124, sx, cy + 14, 500);
  line(sx - 6, 124, sx + 6, 124, 501);
  line(sx, cy + 14, mx + 2, my2 + 2, 502);
  g.fillStyle = "#fff"; circle(mx, my2, 3.2, 503, true); g.fillStyle = "#000"; circle(mx, my2, 3.2, 503);
  line(mx - 2, my2 - 1.5, mx + 2, my2 + 1.5, 504); line(mx - 2, my2 + 1.5, mx + 2, my2 - 1.5, 505);
  const hR = [mx + 3, my2 + 9];
  // La otra mano: en el coro (o cuando la canción sube) se levanta y se mece.
  const up = chorus ? Math.sin(beat * Math.PI) * 5 : 0;
  const hL = chorus ? [cx - 26, cy - 6 - Math.abs(up)] : [cx - 26, cy + 13];
  for (const [x, y, id] of [[hL[0], hL[1], 100], [hR[0], hR[1], 101]]) {
    g.fillStyle = "#fff"; circle(x, y, 4.2, id, true); g.fillStyle = "#000"; circle(x, y, 4.2, id);
  }
  // Notitas que salen flotando mientras canta.
  if (playing && open > 0) for (let k = 0; k < 4; k++) {
    const ph = (t * 0.45 + k / 4) % 1;
    note(cx + 22 + ph * 30 + Math.sin(ph * 6 + k) * 4, cy - 10 - ph * 40, 600 + k * 9);
  }
}

// ---------- Letra estilo karaoke ----------

const rows = [document.createElement("p"), document.createElement("p")];
rows.forEach((r, i) => { r.className = i ? "next" : "now"; lyricsEl.appendChild(r); });
let shownLine = -2;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const lineSpans = (l) => (l ? l.words.map((w) => `<span class="w">${esc(w.text)}</span>`).join(" ") : "&nbsp;");

function updateLyrics(t) {
  const lines = track.lines;
  // Solo se ve el renglón que se está cantando, y cada palabra aparece cuando le toca;
  // entre renglones (intro, solos) no se ve nada.
  const idx = track.started() ? lines.findIndex((l) => t >= l.t0 && t < l.t1) : -1;
  const key = `${def.id}:${idx}:${lines.length}:${track.started()}:${track.ended()}`;
  if (key !== shownLine) {
    shownLine = key;
    rows[1].innerHTML = "&nbsp;";
    rows[0].classList.toggle("note", !lines.length);
    if (!lines.length) {
      rows[0].innerHTML = "falta la letra";
      rows[1].innerHTML = `pégala en karaoke/${def.letra}`;
    } else if (idx >= 0) rows[0].innerHTML = lineSpans(lines[idx]);
    else if (!track.started()) rows[0].innerHTML = "toca «cantar»";
    else rows[0].innerHTML = track.ended() ? "gracias por cantar conmigo" : "&nbsp;";
  }
  if (idx < 0) return;
  const spans = rows[0].querySelectorAll(".w");
  lines[idx].words.forEach((w, i) => {
    if (!spans[i]) return;
    spans[i].style.visibility = t >= w.t0 ? "visible" : "hidden";
    spans[i].style.setProperty("--p", `${(clamp01((t - w.t0) / Math.max(0.05, w.t1 - w.t0)) * 100).toFixed(1)}%`);
  });
}

// ---------- Cuadro completo ----------

function render(t, playing) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
  g.strokeStyle = g.fillStyle = "#000";
  g.lineCap = g.lineJoin = "round";
  drawStage(track.started() && !track.ended());
  drawTV(Math.max(0, t));
  drawSinger(Math.max(0, t), playing);
  if (track.started() && track.ended()) { g.font = '15px "Gochi Hand", cursive'; g.fillText("¡gracias!", 150, 80); }
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const c = d[i] < 150 ? [17, 17, 17] : [239, 237, 232];
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

let lastFrame = -1, idleClock = 0, lastReal = performance.now(), wasEnded = false;
function loop(now) {
  idleClock += (now - lastReal) / 1000;
  lastReal = now;
  if (track.sample) track.sample();
  const playing = track.started() && track.running();
  const t = track.started() ? track.time() : idleClock;
  const ended = track.started() && track.ended();
  if (ended !== wasEnded) { wasEnded = ended; syncButtons(); }
  const f = Math.floor(idleClock * FPS);
  if (f !== lastFrame) { lastFrame = f; boil = Math.floor(f / 2); render(t, playing); }
  updateLyrics(t);
  requestAnimationFrame(loop);
}

document.fonts.load('15px "Gochi Hand"').catch(() => {}).finally(() => requestAnimationFrame(loop));

window.__karaoke = { songs: SONGS, choose: (id) => choose(SONGS.find((s) => s.id === id)), track: () => track };
