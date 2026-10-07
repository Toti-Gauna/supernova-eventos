---
name: gsap-trailer-engine
description: "Arquitectura y reglas para construir un trailer in-app con GSAP en React/Next: host liviano en el bundle compartido, trailer en su propio chunk, núcleo puro testeable, línea de tiempo como datos, timeline maestro pausado que mueve un reloj de audio, contrato de escena determinista y seekable, y las trampas de useGSAP, SplitText, 3D y rendimiento. Usala antes de escribir o modificar código del trailer."
---

# GSAP Trailer Engine

## Propósito

Que el trailer sea **determinista** (se puede saltar a cualquier segundo y queda igual), **sincronizado** con el sonido al cuadro, **liviano** para el resto de la app y **limpio** al cerrarse.

## Cuándo usarla

- Antes de crear o tocar el motor, el reloj, el maestro o cualquier escena.
- Al integrar el trailer en la app (montaje, persistencia, eventos).

## Cuándo no usarla

- Trailers como video (usá `ai-video-prompt`).

## Arquitectura

Ver `references/contrato-de-escena.md` para los tipos.

| Pieza | Regla |
|---|---|
| Host | En el bundle compartido, ≤ 2 KB, **sin GSAP**. Decide si mostrar (ruta, rol resuelto, deep links, "visto") y monta el trailer con `next/dynamic({ ssr: false })`. |
| Núcleo `.mjs` | Reglas puras (visibilidad, clave de visto, parámetros de QA) con tests en `node --test`. |
| Línea `.mjs` | Escenas, supers y cues como **datos** con validador (sin huecos, en la grilla, sin cues en los silencios). |
| `gsapTrailer.ts` | Único archivo que registra plugins y curvas. |
| Reloj | El **audio manda** (`getOutputTimestamp`): la imagen espera al sonido. Sin audio, `performance.now()`. |
| Maestro | `gsap.timeline({ paused: true })`; lo mueve el reloj desde `gsap.ticker`. Escenas en labels; supers armados por el maestro. |
| Escenas | Una por archivo: DOM estático con coordenadas del escenario + `construir()` que devuelve un timeline relativo. |
| Audio | Todo pre-renderizado a buffers; se agenda de una vez en el reloj de audio; síntesis de respaldo por id. |

## Reglas que más fallan

Ver `references/trampas.md`. Las cinco principales:

1. `useGSAP` con dependencias **necesita** `revertOnUpdate: true` (si no, duplica timelines).
2. Nada de tweens sueltos, `delay`, `repeat: -1`, `delayedCall` ni `tl.call()` para sonidos: rompen el seek.
3. Cada escena fija su **estado de entrada** con `set`/`fromTo` (y `immediateRender: false` en el segundo `from` de la misma propiedad).
4. SplitText después de `document.fonts.ready`, sin `autoSplit`, y **sin revertir al terminar** el super (lo revierte el contexto al cerrar).
5. `opacity < 1`, `filter` u `overflow: hidden` en un ancestro `preserve-3d` aplanan el 3D.

## Proceso

1. Fundación: tipos, línea, núcleo y tests, `gsapTrailer`, reloj, maestro.
2. Motor: overlay (portal, `inert`, foco, clases de `<html>`), escenario escalado, capas globales, pantalla de puerta, controles, salida, limpieza.
3. Sonido (`sound-design`) en paralelo con piezas y escenas.
4. Integración en la app y QA (`trailer-qa`).

## Salida esperada

- Código que cumple el contrato, con `tsc` sin errores nuevos, tests del núcleo en verde y el chunk del trailer fuera del bundle compartido.
