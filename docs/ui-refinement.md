# Refinamiento UX/UI · octubre 2026

## Dirección visual

Tinta `#0c0b14`, superficies ciruela `#171421`, lavanda `#cbb2ff` y texto marfil `#f5f0e9`. Tipografía Manrope para títulos y DM Sans para lectura. La home incorpora un planeta SVG con luz en movimiento, bandas y viajeros orbitales, junto a una experiencia destacada derivada de los datos visibles. Las tarjetas combinan fotografía local, fecha, disponibilidad y una acción clara en una composición compacta.

El modo claro usa fondo marfil `#f8f7fc`, superficies blancas, texto berenjena `#282135` y acento violeta `#7650b5`. El selector de sol/luna está disponible en el header de escritorio y móvil; oscuro es la elección inicial, y una elección explícita se guarda en este navegador. Calendarios, menús, toasts, administración, generador, perfil, favoritos y pase siguen la misma paleta. Las fotografías conservan sus overlays de contraste y la plantilla de email mantiene su diseño propio.

## Interacción

- Header centrado en un grid de columnas laterales iguales, sin cambios de posición ni tamaño del logo al bajar; solo la cápsula decorativa aparece con una transición suave. Hero, navegación y contenido comparten un ancho máximo de 1280 px. En móvil, Explorar, Mis eventos, Favoritos y Admin se presentan en una barra inferior con espacio para el área segura.
- Categorías con indicador animado, favoritos con respuesta de resorte y tarjetas con elevación contenida.
- Planeta con paralaje leve, órbitas animadas, colas de luz y profundidad delante/detrás; se pausa fuera de pantalla, durante la intro y cuando la pestaña deja de estar visible.
- Inscripción en `dialog.showModal()` fullscreen: top layer, fondo inerte, Escape, X y foco restaurado. El shell principal se oculta; el contenido organiza historia del evento y formulario en dos columnas, apiladas en móvil.
- Confirmación con partículas de duración finita, pase con relieve suave al mover el mouse, reflejo inicial y regreso del scroll al inicio.
- Pase fullscreen completo dentro del viewport, con entrada y calendario mensual custom compactos, pie de acciones compartido y relieve del ticket con luz interactiva. Se apilan en móvil. La fecha del evento se resalta según su zona horaria; navegar entre meses no modifica la inscripción.
- Perfil y notificaciones minimalistas mediante la API nativa `popover`. El menú de usuario solo presenta Ver mi perfil y Cerrar sesión; Mi perfil concentra identidad y preferencia de novedades. El cierre de sesión de esta demo oculta la app hasta volver a entrar; no implementa SSO ni elimina eventos o favoritos locales.
- Creador sin header principal ni footer, con volver al extremo izquierdo de su barra de pasos, título pequeño, acciones inferiores persistentes, foco en títulos/errores, preview e indicadores de preparación.
- Favoritos con búsqueda, estados vacíos y eliminación animada; persistencia local y visibilidad coherente con el catálogo.
- Controles propios para selects, fechas/horas, color y checkbox. Popovers nativos con opciones/calendario de Supernova, teclado, Escape y posicionamiento dentro del viewport; no abren selectores de sistema operativo. Inputs de texto y número conservan semántica HTML y usan superficies de la marca.
- TyC desactivado por defecto en nuevos eventos; su toggle revela el editor. Desactivarlo retira las condiciones del evento, y reactivarlo durante la edición recupera el texto.
- Dashboard compacto: filtros únicos por encima de métricas, búsqueda explícita, Más filtros, tags que abren un modal para quitar condiciones, tabla sin título adicional y paginado de hasta diez filas.
- Tostadas compartidas para avisos y errores, renderizadas dentro del diálogo cuando corresponde. El error de términos se limpia al aceptar; los formularios de inscripción presentan su propia validación.
- Intro de 3,4 segundos con convergencia de cuatro luces en el símbolo de Supernova. Aparece en cada refresh, no incluye «Saltar intro» y conserva Escape. GSAP permanece en el chunk lazy.
- Primer frame orbital directamente en el HTML y fallback con el mismo artwork mientras llega GSAP. No hay splash de solo logo ni textos de esquina. El reloj compartido evita reiniciar la entrada al completar la descarga; la intro también adapta sus colores al modo claro.
- Scrollbars lavanda finos y redondeados, sin flechas, en página, diálogos, listas, campos y tabla. Sus colores acompañan el tema; las categorías siguen desplazándose sin chrome visible.

Los controles usan HTML nativo y estilos propios. No se agregó un kit de componentes. `prefers-reduced-motion` desactiva el movimiento decorativo y simplifica las transiciones.

## Componentes y continuidad

- `src/components/ui/NativeDialog.tsx` y `src/hooks/useDialog.ts`: apertura, cierre y restauración de foco.
- `src/features/registration/PersonalTicket.tsx`: representación visual del pase.
- `src/features/registration/EventMonthCalendar.tsx`: calendario de presentación de la fecha del evento.
- `src/components/CosmicScene.tsx`: instalación SVG y vínculo al destacado vigente.
- `src/features/admin/studio.css`: refinamiento del estudio sobre la base administrativa existente.
- `src/styles.css`: tokens, home, navegación, catálogo, estados, agenda y responsive.
- `src/layout.css`: composición compacta, header centrado, popovers, cards y Favoritos.
- `src/interface.css`: header estable, barra móvil, perfil y footer admin compacto.
- `src/components/ui/SupernovaSelect.tsx`, `SupernovaDatePicker.tsx`, `SupernovaColorPicker.tsx` y `controls.css`: controles y menús de la marca.
- `src/components/ui/SupernovaToast.tsx`: feedback compartido dentro del shell o del diálogo nativo.
- `src/features/admin/dashboard.css`: filtros, métricas, tabla y paginado compactos.

Los datos siguen siendo ficticios y locales. El alcance backend y sus contratos permanecen documentados en [backend-prompt.md](backend-prompt.md). Evidencia y capturas: [validation.md](validation.md).
