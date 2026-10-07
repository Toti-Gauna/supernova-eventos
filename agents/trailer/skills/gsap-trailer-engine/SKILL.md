---
name: gsap-trailer-engine
description: "Arquitectura y reglas para construir un trailer in-app con GSAP en React y Vite: host liviano, trailer lazy en su propio chunk, timeline finito, contexto con cleanup, contrato de escena determinista y seekable, y reglas de texto, 3D y rendimiento. Usala antes de escribir o modificar código del trailer."
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
| Host | En el bundle compartido, liviano y **sin GSAP**. Decide si mostrar (ruta, rol resuelto, deep links, "visto") y monta el trailer con `React.lazy(() => import(...))` dentro de `Suspense`. |
| Núcleo `.mjs` | Reglas puras (visibilidad, clave de visto, parámetros de QA) con tests en `node --test`. |
| Línea `.mjs` | Escenas, supers y cues como **datos** con validador (sin huecos, en la grilla, sin cues en los silencios). |
| GSAP | Para una intro breve sin plugins, importá GSAP solo desde el componente lazy. Si hay plugins compartidos, un módulo exclusivo de la feature los registra. |
| Reloj | Sin audio, basta el timeline finito de GSAP. Si se pide audio, el **audio manda** (`getOutputTimestamp`): la imagen espera al sonido. No agregues tickers externos a una intro que no los necesita. |
| Maestro | Una intro breve usa un único `gsap.timeline({ onComplete })` dentro de `gsap.context`. Un trailer con seek y audio usa timeline pausado controlado por su reloj. |
| Escenas | Una por archivo: DOM estático con coordenadas del escenario + `construir()` que devuelve un timeline relativo. |
| Audio | Todo pre-renderizado a buffers; se agenda de una vez en el reloj de audio; síntesis de respaldo por id. |

## Reglas que más fallan

Ver `references/trampas.md`. Las cinco principales:

1. Con `gsap.context` en un efecto, devolvé `context.revert()` y limpiá listeners/timers manualmente. Si el repo usa `useGSAP` con dependencias, **necesita** `revertOnUpdate: true`.
2. Nada de tweens sueltos, `delay`, `repeat: -1`, `delayedCall` ni `tl.call()` para sonidos: rompen el seek.
3. Cada escena fija su **estado de entrada** con `set`/`fromTo` (y `immediateRender: false` en el segundo `from` de la misma propiedad).
4. SplitText después de `document.fonts.ready`, sin `autoSplit`, y **sin revertir al terminar** el super (lo revierte el contexto al cerrar).
5. `opacity < 1`, `filter` u `overflow: hidden` en un ancestro `preserve-3d` aplanan el 3D.

## Proceso

Para una intro de menos de 4 segundos, no crees un motor de audio, módulos de escenas o validadores artificiales: componente lazy, estilos propios, timeline finito, controles, cleanup y storyboard breve son suficientes.

1. Fundación: tipos, línea, núcleo y tests, `gsapTrailer`, reloj, maestro.
2. Motor: overlay (portal, `inert`, foco, clases de `<html>`), escenario escalado, capas globales, pantalla de puerta, controles, salida, limpieza.
3. Sonido (`sound-design`) en paralelo con piezas y escenas.
4. Integración en la app y QA (`trailer-qa`).

## Salida esperada

- Código que cumple el contrato, con `tsc` sin errores nuevos, tests del núcleo en verde y el chunk del trailer fuera del bundle compartido.
