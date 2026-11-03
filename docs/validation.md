# Validación del frontend

## Una sola pantalla: acceso, banner y catálogo Comercial · 3 de noviembre de 2026

- **Acceso.** Sin scroll en 1920 × 840, 1440 × 900, 1366 × 660, 390 × 844 y 360 × 740, medido con Chrome headless. En escritorio muestra las dos tarjetas; en teléfono, un selector alterna la tarjeta visible.
- **Banner.** Unos 330 px de alto en 1920 × 840 (antes ocupaba casi toda la pantalla) y 275 px en 1366 × 660. En la home Comercial, las cards empiezan a 711 px en 1920 × 840.
- **Catálogo Comercial.** Barra única (título y contador, búsqueda, orden y filtros) con chips de categoría y el atajo «Tu próximo pase».
- `npm run build` aprobado.
- **Corrida E2E integrada: 132 de 133.** El caso fallido detectó un bug real: en teléfono, la regla que ocultaba la bajada del acceso también ocultaba el aviso «Cerraste sesión». Se corrigió con una clase propia para la bajada. Después aprobaron los 12 casos afectados (`access.spec.ts`, `commercial.spec.ts` y el de navegación móvil de `e2e.spec.ts`); la suite completa no se volvió a correr tras ese ajuste.
- Casos nuevos: acceso sin scroll en laptop y en teléfono con el selector, y atajo «Tu próximo pase» con retorno de foco.

## Versión Comercial · 3 de noviembre de 2026

[Versión Comercial](orbita/comercial.md) en `/comercial/`: estética de banners de Personal, sin espacio, planetas ni intro.

- `npm run build` aprobado; genera `dist/comercial/index.html` para GitHub Pages.
- **130/130 casos E2E en 15,3 minutos**, en una corrida integrada. Incluye los 4 nuevos de `tests/commercial.spec.ts`:
  - sin nebulosa, canvas, intro ni sus descargas;
  - tema claro propio;
  - carrusel con pestañas, flechas, inscripción y salto al catálogo;
  - rotación automática con pausa;
  - cambio de versión conservando sesión y favoritos.

  `tests/access.spec.ts` también cubre `/comercial/`.
- Una corrida previa dio 128/130. Los 2 fallos de tiempo en `universe.spec.ts` (límite de 4 s de la intro y Escape durante el acercamiento) se debían a cuatro servidores Vite de la sesión que quedaron abiertos y competían por CPU. Al cerrarlos, esos casos aprobaron 6/6 repetidos y la suite completa volvió a aprobar entera.
- Revisión visual con Chrome headless de la home en tema claro y oscuro (1440 px) y en claro a 390 px, más acceso, inscripción, Mis eventos, Administrar y la página de versiones.

## Órbita: marca, accesos interno y externo y paleta Personal · 3 de noviembre de 2026

Cambios: [identidad y composición](orbita/README.md), [accesos](orbita/accesos.md) y [universo](orbita/universo.md).

- `npm run build` aprobado con el estado final. Sigue la advertencia previa por el tamaño del chunk de Three.
- **126/126 casos E2E en 13,9 minutos**, en una corrida integrada sin fallos ni casos omitidos. Incluye los 4 nuevos de `tests/access.spec.ts`:
  - pantalla de acceso en la primera visita;
  - validación del código de invitación y foco en el campo con error;
  - catálogo filtrado para externos;
  - bloqueo de enlaces a eventos internos;
  - inscripción prellenada;
  - acceso por evento definido en el creador;
  - cierre de sesión con foco en el título.

  Playwright arranca cada spec con la sesión interna de demo vía `storageState`.
- Una corrida anterior aprobó 114 de 126. Los 12 fallos eran:
  - nombres de descarga `supernova-*` que ahora son `orbita-*` (6);
  - un email de fixture en mayúsculas (5 casos de catálogo);
  - la expresión regular de `universe.spec.ts`, que esperaba `function SolarMap()` sin parámetros. Esta falla ya existía en `40f4878`.

  Se corrigieron en los tests, y los 22 casos de esos archivos volvieron a aprobar antes de la corrida integrada.
