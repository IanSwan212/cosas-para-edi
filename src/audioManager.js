// Latido sintetizado con Web Audio API. Desactivado por defecto; el contexto
// solo se crea tras un gesto del usuario.

export class AudioManager {
  constructor(enabled) {
    this.enabled = enabled;
    this.ctx = null;
    this.master = null;
    this.streamDest = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  /** Debe llamarse desde un manejador de evento del usuario. */
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ensureContext();
      this.playMusic();
    } else {
      this.music?.pause();
    }
    return this.enabled;
  }

  /** Música de fondo en bucle; pasa por el grafo de Web Audio para incluirse en la exportación de vídeo. */
  playMusic() {
    if (!this.music) {
      this.music = new Audio("assets/audio/background.m4a");
      this.music.loop = true;
      this.music.preload = "auto";
      if (this.ctx) {
        const gain = this.ctx.createGain();
        gain.gain.value = 0.7;
        this.ctx.createMediaElementSource(this.music).connect(gain).connect(this.master);
      } else {
        this.music.volume = 0.7;
      }
    }
    this.music.play().catch(() => {});
  }

  /** Pista de audio para grabar junto al vídeo. */
  getStreamTrack() {
    if (!this.enabled || !this.ensureContext()) return null;
    if (!this.streamDest) {
      this.streamDest = this.ctx.createMediaStreamDestination();
      this.master.connect(this.streamDest);
    }
    return this.streamDest.stream.getAudioTracks()[0] || null;
  }

  /** Golpe grave y corto; `strength` diferencia «lub» de «dub». */
  thump(strength = 1) {
    if (!this.enabled || !this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime + 0.005;
    const osc = c.createOscillator();
    const gain = c.createGain();
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180;
    osc.type = "sine";
    osc.frequency.setValueAtTime(62, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.55 * strength, t + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(filter).connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.35);
  }
}
