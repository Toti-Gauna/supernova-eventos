# Apertura y continuidad · Cierre del Prompt 3

9 de octubre de 2026. Registro del rol trailer para [03-flujos-y-calidad.md](../../experiencia-3d/03-flujos-y-calidad.md). Las entregas [1](01-intro-implementada.md) y [2](02-implementado.md), sus reportes y capturas se conservan como evidencia histórica.

Esta entrega conserva el storyboard solar de 3,6 segundos y el contrato `CinematicIntro({ onComplete })`. El overlay usa el puente liviano `useUniversePresentation()` y entrega el arte al primer frame válido del Canvas global. Bootstrap, Suspense y GSAP comparten el reloj monotónico del host. No se agregó un renderer, sonido, textura externa, barra de carga ficticia ni botón «Saltar intro».

La revisión conserva cleanup de `gsap.context`, timers y listeners en StrictMode; aislamiento de la app durante el portal; Tab dentro del escenario; Escape inmediato y restitución de foco sin scroll. Con movimiento reducido, el HTML crítico conserva su primer frame hasta 150 ms, mientras el overlay React completa de inmediato al montar. Se quitó su demora adicional para dejar tiempo al commit de React en CPU lenta; la salida final observada fue de 28 ms y de 187 ms con CPU 4×, dentro del máximo de 200 ms. La duración normal y el bootstrap no cambiaron.

Frontend agregó un boundary acotado al import de `CinematicIntro`. Un chunk rechazado libera el aislamiento y el foco, conserva la UI de eventos y permite volver a pedir replay sin desmontar el universo. El clock y el contrato de `onComplete` siguen siendo los mismos.

## Verificación reproducible

`node docs/trailer/experiencia-3d/intro-check-03.mjs` usa Chrome headless local contra `http://127.0.0.1:5173/supernova-eventos/`. Se puede modificar la URL mediante `SUPERNOVA_QA_URL` y el ejecutable mediante `PLAYWRIGHT_CHROME_PATH`. Los atributos de renderer usados para las mediciones detalladas pertenecen al modo desarrollo.

El script registra plazos con `MutationObserver` y `performance.now()`, no con el polling de Playwright. Conserva los casos de primer frame antes de React, chunk demorado, reloj compartido, Escape, replay, foco y cambio de movimiento reducido. Agrega Escape antes de tener renderer, rechazo real de `CinematicIntro`, replay después de ese rechazo, CPU 4× mediante CDP y frames intermedios de apertura y viajes en 1440 × 900 y 390 × 844. Las capturas se toman con animaciones y reloj reales, sin congelar el Canvas.

Se ejecutaron `node --check docs/trailer/experiencia-3d/intro-check-03.mjs`, `npx tsc -b`, `git diff --check -- src/features/intro docs/trailer` y la corrida final del script: aprobados. Chrome necesitó lanzamiento autorizado fuera del sandbox. La comparación del bloque crítico de `index.html` con `src/features/intro/bootstrap.html` confirmó que son idénticos; no fue necesario regenerar el HTML ni copiarlo otra vez. Frontend ejecutó el build final y la suite integrada: **build aprobado y 58/58 pruebas aprobadas**, registrados en la [validación general](../../validation.md).

El [reporte final](captures/prompt-03/intro-report.json) identifica Chrome headless 155.0.8059.40 sobre Windows, DPR 1, backend ANGLE/Direct3D11 e Intel Iris Xe informado por WebGL. No hubo errores de página ni actualizaciones HMR durante la corrida final. Se abrió un solo browser por turno y se cerró antes de la suite integrada y la galería de frontend.

| Caso | Resultado final observado |
| --- | --- |
| JavaScript principal retenido | Bootstrap liberó a los 3604 ms; nota de carga honesta, negro continuo y Manrope disponible antes de React. React tardío no reabrió la intro. |
| Bootstrap con movimiento reducido | Liberación a los 157 ms. El objetivo visual del HTML es 150 ms; la observación incluye la entrega al scheduler. |
| Escape antes de React | Liberación a los 59 ms desde el reloj del bootstrap. |
| Apertura normal | 3623 ms en 1440 × 900 y 390 × 844; un Canvas, root operativo y SVG retirado tras `ready`. |
| Chunk de GSAP resuelto tarde | Conservó reloj y handoff; el SVG ya retirado no volvió a aparecer. |
| Chunk retenido hasta el plazo | Suspense liberó a los 3655 ms, con foco en `main-content`; resolverlo después no reabrió la intro. |
| Replay desde Mis eventos | Conservó sección, scroll y foco del disparador; Escape liberó el aislamiento. |
| Replay reducido y cambio dinámico | 28 ms desde el nuevo reloj; 33 ms desde el evento de cambio de preferencia. |
| Replay con CPU 4× | Normal: 3528 ms. Reduced: 187 ms. Mismo Canvas, foco y scroll conservados. |
| Escape sin renderer disponible | Liberación 45 ms después de enviar Escape. La navegación ya funcionaba; el renderer tardío usó el destino vigente. |
| Import de intro rechazado | Un request abortado de verdad; liberación a los 810 ms. La app y replay siguieron utilizables, con foco restituido y Canvas conservado. |
| Viajes con movimiento habilitado | Ocho recorridos: Mis eventos, Favoritos, evento y abordaje en 1440 y 390 px. Cámara distinta de origen, mismo Canvas y `travelling=true` antes y después de cada screenshot; partículas finitas durante el viaje y retiradas al llegar. |