- Preview de producción bajo `/supernova-eventos/`: la raíz, `/3d/`, `/hibrida/` y `/original/` muestran el acceso, cargan `fondo-orbita.webp` y no registran errores de página ni respuestas 4xx.
- Revisión visual con Chrome headless en las tres versiones, en ambos temas y a 1440 y 390 px. Cubre la pantalla de acceso, el catálogo, el banner destacado, la banda de novedades, el selector de acceso del creador y el perfil externo. Las capturas del universo están en `orbita/captures/universo/` y las de la intro en `trailer/captures/orbita/`.

## Legibilidad, fondo estable y registro de pases · 13 de octubre de 2026

`npm run build` aprobado después del ajuste final de las cámaras de Admin y la regeneración automática del HTML crítico. TypeScript y Vite completaron la compilación; continúa la advertencia por tamaño del chunk Three compartido y lazy (258,66 kB gzip).

La regresión final aprobó **42/42 pruebas afectadas en 5,9 minutos**, con un worker. Cubre composición del hero, funciones disponibles y reserva vigente, planetas compactos, continuidad del fondo Tour, ausencia de reacción al mouse, pausas, QR, validación y registro de ingresos, temas, separación de versiones y pases móviles. Después se verificaron de nuevo los casos de composición y cabina al corregir el encuadre de la nave: los resultados de esa corrida se detallan al final de esta sección.

Los QR inline de 128 px en escritorio y 112 px en móvil se decodificaron desde píxeles con un lector independiente en **Original, 3D e híbrida**. También se decodificó el pase SVG descargado completo y se leyó ese archivo desde **Registrar pase**. Los casos inválidos incluyen identificadores adulterados, evento o función incorrectos, reservas canceladas y funciones terminadas; la confirmación vuelve a validar la reserva y evita ingresos duplicados. Se comprobó foco, Escape y el pase completo sin scroll a 320 × 667, incluido un calendario de seis filas.

Una corrida amplia previa aprobó 104 de 110 casos; se corrigieron los seis fallos detectados (fixtures/selectores, tipo MIME de la imagen descargada y el espacio del pase móvil). Las pruebas afectadas volvieron a aprobar. La suite vigente reúne 112 casos únicos en 13 archivos, incluyendo las dos regresiones nuevas que comparan la proyección real de la nave con su región DOM al entrar y redimensionar. No se afirma una segunda corrida integrada de los 112.

La [galería actual](cambios-eventos/captures-readability/README.md) contiene 72 capturas en 12 contextos del build servido localmente bajo `/supernova-eventos/`: ambas presentaciones espaciales en cinco tamaños/temas, más dos controles de Original. Incluye los encabezados, QR dentro del pase y resultado de validación administrativa. El [reporte](cambios-eventos/captures-readability/readable-review.json) registra continuidad del fondo, regiones, límites del pase y errores. Las capturas anteriores se conservan como historial.

Comandos de la regresión de 42 casos:

```powershell
npx playwright test tests/compact-solar.spec.ts tests/orbital-home.spec.ts tests/background-motion.spec.ts tests/pass-check-in.spec.ts tests/qr.spec.ts tests/theme.spec.ts tests/versions.spec.ts tests/e2e.spec.ts:487 tests/universe.spec.ts:512
```

La validación y el registro de ingreso corresponden exclusivamente a reservas guardadas en este navegador. No se agregaron servidor ni emails reales. [Implementación y contrato propuesto](cambios-eventos/legibilidad-y-registro-de-pases.md). No hubo deploy, publicación, commit ni push.

## Inicio orbital, funciones y QR · 9 de octubre de 2026

`npm run build` aprobado en la versión final. La regresión integrada aprobó **94/94 E2E en 12,9 minutos**, con un worker y sin skips. Después se amplió la migración del archivo para catálogos que conservan los seis eventos iniciales y agregaron eventos propios: las **9/9 pruebas afectadas** aprobaron en 55,5 segundos, incluyendo ese caso nuevo. La suite vigente reúne **95 casos únicos en diez archivos**; no se afirma una segunda corrida integrada de los 95.

