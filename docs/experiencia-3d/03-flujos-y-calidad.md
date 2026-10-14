# Prompt 3 de 3 · Flujos completos y cierre de calidad

Adjuntá `docs/experiencia-3d/README.md` y este archivo completo; el agente debe leer también los resultados de los prompts 1 y 2 en el repositorio.

**Modelo solicitado:** GPT 6.1 Sol, razonamiento ULTRA. Seleccionalo al ejecutar el prompt; este archivo no modifica la configuración del agente.

**Dependencia:** ejecutar después de las entregas 1 y 2 del [plan](README.md). **Estado al 9 de octubre de 2026: implementado localmente.** Este archivo conserva el prompt ejecutable original; el resultado, las verificaciones y los límites se registran por separado en [implementacion-03.md](implementacion-03.md).

## Prompt para ejecutar

Trabajá sobre Supernova Eventos y terminá la experiencia espacial 3D especificada en `docs/experiencia-3d/README.md`. Completá los flujos, la composición visual y la verificación de las entregas anteriores. Quiero que se sienta como un producto premium: cada sección tiene un destino espacial reconocible, los viajes conservan continuidad y los formularios se pueden usar con tranquilidad mientras el universo acompaña.

No hagas deploy, publicación, push ni commit. Trabajá localmente hasta dejar el resultado implementado, ejecutado y revisable. No agregues backend ni presentes la demo como una integración real. Implementá lo necesario de forma autónoma; resolvé decisiones visuales reversibles con criterio.

### Preparación y ownership

- Leé `AGENTS.md`, `agents/frontend/AGENTS.md`, el plan y las entregas 1 y 2. Revisá el estado de trabajo antes de editar y conservá los cambios existentes.
- Aplicá los skills del rol frontend que hagan falta. `agents/frontend/skills/vertical-slice-planning/SKILL.md` sirve para organizar esta entrega en recorridos verificables; sus referencias se resuelven desde el directorio del skill.
- El rol frontend mantiene `src/features/universe/**`, `src/App.tsx`, `index.html`, UI, estilos, flujos y pruebas. El rol trailer mantiene exclusivamente `src/features/intro/**` y `docs/trailer/**`. Si aparece un ajuste cinematográfico pendiente, delegalo con esos archivos exclusivos y el contrato acordado antes de editar.
- No modifiques los packs originales `codex/`, `trailer-arquitect-claude-code/` ni las instrucciones de los agentes para eludir sus reglas.
- Verificá que las entregas anteriores existen y se ejecutan. Si falta una pieza, completala dentro del ownership acordado; no declares terminada una integración compuesta por placeholders.

### Punto de partida que tenés que preservar

`src/App.tsx` es la fuente de verdad de `view`, `selectedEvent`, `studioActive`, sesión demo, eventos, favoritos e inscripciones. `AppView` admite `explore`, `registrations`, `favorites`, `admin` y `profile`. No conviertas `event` ni `studio` en nuevas vistas de negocio: son destinos visuales que acompañan el modal y el wizard existentes.

`RegistrationModal` usa `NativeDialog` y recibe `onRegister`, que devuelve `Registration | null`; también tiene un estado interno de pase. `AdminPanel` comunica la apertura del creador mediante `onWizardChange(boolean)`. `EventWizard` guarda un borrador local con un debounce de 600 ms. Revisá estos comportamientos en el código actualizado antes de cambiarlos.

Preservá las claves y el contenido de `localStorage`: eventos, inscripciones, favoritos, novedades, sesión, tema y `supernova:event-builder:v1`. No borres datos para simplificar pruebas ni dupliques fuentes de verdad en el motor 3D. El universo recibe identificadores y categoría; no necesita emails, nombres, listas de invitados ni datos de formularios.

### Contrato obligatorio entre host y universo

Usá el contrato compartido definido por frontend en `src/features/universe/contracts.ts`; si ya está implementado, importalo y completá su integración. No crees una segunda variante:

