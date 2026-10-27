// Punto de entrada: con WebGL, ramo 3D (main.js); sin WebGL (o con ?modo=2d),
// respaldo 2D con las mismas flores, posiciones, fechas, textos, enlaces y música.
const params = new URLSearchParams(location.search);
const probe = document.createElement("canvas");
const hasWebGL = !!(probe.getContext("webgl2") || probe.getContext("webgl"));

if (hasWebGL && params.get("modo") !== "2d") {
  await import("./main.js?v=mvq5j85t");
} else {
  const [{ localToday, isComplete, parseISO }, { createProgress }, { FLOWERS }, { renderText, showFinal }, { startFallback2d }, { startMusic }] =
    await Promise.all([
      import("./calendar.js?v=mvq5j85t"), import("./progress.js?v=mvq5j85t"), import("./flowerDefs.js?v=mvq5j85t"),
      import("./ui.js?v=mvq5j85t"), import("./fallback2d.js?v=mvq5j85t"), import("./music.js?v=mvq5j85t")
    ]);
  const simDate = parseISO(params.get("fecha"));
  const date = simDate || localToday();
  const progress = createProgress();
  const visit = simDate ? { ...progress.simulate(date), newFrom: 0 } : progress.visit(date);
  const firstAnim = simDate || visit.firstVisit;
  renderText({ date, count: visit.count, simulated: !!simDate });
  startFallback2d({
    canvas: document.getElementById("scene"),
    flowers: FLOWERS,
    count: visit.count,
    instantBelow: firstAnim ? 0 : visit.newFrom,
    stagger: firstAnim ? Math.min(0.5, 7 / Math.max(1, visit.count)) : 0.45,
    duration: 3,
    onReady: ({ end, draw }) => {
      window.__ramo2d = { end, draw };
      if (visit.count === 29 && isComplete(date)) {
        setTimeout(() => showFinal(true), Math.max(0, end * 1000 - performance.now()) + 800);
      }
    }
  });
  startMusic();
  window.__ramo = { mode: "2d", visit };
  document.getElementById("scene").style.cursor = "default";
}
