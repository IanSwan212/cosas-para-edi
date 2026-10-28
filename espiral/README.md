# Spiral Art — Edi y yo

Recreación del video de referencia («Spiral Art»): la frase **«I love you»** se escribe sin parar sobre
una espiral que crece desde el centro, y el brillo rojo de cada letra sale de nuestra foto, así que el
retrato aparece dentro de un círculo sobre fondo negro.

## Análisis del video de referencia

- 14,4 s, 720×1280, 30 fps, con audio (ruido ambiente de la grabación; no forma parte del efecto, así que
  no se usa).
- Es una grabación con móvil de una pantalla. La parte que corresponde al efecto es la ventana de un
  programa «Spiral Art» (Python/Tkinter) con fondo negro.
- **0–2,4 s:** se ve el código en el editor (no se recrea: es la pantalla de quien grabó).
- **~2,4–2,8 s:** «preparing...» en gris, en el centro de la ventana.
- **~2,8–10,8 s:** la frase se escribe a lo largo de una espiral de Arquímedes desde el centro. Las
  letras siguen la tangente de la espiral. El radio crece con la raíz cuadrada del tiempo (25 % a los
  0,5 s, 43 % a los 1,5 s, 66 % a los 3,5 s, 83 % a los 5,5 s), es decir, a ritmo constante de letras.
- El color es rojo anaranjado. Las luces de la foto son letras rojo vivo, las sombras letras apagadas o
  ninguna. No hay otros efectos, textos ni transiciones.
- **Final:** retrato completo dentro de un círculo. Al final el video se acerca, pero es el móvil
  moviéndose, no parte del efecto.

## La foto

`assets/foto.jpg` se generó a partir de la original, en local y sin servicios externos:

1. Girada 90° a la izquierda para que quede derecha.
2. Recortada en un cuadrado centrado en los dos rostros (yo a la izquierda, Edi a la derecha con gafas).
3. Solo ajustes de tono: autocontraste, +35 % de contraste y algo de nitidez. Además, la pared del fondo
   se oscureció suavemente (los rostros se detectaron con OpenCV) para imitar el sujeto iluminado sobre
   fondo oscuro del video. No se tocaron rasgos, colores de ropa ni gafas.

Para usar otra foto, sustituye `assets/foto.jpg` por una imagen cuadrada con los rostros cerca del centro
y sube el número `?v=` de `PHOTO` en `index.html`.

## Ejecutar

Página estática, sin dependencias:

```bash
python -m http.server 8765
```

y abrir `http://localhost:8765/espiral/` (desde la raíz del repositorio). Tecla **R** o doble clic para
repetir la animación.

## Diferencias respecto al video

- No se recrean el editor de código ni la ventana de Windows: solo el lienzo negro del programa.
- La frase, el color y el ritmo son los del video. La fuente es Arial negrita en vez de la de Tkinter,
  y el tamaño de letra se adapta a la pantalla.