```ts
type UniverseDestination =
  | { kind: 'section'; view: AppView }
  | { kind: 'event'; eventId: string; category: EventCategory }
  | { kind: 'studio' };

interface UniverseCommand {
  requestId: number;
  issuedAtMs: number;
  destination: UniverseDestination;
  reason:
    | 'boot' | 'navigate' | 'open-event' | 'close-event'
    | 'open-studio' | 'close-studio' | 'registration-success' | 'replay';
}

interface UniverseExperienceProps {
  command: UniverseCommand;
  favoriteSatellites: readonly { eventId: string; category: EventCategory }[];
  reducedMotion: boolean;
  paused: boolean;
  quality: 'auto' | 'low' | 'balanced' | 'high';
  onSettled: (result: {
    requestId: number;
    outcome: 'arrived' | 'cancelled' | 'fallback';
  }) => void;
  onStatusChange: (status:
    | 'loading' | 'ready' | 'fallback' | 'context-lost'
  ) => void;
}
```

`CinematicIntro` conserva exactamente `{ onComplete: () => void }`. Usa el puente liviano de frontend `useUniversePresentation(): { status, command, introStartedAtMs }` para consultar disponibilidad y coordinar el encuadre; no recibe otro renderer y no monta otro Canvas. El puente no importa el engine 3D ni GSAP en el host. `issuedAtMs` y `introStartedAtMs` usan el mismo reloj monotónico `performance.now()`: boot hereda el comienzo del bootstrap HTML; replay usa el instante actual, sin reiniciar relojes al resolver un chunk.

Un `requestId` monotónico representa cada intención efectiva del usuario. La intención más reciente reemplaza el viaje anterior. Los callbacks se deduplican por `requestId`; una respuesta vieja no cambia la vista, el foco ni el destino actual. `ready` significa recursos críticos listos y primer frame válido, no simplemente que terminó un import. Las respuestas `cancelled` y `fallback` son estados visuales; nunca revierten una inscripción, favoritos o un borrador.

`favoriteSatellites` es una proyección del host de hasta ocho favoritos visibles, filtrados con las reglas existentes, sin borradores y ordenados de manera estable por ID. Envía solamente ID y categoría. El engine no lee storage ni resuelve permisos; el DOM conserva el total real y la lista completa. Quitar un favorito actualiza esta proyección sin disparar un viaje.

### Slice 1 · Navegación conectada y composición

Conectá el host con el controller sin desmontar el universo al cambiar de sección. El único Canvas global queda fuera de los contenedores con `key={view}`, de `AnimatePresence` que reemplaza vistas y del `Suspense` de la intro. No lo muevas por portales ni cambies su nodo padre para entrar a un modal. Lazy, carga, error y recuperación deben conservar la UI DOM utilizable.

Cada intención actualiza primero el estado funcional y emite el comando visual correspondiente. El usuario no espera una llegada de cámara para navegar, escribir, abrir un modal o recibir su pase:

| Acción | Destino y motivo | Resultado funcional inmediato |
| --- | --- | --- |
| Arranque | Sección `explore`, `boot` | La UI se prepara y el cargador coordina el sistema solar según el plan. |
| Navegación por header, barra móvil o hotspot equivalente | Sección solicitada, `navigate` | Se activa la vista y su navegación seleccionada. |
| Abrir evento o pase existente | Evento con `eventId` y categoría, `open-event` | Se abre el `dialog` nativo y el detalle/pase recibe foco. |
| Cerrar evento | Destino que estaba debajo, `close-event` | Se cierra el modal y se devuelve foco al disparador disponible. |
| Crear, editar o retomar borrador | `studio`, `open-studio` | Se muestra el wizard; la aproximación termina en la nave. |
| Salir, guardar o publicar desde el wizard | Sección `admin`, `close-studio` | Se conserva la operación local y vuelve el dashboard. |
| Registro válido nuevo | El mismo evento, `registration-success` | El pase aparece y los cupos se actualizan inmediatamente. |
| Repetir el inicio desde footer | Sección actual como destino de regreso, `replay` | Se repite el sistema solar y vuelve a esa sección sin cambiar vista, scroll ni datos. |

Conservá un stack de retorno del host para abrir un evento encima del estudio: al cerrar una vista previa administrativa, volvé a `studio`, con el mismo paso y los mismos campos. Al cerrar un evento abierto desde Mis eventos o Favoritos, volvé a ese planeta. No calcules el destino de vuelta como `explore` por defecto.

