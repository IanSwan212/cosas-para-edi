// La canción del karaoke: letra y melodía originales, hechas para esta página.
// Cada renglón dura dos compases; sus sílabas se reparten en los primeros seis tiempos y la
// última se sostiene. La melodía sigue un contorno por tipo de renglón (estrofa o coro).

export const BPM = 88;
export const BEAT = 60 / BPM;
export const INTRO_BARS = 2;

// [texto, tipo de renglón]
export const LYRICS = [
  ["cuento los días en mi ventana", "va"],
  ["guardo tu risa bajo la almohada", "vb"],
  ["y aunque estés lejos, muy lejos de aquí", "va"],
  ["cada mañana despierto por ti", "vb"],
  ["ven, que te espero, ven", "ca"],
  ["ya falta poquito, ya ves", "cb"],
  ["es que te amo tanto, tanto", "ca"],
  ["que hasta el reloj se cansa de contar", "cb"],
  ["le di un besito a mi zorrito", "va"],
  ["le conté cuánto te extraño", "vb"],
  ["me dijo bajito: ya viene, ya viene", "va"],
  ["y bailé solito en la alfombra", "vb"],
  ["ven, que te espero, ven", "ca"],
  ["ya falta poquito, ya ves", "cb"],
  ["es que te amo tanto, tanto", "ca"],
  ["y aquí te espero, aquí", "cb"],
];

// Contornos en grados de la escala de do mayor (0 = do central).
const CONTOUR = {
  va: [4, 4, 5, 4, 2, 2, 1, 2, 4, 2, 1, 0],
  vb: [4, 4, 5, 7, 7, 5, 4, 5, 4, 2, 2, 4],
  ca: [7, 7, 8, 7, 5, 4, 5, 7, 5, 4, 2, 4],
  cb: [5, 5, 4, 2, 4, 5, 4, 2, 1, 0, 1, 0],
};
// Acordes por compás (dos por renglón): estrofa I–vi–IV–V, coro IV–V–iii–vi y cierre en I.
const CHORDS = {
  va: [[0, 4, 7], [9, 12, 16]], // do, la menor
  vb: [[5, 9, 12], [7, 11, 14]], // fa, sol
  ca: [[5, 9, 12], [7, 11, 14]], // fa, sol
  cb: [[4, 7, 11], [9, 12, 16]], // mi menor, la menor
};
const SCALE = [0, 2, 4, 5, 7, 9, 11];
const midi = (deg) => 60 + 12 * Math.floor(deg / 7) + SCALE[((deg % 7) + 7) % 7];

// Sílabas aproximadas: grupos de vocales.
function syllables(word) {
  const m = word.toLowerCase().match(/[aeiouáéíóúü]+/g);
  return Math.max(1, m ? m.length : 1);
}

// Arma la canción: por renglón, sus palabras con tiempos y las notas de la melodía.
export function buildSong() {
  const bar = BEAT * 4;
  const lines = [], notes = [], chords = [];
  let t = INTRO_BARS * bar;
  chords.push({ t: 0, notes: [0, 4, 7], dur: bar }, { t: bar, notes: [7, 11, 14], dur: bar });
  for (const [text, kind] of LYRICS) {
    const words = text.split(" ").map((w) => ({ text: w, n: syllables(w.replace(/[^\p{L}]/gu, "")) }));
    const total = words.reduce((s, w) => s + w.n, 0);
    const step = (6 * BEAT) / total;
    const shape = CONTOUR[kind];
    let k = 0;
    const lw = [];
    for (const w of words) {
      const start = t + k * step;
      for (let j = 0; j < w.n; j++, k++) {
        const deg = shape[Math.round((k / Math.max(1, total - 1)) * (shape.length - 1))];
        const last = k === total - 1;
        notes.push({ t: t + k * step, dur: last ? step + 2 * BEAT : step * 0.92, midi: midi(deg) });
      }
      lw.push({ text: w.text, t0: start, t1: t + k * step });
    }
    lines.push({ words: lw, t0: t, t1: t + 2 * bar });
    chords.push({ t, notes: CHORDS[kind][0], dur: bar }, { t: t + bar, notes: CHORDS[kind][1], dur: bar });
    t += 2 * bar;
  }
  chords.push({ t, notes: [5, 9, 12], dur: bar }, { t: t + bar, notes: [0, 4, 7], dur: bar * 2 });
  return { lines, notes, chords, length: t + 3 * bar };
}
