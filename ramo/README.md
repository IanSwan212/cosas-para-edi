# Nuestro ramo

Un ramo en 3D que gana una flor cada día, del **26 de octubre** al **23 de noviembre de 2026**:
29 flores en total, una por día.

- Web: `https://ianswan212.github.io/cosas-para-edi/ramo/`
- En local: `python -m http.server 8765` en la raíz del repositorio y abrir `http://localhost:8765/ramo/`

## Estilo (como el video)

Como el video de referencia («ASCII Lily Bouquet»), el ramo se dibuja como **arte ASCII de colores**:
la escena 3D se renderiza a una textura con un píxel por carácter, y un shader dibuja en cada celda
un glifo elegido por luminosidad y coloreado con el color de esa zona (`src/asciiView.js`). Predominan
flores mezcladas: lirios, rosas, tulipanes, dalias, margaritas, anémonas, cosmos y ramilletes.
Con `?modo=3d` se ve el render 3D sin el efecto ASCII.

## Modo de prueba

- Pulsa el icono de calendario (esquina inferior derecha) o la tecla **P**.
- O abre la página con `?prueba` (panel abierto) o `?fecha=2026-11-10` (simula esa fecha directamente).
- El deslizador va del 25 de octubre (0 flores) al 24 de noviembre (29 flores).
- «Repetir crecimiento» vuelve a animar el ramo desde cero. «Volver a la fecha real» cierra la simulación.
- Mientras simulas, se ve la etiqueta «Simulación · no es la fecha real». La simulación no lee ni escribe
  el almacenamiento y no toca la fecha del sistema.

## Cómo se calcula el número de flores

`src/calendar.js` (sin DOM ni gráficos):

1. Se toma la fecha **local** del dispositivo (`getFullYear/getMonth/getDate`), no UTC.
2. Cada fecha `{año, mes, día}` se convierte en un número de día civil entero (algoritmo
   *days_from_civil*). No se restan marcas de tiempo, así que la zona horaria, el horario de verano
   y la medianoche no influyen.
3. `flores = día(hoy) − día(26 oct 2026) + 1`, limitado a `[0, 29]`.

`dateForFlower(n)` devuelve la fecha de la flor `n`.

## Persistencia

- La cantidad de flores **siempre** se calcula a partir de la fecha. No hay contador.
- Las 29 flores (especie, colores, pétalos, hojas y posición) están fijadas en `src/flowerDefs.js`
  con una semilla por flor, así que el ramo es idéntico en cada recarga.
- `localStorage["ramo.visto"]` solo guarda cuántas flores había ya visto el usuario. Sirve para animar
  únicamente las flores nuevas al volver, en lugar de repetir todo desde cero. Si falta o está dañado,
  el ramo se muestra igual de bien.

## Arquitectura

| Archivo | Responsabilidad |
|---|---|
| `src/calendar.js` | Fechas y cálculo del progreso |
| `src/progress.js` | Flores ya vistas (dato auxiliar) y simulación sin efectos |
| `src/flowerDefs.js` | Definición determinista de las 29 flores |
| `src/geometry.js` | Pétalos, hojas y tallos como superficies 3D procedurales |
| `src/flower.js` | Montaje de cada especie y su animación (tallo → hojas → capullo → apertura) |
| `src/bouquet.js` | Composición (espiral áurea sobre una cúpula), escena, luces y cámara |
| `src/asciiView.js` | Efecto ASCII en la GPU (atlas de glifos + shader) |
| `src/ui.js` | Textos y panel de prueba |
| `src/main.js` | Orquestación y bucle de render |
| `tests/calendar.test.mjs` | Pruebas unitarias |

Las especies son lirio, rosa, tulipán, dalia, margarita, anémona, cosmos y ramillete de florecillas.

**Dependencia añadida:** Three.js 0.160.0 desde unpkg, mediante un *import map*. Hace falta WebGL para
dar volumen real a pétalos y hojas. No requiere instalar nada ni un paso de compilación.

## Pruebas

```bash
node --test ramo/tests
```
