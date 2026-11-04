// Un muñequito de garabato que se cuida como mascota: se le da de comer, se baña, se le da un besito
// y se pone a dormir. Tiene hambre, limpieza, cariño y energía, que bajan con el tiempo real
// (también con la página cerrada) y se guardan en este navegador.
//
// Se dibuja como en el video: a baja resolución, en blanco y negro puros (cada cuadro se pasa a
// 1 bit) y con trazos que tiemblan un poco en cada cuadro, como una animación hecha a mano. Al lado
// escribe palabras a mano, una por una. Vive en un cuartito dibujado igual: ventana, sillón,
// alfombra, lámpara de piso y un refri, de donde sale su comida.

const W = 240, H = 160, FPS = 12, TAU = Math.PI * 2;
const KEY = "munequito.v1";
const canvas = document.getElementById("pet");
const g = canvas.getContext("2d", { willReadFrequently: true });
const btn = {
  feed: document.getElementById("feed"), bath: document.getElementById("bath"),
  love: document.getElementById("love"), sleep: document.getElementById("sleep"),
};

const clamp = (x, a = 0, b = 100) => (x < a ? a : x > b ? b : x);
const clamp01 = (x) => clamp(x, 0, 1);
const nowS = () => Date.now() / 1000;
const rnd = (a, b) => a + (b - a) * Math.random();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- Estado de la mascota ----------

// Cuánto baja cada cosa por hora (y cuánto se recupera la energía dormido).
const RATE = { hunger: 9, clean: 6, love: 8, energy: 7, rest: 35 };

function decay(s, sec) {
  const h = Math.min(Math.max(sec, 0), 3 * 24 * 3600) / 3600; // a lo mucho 3 días de abandono
  s.hunger = clamp(s.hunger - RATE.hunger * h);
  s.clean = clamp(s.clean - RATE.clean * h);
  s.love = clamp(s.love - RATE.love * h);
  s.energy = clamp(s.sleeping ? s.energy + RATE.rest * h : s.energy - RATE.energy * h);
}

function load() {
  const fresh = { hunger: 75, clean: 80, love: 70, energy: 80, sleeping: false, last: nowS() };
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  s = s && typeof s.hunger === "number" ? { ...fresh, ...s } : fresh;
  decay(s, nowS() - s.last);
  s.last = nowS();
  return s;
}
function save() {
  st.last = nowS();
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
}

const st = load();
let act = null; // acción en curso: { kind, t0, dur, refused }
let msg = null; // lo que está escribiendo: { words, t0, hold }
let nextIdle = 3;
let clock = 0; // segundos desde que se abrió la página

// ---------- Trazos de garabato ----------

let boil = 0; // cambia cada dos cuadros: los trazos "hierven" como en una animación a mano
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const wob = (i, amp = 0.6) => (hash(i + boil * 17.3) - 0.5) * 2 * amp;