## Hallazgos resueltos

| Área | Evidencia y corrección | Estado |
| --- | --- | --- |
| Correctitud y continuidad | Abrir un evento desde el catálogo scrolleado heredaba la pausa de la escena anterior y saltaba a la pose final. Frontend condicionó la pausa al destino de sección, reinició visibilidad al emitir un comando y descartó callbacks antiguos. | Vuelo de evento observado en ambos viewports; regresión integrada aprobada. |
| Rendimiento y accesibilidad | El timer de 150 ms de React dejó una salida de 305 ms bajo CPU 4×. `introLifecycle.ts` ahora completa sin demora al montar con reduced. | 187 ms en la corrida final con CPU 4×; foco y scroll conservados. |
| Ciclo de vida y recuperación | Un import rechazado requería aislamiento del error en el host. Frontend añadió el boundary exclusivo de la intro y la salida funcional. | Abort real y replay posterior aprobados. |
| Consistencia del repositorio | README, storyboard y QA anteriores describían todavía la intro de 3,4 s y el hero SVG. | README actualizado; registros históricos preservados e identificados. |

Un intento intermedio detectó reemplazo del Canvas mientras se terminaban cambios del engine; esa corrida no se tomó como aprobación final. El reporte final exige ausencia de HMR e identidad del Canvas en todos sus viajes. El [reporte incompleto](captures/prompt-03/intro-report-incomplete.json) se conserva como diagnóstico del fallo previo de CPU 4×, separado del reporte aprobado.

## Revisión visual

La [galería de esta entrega](captures/prompt-03/README.md) contiene 21 capturas nuevas, sin modificar las de Prompt 1 o 2. Se revisaron el primer frame y handoff solar, la llegada al hero y frames intermedios de las cuatro rutas. El sistema solar mantiene la marca legible sobre negro, el fundido retira el SVG sin un corte blanco y el volumen del planeta permanece en el renderer. En móvil, el artwork queda dentro del viewport; al abordar, la nave aporta estructura detrás de los formularios DOM y sus controles siguen visibles. Las imágenes de un viaje muestran el estado intermedio, no su composición final.

Los frames de abordaje preceden al último pulido de la cabina: metal grafito, postes y viga más finos, luces suaves y viga apartada del título. Ese ajuste visual no cambió cámara, intro ni contrato; la evidencia conserva su validez para plazos y continuidad. La [galería final de frontend](../../experiencia-3d/captures/prompt-3/README.md) muestra la composición actual. No se repitió el navegador desde trailer después de ese pulido.

CPU 4× representa una emulación de CPU sobre Chrome local con los recursos de replay ya cargados. No demuestra rendimiento de GPU ni de un teléfono físico. No se ejecutó una traza de tareas Layout desde este rol y no se afirman FPS sostenidos ni ausencia total de fugas. El build, la suite general, los presupuestos del engine y las composiciones finales del pase/cabina se registran desde frontend en `docs/experiencia-3d/`.

## Ajuste del inicio orbital · 9 de octubre de 2026

El [inicio orbital](../../cambios-eventos/inicio-orbital.md) incorpora a la izquierda un buscador y tres filas: dos eventos próximos y uno vencido; el catálogo completo continúa debajo. Los planetas 3D e híbridos retoman las bandas oscuras, la luz de borde y las órbitas finas de la referencia. El arte híbrido conserva sus dimensiones y las 36 variantes SVG de la carga producen exactamente su salida anterior; la intro, su reloj y el recorrido de cámara permanecen intactos.

La [galería del ajuste](../../cambios-eventos/captures-orbital/README.md) reúne 38 capturas de 18 contextos desde el build de producción local, sin errores registrados. Desde trailer se revisaron las vistas 3D oscura de 1440 px e híbrida oscura de 1920 px, además de las dos vistas híbridas de 320 × 667 en oscuro y claro: las filas se leen completas y tanto **Ver eventos** como el acceso circular quedan libres de la navegación inferior. También aprobó `npx tsc -b`. Frontend cerró el build y la regresión integrada de 94/94, y repitió 9/9 pruebas afectadas después del ajuste final de compatibilidad; [validación](../../validation.md) detalla las corridas. Las capturas y mediciones de los prompts anteriores se conservan como evidencia histórica.

La demo persiste datos localmente; no se enviaron emails ni se agregó backend. No hubo deploy, push ni commit.

## Fondo Tour y ocho planetas · 9 de octubre de 2026

