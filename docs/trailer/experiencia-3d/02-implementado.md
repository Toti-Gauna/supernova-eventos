# Apertura solar y continuidad · Prompt 2

8 de octubre de 2026. Implementación del rol trailer de [02-universo-y-viajes.md](02-universo-y-viajes.md). La primera entrega y sus capturas se conservan en [01-intro-implementada.md](01-intro-implementada.md); esta revisión escribe sus artefactos en `captures/prompt-02/`.

La apertura mantiene un primer frame SVG liviano y un solo renderer 3D persistente, provisto por frontend. El HTML crítico, Suspense y `CinematicIntro` comparten el mismo dibujo: estrella cálida pequeña, cinco cuerpos de distintos tamaños, anillo violeta, mundo teal con tres lunas, mundo ámbar, cuerpos lejanos y nave. El espacio es negro `#020205`; se retiró la mancha violeta de fondo. La luz solar ocupa una región pequeña, sin bloom de pantalla.

El símbolo Supernova conserva su trazo vectorial y aparece junto al wordmark, con su acento lavanda. Está separado de la estrella del sistema, sin deformaciones ni rotaciones. La tipografía y los textos siguen siendo los existentes. Los cuerpos del SVG son un primer frame y un fallback: la geometría, los materiales y el recorrido real pertenecen al Canvas de `src/features/universe/`.

Frontend precarga el Manrope 400 existente y declara su fuente en el HTML crítico, antes del JavaScript principal. El primer frame usa la tipografía del producto aunque React esté demorado; no suma familias nuevas ni depende de un CDN. Vite resuelve la URL local para el prefijo de producción.

## Storyboard aplicado

| Tiempo desde bootstrap | Overlay DOM |
| --- | --- |
| 0,00–0,45 s | Sistema visible sobre negro; las órbitas tienen una deriva inicial de solo 2° y el halo solar cambia únicamente su opacidad. |
| 0,35–1,30 s | Wordmark y tagline entran con opacidad y desplazamiento vertical. El logo viaja dentro del lockup, conservando su forma. |
| 1,20–1,85 s | El mapa y el fondo SVG se desvanecen si el engine ya informó `ready` después de presentar su primer frame. La identidad permanece sobre el universo real. |
| 1,90–2,65 s | La identidad completa se retira con opacidad y un desplazamiento de 8 px. La cámara es el foco de la llegada. |
| 2,80–3,20 s | Se retira la composición solar restante si el engine sigue en fallback. |
| 3,25–3,60 s | Sale el overlay; `onComplete` libera la UI y restituye el foco. |

Cuando `ready` llega tarde, el fundido conserva la ventana temporal de handoff y se acorta hasta 150 ms si esa ventana ya terminó; no reinicia la intro. `introHandoff.ts` conserva una única sesión por reloj entre Suspense y el componente lazy: si el SVG ya se retiró, resolver GSAP no lo repone durante otro fundido. Un delay CSS negativo busca el punto vigente y los estilos memoizados evitan nuevos seeks por renders del host. El host conserva su reloj monotónico y decide la revelación del hero/header y el destino de replay. Esta fase no anima la cámara desde GSAP, no crea un Canvas en la intro y no importa GSAP en el host.

## Robustez conservada

`CinematicIntro({ onComplete })` y el contexto compartido mantienen sus contratos. La línea finita usa `gsap.context` y revierte al desmontar. Bootstrap, Suspense y el componente lazy reciben el mismo `introStartedAtMs`; el componente tardío hace seek al elapsed real. Duración visual de 3,6 s, deadline absoluto de 4 s y movimiento reducido de 150 ms. Escape completa de inmediato. La lógica de timers, listeners, aislamiento, Tab y restitución de foco del Prompt 1 permanece intacta.

El HTML deja de bloquear sin React al vencer su reloj y conserva la nota honesta «La aplicación todavía se está cargando». El CSS crítico mantiene `html` y `body` negros mientras ese bootstrap permanezca en el documento, incluso en tema claro y antes de que llegue el CSS de la app. No muestra porcentajes estimados, un progreso inventado, botón «Saltar intro» ni sonido. La aplicación de eventos sigue siendo una demo con persistencia local.

## Sincronización

