# Plantilla de storyboard

## Constantes

```ts
export const BPM = 120, GOLPE = 0.5, COMPAS = 2, DURACION = 32;
export const T = (c: number, g = 1, s16 = 0) => (c - 1) * 2 + (g - 1) * 0.5 + s16 * 0.125;
export const ESCENARIO = { w: 1920, h: 1080 }; // coordenadas = centro de la pieza
```

## Tabla de escenas (por versión)

| # | id | inicio | fin | compases | compartida (parámetros) |
|---|---|---|---|---|---|

## Por escena

```md
### `id` · 00,00–00,00 · cN
- **Objetivo:** una línea.
- **Transición de entrada:** cuál (de la tabla de transiciones firma).
- **Composición:** piezas reales, tamaño, posición (x, y, z), escala de réplica.
- **Coreografía:** tiempos relativos (+0,25…) o absolutos, propiedad, desde → hasta, duración, curva.
- **Cámara:** movimiento, duración, curva.
- **Super:** texto exacto, tamaño, posición, entrada y salida.
- **Cues:** t · id · ganancia · nota.
```

## Secciones globales

- Pila de capas, luz, receta de vidrio, sheen.
- Curvas (máximo tres, con `CustomEase` y su motivo).
- Ritmo (qué cae en qué golpe) y lectura (tiempos mínimos de supers).
- Tipografía (escala en px del escenario).
- Transiciones firma (nombre, mecánica, dónde).
- La marca: construcción, estados y cómo se anima.
- Tema (siempre oscuro o respeta tema) con decisión y motivo.
- Controles, pantalla de puerta, cierre y salida.
- Movimiento reducido (láminas).
- Cue sheet completo por tramos y recetas de síntesis.
- Partitura por compás (acorde, capas, riser, silencios, drops).
- Presupuesto de rendimiento y modo liviano.
- Prerrequisitos en el código.