La actualización espacial conserva el fondo del proyecto local Supernova Tour desde el primer HTML, durante la intro y en toda la app. [`TourNebulaBackdrop`](../../../src/features/background/TourNebulaBackdrop.tsx) controla el nodo persistente `#tour-nebula-backdrop`, fuera de `#root`, y retorna `null`. La imagen original, el resplandor y las siete partículas se dibujan antes de React; 60 estrellas SVG conservan la semilla, deriva y titileo de Tour sin sumar un Canvas. La imagen tiene su zoom de 2 s en una capa separada del parallax. [`Fondo de Supernova Tour`](../fondo-supernova-tour.md) registra fuente, hash, algoritmo y contrato de integración.

El fondo se mantiene visible durante el catálogo y los viajes; el scroll fuera del hero no lo detiene. Pausa manual, página oculta y movimiento reducido detienen CSS, estrellas y parallax. El reloj acumula sólo tiempo activo, con cleanup de frames, listeners y observadores en StrictMode. `data-motion`, `data-star-count` y `data-frame` permiten revisar esos estados; el contador publica aproximadamente cada 300 ms activos y se congela al pausar. Original y selector de versiones conservan su presentación independiente.

El SVG solar ahora muestra los ocho planetas con colores naturales. La Tierra azul, con continentes y nubes, reemplaza al cuerpo violeta y conserva `data-intro-point="0"` en `(300,157)` para el acercamiento. Júpiter incorpora bandas, mancha y cuatro lunas; Saturno y Urano tienen anillos. Mercurio, Venus, Marte y Neptuno completan el mapa. Se conservan el viewBox, las órbitas, la marca, los atributos GSAP y la duración de 3,6 s. Las versiones espaciales hacen transparente el backdrop privado de la intro y ocultan sus estrellas para compartir el mismo cielo de Tour.

Las mediciones y capturas anteriores documentan las entregas en sus fechas. La validación del nuevo fondo y del sistema solar se registra después de integrar y regenerar el HTML crítico; las aprobaciones históricas no se trasladan automáticamente a este ajuste.

## Movimiento autónomo del fondo · 13 de octubre de 2026

El fondo espacial deja de reaccionar al mouse. Se retiraron el listener de movimiento, la detección de hover, el frame coalescido, las variables de desplazamiento y la transición del contenedor de imagen. Se conserva el nodo del primer HTML y su contenedor estático, con la misma imagen, zoom, deriva, resplandor, 60 estrellas y siete partículas. Pausa manual, movimiento reducido, pestaña oculta, reloj activo y cleanup en StrictMode mantienen sus contratos. El SVG de carga y su duración no cambian en este ajuste.

La regresión [`background-motion.spec.ts`](../../../tests/background-motion.spec.ts) compara las capas antes y después de mover el puntero con la deriva CSS congelada, tanto en 3D como en híbrida, y revisa las pausas del fondo. Sus tres casos aprobaron dentro de la corrida final de 42/42 pruebas afectadas. Las cámaras también dejan de reaccionar al mouse. El último encuadre de Admin desplaza posición y objetivo juntos en los ejes de la cámara para mantener la nave dentro del encabezado. [Validación](../../validation.md) registra el build y la regresión específica de ese ajuste.

La [entrega de legibilidad y registro de pases](../../cambios-eventos/legibilidad-y-registro-de-pases.md) reduce el espacio decorativo y amplía fotos/textos del inicio. La [galería actual](../../cambios-eventos/captures-readability/README.md) reemplaza las capturas anteriores como evidencia de esta composición; las anteriores se conservan como historial. El QR aparece dentro del pase y de su descarga, y administración valida y registra ingresos exclusivamente en la demo local. Sin deploy.

## Entrega de la Tierra única · 13 de octubre de 2026

El planeta violeta separado del mapa provenía del fallback del host híbrido, visible debajo de la intro transparente mientras cargaba el renderer. Frontend lo oculta durante la apertura y durante el bootstrap. La intro conserva sus ocho cuerpos naturales y el punto de Tierra `(300,157)`, con radio 14, dentro del viewBox `0 0 480 380`; no agrega otro planeta DOM.

La entrega del SVG al renderer pasa de 1,2–1,85 s a 1,0–1,2 s. Las cámaras de ambos modos conservan la pose exacta del mapa hasta 1,2 s y luego acercan la Tierra al lado derecho del hero hasta 3,25 s. El fundido termina antes del vuelo; si `ready` llega tarde, usa únicamente el tiempo restante de la entrega o se completa inmediatamente, evitando mezclar dos poses distintas. Se conservan `status`, `introStartedAtMs`, `variant`, el reloj compartido con Suspense, la duración normal de 3,6 s, Escape, foco, replay, StrictMode y movimiento reducido de hasta 200 ms.

La fuente de intro y la integración de cámaras se verifican juntas al cerrar frontend. No se atribuyen los resultados históricos de QA a este cambio.
