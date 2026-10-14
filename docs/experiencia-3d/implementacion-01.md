# Prompt 1 · fundación y primer recorrido implementados

Implementación local del 8 de octubre de 2026. **Sin deploy, push ni publicación.** Continúa el pack de tres prompts del [README](README.md); este archivo registra la entrega y no agrega un cuarto prompt.

## Resultado

La app tiene un fondo espacial negro persistente y un planeta real en el hero, con superficie procedural, terminador de luz, borde atmosférico y anillo con oclusión. Mis eventos tiene un mundo teal con tres lunas; Favoritos, un planeta ámbar y hasta ocho satélites derivados de eventos visibles. Perfil tiene su propio cuerpo y Administración una nave base. La cámara recorre posiciones estables y termina mostrando solamente el protagonista de cada sección.

Bootstrap, fallback e intro lazy presentan un sistema solar desde el primer frame y entregan la escena al mismo Canvas. Comparten reloj, Escape y salida automática; un chunk tardío no vuelve a abrir la intro. Replay conserva la sección y el scroll. El estudio ya tiene una pose de cabina como base para el siguiente acabado.

Las regiones decorativas viven dentro de los encabezados. En desktop, planeta o nave quedan junto al texto; en móvil, debajo del título y antes de las acciones. La tarjeta del destacado sigue siendo un botón DOM. El fondo se mantiene `#020205` con ambos temas; los controles y paneles conservan su preferencia clara u oscura.

## Integración y ownership

| Área | Implementación |
| --- | --- |
| Estado de presentación | `contracts.ts`, `useUniverseController.ts`, `presentation.tsx`: comandos monotónicos, reloj compartido, última intención vigente, pausa y resultados de cámara. |
| Host | `UniverseHost.tsx` y `App.tsx`: engine lazy fuera de las vistas con `key={view}`, de la intro y de los diálogos. Un Canvas persistente. |
| Composición DOM | `UniverseSurface.tsx`, encabezados de las vistas, `CosmicScene.tsx` y `universe.css`: reservas de espacio, CTA y fallback SVG original. |
| Escena | `UniverseExperience.tsx`, `CameraRig.tsx`, `scene.config.ts`, `Planet.tsx`, `Starfield.tsx`, `Spaceship.tsx` y shaders: cuerpos, cámara, recursos y calidad. |
| Intro, rol trailer | `src/features/intro/**`, plantilla bootstrap y [registro de QA de apertura](../trailer/experiencia-3d/01-intro-implementada.md). Frontend sincroniza `index.html`. |
| Acciones | App conserva vistas, registros, favoritos y wizard. Un callback de presentación no registra, publica ni cancela eventos. |

Entrar a un evento emite su ID/categoría y guarda la sección o estudio de origen para regresar al cerrar. Abrir/cerrar el wizard emite una intención real; su cleanup ya no provoca viajes falsos en StrictMode. El comando de confirmación se genera al crear una nueva inscripción válida. El formulario, el pase, los borradores y las claves de negocio existentes siguen usando estado local.

Dependencias instaladas y fijadas en el lockfile: `three@0.186.1`, `@react-three/fiber@9.8.1` y `@types/three@0.186.0`. No se agregaron Drei, otro router, GLB, texturas remotas ni servicios de backend.

## Accesibilidad, movimiento y fallo

Mi perfil incorpora «Pausar movimiento» / «Reanudar movimiento», con `aria-pressed` y persistencia en `supernova-universe-motion-v1`. La preferencia del sistema, la pausa voluntaria, una pestaña oculta y la región de cualquier planeta fuera de pantalla detienen el ambiente; las solicitudes vigentes siguen resolviéndose sin esperar un vuelo. Reduced motion y pausa usan render bajo demanda.

Los diálogos siguen usando `showModal()`, Escape y foco nativo. Si el trigger desaparece, el foco regresa al contenido principal. El Canvas decorativo no recibe foco ni eventos de puntero. Scroll, header flotante y navegación móvil conservan su comportamiento.

Errores del import, renderer o shader activan el fondo estático. La pérdida de contexto resuelve el request en fallback; una restauración puede reutilizar el renderer y las pérdidas repetidas conservan el fallback. La disponibilidad de la escena nunca determina si una inscripción o publicación es válida.

El DOM sigue animando transform y opacity. El engine usa las excepciones autorizadas para transforms de cámara/objetos y uniforms de materiales. Los observadores, listeners y timers tienen cleanup; las geometrías y materiales pertenecen al árbol del renderer y no se recrean por cada destino. GSAP permanece dentro del chunk de intro.

## Verificaciones ejecutadas