La verificación cubre las tres versiones, selección de funciones, reservas y cupos independientes, cancelación, calendarios por función, datos anteriores, editor y borradores, QR de usuario/admin con lectura de píxeles y descarga, enlaces de evento/horario, navegación de regreso, selector de versiones, búsqueda y paginado. Incluye teclado, Escape/foco, pase sin scroll a 320 × 667 y calendario de seis filas, movimiento reducido, continuidad del Canvas, viajes interrumpidos, touch y pérdida/restauración real de contexto WebGL.

El inicio espacial tiene buscador y dos eventos próximos más uno vencido a la izquierda del planeta; el catálogo sigue al bajar. Las bandas oscuras, bordes luminosos y órbitas finas siguen la referencia. Original conserva su composición clásica y el arte del loader híbrido mantiene sus 36 variantes SVG anteriores. La migración conserva las ediciones y los eventos propios, excluye catálogos enteramente personalizados y no recrea el archivo eliminado.

La [galería orbital vigente](cambios-eventos/captures-orbital/README.md) suma **38 capturas en 18 contextos** sobre producción local bajo `/supernova-eventos/`: oscuro/claro a 1440, 390 y 320 px en ambas presentaciones espaciales, 1920 px oscuro y controles clásicos de Original. Sin errores JavaScript/HTTP, requests fallidos, imágenes rotas ni overflow. El acceso al catálogo queda por encima de la navegación inferior. [Funciones, navegación y QR](cambios-eventos/README.md) enlaza las revisiones adicionales y los contratos BE propuestos.

Los datos, reservas y QR siguen siendo una demo local; no se agregaron backend ni envíos reales. No se publicó ni desplegó.

## Tres versiones · 9 de octubre de 2026

Build aprobado y **64/64 E2E en una corrida integrada de 6,5 minutos, sin skips**: los 58 casos anteriores más seis de separación, navegación híbrida sin esferas, Canvas persistente, inscripción/pase, Escape/foco, borrador en cabina, fallback sin WebGL y pérdida/restauración real de contexto. La raíz sigue siendo 3D; `/original/` y `/hibrida/` son independientes.

La [galería híbrida](experiencia-hibrida/captures/README.md) suma 48 capturas de seis recorridos en ambos temas y viewports 1440×900, 390×844 y 320×667. Un Canvas, una inscripción por recorrido, cero errores JS/consola/requests fallidas, sin desbordes horizontales. Hasta 7 draw calls/8 triángulos en las composiciones estáticas, cero `SphereGeometry`. Otras 18 poses de intro verifican la coincidencia del centro/diámetro del violeta a 1,4 s con tolerancia de 2 px; se capturaron con reloj controlado y assets calientes, no son mediciones de GPU ni de descarga inicial.

[Preview de las tres versiones](experiencia-hibrida/captures/preview/review.json): **18/18 comprobaciones** bajo `/supernova-eventos/`, con fuentes y fotografías locales correctamente prefijadas, ambos temas y tres anchos. La original no descarga el renderer Three y completa su inscripción/pase en los seis contextos. Hay 24 capturas de preview: 18 homes y seis pases originales. Cero errores inesperados o requests fallidas. El build mantiene la advertencia de Vite para el chunk Three compartido y lazy, de 250,88 kB gzip.

Comandos ejecutados: `npm run build`, `npm run test:e2e`, `node scripts/hybrid-review.mjs`, `node scripts/hybrid-intro-review.mjs`, `node scripts/versions-preview-check.mjs`, `git -c core.safecrlf=false diff --check`. [Accesos e implementación](experiencia-hibrida/README.md). Sin deploy, publicación, commit ni push.

## Registro del cierre 3D anterior

Última revisión: **9 de octubre de 2026, cierre del prompt 3 de la experiencia 3D**. Build aprobado y **58/58 E2E en una única corrida integrada**, sin skips. Después del pulido visual se repitieron **10/10 casos afectados**, y **2/2 casos de pase** tras el último ajuste de contraste/margen. Incluye reserva/cupo/cue exactamente una vez ante doble submit, borrador final antes de 600 ms y reload, restauración real con `WEBGL_lose_context`, reintento de chunk rechazado, shader inválido con inscripción operativa, excepción React del engine recuperable, vuelo desde catálogo scrolleado, teclado/touch, foco, pausas e intro. Ver [implementación 3](experiencia-3d/implementacion-03.md) y [QA trailer 3](trailer/experiencia-3d/03-cierre.md).

