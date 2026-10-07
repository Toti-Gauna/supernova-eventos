# Validación del frontend

Validado el 7 de octubre de 2026 con Node 22.23.2 y Chrome local en Windows.

- `npm run build`: TypeScript y build de Vite correctos.
- **23 casos E2E aprobados**, mediante la suite integrada y ejecuciones dirigidas de primer frame. Los casos de intro usan reloj real para permitir el avance de GSAP; los demás fijan la fecha de los eventos al 7 de octubre de 2026.
- 21 capturas de home, catálogo, Favoritos, inscripción fullscreen y toast, pase compacto, administración y filtros, creador con controles custom, perfil, notificaciones e intro. Incluye 1440 × 1100, 1440 × 1000, 1920 × 818, 390 × 844 y 390 × 667; sin errores JavaScript.
- Home verificada a 320, 390, 768, 1024, 1440, 1920 y 2560 px: sin desbordamiento horizontal.
- Intro y administración en chunks separados; lector de Excel cargado al importar un XLSX. Fuentes y fotografías servidas localmente.
- 15 capturas nuevas del modo claro/oscuro, controles, menús, administración, estudio, inscripción y pase. `node scripts/theme-review.mjs` terminó sin errores de página. El pase también conserva su calendario y acciones completos en modo claro a 1440 × 818, 1280 × 550, 390 × 667 y 320 × 667.
- Oscuro inicial incluso con sistema en modo claro; cambio por teclado, persistencia después de refresh, `color-scheme` y `theme-color` coherentes. Superficies claras verificadas en popovers, perfil, favoritos, métricas, tabla, modal de filtros, estudio, selects, calendario y toasts.
- Header estable con selector de tema desde 320 hasta 2560 px, sin superposición con el logo ni overflow horizontal. Scrollbars custom de 10 px con thumb redondeado y flechas ocultas en Chrome; reglas thin para Firefox.
- Primera escena comprobada antes de descargar React y durante la espera de GSAP. HTML, fallback y escena comparten artwork y reloj; no hay pantalla de solo logo ni textos de esquina. [QA de movimiento](trailer/qa.md) documenta las pruebas adicionales de handoff, foco, Escape y reduced motion.

## Flujos comprobados

1. Intro en cada refresh: cierre automático, ausencia de «Saltar intro», Escape, replay, regreso del foco y liberación del contenido. Revisión adicional de movimiento: 3456 ms observados; el planeta se mueve y se pausa fuera de pantalla y durante la intro.
2. Movimiento reducido, catálogo de seis experiencias y header flotante redondeado al bajar.
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
