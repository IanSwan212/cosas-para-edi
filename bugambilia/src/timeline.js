// Línea de tiempo única de la bugambilia. Todo (ramas, hojas, brácteas, viento y vuelo)
// se calcula a partir de un solo tiempo t en segundos, así que se puede pausar, adelantar,
// retroceder o cambiar de velocidad sin perder la continuidad.

export const DURATION = 15;

// Las seis fases (se solapan a propósito, como en una planta real).
export const PHASES = [
  { id: "aparicion", name: "Aparición", start: 0, end: 2 },
  { id: "ramificacion", name: "Ramificación", start: 2, end: 5 },
  { id: "follaje", name: "Follaje", start: 4, end: 8 },
  { id: "floracion", name: "Floración", start: 6, end: 11 },
  { id: "plenitud", name: "Máxima floración", start: 10, end: 12 },
  { id: "liberacion", name: "Liberación", start: 12, end: 15 },
];

// Ventanas que usa la generación de la planta; se pueden cambiar sin tocar el resto.
export const TIMING = {
  branches: { start: 0.05, end: 5.0 },
  leaves: { start: 4.0, end: 8.0 },
  bloom: { start: 6.0, end: 11.0 },
  peak: { start: 10.0, end: 12.0 },
  release: { start: 12.0, end: 14.8, fraction: 0.7 },
  wind: { start: 11.4, end: 13.2 },
};

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, k) => a + (b - a) * k;
export const progress = (t, a, b) => clamp01((t - a) / (b - a));
export const easeOutCubic = (x) => 1 - (1 - x) ** 3;

export function smoothstep(a, b, x) {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
}

// Intensidad del viento (0..1): sube justo antes de que se suelten las brácteas.
export const windAt = (t, timing = TIMING) => smoothstep(timing.wind.start, timing.wind.end, t);

// La fase más reciente que ya empezó.
export function phaseAt(t, phases = PHASES) {
  let current = phases[0];
  for (const p of phases) if (t >= p.start) current = p;
  return current;
}
