# QA de movimiento

## Primer frame y tema claro · 7 de octubre de 2026

Se ejecutaron `node docs/trailer/first-frame-check.mjs` y `node docs/trailer/motion-check.mjs` contra Vite en localhost con Chrome headless. Ambos finalizaron sin errores de página. La revisión de primer frame demoró deliberadamente el módulo principal y luego la escena lazy: el HTML ya mostró órbitas animadas; el fallback conservó el artwork, foco y app inerte, y la entrega a GSAP mantuvo ese aislamiento. Se verificaron la eliminación de las cuatro esquinas, el fondo claro, Escape con restitución de foco y reduced motion.

La revisión normal midió **2710 ms desde la aparición del portal**; el timeline conserva su duración nominal de 3,4 s, pero retoma el tiempo ya mostrado por el primer frame HTML. Refresh, ausencia de «Saltar intro», movimiento del hero, pausa fuera del viewport y restitución del foco con movimiento reducido pasaron. No se ejecutaron build ni `tsc` desde este rol; la integración los registra por separado.

Capturas nuevas revisadas visualmente: [antes de React](captures/intro-first-frame-before-react.png), [descarga lazy demorada](captures/intro-first-frame-pending-chunk.png) y [modo claro](captures/intro-light-desktop.png). No se mostró una pantalla de solo logo en ninguna fase de la prueba.

## Verificación ejecutada

En la revisión anterior se ejecutaron `npx tsc -b` y `node docs/trailer/motion-check.mjs` contra Vite en localhost, con Chrome headless. El primer lanzamiento del navegador requirió escalación por `spawn EPERM`. El check final completó sin errores de página.

| Área | Resultado |
|---|---|
| Duración normal | La intro salió a los 3456 ms observados; timeline nominal de 3,4 s. |
| Refresh | Se mostró nuevamente después de recargar. |
| Controles | No existe botón dentro de la intro. Escape cierra. |
| Teclado | Tab mantiene el foco en el escenario; la app queda inerte debajo. |
| Salida inicial | La app recupera interacción y el foco queda en `main-content`. |
| Replay y reduced motion | Salida sin órbitas animadas y foco de vuelta en el botón del footer. |
| Hero | El transform del viajero cambia entre dos muestras. Fuera del viewport, su animación queda pausada. |
| Hero durante intro | Los grupos animados quedan pausados mientras la app está inerte. |
| Capturas | Se revisaron desktop 1440 × 900 y móvil 390 × 844. |

La lectura de código confirma un solo timeline finito, cleanup de contexto/listeners/timer, IDs SVG únicos y pausa del hero cuando el documento queda oculto. No se realizó un perfil de CPU ni se afirma una tasa de 60 fps.

La suite y el build de la integración completa se registran en [validation.md](../validation.md). Este documento reporta exclusivamente la revisión del rol trailer.

