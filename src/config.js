// Configuración central. Cada propiedad está conectada a la implementación.
export const CONFIG = {
  backgroundColor: "#000000",

  primaryColor: "#FF1744",
  secondaryColor: "#B00020",

  // Tamaño de fuente base (px CSS) para un corazón de ~700 px de ancho.
  fontSize: 11,

  // Máximo de partículas: si caben más, la fuente crece hasta respetarlo.
  targetParticleCount: 650,

  // Duración total de la línea temporal (ms). Todas las fases escalan con ella.
  animationDuration: 18000,

  // Radio del resplandor en px CSS (0 lo desactiva).
  glowIntensity: 3,

  heartbeatEnabled: true,

  heartbeatScale: 1.035,

  // Estado inicial del sonido (el navegador exige un gesto del usuario de todos modos).
  audioEnabled: false,

  interactionEnabled: true,

  randomSeed: 42,

  loopAnimation: false,

  finalMessage: "TE AMO",

  // Escala del mensaje final respecto al tamaño base de las palabras.
  finalMessageScale: 1.4,

  // Muestra los botones de imagen y vídeo.
  exportEnabled: true
};
