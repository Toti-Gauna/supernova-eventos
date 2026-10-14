# Intro conectada · primera etapa

8 de octubre de 2026. Esta entrega prepara la continuidad de apertura para el universo de Prompt 1. El sistema solar cinematográfico, los materiales finales y los viajes del storyboard de Prompt 2 siguen siendo su siguiente etapa.

`IntroArtwork` comparte un primer frame solar entre el HTML crítico, Suspense y la intro lazy: órbitas elípticas, planeta violeta con anillo, mineral teal con tres lunas, ámbar, mundo perlado y nave. Es un fallback SVG liviano; no se presenta como un segundo renderer 3D. Conserva la marca y el fondo negro `#020205`, también con las superficies claras del producto.

`CinematicIntro({ onComplete })` usa el contexto liviano `useUniversePresentation()`. `ready` entrega la imagen al Canvas persistente mediante un fundido de los padres DOM; GSAP conserva la propiedad de los transforms y opacity de sus hijos. Se evita animar una misma propiedad con CSS y GSAP. La UI del host se revela cuando finaliza la intro.

El reloj llega explícitamente por `introStartedAtMs`, capturado por el host antes de remover bootstrap. La descarga lazy hace seek al tiempo real, sin volver al primer frame ni recortar artificialmente el elapsed. Timeline, bootstrap y Suspense apuntan a 3,6 s, con timeout de seguridad de 4 s para GSAP y reduced motion de 150 ms. Ese margen absorbe la entrega del callback al scheduler del navegador. Escape continúa inmediatamente y cambiar a movimiento reducido termina la apertura vigente. Los timers, listeners y el contexto GSAP se limpian en StrictMode.

La sesión de aislamiento conserva el foco original entre Suspense y el componente lazy: app inerte, Tab en el escenario y restitución de foco al terminar. El reloj no se reinicia desde un cleanup. Replay usa el reloj nuevo del host y conserva la sección y su botón de retorno.

## Integración del HTML crítico

Regenerar con `node docs/trailer/sync-bootstrap.mjs`. El script usa `IntroArtwork.tsx` y `intro.css` como fuentes y escribe `src/features/intro/bootstrap.html`; frontend copia el bloque completo antes de `#root` en `index.html`, preservando su head, las fuentes y el script de tema.

Antes de remover el HTML, capturar `data-intro-started-at` y `data-intro-dismissed`. Si React llega luego de que bootstrap venció o recibió Escape, el host no vuelve a mostrar la intro. El HTML libera el bloqueo visual por CSS y por un timer independiente de React; si la aplicación aún no llegó, aparece «La aplicación todavía se está cargando». No hay porcentajes estimados, sonido ni botón «Saltar intro». Un observer limpia el timer, los listeners y la nota cuando el host remueve bootstrap.

## Verificación del rol trailer

Se ejecutaron `node docs/trailer/sync-bootstrap.mjs`, `node --check docs/trailer/experiencia-3d/intro-check.mjs`, `git diff --check -- src/features/intro docs/trailer` y `node docs/trailer/experiencia-3d/intro-check.mjs` contra Vite en `127.0.0.1:5173/supernova-eventos/`. El primer lanzamiento de Chrome headless encontró `spawn EPERM`; la revisión autorizó ejecutarlo fuera del sandbox. El check final completó sin errores de página. La integración repitió este QA después de corregir el seed del tema al formato JSON esperado por storage; la corrida final verificó explícitamente `html[data-theme='light']`.

La instrumentación usa `MutationObserver` y el reloj monotónico expuesto en los nodos, evitando sumar la latencia del click de Playwright y su polling a la duración de la intro. La corrida final registró:

| Caso | Observación |
| --- | --- |
| JavaScript principal demorado | Bootstrap liberó el arte a los 3603 ms; permaneció una nota honesta de carga. React tardío no reabrió la intro. |
| Bootstrap con movimiento reducido | Liberación a los 159 ms. |
| Escape antes de React | Liberación a los 105 ms desde la apertura; la duración incluye el envío inicial de la tecla. |
| GSAP demorado | Suspense terminó a los 3704 ms, recuperó foco en `main-content` y app operable. Resolver el chunk después no reabrió la intro. |
| Replay desde Mis eventos | Conservó esa sección, la cantidad de Canvas y el foco del botón al salir con Escape. |
| Replay con movimiento reducido | Terminó a los 183 ms. |
| Cambio de preferencia durante replay | Terminó a los 111 ms desde el evento de preferencia y restituyó el foco. |
| DOM de intro | No agregó otro Canvas; Tab conservó el foco en la presentación y root quedó inerte mientras estaba abierta. |

Se revisaron capturas del [primer frame en desktop](captures/solar-before-react.png), [Suspense demorado](captures/solar-pending-lazy.png), [390 × 844](captures/solar-bootstrap-390.png) y [320 × 740](captures/solar-bootstrap-320.png): negro coherente en tema claro, órbitas y planetas identificables, tipografía sin recortes. La prueba automatizada verificó los límites horizontales del artwork móvil.

No se midieron FPS, CPU ni dispositivos físicos; estas duraciones corresponden a Chrome headless local con otros checks ejecutándose. El build y las regresiones generales pertenecen al registro de integración frontend. Los scripts históricos de movimiento y primer frame permanecen como referencias de la intro anterior; sus expectativas de fondo claro y hero SVG no describen esta etapa.
