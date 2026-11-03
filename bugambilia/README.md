# Bugambilia

Una bugambilia en 3D (Three.js, el mismo que usa `ramo/`), dibujada en arte ASCII de colores como el ramo, que crece al atardecer, florece y suelta sus brácteas; una ráfaga las lleva a escribir «Es que te amo tanto» en el cielo, con un corazón pequeño al final, y otra ráfaga se lo lleva. Dura unos 26 segundos y vuelve a empezar al tocar la planta.

## Secuencia (`src/timeline.js`)

| Fase | Segundos | Qué pasa |
|---|---|---|
| Aparición | 0–2 | Crece el tronco y salen las primeras cañas, de la base a la punta |
| Ramificación | 2–5 | Ramas secundarias y brotes, cada uno desde el punto de su madre |
| Follaje | 4–8 | Las hojas brotan plegadas y se despliegan |
| Floración | 6–11 | Las tríadas de brácteas se abren y pasan de verde pálido a fucsia |
| Máxima floración | 10–12 | Pausa con la planta completa; el viento empieza a subir |
| Liberación | 12–15 | Cerca del 70 % de las brácteas se sueltan en un barrido y vuelan |
| Te amo | 15–21.4 | Una ráfaga junta parte de ellas y escribe «Es que te amo tanto» en cursiva sobre el cielo, de izquierda a derecha, y al final un corazón pequeño; siempre de frente a la cámara |
| Se lo lleva el viento | 21.4–26 | El mensaje se deshace de izquierda a derecha: los pétalos suben, giran y se desvanecen |

Todo sale de un solo tiempo `t`. No hay barra de controles: un toque sobre la bugambilia reinicia la animación (arrastrar gira la cámara).

## Archivos

- `src/plant.js`: genera la planta con semilla fija (tronco, cañas arqueadas, ramas, brotes, pedicelos, hojas, espinas y tríadas).
- `src/bracts.js`: apertura de cada bráctea y su vuelo. El vuelo es analítico (arrastre, viento, vaivén y giro que arranca desde cero) y parte de la pose exacta del instante en que se suelta.
- `src/meshes.js`: geometrías y materiales. Ramas, hojas y espinas crecen en el shader (también en la sombra); las brácteas y florecitas son instancias.
- `src/sky.js`: cielo de atardecer (degradado, sol, halo y nubes) y cordilleras en la bruma.
- `src/ascii.js`: la vista en arte ASCII (glifos del ramo), con estilos distintos para cielo, suelo y planta.
- `src/main.js`: escena, luz baja del sol, cámara, reloj, toque para reiniciar y el muestreo del mensaje.
- `src/math.js`: vectores y cuaterniones sin Three.js, para poder probar con Node.

Pruebas: `node --test bugambilia/tests`
