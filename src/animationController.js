// Línea temporal determinista: el estado visual depende solo de `time` (ms).

export class AnimationController {
  constructor({ duration, loop, onFrame, onEvent, events = [] }) {
    this.duration = duration;
    this.loop = loop;
    this.onFrame = onFrame;
    this.onEvent = onEvent;
    this.events = events; // [{ time, name }]
    this.time = 0;
    this.playing = false;
    this.last = 0;
    this.endHold = 3000; // pausa antes de repetir cuando loop está activo
    this.frame = this.frame.bind(this);
    this.raf = 0;
  }

  get finished() {
    return this.time >= this.duration;
  }

  play() {
    if (this.playing) return;
    if (this.finished && !this.loop) this.time = 0;
    this.playing = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  pause() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.onFrame(this.time, 0);
  }

  restart() {
    this.time = 0;
    this.onFrame(0, 0);
    if (!this.playing) this.play();
  }

  seek(time) {
    this.time = Math.max(0, time);
    this.onFrame(this.time, 0);
  }

  frame(now) {
    if (!this.playing) return;
    // Limita el salto tras una pestaña en segundo plano.
    const dt = Math.min(100, now - this.last);
    this.last = now;
    const prev = this.time;
    this.time += dt;
    for (const ev of this.events) if (prev < ev.time && this.time >= ev.time) this.onEvent(ev.name, ev.time);
    if (this.loop && this.time >= this.duration + this.endHold) this.time = 0;
    this.onFrame(this.time, dt);
    this.raf = requestAnimationFrame(this.frame);
  }
}