| Comando o comprobación | Resultado |
| --- | --- |
| `npm run build` | TypeScript y Vite aprobados sobre el estado final. |
| `npm run test:e2e` | **40 pruebas aprobadas** en la ejecución integrada final; 32 flujos previos y 8 casos específicos del universo. |
| `node scripts/universe-review.mjs` | **42 capturas y 3 viajes reales**, cero errores de página/consola y cero desbordamientos horizontales detectados. |
| `npm run preview` + `node scripts/universe-preview-check.mjs` | **12 comprobaciones aprobadas** bajo `/supernova-eventos/`: tres destinos × dos temas × 390/1440 px; mismo Canvas, WebGL disponible y cero errores HTTP/JavaScript o requests fallidos. |
| QA de intro | Bootstrap 3603 ms normal / 159 ms reduced; chunk pendiente 3704 ms; Escape, foco, replay y cambio de preferencia aprobados. Detalle en el registro del rol trailer. |
| Comparación plantilla/index y `git diff --check` | Bootstrap sincronizado; sin errores de whitespace. |

Las ocho pruebas nuevas cubren viaje interrumpido y última intención, identidad del Canvas, ausencia de cuerpos anteriores al llegar, reduced motion, chunk 3D fallido con operación por teclado, WebGL ausente, pérdida de contexto, intro demorada, pausa persistente y pausa automática al leer una sección lejos de su planeta. Los casos existentes comprobaron nuevamente catálogo, inscripción, términos, acompañantes, pase, calendario, cancelación, importación, filtros, creación, temas, foco y navegación responsive.

La prueba de chunk demorado inicia replay con React ya montado y mide la salida mediante MutationObserver y el reloj de la intro. Así separa la demora de GSAP de una descarga lenta del bundle principal, mantiene el límite de 4 segundos y comprueba restitución de foco y ausencia de reapertura tardía. Se repitió dos veces de forma dirigida antes de la corrida integrada final. El QA de trailer verifica además bootstrap y apertura inicial con JavaScript demorado.

El script visual revisa hero/Mis eventos/Favoritos en 320, 390, 768 y 1440 px, y perfil/administración/estudio/evento en 390 y 1440 px, con ambos temas. La preferencia del sistema permite movimiento en la observación de viajes. Las capturas usan la pausa real del producto para congelar WebGL y una semilla estable; `animations: 'disabled'` solamente congela el DOM.

## Medición local y límites

Equipo de revisión: Windows, Chrome headless 155.0.8059.40, WebGL 2 mediante ANGLE/Direct3D11 sobre **Intel Iris Xe**, DPR 1. El [reporte visual](captures/review.json) conserva navegador, renderer, viewport, cámara y contadores; el [reporte de producción](captures/production-review.json) registra la comprobación del prefijo.

En los tres viajes observados, la cámara recorrió aproximadamente **20,08 / 49,71 / 30,40 unidades**. Se observaron **824 / 846 / 883 ms restantes** desde detectar el viaje hasta la llegada; esos intervalos no son una medición de FPS. Las capturas finales en `balanced` registraron **3–14 draw calls** y **3304–9268 triángulos** por frame.

El engine lazy final pesa **946,80 kB minificados / 256,19 kB gzip**, dentro del presupuesto adicional de 450 KiB gzip del brief. Vite advierte por el chunk minificado de más de 500 kB; se conserva lazy y separado del host inicial. La carga se verificó bajo el prefijo de producción, sin assets 3D externos.

**No se midieron FPS ni rendimiento en un teléfono físico.** Los tamaños móviles son viewports de Chrome local. Los contadores corresponden a las escenas capturadas y no prueban el costo máximo de futuras escenas o postprocesado.

## Capturas representativas

- [Hero desktop](captures/hero-dark-1440.png) y [hero móvil](captures/hero-dark-390.png).
- [Mis eventos](captures/mis-eventos-dark-1440.png) y [Mis eventos móvil claro](captures/mis-eventos-light-390.png).
- [Favoritos](captures/favoritos-dark-1440.png) y [Favoritos móvil claro](captures/favoritos-light-390.png).
- [Perfil](captures/perfil-light-390.png), [nave administrativa](captures/admin-dark-1440.png) y [cabina con formulario](captures/estudio-light-1440.png).
- [Detalle del evento](captures/evento-light-1440.png) y [formulario móvil](captures/evento-formulario-light-390.png).

## Continuación prevista

**Prompt 2:** acabado de materiales y luz, composición cinematográfica del sistema solar, continuidad de partículas, refinamiento de los viajes y nave/cabina con mayor identidad. La nave de esta entrega es geometría base; el storyboard completo todavía requiere ese trabajo.

**Prompt 3:** composición espacial definitiva del detalle y pase, celebración visible de inscripción, interacción opcional equivalente por teclado, recorridos completos de creación a bordo y revisión final de calidad/rendimiento. El diálogo ya tiene scrim translúcido y paneles legibles, pero su composición actual cubre gran parte del planeta del evento; esa región decorativa debe diseñarse en esta etapa sin perjudicar el formulario ni el pase.

SSO, autorización, concurrencia de cupos, nómina y envío de emails conservan las dependencias propuestas en [backend-prompt.md](../backend-prompt.md). Esta implementación mantiene la demo y sus datos ficticios locales.
