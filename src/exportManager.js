// Exportación: PNG a resolución nativa del canvas y vídeo con MediaRecorder.

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function savePNG(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) download(blob, "love-in-every-language.png");
      resolve(!!blob);
    }, "image/png");
  });
}

export function pickVideoFormat() {
  if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) return null;
  const candidates = [
    ["video/webm;codecs=vp9", "webm"],
    ["video/webm;codecs=vp8", "webm"],
    ["video/webm", "webm"],
    ["video/mp4", "mp4"] // Safari graba MP4 de forma nativa
  ];
  for (const [mime, ext] of candidates) if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
  return null;
}

/**
 * Graba la línea temporal completa desde el inicio.
 * @returns {Promise<boolean>}
 */
export function recordVideo({ canvas, controller, audioTrack, tailMs = 1200, onState }) {
  const format = pickVideoFormat();
  if (!format) return Promise.resolve(false);
  const stream = canvas.captureStream(60);
  if (audioTrack) stream.addTrack(audioTrack);
  const recorder = new MediaRecorder(stream, { mimeType: format.mime, videoBitsPerSecond: 12_000_000 });
  const chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  return new Promise((resolve) => {
    recorder.onstop = () => {
      stream.getVideoTracks().forEach((t) => t.stop());
      download(new Blob(chunks, { type: format.mime }), `love-in-every-language.${format.ext}`);
      onState?.(false);
      resolve(true);
    };
    onState?.(true);
    controller.seek(0);
    recorder.start(250);
    controller.play();
    const check = () => {
      if (controller.time >= controller.duration + tailMs) recorder.stop();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}
