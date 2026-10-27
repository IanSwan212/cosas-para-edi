// Lógica de calendario del ramo. Sin dependencias del DOM ni de los gráficos.
//
// Se trabaja con fechas de calendario {y, m, d} (mes 1..12), nunca con marcas de
// tiempo: cada fecha se convierte en un número de día civil entero (algoritmo
// days_from_civil de Howard Hinnant), así que no influyen la zona horaria, UTC
// ni los cambios de horario.

export const START = { y: 2026, m: 10, d: 26 };
export const END = { y: 2026, m: 11, d: 23 };

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
  "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Número de día civil (días desde 1970-01-01) de una fecha del calendario gregoriano. */
export function daysFromCivil({ y, m, d }) {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** Inversa de daysFromCivil. */
export function civilFromDays(z) {
  z += 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return { y: yoe + era * 400 + (m <= 2 ? 1 : 0), m, d };
}

export const TOTAL_FLOWERS = daysFromCivil(END) - daysFromCivil(START) + 1; // 29

/** Fecha LOCAL del dispositivo (lo que el usuario ve en su calendario). */
export function localToday(now = new Date()) {
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
}

/** Flores que corresponden a una fecha: días desde el inicio + 1, limitado a [0, 29]. */
export function flowerCountFor(date) {
  const n = daysFromCivil(date) - daysFromCivil(START) + 1;
  return Math.max(0, Math.min(TOTAL_FLOWERS, n));
}

/** Fecha de la flor número `index` (1..29). */
export function dateForFlower(index) {
  if (index < 1 || index > TOTAL_FLOWERS) throw new RangeError(`Flor fuera de rango: ${index}`);
  return civilFromDays(daysFromCivil(START) + index - 1);
}

export function isComplete(date) {
  return daysFromCivil(date) >= daysFromCivil(END);
}

export function toISO({ y, m, d }) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseISO(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text || "");
  if (!match) return null;
  const date = { y: +match[1], m: +match[2], d: +match[3] };
  // Rechaza fechas imposibles (p. ej. 2026-02-31) comprobando la ida y vuelta.
  const back = civilFromDays(daysFromCivil(date));
  return back.y === date.y && back.m === date.m && back.d === date.d ? date : null;
}

export function formatDate({ y, m, d }) {
  return `${d} de ${MONTHS[m - 1]} de ${y}`;
}

export function addDays(date, n) {
  return civilFromDays(daysFromCivil(date) + n);
}