`node docs/trailer/sync-bootstrap.mjs` genera `src/features/intro/bootstrap.html` desde `IntroArtwork.tsx` e `intro.css`. El rol frontend copia el bloque completo antes de `#root` en `index.html`, sin cambiar su head. El renderer y el hero se revisan en el registro general de frontend.

## Verificación

Se ejecutaron `node docs/trailer/sync-bootstrap.mjs`, `node --check docs/trailer/experiencia-3d/intro-check-02.mjs`, `git diff --check -- src/features/intro docs/trailer` y `node docs/trailer/experiencia-3d/intro-check-02.mjs`. El script anterior queda intacto como evidencia histórica de Prompt 1. Chrome requirió un lanzamiento autorizado fuera del sandbox tras `spawn EPERM`. Un intento intermedio encontró Vite/React en plena integración y no completó; la corrida final, con el código estable y el bootstrap sincronizado, aprobó todos sus casos sin errores de página.

El [reporte JSON](captures/prompt-02/intro-report.json) registra Chrome headless 155.0.8059.40 en Windows local, movimiento habilitado salvo los casos de reduced motion, tema de superficies claro y viewports 1440 × 900, 390 × 844 y 320 × 740. Las duraciones usan `MutationObserver` y `performance.now()`; no suman el polling de Playwright al reloj de release.

| Caso | Resultado final observado |
| --- | --- |
| JavaScript principal bloqueado | Bootstrap liberó a los 3609 ms; la nota conservó un fondo negro y Manrope estaba cargado antes de React. React tardío no reabrió la intro. |
| Bootstrap con movimiento reducido | Liberación a los 161 ms. |
| Escape antes de React | Liberación a los 82 ms desde el primer frame; incluye el envío inicial de la tecla. |
| Intro normal | Liberación a los 3666 ms; un Canvas persistente y root operativo. |
| Lazy de GSAP resuelto a partir de 2,4 s | El componente retomó su reloj y mantuvo el SVG retirado; no reprodujo el fundido de entrada. |
| Lazy de GSAP retenido hasta el deadline | Suspense terminó a los 3669 ms, restituyó foco y el chunk tardío no reabrió la escena. |
| Replay desde Mis eventos | Conservó sección, cantidad de Canvas y foco del disparador tras Escape. |
| Replay con movimiento reducido | Terminó a los 178 ms. |
| Cambio de preferencia durante replay | Terminó a los 88 ms desde el evento de preferencia, con foco restituido. |

Se revisaron el [primer frame desktop](captures/prompt-02/solar-before-react.png), [320 px](captures/prompt-02/solar-bootstrap-320.png), [390 px](captures/prompt-02/solar-bootstrap-390.png), [Suspense](captures/prompt-02/solar-pending-lazy.png), los frames de [1127 ms](captures/prompt-02/solar-live-1100.png), [2066 ms](captures/prompt-02/solar-live-1800.png), [2839 ms](captures/prompt-02/solar-live-2750.png) y la [llegada al hero](captures/prompt-02/solar-arrival.png). Son ocho capturas nuevas, separadas de las históricas.

La corrida fría mantuvo el SVG mientras WebGL cargaba a los 1127 ms; a los 2066 ms el renderer estaba listo y comenzó su handoff acortado. A los 2839 ms el SVG y el lockup ya tenían opacidad cero, con hero/header entrando sobre los cuerpos reales. La llegada conserva el planeta del renderer, el ticket DOM y la tipografía legible; no hay cortes blancos ni overflow horizontal en el artwork móvil.

La integración ejecutó `npm run build` con este handoff final: aprobado, 2134 módulos transformados, chunk lazy de intro de 28,42 kB gzip y motor 3D de 260,42 kB gzip. El universo usa la misma escena para sistema solar, mundos, nave y cabina; frontend conserva la lógica de la UI y administra los destinos. La suite de flujos, la galería de planetas, la medición del renderer y la revisión del prefijo de producción quedan registradas en [implementacion-02.md](../../experiencia-3d/implementacion-02.md), mantenido por frontend.

Estas capturas son viewports de Chrome local: no se midieron aquí FPS, CPU 4× ni dispositivos móviles físicos. La fase trailer no demuestra envío de emails, integración backend ni publicación. No se deployó.
