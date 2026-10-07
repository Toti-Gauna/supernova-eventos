# Rúbrica del juez

Puntaje de 1 a 10 por criterio, con una línea de justificación cada uno.

| Criterio | Qué se mira |
|---|---|
| Impacto premium | ¿Se sostiene al lado de un lanzamiento de Apple, Google, Anthropic o Linear? Contención, luz, tiempo, tipografía. |
| Claridad del producto | Alguien que no conoce la feature, ¿entiende qué hace en una sola vista? |
| Fidelidad a la UI real | ¿Usa piezas y textos reales? ¿Inventa pantallas? |
| Construible a 60 fps | En DOM + GSAP, en una notebook con GPU integrada. Penaliza blur, backdrop-filter, muchas capas 3D, canvas múltiples. |
| Coherencia con la marca | ¿La marca se respeta (forma, color, uso del degradé)? ¿El tono va con el dominio? |
| Audiencia A | ¿El arco sirve a ese rol y promete solo lo que tiene? |
| Audiencia B | Ídem. |

## Qué entrega el juez

1. Tabla de puntajes y totales.
2. Fortalezas, debilidades y **errores de contenido** de cada dirección (datos inventados, formatos mal, promesas falsas).
3. Ganadora como columna vertebral y lista de **injertos** (de dónde y por qué) y **descartes** (qué y por qué).
4. Storyboard definitivo (ver `plantilla-storyboard.md`), cue sheet y partitura.
5. Prerrequisitos y hallazgos en el código (exports que faltan, textos a corregir en el producto, datos sensibles).

## Sesgos a evitar

- Elegir lo más espectacular sin mirar el costo en GPU.
- Premiar el humor en dominios sensibles.
- Aceptar datos de las capturas sin compararlos con el código.
