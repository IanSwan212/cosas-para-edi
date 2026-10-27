// Música de fondo, muy suave. Los navegadores no dejan sonar sin interacción:
// empieza con el primer toque, clic o tecla y entra poco a poco.
const MUSIC_VOLUME = 0.12;

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
  return music;
}