La [galería final](experiencia-3d/captures/prompt-3/README.md) contiene **80 capturas** en ambos temas, a 1440 × 900, 390 × 844 y 320 × 667, con pases de seis filas y alturas de 550/667 px. El marco de cabina ya no cruza el título; planeta/cue del pase tienen región propia, lejos del cierre; calendario claro opaco, acciones y aviso demo legibles. Tres recorridos finales con dos warmups y cuatro ciclos mantuvieron 23 geometrías/1 textura/11 programas/49 nodos y el mismo Canvas. Deltas R3F medianos de 16 ms y p95 de 20/18/18 ms; máximos de 12 calls/9824 triángulos. Son intervalos muestreados en viewports de Chrome local / Intel Iris Xe, sin medir tiempo GPU, heap JS ni hardware móvil físico. No equivalen a FPS sostenidos ni cero fugas.

La apertura sumó 21 capturas y ocho viajes vivos, sin HMR ni errores inesperados. Normal: 3623 ms en ambos viewports; con CPU 4×, replay normal 3528 ms y reducido 187 ms. Escape antes de renderer, import rechazado y replay posterior conservaron app/foco. La revisión del build bajo `/supernova-eventos/` pasó 18 comprobaciones en ambos temas/3 anchos y el retry real con una entrada hashed alternativa, favoritos preservados y sin errores inesperados. Reportes, límites y comandos están enlazados desde la implementación 3. **Sin deploy, publicación, commit ni push.**

## Registro del prompt 2

Revisión del **8 de octubre de 2026**: `npm run build` aprobado y **48 casos E2E diferentes aprobados**: 47 en la ejecución integrada y el caso restante repetido tras corregir un selector antiguo de la intro que encontraba mapa y logo. Después del arreglo visual del fondo del modal se repitieron las **11 pruebas afectadas, todas aprobadas**. Incluye continuidad del Canvas, cámara real, interrupciones y resolución única, replay solar, pausa, reduced motion/visibility durante vuelo, touch, inscripción sin esperar el cue, retorno al origen con foco y borrador/paso del wizard conservados, además de todos los flujos anteriores. Ver [registro de implementación 2](experiencia-3d/implementacion-02.md) y [QA de apertura 2](trailer/experiencia-3d/02-implementado.md). La [primera entrega](experiencia-3d/implementacion-01.md) conserva su evidencia histórica.

La [galería del prompt 2](experiencia-3d/captures/prompt-2/README.md) tiene 58 capturas a 1440 × 900, 390 × 844 y 320 × 740 en ambos temas, más ocho frames específicos de apertura. Tres recorridos medidos con movimiento habilitado en Chrome local / Intel Iris Xe registraron delta mediano de 16 ms, p95 de 30/30/24 ms y pool de viaje de 32 → 0. Los máximos globales de las capturas fueron 18 draw calls y 15.036 triángulos. Son intervalos muestreados de R3F en viewports emulados; no se midió GPU, CPU 4× ni hardware móvil físico. Los scripts finalizaron sin errores de página/consola.

La revisión de producción local bajo `/supernova-eventos/` aprobó 18 comprobaciones en ambos temas a 1440, 390 y 320 px, con WebGL, mismo Canvas, fuente crítica y fotografías cargadas, sin overflow ni errores HTTP/JavaScript. No se publicó ni desplegó. El cierre visual del pase y el encuadre de la cabina móvil quedaron entonces para el prompt 3, completado en el registro vigente de arriba.

## Registro anterior del prototipo

Validado el 7 de octubre de 2026 con Node 22.23.2 y Chrome local en Windows.

