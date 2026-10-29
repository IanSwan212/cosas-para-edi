// Progreso visto: dato AUXILIAR para decidir qué flores animar al entrar.
// La cantidad de flores siempre sale de la fecha (calendar.js); lo guardado
// solo indica cuántas había visto ya el usuario, para no repetir la animación
// completa al recargar.

import { flowerCountFor, toISO } from "./calendar.js?v=mvt7cftc";

const KEY = "ramo.visto";

export function createProgress(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  const read = () => {
    try {
      const raw = storage?.getItem(KEY);
      const data = raw ? JSON.parse(raw) : null;
      return data && Number.isInteger(data.count) ? data : null;
    } catch {
      return null;
    }
  };
  const write = (data) => {
    try { storage?.setItem(KEY, JSON.stringify(data)); } catch { /* modo privado, etc. */ }
  };

  return {
    /** Visita real con la fecha del dispositivo. */
    visit(today) {
      const count = flowerCountFor(today);
      const seen = read();
      // Si lo guardado supera lo calculado (p. ej. el reloj se atrasó), manda la fecha.
      const seenCount = seen ? Math.min(seen.count, count) : 0;
      write({ count, date: toISO(today) });
      return { count, newFrom: seenCount, firstVisit: !seen };
    },
    /** Simulación: calcula sin leer ni escribir nada. */
    simulate(date) {
      return { count: flowerCountFor(date), simulated: true };
    }
  };
}