No hagas que `onWizardChange(false)` durante el cleanup de StrictMode o una navegación tardía emita un viaje fantasma de vuelta a administración. Usá handlers estables, verificá la intención vigente y distinguí un cierre real de una notificación repetida de ciclo de vida. El cambio funcional de sección siempre tiene prioridad sobre callbacks antiguos.

Mantené header normal arriba y cápsula flotante al hacer scroll en desktop; en móvil conservá la navegación inferior actual con Administración y safe areas. Sin sidebar. Las acciones del mapa espacial deben invocar los mismos handlers que la navegación DOM y contar con botones equivalentes accesibles. El Canvas no puede ser el único camino a una sección.

El fondo del universo es negro espacial en los dos temas. Conservá la preferencia claro/oscuro persistida y el toggle: adaptá superficies, textos y controles DOM al tema; no vuelvas blanco el universo ni fuerces el tema guardado. Revisá `theme.css`, `useTheme` y los CSS específicos para quitar fondos de página que tapen accidentalmente el espacio. Para el navegador, la capa exterior espacial y `theme-color` deben resultar coherentes; documentá y actualizá sólo las aserciones de color que cambien por ese criterio.

Validá este slice recorriendo Explorar → Mis eventos → Favoritos → Perfil → Administración, cambiando rápidamente de destino y usando también teclado y navegación móvil. Debe haber un solo Canvas y ninguna transición debe dejar la vista seleccionada en otro planeta.

### Slice 2 · Eventos y confirmación de inscripción

Completá el acercamiento al evento y el retorno definidos por el storyboard de la entrega 2. Conectá el visual al evento seleccionado sin convertir el detalle en contenido dibujado sobre WebGL. Título, fecha, lugar, cupos, términos, datos personales y acciones siguen siendo HTML legible, seleccionable y accesible.

Resolvé la composición del fullscreen nativo: hoy `dialog`, `::backdrop` y `.registration-modal` tienen fondos opacos que taparían el Canvas. Creá una variante para evento/pase con fondo transparente o scrim suave y paneles DOM suficientemente opacos. El planeta y el pulso tienen que verse en márgenes o zonas reservadas sin atravesar los textos. Revisá también las reglas de tema claro. No cambies todos los diálogos pequeños para hacerlos transparentes.

Conservá `showModal()`, el fondo inerte, el trap de foco nativo, Escape, X, scroll interno y restitución de foco de `useDialog`. El Canvas decorativo global puede seguir renderizando detrás del top-layer, pero pierde toda interactividad mientras haya un modal. No actives listeners globales, raycasting o controles de cámara para puentear `inert`. No esperes `onSettled` para abrir el modal o ubicar el foco.

Emití `registration-success` sólo en la rama del host que crea una nueva inscripción válida. Un `onRegister` rechazado, un doble submit, la devolución de una inscripción existente, abrir un pase guardado, descargarlo o cerrar el diálogo no disparan otra celebración. La actualización de datos y el pase se completan aunque el motor esté cargando, pausado o en fallback.

La celebración es una expansión orbital corta y controlada del sistema del evento, coordinada con el pase según el storyboard. No tapa botones, no cambia el foco y no cierra el diálogo. Si se cancela la inscripción, actualizá plazas y estado local con la confirmación actual; no vuelvas a ejecutar el vuelo de celebración.

Preservá: validación del email y nombre, términos opt-in del evento, acompañantes, cupos, eventos privados, finalizados, preview de borradores, descarga de pase SVG y calendario `.ics`, calendario mensual navegable y cancelación. El pase conserva la advertencia de demostración y todas sus acciones visibles en desktop y móvil, incluso en meses de seis filas y alturas pequeñas. No sacrifiques contenido para reservar espacio al planeta.

Validá este slice inscribiendo con acompañante, recargando, abriendo el pase desde Mis eventos, descargando calendario/pase y cancelando. Probá también términos sin aceptar, email inválido, evento sin lugares y preview administrativo: el universo no debe anunciar un éxito inexistente.

### Slice 3 · Nave de creación y conservación de borradores

