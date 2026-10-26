# Love in Every Language

Un corazón construido solo con texto: 139 traducciones de «Te amo» colocadas dentro de la curva
`x = 16 sin³t, y = 13cos t − 5cos 2t − 2cos 3t − cos 4t`, animadas durante 18 s y rematadas por un latido.

## Ejecutar

Los módulos ES necesitan un servidor HTTP (no funcionan con `file://`):

```bash
python -m http.server 8765
```

Abre `http://localhost:8765`. Se necesita conexión para cargar los subconjuntos de Noto desde Google Fonts;
sin ella se usan fuentes del sistema (pueden faltar glifos de algunos alfabetos).

## Controles

Aparecen al mover el cursor o tocar la pantalla y se ocultan a los ~3 s.

| Tecla | Acción |
|---|---|
| Espacio | Reproducir / pausar |
| R | Reiniciar |
| M | Sonido on/off (apagado por defecto) |
| F | Pantalla completa |

Los botones permiten además guardar un PNG, exportar vídeo y abrir la lista accesible de idiomas.
Cuando termina la animación, al pasar el cursor por una palabra se muestra su idioma. Al hacer clic o
tocar una palabra, el corazón se «infla»: las traducciones se atenúan y el mensaje personal
(`src/messages.js`) llena la silueta en ese idioma. Brota desde el centro con un rebote elástico, y la
última frase se repite hasta rellenar la punta. Pulsar «TE AMO» muestra el original en español. Un clic
en cualquier sitio o la tecla Esc lo desinfla. Los idiomas sin traducción del mensaje muestran el original.

## Análisis del vídeo de referencia

Se extrajeron fotogramas a 1 fps con FFmpeg (720×1280, 18,4 s). Es una grabación con móvil de una pantalla
que ejecuta un script de Python turtle: 0–2 s se ve el código; luego fondo negro; desde ~3 s aparecen palabras
rojas horizontales en negrita que recorren el **contorno** empezando arriba en el centro, bajan por el lóbulo
derecho hasta la punta y suben por el izquierdo (~3–9 s); después se rellena el **interior** de forma dispersa
hasta quedar denso (~9–18 s). Esta app reproduce ese orden (contorno según el parámetro *t*, luego interior)
y añade el mensaje central y el latido que se pedían.

## Arquitectura

```
src/
  config.js              Configuración central (todas las claves tienen efecto)
  translations.js        Base multilingüe + direccionalidad derivada del script
  fontManager.js         Carga de Noto por familia con `text=` (solo glifos usados), document.fonts
  heartGeometry.js       Curva paramétrica → polígono → intervalos interiores por fila (par-impar)
  textLayout.js          Empaquetado tipográfico: bandas adaptativas, anclaje al contorno, mazo equilibrado
  particleSystem.js      LoveParticle, línea temporal de fases, índice espacial para hit-testing
  animationController.js Reloj determinista (play/pause/seek/restart/loop, eventos de latido)
  renderer.js            Canvas 2D + capa fuera de pantalla, resplandor, latido, devicePixelRatio
  interaction.js         Hover/toque con etiqueta y controles que se ocultan solos
  audioManager.js        Latido sintetizado (Web Audio), solo tras un gesto del usuario
  exportManager.js       PNG (toBlob) y vídeo (captureStream + MediaRecorder)
  random.js              PRNG con semilla (mulberry32)
  main.js                Orquestación
```

**Geometría.** La curva se muestrea en 900 puntos; para cada fila de 1 px se calculan los cruces con el
polígono y se emparejan en intervalos interiores. Una caja de texto es válida si cabe dentro de un mismo
intervalo en 5 filas a lo largo de su altura (con un margen de seguridad). La ecuación nunca se usa para
generar puntos interiores directamente.

**Distribución.** El corazón se divide en bandas de `1,42 × fuente`. En cada banda: (1) se anclan palabras
pegadas a los bordes izquierdo y derecho de cada intervalo para definir la silueta; (2) un cursor rellena
de izquierda a derecha con huecos aleatorios; (3) una segunda pasada con fuente más pequeña cubre los huecos.
Las palabras salen de un *mazo* barajado en el que cada idioma aparece una vez por ronda, así que ningún
idioma domina, y no se repite ninguna de las 10 últimas. Una zona central queda reservada para «TE AMO».
Como no hay solapamientos por construcción, no se necesita detección de colisiones global; el índice
espacial se usa para el hit-testing.

**Tamaño y cantidad.** `fontSize` se escala con el ancho del corazón (0,8×–1,35×, mínimo 8 px). Si caben
más palabras que `targetParticleCount`, la fuente crece un 7 % y se recalcula. Con los valores por defecto
salen ~200–260 palabras en escritorio y ~85 en un móvil de 375 px. Para un corazón más denso, baja `fontSize`.

**Línea temporal** (escala con `animationDuration`):

| Fase | Tiempo | Qué ocurre |
|---|---|---|
| Silencio | 0–1,8 s | Negro |
| Primeras palabras | 1,8–6 s | El contorno empieza arriba a la derecha, con aparición lenta y desplazamiento de 2–5 px |
| Construcción | 6–12 s | El contorno avanza por la punta y el lóbulo izquierdo; empieza el interior aleatorio |
| Revelación | 12–15 s | Últimas palabras del interior |
| Última expresión | 15–16,1 s | «TE AMO» aparece en el centro |
| Latido | 16,15–17 s | Doble pulsación 1 → 1,035 → 1 sobre toda la composición |

**Rendimiento.** Las posiciones se precalculan una vez (y al redimensionar, con debounce). Las mediciones de
texto van en caché. Tras asentarse, la capa de palabras deja de redibujarse y cada fotograma solo la recompone.
El resplandor es una única sombra sobre el bitmap, no una sombra por palabra, y se desactiva solo si hay más de
20 fotogramas lentos (>30 ms). La densidad de píxeles se limita a unos 9 MP.

**Accesibilidad.** Con `prefers-reduced-motion` se muestra directamente la composición final, sin latido. Los
controles se pueden usar con teclado y tienen `aria-label`. El canvas tiene `role="img"`. El botón de lista abre
un `<dialog>` con todas las traducciones marcadas con `lang` y `dir`.

## Exportación

- **PNG**: resolución real del canvas (CSS × devicePixelRatio).
- **Vídeo**: reinicia la línea temporal y graba hasta 1,2 s después del final. Chrome, Edge y Firefox generan
  **WebM** (VP9/VP8); Safari genera **MP4** si su MediaRecorder lo admite. Si se activó el sonido, el latido
  se incluye en la grabación. Limitaciones: la grabación es en tiempo real (dura lo mismo que la animación);
  si la pestaña pasa a segundo plano el navegador puede pausar los fotogramas; la tasa de fotogramas depende
  del equipo.

Convertir WebM a MP4:

```bash
ffmpeg -i love-in-every-language.webm -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart love.mp4
```

## Traducciones

Consulta [TRANSLATIONS.md](TRANSLATIONS.md). Ninguna entrada está verificada externamente (`verified: false`).
Cada una indica un nivel de confianza y notas sobre género o registro.

## Qué se ha probado

En Chromium (panel del navegador integrado): carga de fuentes y renderizado de todos los alfabetos sin cuadros
vacíos a la vista; composición final en 1024×768 y en 375×812; fase de construcción a mitad de animación;
etiqueta de idioma al pasar el cursor. **No se ha probado**: la exportación de vídeo/PNG (descargas), el audio,
la pantalla completa, Safari/Firefox ni dispositivos táctiles reales.