- `npm run build`: TypeScript y build de Vite correctos.
- **32 casos E2E aprobados**: ejecución integrada de 31 casos y ejecución dirigida del caso adicional de transición de fases. Los casos de intro usan reloj real para permitir el avance de GSAP; los demás fijan la fecha de los eventos al 7 de octubre de 2026.
- 21 capturas de home, catálogo, Favoritos, inscripción fullscreen y toast, pase compacto, administración y filtros, creador con controles custom, perfil, notificaciones e intro. Incluye 1440 × 1100, 1440 × 1000, 1920 × 818, 390 × 844 y 390 × 667; sin errores JavaScript.
- Home verificada a 320, 390, 768, 1024, 1440, 1920 y 2560 px: sin desbordamiento horizontal.
- Intro y administración en chunks separados; lector de Excel cargado al importar un XLSX. Fuentes y fotografías servidas localmente.
- 15 capturas nuevas del modo claro/oscuro, controles, menús, administración, estudio, inscripción y pase. `node scripts/theme-review.mjs` terminó sin errores de página. El pase también conserva su calendario y acciones completos en modo claro a 1440 × 818, 1280 × 550, 390 × 667 y 320 × 667.
- Oscuro inicial incluso con sistema en modo claro; cambio por teclado, persistencia después de refresh, `color-scheme` y `theme-color` coherentes. Superficies claras verificadas en popovers, perfil, favoritos, métricas, tabla, modal de filtros, estudio, selects, calendario y toasts.
- Header estable con selector de tema desde 320 hasta 2560 px, sin superposición con el logo ni overflow horizontal. Scrollbars custom de 10 px con thumb redondeado y flechas ocultas en Chrome; reglas thin para Firefox.
- Primera escena comprobada antes de descargar React y durante la espera de GSAP. HTML, fallback y escena comparten artwork y reloj; no hay pantalla de solo logo ni textos de esquina. [QA de movimiento](trailer/qa.md) documenta las pruebas adicionales de handoff, foco, Escape y reduced motion.

## Flujos comprobados

1. Intro en cada refresh: cierre automático, ausencia de «Saltar intro», Escape, replay, regreso del foco y liberación del contenido. Revisión adicional de movimiento: 3456 ms observados; el planeta se mueve y se pausa fuera de pantalla y durante la intro.
2. Movimiento reducido, catálogo de seis experiencias distribuido en dos páginas de tres y header flotante redondeado al bajar.
3. Búsqueda vacía, categorías, favoritos y persistencia de preferencias.
4. Inscripción, términos, acompañante, pase, foco, calendario ICS con horarios UTC correctos, persistencia, vista previa administrativa de solo lectura y cancelación que libera ambas plazas.
5. Validación del creador, selección desde nómina ficticia, email personalizado, publicación privada y cambio a audiencia de compañía.
6. Modelo CSV descargable, importación XLSX real, normalización de emails, duplicados y filas inválidas.
7. Navegación, inscripción, confirmación con pase visible desde arriba y creación de eventos en móvil de 390 px.
8. Filtro por fecha local de un evento que empieza a las 23:30 y cruza al día siguiente en UTC.
9. Popovers nativos de perfil y notificaciones: Escape, clic exterior y navegación.
10. Diálogo nativo fullscreen: bloqueo del foco en el fondo, Escape, cierre explícito y restitución del foco. Un clic en el margen permanece dentro de la experiencia.
11. Pantalla Favoritos: estado vacío, búsqueda, alta y eliminación desde las cards y persistencia tras refresh.
12. Header y navegación centrados entre 1024 y 2560 px, cápsula flotante y acción del hero visible en la primera pantalla de 818 px de alto.
13. Creador con steppers en su propio header, regreso a administración, inscripción y pase sin header principal ni footer; calendario custom con fecha del evento, navegación entre meses y regreso al mes del evento.
14. Barra inferior móvil con los cuatro destinos, acceso a perfil, preferencias y cierre/regreso de la sesión demo conservando favoritos.
15. Select custom con teclado y opciones propias, calendario de fecha/hora, Escape, foco y TyC desactivado por defecto; activar, desactivar y recuperar el texto.
16. Filtros admin por nombre/estado/audiencia/fechas, aplicación explícita, tags con modal, eliminación y reset, paginado de hasta diez filas y cambios de página.
17. Email y términos con tostadas dentro del diálogo, limpieza del aviso al corregir, pase completo sin scroll en 1440 × 818, 1920 × 818, 1366 × 768, 1280 × 550, 1024 × 600, 390 × 844, 390 × 667 y 320 × 667; calendario de seis filas y acciones visibles.
18. Escena orbital en el HTML con el módulo principal bloqueado, sin textos de esquina y con oscuro por defecto.
19. Intro pendiente con chunk demorado, misma escena, fondo inerte, Escape y foco restaurado sin aparición tardía de la intro.
20. Selector de tema con teclado y preferencia persistida en refresh, sin depender de la elección del sistema operativo.
21. Modo claro en notificaciones, perfil, favoritos, tostadas, dashboard, modal de tags y controles del estudio.
22. Inscripción y pase en modo claro, con validación, calendario y acciones completos sin desbordamiento en escritorio y móvil.
23. Geometría del header y navegación entre 320 y 2560 px en ambos temas; thumb, track y botones custom del scrollbar.
24. Seis eventos iniciales distribuidos en dos páginas de tres, con límites Anterior/Siguiente y foco en los resultados al navegar.
25. Prioridad Activos → Próximos → Finalizados, con tres tarjetas en total por página y exclusión de borradores y privados sin acceso.
26. Orden por nombre o cupos dentro de cada fase, conservando la jerarquía y reiniciando la página.
27. Búsqueda, categorías, modalidad, fecha y favoritos aplicados antes de paginar; cambiar un filtro vuelve a la primera página.
28. Quitar los favoritos de la última página ajusta el paginado al nuevo total, sin dejar una página vacía.
29. Detalle de finalizados con inscripción cerrada, incluido el instante exacto de fin y el estado `ended` con una fecha futura.
30. Transición Próximo → Activo → Finalizado al avanzar el reloj del navegador, sin refresh ni cambio del estado persistido.
31. Paginado por teclado, foco y scroll por debajo del header, sin overflow a 320 y 390 px en modo oscuro.
32. El mismo recorrido de paginado por teclado y tamaños de pantalla en modo claro.