Administración presenta el exterior de la nave. Entrar al creador es abordarla una sola vez: aproximación, acceso y encuadre de la cabina. Conservá el diseño de cuatro pasos, sus labels, validación, navegación con teclado y barra de regreso. No hagas un vuelo nuevo para cada campo o paso. La cámara se estabiliza dentro de la nave para que escribir y revisar datos resulte cómodo.

El estudio conserva las reglas actuales de ocultar header/footer principales. Formularios y controles son DOM; la cabina aporta estructura visual alrededor. Mientras se escribe o un calendario, select, color picker o preview recibe foco, no hay parallax que mueva el plano de trabajo. No agregues un overlay decorativo con `pointer-events` que impida usar los controles.

El wizard permanece montado durante la vista previa de participante. Retomar borrador, editar y crear usan el mismo destino `studio`; no dupliques eventos ni reinicies estado por una transición. Mantener el debounce y el feedback de almacenamiento no es suficiente si al salir se pierde la última edición: verificá el recorrido actual y asegurá el guardado final cuando corresponda, sin borrar borradores por efectos de animación.

Conservá importación local Excel/CSV, revisión y deduplicación de emails, audiencia ficticia, plantilla de email, portada, validaciones, guardar borrador y publicación demo. Publicar vuelve al dashboard con el mensaje explícito de que los emails no se enviaron. El 3D no inicia red corporativa, autenticación ni envío real.

Validá crear → editar campos → preview → cerrar preview → volver → retomar borrador → publicar. Verificá que el paso, la audiencia, la plantilla y los campos se conservan. Probá publicar con validaciones pendientes y cancelar el viaje mientras el borrador sigue guardándose.

### Accesibilidad, interrupciones y degradación

- Respetá el cambio dinámico de `prefers-reduced-motion`: sin travellings, órbitas continuas, celebraciones expansivas ni parallax. Usá encuadres estáticos y feedback DOM inmediato. No bloquees la navegación esperando una secuencia omitida.
- Ofrecé en Mi perfil el control DOM «Pausar movimiento» / «Reanudar movimiento» con estado accesible y persistencia local independiente del tema. `paused` combina esa preferencia y visibilidad; el ambiente se congela y los comandos se resuelven por pose final/fundido de hasta 200 ms, sin dejar callbacks pendientes ni vuelos en cola. Preservá foco visible, labels, landmarks, skip link y contraste. No anuncies cada frame; los mensajes accesibles describen acciones funcionales, no detalles técnicos del renderer.
- Escape de la intro libera aislamiento y foco aun si falta el chunk o un recurso. No agregues un botón «Saltar intro» en esta entrega: el flujo existente usa Escape, movimiento reducido y final automático. El plazo independiente de salida es como máximo 4 segundos desde el comienzo compartido; con movimiento reducido, como máximo 200 ms. Una GPU lenta no mantiene al usuario encerrado. Replay devuelve foco a su botón y conserva scroll; arranque termina en un punto útil del contenido de Explorar.
- Cambiar de destino durante un vuelo cancela el anterior desde su cámara actual, sin salto a un punto inicial ni cola de viajes viejos. Abrir/cerrar un evento rápidamente, cerrar sesión y volver a entrar siguen funcionando en el último estado confirmado.
- Al cerrar sesión, limpiá selección visual/modal y estudio como hace la demo. La escena puede quedar decorativa y estable en el encuadre de Explorar; no agregues autenticación real ni un planeta de login fuera del contrato.
- Pestaña oculta, fondo inactivo y movimiento pausado frenan el gasto continuo sin pausar validaciones o persistencia. Al retomar, limitá el delta temporal y resolvé el destino vigente; no reproduzcas todo el tiempo transcurrido.
- WebGL no disponible, chunk rechazado, textura fallida y `webglcontextlost` conservan un fondo espacial estático y toda la UI. La recuperación vuelve al destino actual sin recrear vistas o datos. Si no se puede recuperar, mantené fallback utilizable y reintento DOM; no metas errores del motor en la inscripción.
- Recursos, observers, listeners, timers, controles y timelines se limpian en StrictMode. Un nodo no puede tener simultáneamente GSAP y Motion escribiendo su transform. No hay sonido automático.

### Verificación ejecutable y evidencia

