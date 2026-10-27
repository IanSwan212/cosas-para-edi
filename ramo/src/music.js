// Música de fondo, muy suave. Los navegadores no dejan sonar sin interacción:
// empieza con el primer toque, clic o tecla y entra poco a poco.
const MUSIC_VOLUME = 0.07;

export function startMusic(src = "assets/cancion.mp3") {
  const music = new Audio(src);
  music.loop = true;
  music.volume = 0;
  const start = () => {
    window.removeEventListener("pointerdown", start, true);
    window.removeEventListener("keydown", start, true);
    music.play().then(() => {
      const t0 = performance.now();
      const fade = () => {
        const k = Math.min(1, (performance.now() - t0) / 4000);
        music.volume = MUSIC_VOLUME * k;
        if (k < 1) requestAnimationFrame(fade);
      };
      fade();
    }).catch(() => {});
  };
  window.addEventListener("pointerdown", start, true);
  window.addEventListener("keydown", start, true);
  // Botón de silencio; la preferencia se recuerda en este navegador.
  const btn = document.getElementById("mute");
  const KEY = "ramo.silencio";
  const apply = (muted) => {
    music.muted = muted;
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(muted));
    const label = muted ? "Activar música" : "Silenciar música";
    btn.setAttribute("aria-label", label);
    btn.title = label;
  };
  let muted = false;
  try { muted = localStorage.getItem(KEY) === "1"; } catch { /* sin almacenamiento */ }
  apply(muted);
  btn?.addEventListener("click", () => {
    muted = !muted;
    apply(muted);
    try { localStorage.setItem(KEY, muted ? "1" : "0"); } catch { /* sin almacenamiento */ }
  });
  return music;
}
