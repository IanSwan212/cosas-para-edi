// Un editor de código donde el muñequito teclea, renglón por renglón, lo que dice frases.txt
// mientras suena una parte de la canción, como en el video del editor. La "cámara" mira muy de
// cerca el renglón que se escribe, inclinada, y se desliza con un leve desenfoque. Al final sale
// el aviso de «¿borrar todo?», se elige «Cancelar» y queda «// sigo aquí.».
//
// frases.txt: «inicio m:ss», «fin m:ss» y un renglón por frase, con o sin tiempo
// («0:05 texto»). Si no tienen tiempo se reparten solos. Con cancion/?marcar se toman los
// tiempos tocando al ritmo de la canción.

const code = document.getElementById("code");
const cam = document.getElementById("cam");
const pos = document.getElementById("pos");
const hint = document.getElementById("hint");
const dialog = document.getElementById("dialog");
const pointer = document.getElementById("pointer");
// La canción se carga completa en memoria: así se puede saltar a la parte elegida aunque el
// servidor no permita pedir solo un pedazo del archivo (el servidor local de pruebas no lo permite).
const audio = new Audio();
audio.preload = "auto";
const songReady = fetch("assets/cancion.mp3")
  .then((r) => r.blob())
  .then((b) => { audio.src = URL.createObjectURL(b); })
  .catch(() => { audio.src = "assets/cancion.mp3"; });

let clip = { start: 60, end: 105 };
let lines = []; // { t, text }
let playing = false, ended = false, endAt = 0;
let debugT = null; // para revisar un momento fijo desde la consola
const OUTRO = "// sigo aquí.";

// ---------- frases.txt ----------

const toSec = (s) => { const [m, sec] = s.split(":").map(Number); return (m || 0) * 60 + (sec || 0); };

async function loadPhrases() {
  let txt = "";
  try { txt = await (await fetch("frases.txt", { cache: "no-cache" })).text(); } catch (e) {}
  const lrc = []; // renglones en formato LRC: [mm:ss.xx] texto (tiempo desde el inicio de la canción)
  let hasStart = false, hasEnd = false;
  for (const raw of txt.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l || l.startsWith("#")) continue;
    let m = l.match(/^inicio\s+(\d+:\d{1,2})/i);
    if (m) { clip.start = toSec(m[1]); hasStart = true; continue; }
    m = l.match(/^fin\s+(\d+:\d{1,2})/i);
    if (m) { clip.end = toSec(m[1]); hasEnd = true; continue; }
    // LRC: uno o varios tiempos entre corchetes al principio; las etiquetas como [ar:…] o [ti:…] se ignoran.
    if (/^\[[a-z]+:/i.test(l)) continue;
    m = l.match(/^((?:\[\d+:\d{1,2}(?:[.:]\d+)?\])+)\s*(.*)$/);
    if (m) {
      const text = m[2].trim();
      for (const tag of m[1].match(/\d+:\d{1,2}(?:[.:]\d+)?/g)) {
        const [mm, rest] = tag.split(/:(.*)/s);
        lrc.push({ abs: Number(mm) * 60 + Number(rest.replace(":", ".")), text });
      }
      continue;
    }
    m = l.match(/^(?:(\d+:\d{1,2}(?:\.\d+)?)\s+)?(.+?)\s*(?:\[\w+\])?$/); // la [carita] ya no se usa aquí
    if (m) lines.push({ t: m[1] ? toSec(m[1]) : null, text: m[2] });
  }
  if (lrc.length) {
    lrc.sort((a, b) => a.abs - b.abs);
    // Sin inicio o fin escritos, la parte va del primer renglón al último (con un respiro).
    if (!hasStart) clip.start = Math.max(0, lrc[0].abs - 1.5);
    if (!hasEnd) clip.end = lrc[lrc.length - 1].abs + 5;
    for (const r of lrc) if (r.text && r.abs >= clip.start - 0.01 && r.abs < clip.end) lines.push({ t: r.abs - clip.start, text: r.text });
  }
  // Los renglones sin tiempo se reparten parejos entre sus vecinos con tiempo (o en toda la parte).
  const dur = Math.max(1, clip.end - clip.start);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].t !== null) continue;
    let j = i;
    while (j < lines.length && lines[j].t === null) j++;
    const a = i > 0 ? lines[i - 1].t : 0.5, b = j < lines.length ? lines[j].t : dur - 3;
    const off = i > 0 ? 1 : 0;
    for (let k = i; k < j; k++) lines[k].t = a + ((b - a) * (k - i + off)) / (j - i + off);
    i = j - 1;
  }
  lines.sort((a, b) => a.t - b.t);
}

// ---------- Colores de código (para lo que se escriba, sea código o no) ----------