La suite existente está en `tests/e2e.spec.ts`, `tests/catalog.spec.ts` y `tests/theme.spec.ts`. `playwright.config.ts` usa `reducedMotion: 'reduce'`, Chromium, `es-AR` y `America/Montevideo`. Conservá esos recorridos de negocio; añadí casos con `page.emulateMedia({ reducedMotion: 'no-preference' })` para verificar la experiencia animada, en vez de creer que la configuración global prueba el 3D.

Agregá pruebas significativas para el contrato y sus fallos observables. Usá estados públicos del host o atributos de QA acotados para esperar destinos/estado del universo; no publiques datos privados ni copies el algoritmo de animación en los tests. Evitá asserts sobre coordenadas de cámara exactas, tiempos de pared fijos y snapshots dependientes de la GPU.

Como mínimo, cubrí:

1. Arranque con chunk lento, Escape antes de `ready`, fallback de import/recurso crítico y regreso utilizable al hero. Conservá la prueba del primer frame en HTML antes de React.
2. Navegación rápida Explorar → Mis eventos → Favoritos: la última vista coincide con el destino final; callbacks viejos no vuelven atrás y sólo hay un Canvas.
3. Abrir evento, Escape durante el acercamiento y retorno de foco al disparador; vuelo pendiente sin capturar Tab o impedir un click DOM.
4. Inscripción nueva con términos/cupos: exactamente una persistencia y una celebración; pase ya existente y rechazo sin celebración. Cancelación libera plazas sin depender del renderer.
5. Preview desde estudio, cierre y regreso al mismo paso/campos; reanudar borrador después de salir/recargar. Detectá viajes falsos por cleanup y pérdidas de la última edición.
6. Movimiento reducido al cargar y cambio a reducido durante un vuelo; pausa/reanudación y cambio de pestaña sin cola antigua.
7. Contexto perdido con `WEBGL_lose_context` cuando la extensión esté disponible, y WebGL bloqueado: formularios y navegación siguen funcionando. Si el entorno no permite la extensión, reportá el caso omitido y validá el fallback por otra vía sin fingir esa prueba.
8. Teclado, diálogo nativo, scroll/foco restituido, temas persistidos y pantalla móvil sin overflow ni acciones del pase fuera del viewport.

Revisá visualmente arranque, hero, Mis eventos, Favoritos, evento abierto, pase y nave. Capturá estados estables y al menos frames intermedios de los viajes en 1440×900 y 390×844; sumá la revisión de 320×667 y alturas bajas para el pase. Usá el plan como criterio: planeta 3D con iluminación/volumen, lunas distinguibles, negro espacial continuo, profundidad controlada y paneles legibles. Una captura con animaciones desactivadas no verifica el movimiento.

Ejecutá `npm run build` y `npm run test:e2e` una vez que la integración esté completa. Si falla un recorrido por un cambio intencional documentado —por ejemplo, el color exterior del tema o la estructura del artwork— actualizá la aserción para ese comportamiento, preservando la capacidad de detectar errores. No borres pruebas, fuerces skips o amplíes timeouts para ocultar problemas de foco, carga o persistencia.

Aplicá los presupuestos y tiers de rendimiento definidos en el plan. Medí localmente memoria/objetos y frames sobre recorridos reales; pausá al ocultarse y bajá calidad si hace falta. Si no pudiste medir una GPU/dispositivo, identificá ese límite. No presentes FPS estimados, cero fugas o calidad móvil como verificados por un build.

Actualizá la documentación de arquitectura y validación con el comportamiento final, los comandos realmente ejecutados y los fallos pendientes. Coordiná con trailer la actualización de su storyboard/QA dentro de `docs/trailer/**`, sin editar su ownership desde frontend. Conservá una separación explícita entre comprobaciones ejecutadas y casos todavía pendientes.

### Cierre esperado

Entregá una experiencia local completa: sistema solar de entrada, hero 3D, destinos diferenciados para las secciones, detalle de evento, confirmación y acceso a la nave; toda la demo conserva persistencia, formularios y accesibilidad. Cerrá con una explicación breve de qué cambió, cómo se probó y cualquier limitación real. Incluí paths de las capturas y documentación. Reiterá que no hubo deploy. No presentes un mock visual o una lista de tareas como la implementación terminada.