El build de producción también se revisó bajo `/supernova-eventos/`, en ambos temas a 320, 390 y 1440 px: tres tarjetas por página, fotografías cargadas, jerarquía temporal y consulta de finalizados correctas, sin errores HTTP ni JavaScript.

## Capturas

Modo claro: [home](screenshots/theme/home-light.png), [home móvil](screenshots/theme/home-light-mobile.png), [catálogo](screenshots/theme/catalog-light.png), [administración](screenshots/theme/admin-light.png), [estudio](screenshots/theme/studio-light.png), [calendario de edición](screenshots/theme/calendar-light.png), [inscripción](screenshots/theme/registration-light.png), [pase](screenshots/theme/pass-light.png) y [pase móvil](screenshots/theme/pass-light-mobile.png). [Primera escena antes de React](trailer/captures/intro-first-frame-before-react.png) y [intro clara](trailer/captures/intro-light-desktop.png).

- [Home desktop](screenshots/home-desktop.png).
- [Home en pantalla grande](screenshots/home-wide.png).
- [Catálogo y header flotante](screenshots/catalog-desktop.png).
- [Favoritos](screenshots/favorites-desktop.png).
- [Inscripción](screenshots/registration-desktop.png).
- [Pase personal](screenshots/registration-ticket.png).
- [Pase móvil completo](screenshots/registration-ticket-mobile.png).
- [Toast de inscripción](screenshots/registration-toast.png).
- [Administración](screenshots/admin-desktop.png).
- [Administración móvil](screenshots/admin-mobile.png).
- [Filtros aplicados](screenshots/admin-applied-filters.png).
- [Modal de filtros](screenshots/admin-filter-dialog.png).
- [Creador por pasos](screenshots/wizard-desktop.png).
- [Select custom](screenshots/wizard-select.png).
- [Calendario custom](screenshots/wizard-calendar.png).
- [Toggle de términos](screenshots/wizard-terms.png).
- [Plantilla de email](screenshots/admin-email-step.png).
- [Home móvil](screenshots/home-mobile.png).
- [Perfil nativo](screenshots/profile-desktop.png).
- [Pantalla Mi perfil](screenshots/profile-page.png).
- [Notificaciones nativas](screenshots/notifications-desktop.png).
- [Intro con convergencia orbital](screenshots/intro-desktop.png).

Las pruebas validan el prototipo local. SSO, permisos reales, nómina corporativa, inscripciones concurrentes y entrega de emails requieren el backend descrito en [backend-prompt.md](backend-prompt.md). No se midieron 60 fps en hardware objetivo.