const KW = new Set(["const", "let", "var", "if", "else", "while", "for", "return", "function", "new", "true", "false", "null", "await", "async", "import", "from", "export", "class", "do"]);
const ME = new Set(["i", "yo", "me", "mi", "mí", "we", "nosotros", "us"]);
const YOU = new Set(["you", "tú", "tu", "ti", "te", "edi"]);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function highlight(src) {
  if (/^\s*\/\//.test(src)) return `<span class="t-com">${esc(src)}</span>`;
  let out = "", i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    let m;
    if ((m = rest.match(/^"[^"]*"?|^'[^']*'?/))) { out += `<span class="t-str">${esc(m[0])}</span>`; i += m[0].length; continue; }
    if ((m = rest.match(/^\d+(\.\d+)?/))) { out += `<span class="t-num">${m[0]}</span>`; i += m[0].length; continue; }
    if ((m = rest.match(/^[\p{L}_$][\p{L}\p{N}_$]*/u))) {
      const w = m[0], lw = w.toLowerCase(), prev = src[i - 1], next = src[i + w.length];
      const cls = KW.has(lw) ? "t-kw" : ME.has(lw) ? "t-me" : YOU.has(lw) ? "t-you" : next === "(" ? "t-fn" : prev === "." ? "t-prop" : "";
      out += cls ? `<span class="${cls}">${esc(w)}</span>` : esc(w);
      i += w.length; continue;
    }
    if (/[().,;{}\[\]=+\-*/<>!:]/.test(src[i])) { out += `<span class="t-p">${esc(src[i])}</span>`; i++; continue; }
    out += esc(src[i]); i++;
  }
  return out;
}

// ---------- Tecleo ----------

const FACE = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#fff" stroke="#111" stroke-width="1.6"/>
  <circle cx="9" cy="10" r="1.2" fill="#111"/><circle cx="15" cy="10" r="1.2" fill="#111"/><path d="M8.5 14q3.5 3 7 0" fill="none" stroke="#111" stroke-width="1.4" stroke-linecap="round"/></svg>`;

// Cuántos caracteres del renglón i se ven en el segundo t de la parte.
function typed(i, t) {
  const l = lines[i];
  if (t < l.t) return 0;
  const gap = (i + 1 < lines.length ? lines[i + 1].t : l.t + 3) - l.t;
  const cps = Math.max(9, Math.min(28, l.text.length / Math.max(0.6, gap * 0.75)));
  return Math.min(l.text.length, Math.floor((t - l.t) * cps) + 1);
}

let lastHtml = "", curLine = -1;
function renderCode(t, outro) {
  const rows = [];
  let cur = -1, curCol = 0, typing = false;
  lines.forEach((l, i) => {
    const n = typed(i, t);
    if (n > 0) { cur = i; curCol = n; typing = n < l.text.length; rows.push(l.text.slice(0, n)); }
  });
  if (outro > 0) { rows.push(""); rows.push(OUTRO.slice(0, outro)); cur = rows.length - 1; curCol = outro; typing = outro < OUTRO.length; }
  if (!rows.length) rows.push("");
  const html = rows.map((r, i) => {
    const caret = i === Math.max(cur, 0) ? `<span class="caret${typing ? " typing" : ""}"><span class="who">${FACE}yo</span></span>` : "";
    return `<div class="ln${i === cur ? " cur" : ""}"><span class="num">${i + 1}</span><span>${highlight(r)}${caret}</span></div>`;
  }).join("");
  if (html !== lastHtml) { code.innerHTML = html; lastHtml = html; }
  pos.textContent = `Ln ${Math.max(cur, 0) + 1}, Col ${curCol + 1}`;
  return Math.max(cur, 0);
}

// ---------- Cámara ----------
// Sigue al cursor muy de cerca, con un leve giro en 3D; cuando cambia de renglón se desliza
// y se desenfoca un instante, como la cámara en mano del video.

let camX = 0, camY = 0, camZ = 1.6, lastMove = -10;
function moveCamera(line, t, dt) {
  const caret = code.querySelector(".caret");
  const editor = document.getElementById("editor");
  let tx = 300, ty = 120;
  if (caret) {
    // Posición del cursor dentro del editor, sin contar la cámara (offsets de maquetación).
    tx = 0; ty = 0;
    for (let el = caret; el && el !== editor; el = el.offsetParent) { tx += el.offsetLeft; ty += el.offsetTop; }
  }
  if (line !== curLine) { curLine = line; lastMove = t; }
  const k = 1 - Math.exp(-dt * 3.2);
  // El cursor queda un poco a la derecha del centro: se ve lo recién escrito a su izquierda.
  camX += (tx - (window.innerWidth * 0.12) / camZ - camX) * k;
  camY += (ty - camY) * k;
  const zoom = 1.6 + 0.15 * Math.sin(t * 0.35);
  camZ += (zoom - camZ) * k;
  const rx = 8 + 3 * Math.sin(t * 0.27), ry = -14 + 6 * Math.sin(t * 0.21), rz = -3 + 1.5 * Math.sin(t * 0.31);
  cam.style.transform = `scale(${camZ}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) translate(${-camX}px, ${-camY}px)`;
  const moving = t - lastMove < 0.45;
  cam.style.filter = moving ? "blur(2.2px)" : "blur(0px)";
}

// ---------- Final: «¿borrar todo?» → Cancelar ----------

function playEnding(since) {
  dialog.classList.toggle("on", since > 0.8 && since < 4.6);
  const cancel = document.getElementById("cancel");
  if (since > 1.2 && since < 4.6) {
    pointer.style.opacity = 1;
    const go = since > 1.8;
    pointer.style.left = go ? `${cancel.offsetLeft + 30}px` : "430px";
    pointer.style.top = go ? `${cancel.offsetTop + 16}px` : "150px";
  } else pointer.style.opacity = 0;
  cancel.classList.toggle("hit", since > 3 && since < 4.6);
  const outro = since > 4.8 ? Math.min(OUTRO.length, Math.floor((since - 4.8) * 10) + 1) : 0;
  return outro;
}

// ---------- Reproducción ----------

function start() {
  ended = false;
  hint.classList.add("gone");
  audio.volume = 0;
  songReady
    .then(() => { audio.currentTime = clip.start; return audio.play(); })
    .then(() => { playing = true; })
    .catch((e) => console.warn("no se pudo reproducir:", e.name, e.message));
}

let last = performance.now(), clock = 0;
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  clock += dt;
  let t = 0, outro = 0;
  if (playing) {
    const p = audio.currentTime;
    audio.volume = Math.max(0, Math.min(1, (p - clip.start) / 1.2, (clip.end - p) / 2.5)) * 0.85;
    t = p - clip.start;
    if (p >= clip.end) { audio.pause(); playing = false; ended = true; endAt = clock; }
  }
  if (ended) { t = clip.end - clip.start; outro = playEnding(clock - endAt); }
  if (debugT !== null) t = debugT;
  const line = renderCode(t, outro);
  moveCamera(line, clock, dt);
  requestAnimationFrame(loop);
}

document.addEventListener("click", () => { if (!playing && !MARK) start(); });

// ---------- Modo para marcar tiempos (cancion/?marcar) ----------

const MARK = new URLSearchParams(location.search).has("marcar");
const fmt = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r < 10 ? "0" : ""}${r.toFixed(1)}`; };

function setupMarking() {
  const css = document.createElement("style");
  css.textContent = `.mark { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); width: min(92vw, 560px); z-index: 5;
    font: 15px ui-sans-serif, system-ui, sans-serif; color: #eee; background: rgba(20, 20, 26, 0.94); border-radius: 10px; padding: 12px 14px; cursor: pointer; }
    .mark b { color: #ff9ac0; } .mark textarea { width: 100%; height: 40vh; margin-top: 8px; font: 13px ui-monospace, monospace; }
    .mark button { margin-top: 8px; font: inherit; padding: 6px 14px; border-radius: 8px; border: 0; cursor: pointer; }`;
  document.head.appendChild(css);
  hint.classList.add("gone");
  const box = document.createElement("div");
  box.className = "mark";
  document.body.appendChild(box);
  let next = 0, started = false;
  const marks = [];
  const show = () => {
    box.innerHTML = !started ? "Modo para marcar tiempos: toca aquí o la barra espaciadora para empezar la canción."
      : `Toca cuando empiece: <b>${esc(lines[next].text)}</b> (${next + 1} de ${lines.length})`;
  };
  const finish = () => {
    audio.pause(); playing = false; next = lines.length;
    const out = [`inicio ${fmt(clip.start).replace(/\.\d$/, "")}`, `fin ${fmt(clip.end).replace(/\.\d$/, "")}`]
      .concat(lines.map((l, i) => `${fmt(marks[i] ?? l.t)} ${l.text}`)).join("\n");
    box.innerHTML = "Copia esto y pégalo en frases.txt en lugar de lo que tenía:";
    const ta = document.createElement("textarea");
    ta.value = out;
    const copy = document.createElement("button");
    copy.textContent = "copiar";
    copy.onclick = (e) => { e.stopPropagation(); ta.select(); navigator.clipboard?.writeText(out).catch(() => {}); copy.textContent = "copiado"; };
    box.append(ta, copy);
  };
  const tap = () => {
    if (!started) { started = true; start(); show(); return; }
    if (next >= lines.length) return;
    marks[next++] = Math.max(0, audio.currentTime - clip.start);
    next >= lines.length ? finish() : show();
  };
  window.addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); tap(); } });
  box.addEventListener("click", tap);
  audio.addEventListener("pause", () => { if (started && next < lines.length && audio.currentTime >= clip.end - 0.1) finish(); });
  show();
}

loadPhrases().then(() => {
  if (MARK) setupMarking();
  requestAnimationFrame(loop);
});

// Para revisar desde la consola: muestra el segundo `sec` de la parte sin sonar.
window.__cancion = { lines, clip, audio, state: () => ({ playing, ended, debugT }), at: (sec) => { debugT = sec; }, rows: (sec) => (renderCode(sec, 0), code.querySelectorAll(".ln").length) };