function circle(cx, cy, r, id, fill = false) {
  const n = Math.max(10, Math.round(r * 1.8));
  g.beginPath();
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * TAU, rr = r + wob(id * 31 + (k % n), Math.min(0.7, r * 0.08 + 0.25));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    k ? g.lineTo(x, y) : g.moveTo(x, y);
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
  const n = 10;
  g.beginPath();
  for (let k = 0; k <= n; k++) {
    const a = a0 + ((a1 - a0) * k) / n, rr = r + wob(id * 7 + k, 0.35);
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    k ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.stroke();
}
function heart(cx, cy, s, id) {
  g.beginPath();
  for (let k = 0; k <= 24; k++) {
    const a = (k / 24) * TAU;
    const x = 16 * Math.sin(a) ** 3, y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    const px = cx + (x / 16) * s + wob(id + k, 0.3), py = cy - (y / 16) * s + wob(id + k + 50, 0.3);
    k ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  g.stroke();
}
function wavy(x, y, len, id) { // línea ondulada que sube (olor, vapor)
  g.beginPath();
  for (let k = 0; k <= 8; k++) {
    const yy = y - (len * k) / 8, xx = x + Math.sin(k * 1.3 + clock * 4 + id) * 1.8;
    k ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
  }
  g.stroke();
}

// ---------- El muñequito ----------

const PET = { x: 104, y: 95, r: 18 };
const FRIDGE = { x: 198, y: 44, w: 34, h: 77 };
const FLOOR = 122;

// ---------- El cuartito ----------

function rect(x, y, w, h, id) {
  line(x, y, x + w, y, id); line(x + w, y, x + w, y + h, id + 6);
  line(x + w, y + h, x, y + h, id + 12); line(x, y + h, x, y, id + 18);
}

function drawRoom(night, fridgeOpen) {
  g.lineWidth = 1.3;
  // Piso y zoclo.
  line(0, FLOOR, 240, FLOOR, 400); line(0, FLOOR + 2.5, 240, FLOOR + 2.5, 401);

  // Ventana con cortinas: sol y una nube de día, luna y estrellas de noche.
  rect(14, 20, 44, 40, 410);
  line(36, 20, 36, 60, 430); line(14, 40, 58, 40, 431);
  for (const s of [0, 1]) {
    const x = s ? 60 : 12;
    g.beginPath();
    for (let k = 0; k <= 8; k++) { const yy = 16 + k * 6, xx = x + (s ? 1 : -1) * (2 + Math.sin(k * 1.4) * 1.5); k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
    g.stroke();
  }
  line(8, 16, 64, 16, 435);
  if (night) {
    circle(25, 29, 5, 440); g.fillStyle = "#fff"; circle(27.5, 27.5, 4.5, 441, true); g.fillStyle = "#000";
    for (const [x, y] of [[45, 26], [50, 33], [42, 51], [22, 52], [53, 48]]) circle(x, y, 0.6, 442 + x, true);
  } else {
    circle(26, 29, 4, 450);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; line(26 + Math.cos(a) * 6, 29 + Math.sin(a) * 6, 26 + Math.cos(a) * 8, 29 + Math.sin(a) * 8, 451 + k); }
    arc(46, 52, 3, Math.PI, TAU, 460); arc(50, 51, 4, Math.PI, TAU, 461); line(43, 52, 54, 52, 462);
  }

  // Alfombra con flecos.
  g.beginPath(); g.ellipse(104, FLOOR + 9, 58, 8, 0, 0, TAU); g.stroke();
  g.beginPath(); g.ellipse(104, FLOOR + 9, 48, 5, 0, 0, TAU); g.stroke();
  for (let k = 0; k < 5; k++) { line(44 - k * 0.6, FLOOR + 5 + k * 2, 41 - k * 0.6, FLOOR + 5 + k * 2, 470 + k); line(164 + k * 0.6, FLOOR + 5 + k * 2, 167 + k * 0.6, FLOOR + 5 + k * 2, 476 + k); }

  // Sillón: respaldo con dos cojines, asiento, brazos y patitas.
  rect(62, 66, 84, 32, 500);
  line(90, 68, 90, 96, 530); line(118, 68, 118, 96, 531);
  rect(56, 96, 96, 14, 540);
  rect(50, 80, 12, 30, 560); rect(146, 80, 12, 30, 580);
  line(56, 110, 56, 117, 600); line(152, 110, 152, 117, 601);

  // Lámpara de piso; de noche está prendida.
  line(172, 58, 172, 120, 610);
  g.beginPath(); g.ellipse(172, 121, 7, 2, 0, 0, TAU); g.stroke();
  line(163, 58, 181, 58, 611); line(163, 58, 166, 42, 612); line(181, 58, 178, 42, 613); line(166, 42, 178, 42, 614);
  if (night) for (let k = 0; k < 5; k++) { const x = 163 + k * 4.5; line(x, 61, x + (x - 172) * 0.5, 70, 620 + k); }

  // Refri con congelador, manijas y un imán de corazón. Abierto: repisas con comida.
  const f = FRIDGE;
  rect(f.x, f.y, f.w, f.h, 640);
  line(f.x + 4, f.y + f.h, f.x + 4, f.y + f.h + 1, 660); line(f.x + f.w - 4, f.y + f.h, f.x + f.w - 4, f.y + f.h + 1, 661);
  if (fridgeOpen > 0.05) {
    line(f.x, f.y + 24, f.x + f.w, f.y + 24, 662);
    line(f.x + 2, f.y + 44, f.x + f.w - 2, f.y + 44, 663); line(f.x + 2, f.y + 60, f.x + f.w - 2, f.y + 60, 664);
    rect(f.x + 5, f.y + 32, 6, 11, 665); line(f.x + 5, f.y + 32, f.x + 8, f.y + 29, 671); // leche
    circle(f.x + 18, f.y + 40, 3, 672); circle(f.x + 25, f.y + 40, 3, 673); // manzanas
    circle(f.x + 10, f.y + 54, 4, 674); circle(f.x + 22, f.y + 55, 4, 675); // galletas
    // La puerta abierta, de lado, hacia el cuarto.
    const dw = 10 * fridgeOpen;
    line(f.x, f.y + 24, f.x - dw, f.y + 27, 676); line(f.x - dw, f.y + 27, f.x - dw, f.y + f.h - 3, 677); line(f.x - dw, f.y + f.h - 3, f.x, f.y + f.h, 678);
  } else {
    line(f.x, f.y + 24, f.x + f.w, f.y + 24, 662);
    line(f.x + 5, f.y + 8, f.x + 5, f.y + 17, 680); line(f.x + 5, f.y + 30, f.x + 5, f.y + 46, 681);
    heart(f.x + 22, f.y + 36, 3.5, 682);
  }
  g.lineWidth = 1.7;
}

function mood() {
  if (st.sleeping) return "sleep";
  if (act) return act.refused ? "full" : act.kind;
  if (st.hunger < 30) return "hungry";
  if (st.energy < 25) return "tired";
  if (st.clean < 30) return "dirty";
  if (st.love < 30) return "lonely";
  return "happy";
}

function drawPet() {
  const m = mood();
  const at = act ? clock - act.t0 : 0;
  let cx = PET.x, cy = PET.y + Math.sin(clock * 2.2) * 1.4;
  if (m === "full") cx += Math.sin(at * 18) * 2.5 * (1 - clamp01(at / 1.2)); // dice que no con la cabeza
  if (m === "love") cy -= Math.abs(Math.sin(at * 7)) * 3; // da saltitos
  if (m === "sleep") cy = PET.y + 3 + Math.sin(clock * 1.2) * 1.2;
  const R = PET.r;
  g.lineWidth = 1.7;
  g.fillStyle = "#fff"; circle(cx, cy, R, 1, true); g.fillStyle = "#000"; // tapa el sillón de atrás
  circle(cx, cy, R, 1);

  // Ojos
  const blink = (clock % 3.7) < 0.14;
  const ex = 7, ey = cy - 4;
  const eyes = m === "sleep" ? "closed" : m === "bath" ? "squint" : m === "love" || (m === "feed" && at > 0.8) ? "joy"
    : m === "hungry" || m === "lonely" || m === "dirty" ? "sad" : m === "tired" ? "tired" : blink ? "blink" : "dot";
  for (const s of [-1, 1]) {
    const x = cx + s * ex;
    if (eyes === "dot") circle(x, ey, 1.5, 10 + s, true);
    else if (eyes === "blink") line(x - 2, ey, x + 2, ey, 20 + s);
    else if (eyes === "joy") arc(x, ey + 1.5, 2.6, Math.PI * 1.15, Math.PI * 1.85, 30 + s);
    else if (eyes === "closed") arc(x, ey - 1, 2.6, Math.PI * 0.15, Math.PI * 0.85, 40 + s);
    else if (eyes === "squint") { line(x - 2.5 * s, ey - 2, x + 2 * s, ey, 50 + s); line(x + 2 * s, ey, x - 2.5 * s, ey + 2, 55 + s); }
    else if (eyes === "sad") { circle(x, ey + 1, 1.4, 60 + s, true); line(x - 3 * s, ey - 4, x + 2 * s, ey - 2.5, 65 + s); }
    else if (eyes === "tired") { line(x - 2.5, ey, x + 2.5, ey, 70 + s); circle(x, ey + 1.6, 0.9, 75 + s, true); }
  }

  // Boca
  const my = cy + 7;
  const yawn = m === "tired" && (clock % 6) < 1.2;
  if (m === "feed" && !act.refused) {
    const open = at < 0.8 ? clamp01((at - 0.25) / 0.4) : at < 2.3 ? (Math.sin(at * 14) > 0 ? 0.8 : 0.15) : 0;
    open > 0.2 ? circle(cx, my, 2 + open * 2.5, 80) : arc(cx, my - 2, 4, Math.PI * 0.2, Math.PI * 0.8, 81);
  } else if (m === "bath" || yawn || m === "sleep") {
    circle(cx, my + (m === "sleep" ? 1 : 0), m === "sleep" ? 1.6 : yawn ? 3.5 : 2.2, 82);
  } else if (m === "love") {
    // Trompita de besito.
    arc(cx - 1, my - 1, 1.6, -Math.PI * 0.5, Math.PI * 0.5, 83);
    arc(cx - 1, my + 2, 1.6, -Math.PI * 0.5, Math.PI * 0.5, 84);
  } else if (m === "happy") {
    arc(cx, my - 3, 4.5, Math.PI * 0.15, Math.PI * 0.85, 83);
  } else if (m === "full") {
    line(cx - 4, my, cx + 4, my, 85);
  } else {
    arc(cx, my + 4, 4, Math.PI * 1.2, Math.PI * 1.8, 86); // triste
  }

  // Chapitas cuando le dan un besito o está contento después de comer.
  if (m === "love" || (m === "feed" && at > 0.8 && !act.refused)) {
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) line(cx + s * 13 - 2 + k * 1.6, cy + 3, cx + s * 13 - 3 + k * 1.6, cy + 5.5, 90 + k + s * 5);
  }

  // Manitas
  let L = [cx - 27, cy + 13], Rh = [cx + 27, cy + 12];
  if (m === "feed" && !act.refused && at > 0.6 && at < 2.4) { L = [cx - 13, cy + 12]; Rh = [cx + 13, cy + 12]; }
  else if (m === "bath") { const k = Math.sin(at * 12) * 3; L = [cx - 13 + k, cy - 22]; Rh = [cx + 13 - k, cy - 23]; }
  else if (m === "love") { L = [cx - 22, cy + 5]; Rh = [cx + 22, cy + 5]; }
  else if (m === "sleep") { L = [cx - 25, cy + 16]; Rh = [cx + 25, cy + 16]; }
  else if (m === "happy" && (clock % 9) < 1.6) { Rh = [cx + 26, cy + 4 - Math.abs(Math.sin(clock * 8)) * 7]; } // saluda
  g.fillStyle = "#fff"; circle(L[0], L[1], 4.2, 100, true); circle(Rh[0], Rh[1], 4.2, 101, true); g.fillStyle = "#000";
  circle(L[0], L[1], 4.2, 100);
  circle(Rh[0], Rh[1], 4.2, 101);
  circle(L[0] + 1, L[1] + 0.5, 1, 102, true);
  circle(Rh[0] - 1, Rh[1] + 0.5, 1, 103, true);

  // Mugre: olor, motitas y una mosca.
  if (st.clean < 35 && m !== "bath") {
    for (let k = 0; k < 3; k++) wavy(cx - 10 + k * 10, cy - R - 4, 10, k * 2);
    for (let k = 0; k < 5; k++) circle(cx - 12 + hash(k) * 24, cy - 8 + hash(k + 9) * 18, 0.5, 110 + k, true);
    const fa = clock * 3.2, fx = cx + Math.cos(fa) * 30, fy = cy - 18 + Math.sin(fa * 1.7) * 8;
    circle(fx, fy, 1.2, 120, true);
    circle(fx - 1.6, fy - 2, 1.3, 121); circle(fx + 1.6, fy - 2, 1.3, 122);
  }
  // Hambre: la pancita gruñe.
  if (m === "hungry" && (clock % 5) < 1.2) { g.font = '9px "Gochi Hand", cursive'; g.fillText("grrr", cx + 12, cy + 30); }
  return { cx, cy };
}

// ---------- Efectos de cada acción ----------

function drawEffects(p) {
  if (st.sleeping) {
    g.font = '12px "Gochi Hand", cursive';
    for (let k = 0; k < 3; k++) {
      const ph = (clock * 0.5 + k / 3) % 1;
      g.globalAlpha = 1;
      g.fillText("Z", p.cx + 18 + ph * 16, p.cy - 18 - ph * 26 - k * 2);
    }
  }
  if (!act) return;
  const at = clock - act.t0;
  if (act.kind === "feed" && !act.refused) {
    // Del refri sale volando una galleta a su boca y se la come en tres mordidas, con boronitas.
    const k = clamp01((at - 0.25) / 0.55);
    const sx = FRIDGE.x + 10, sy = FRIDGE.y + 54, ex = p.cx, ey = p.cy + 8;
    const fx = sx + (ex - sx) * k, fy = sy + (ey - sy) * k - Math.sin(k * Math.PI) * 30;
    const bites = at < 0.8 ? 0 : Math.min(3, Math.floor((at - 0.8) / 0.5) + 1);
    if (bites < 3) {
      const r = 6 - bites * 1.6;
      circle(fx, fy, r, 130);
      for (let i = 0; i < 3 - bites; i++) circle(fx - 2 + i * 2.2, fy - 1 + (i % 2) * 2, 0.6, 131 + i, true);
    }
    if (at > 0.8) for (let i = 0; i < 6; i++) {
      const ct = (at - 0.8 - i * 0.2);
      if (ct > 0 && ct < 0.8) circle(p.cx - 6 + hash(i) * 12, p.cy + 12 + ct * ct * 60, 0.6, 140 + i, true);
    }
  }
  if (act.kind === "bath") {
    // Regadera, gotas, burbujas y al final destellos.
    line(p.cx - 2, 2, p.cx - 2, 12, 150); line(p.cx - 2, 2, p.cx + 14, 2, 151);
    arc(p.cx - 2, 16, 7, Math.PI * 1.05, Math.PI * 1.95, 152); line(p.cx - 9, 16, p.cx + 5, 16, 153);
    if (at < act.dur - 0.7) for (let i = 0; i < 9; i++) {
      const ph = (at * 2.4 + i / 9) % 1, x = p.cx - 8 + (i % 5) * 3.6, y = 18 + ph * 40;
      line(x, y, x - 0.4, y + 3, 160 + i);
    }
    for (let i = 0; i < 7; i++) {
      const ph = (at * 0.6 + i / 7) % 1;
      circle(p.cx - 24 + hash(i + 3) * 48, p.cy + 18 - ph * 46, 1.5 + hash(i) * 2.5, 170 + i);
    }
    if (at > act.dur - 0.9) for (let i = 0; i < 4; i++) {
      const x = p.cx - 22 + i * 15, y = p.cy - 26 + (i % 2) * 8;
      line(x - 2.5, y, x + 2.5, y, 180 + i); line(x, y - 2.5, x, y + 2.5, 185 + i);
    }
  }
  if (act.kind === "love") {
    for (let i = 0; i < 4; i++) {
      const ph = clamp01((at - i * 0.22) / 1.2);
      if (ph <= 0 || ph >= 1) continue;
      heart(p.cx - 18 + i * 12, p.cy - 22 - ph * 26, 3 + ph * 1.5, 190 + i * 30);
    }
  }
}

// ---------- Lo que escribe a mano ----------

function say(text, hold = 2.6) { msg = { words: text.split(" "), t0: clock, hold }; }

function drawWords() {
  if (!msg) return;
  const per = 0.28, shown = Math.floor((clock - msg.t0) / per) + 1;
  if (clock - msg.t0 > msg.words.length * per + msg.hold) { msg = null; return; }
  g.font = '15px "Gochi Hand", cursive';
  g.textBaseline = "alphabetic";
  let x = 118, y = 24;
  for (let i = 0; i < Math.min(shown, msg.words.length); i++) {
    const w = msg.words[i], ww = g.measureText(w + " ").width;
    if (x + ww > 196 && x > 118) { x = 118; y += 14; }
    g.fillText(w, x + wob(300 + i, 0.4), y + wob(320 + i, 0.4));
    x += ww;
  }
}

const IDLE = {
  happy: ["te extraño", "eres mi persona favorita", "¿me das un abrazo?", "pienso en ti", "hoy te quiero más", "quédate tantito", "me gusta cuando vienes"],
  hungry: ["tengo hambre...", "¿hay galletas?", "mi pancita suena"],
  dirty: ["huelo raro...", "¿me bañas?", "tengo una mosca"],
  tired: ["tengo sueño...", "ya me quiero dormir"],
  lonely: ["dame un besito", "te extrañé mucho", "¿dónde andabas?"],
};

// ---------- Barras: hambre, limpieza, cariño, energía ----------

function drawStats() {
  const items = [["hunger", 14], ["clean", 72], ["love", 130], ["energy", 188]];
  g.lineWidth = 1;
  for (const [k, x] of items) {
    const y = 152;
    if (k === "hunger") { circle(x + 3, y, 3, 200); line(x + 3, y - 3, x + 4.5, y - 6, 201); }
    if (k === "clean") { g.beginPath(); g.moveTo(x + 3, y - 4.5); g.quadraticCurveTo(x + 7, y + 1, x + 3, y + 3); g.quadraticCurveTo(x - 1, y + 1, x + 3, y - 4.5); g.stroke(); }
    if (k === "love") heart(x + 3, y, 3.2, 210);
    if (k === "energy") { arc(x + 3, y, 3.5, Math.PI * 0.4, Math.PI * 1.6, 220); arc(x + 4.5, y, 2.6, Math.PI * 0.55, Math.PI * 1.45, 221); }
    g.strokeRect(x + 10.5, y - 2.5, 24, 5);
    g.fillRect(x + 11.5, y - 1.5, Math.round((22 * st[k]) / 100), 3);
  }
  g.lineWidth = 1.7;
}

// ---------- Cuadro completo: dibujar, pasar a 1 bit ----------

function render() {
  const night = st.sleeping;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "#fff";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = g.fillStyle = "#000";
  g.lineCap = g.lineJoin = "round";
  const fat = act && act.kind === "feed" && !act.refused ? clock - act.t0 : -1;
  drawRoom(night, fat < 0 ? 0 : clamp01(fat / 0.25) * (1 - clamp01((fat - 1.0) / 0.3)));
  const p = drawPet();
  drawEffects(p);
  g.fillStyle = "#000";
  drawWords();
  drawStats();
  // A 1 bit: tinta o papel, nada en medio. De noche se invierten los colores.
  const img = g.getImageData(0, 0, W, H), d = img.data;
  const paper = night ? [26, 26, 34] : [239, 237, 232], ink = night ? [228, 228, 218] : [17, 17, 17];
  for (let i = 0; i < d.length; i += 4) {
    const c = d[i] < 150 ? ink : paper;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}

// ---------- Acciones ----------

function start(kind, dur) { act = { kind, t0: clock, dur, refused: false }; }

function wake(quiet) {
  if (!st.sleeping) return;
  st.sleeping = false;
  btn.sleep.textContent = "dormir";
  if (!quiet) say("ya desperté");
}

function feed() {
  wake(true);
  if (st.hunger > 92) { start("feed", 1.6); act.refused = true; say("ya no me cabe nada"); return; }
  start("feed", 2.8);
  st.hunger = clamp(st.hunger + 32); st.love = clamp(st.love + 3);
  say(pick(["ñam ñam", "gracias", "qué rica galleta", "mmm"]));
  save();
}
function bath() {
  wake(true);
  start("bath", 3.4);
  st.clean = 100; st.love = clamp(st.love + 4); st.energy = clamp(st.energy - 3);
  say(pick(["¡burbujas!", "ya huelo rico", "agua calientita"]), 2.2);
  save();
}
// El día en que se vuelven a ver (cuando el ramo tiene sus 29 flores).
const REUNION = new Date(2026, 10, 23);

function countdown() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((REUNION - today) / 86400000);
  if (days > 1) return `faltan ${days} días para volver a verte`;
  if (days === 1) return "falta 1 día para volver a verte";
  if (days === 0) return "¡hoy te vuelvo a ver!";
  return null; // ya pasó: no lo dice
}

function love() {
  if (st.sleeping) { wake(); return; }
  start("love", 1.8);
  st.love = clamp(st.love + 15);
  const lines = ["te amo mucho mucho mucho", "te amo tanto", "te extraño"];
  const left = countdown();
  if (left) lines.push(left);
  say(pick(lines), 3);
  save();
}
function sleep() {
  if (st.sleeping) { wake(); save(); return; }
  act = null;
  st.sleeping = true;
  btn.sleep.textContent = "despertar";
  say("buenas noches");
  save();
}

btn.feed.addEventListener("click", feed);
btn.bath.addEventListener("click", bath);
btn.love.addEventListener("click", love);
btn.sleep.addEventListener("click", sleep);
// Tocar el refri le da de comer; tocarlo a él (o cualquier otra parte) es darle un besito.
canvas.addEventListener("click", (e) => {
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
  const f = FRIDGE;
  if (x > f.x - 2 && x < f.x + f.w + 2 && y > f.y - 2 && y < f.y + f.h + 2) feed(); else love();
});
if (st.sleeping) btn.sleep.textContent = "despertar";

// ---------- Bucle: 12 cuadros por segundo, como la animación del video ----------

let lastReal = performance.now(), lastFrame = -1, lastSave = 0;
function loop(now) {
  const dt = Math.min(1, (now - lastReal) / 1000);
  lastReal = now;
  clock += dt;
  decay(st, dt);
  if (st.sleeping && st.energy >= 100) { wake(); save(); }
  if (act && clock - act.t0 > act.dur) act = null;
  if (!msg && !act && clock > nextIdle) {
    const m = mood(), pool = IDLE[m] || IDLE.happy;
    if (m !== "sleep") say(pick(pool));
    nextIdle = clock + rnd(8, 14);
  }
  if (clock - lastSave > 10) { save(); lastSave = clock; }
  const f = Math.floor(clock * FPS);
  if (f !== lastFrame) { lastFrame = f; boil = Math.floor(f / 2); render(); }
  requestAnimationFrame(loop);
}
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });

document.fonts.load('15px "Gochi Hand"').catch(() => {}).finally(() => {
  if (st.hunger < 30) say("¡volviste! tengo hambre"); else say("hola, te extrañé");
  requestAnimationFrame(loop);
});

// Para revisar desde la consola.
window.__muneco = { st, feed, bath, love, sleep, render, at: (sec) => { clock = sec; boil = Math.floor(sec * FPS / 2); render(); },
  set: (o) => Object.assign(st, o), act: () => act };
