# Bugambilia

Una bugambilia en 3D (Three.js, el mismo que usa `ramo/`) que crece, florece y suelta sus brácteas al viento en unos 15 segundos.

## Secuencia (`src/timeline.js`)

| Fase | Segundos | Qué pasa |
|---|---|---|
| Aparición | 0–2 | Crece el tronco y salen las primeras cañas, de la base a la punta |
| Ramificación | 2–5 | Ramas secundarias y brotes, cada uno desde el punto de su madre |
| Follaje | 4–8 | Las hojas brotan plegadas y se despliegan |
| Floración | 6–11 | Las tríadas de brácteas se abren y pasan de verde pálido a fucsia |
| Máxima floración | 10–12 | Pausa con la planta completa; el viento empieza a subir |
| Liberación | 12–15 | Cerca del 70 % de las brácteas se sueltan en un barrido y vuelan |

Todo sale de un solo tiempo `t`, así que la barra permite pausar, adelantar, retroceder y cambiar la velocidad.

## Archivos

- `src/plant.js`: genera la planta con semilla fija (tronco, cañas arqueadas, ramas, brotes, pedicelos, hojas, espinas y tríadas).
- `src/bracts.js`: apertura de cada bráctea y su vuelo. El vuelo es analítico (arrastre, viento, vaivén y giro que arranca desde cero) y parte de la pose exacta del instante en que se suelta.
- `src/meshes.js`: geometrías y materiales. Ramas, hojas y espinas crecen en el shader (también en la sombra); las brácteas y florecitas son instancias.
- `src/main.js`: escena, luces, cámara, reloj y controles.
- `src/math.js`: vectores y cuaterniones sin Three.js, para poder probar con Node.

Pruebas: `node --test bugambilia/tests`
