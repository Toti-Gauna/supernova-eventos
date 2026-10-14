# Prompt 1 de 3 · fundación y primer recorrido

Adjuntá `docs/experiencia-3d/README.md` y este archivo. Ejecutá en este repositorio con **GPT 6.1 Sol, razonamiento ULTRA**. Leé los prompts 2 y 3 como contexto del resultado final; en esta etapa implementá el alcance definido abajo.

## Pedido ejecutable

Implementá localmente la primera entrega de la experiencia espacial 3D de Supernova Eventos. Quiero un hero con planeta 3D real, espacio negro persistente y viajes de cámara hacia Mis eventos, Favoritos, Perfil y Administración. Debe sentirse como el mismo universo, con profundidad, oclusión de anillos y luz cuidada. La UI actual sigue funcionando y mantiene sus datos.

No despliegues, no publiques, no hagas push ni modifiques el workflow de hosting. No hagas commits salvo que se pidan explícitamente. Tomá las decisiones visuales reversibles con criterio; no cierres el trabajo con una lista de propuestas pendientes.

### Antes de editar

1. Leé `AGENTS.md`, `agents/frontend/AGENTS.md`, `agents/trailer/AGENTS.md` y los skills relevantes bajo demanda. Revisá `git status --short` y conservá los cambios del usuario y los packs originales.
2. Leé App, tipos, CosmicScene, EventExplorer, Header, theme/useTheme, lib/assets, IntroLoading, CinematicIntro, introLifecycle, bootstrap.html, index.html, NativeDialog/useDialog, AdminPanel y las pruebas actuales. Revisá las capturas existentes como referencia de marca.
3. La app usa React 19.2, TypeScript y Vite; no tiene Three.js. Instalá versiones compatibles de `three`, `@react-three/fiber` y `@types/three` cuando corresponda. R3F 9 corresponde a React 19; comprobá peer dependencies actuales en documentación/metadata oficial. Drei sólo si un helper concreto lo justifica. Actualizá `package-lock.json`, sin migrar el stack.
4. Delegá el trabajo de intro al rol trailer con `src/features/intro/**` y `docs/trailer/**` exclusivos. Frontend mantiene `src/features/universe/**`, host, `index.html`, CSS compartido y pruebas. Acordá antes los tipos del README. Frontend integra el HTML inicial a partir de la plantilla que entregue trailer; nadie edita el mismo archivo en paralelo.

### Resultado observable de esta etapa

Al iniciar, el hero tiene un planeta esférico real con anillo, superficie, terminador de luz y perspectiva. Al activar «Mis eventos» o «Favoritos», la cámara abandona el planeta actual y llega a un cuerpo distinto. El contenido cambia enseguida y sigue operable durante el viaje. La navegación hacia Administración muestra la nave exterior; la cabina y los acabados cinematográficos se refinan en las etapas siguientes.

El primer recorrido ya es revisable en desktop y móvil; no entregues solamente infraestructura vacía, un cubo de ejemplo o un Canvas negro. Implementá cuerpos de buena base visual que puedan pulirse, sin fingir que el acabado del prompt 2 ya está verificado.

### Arquitectura y archivos

Creá el módulo `src/features/universe/` usando el mapa y el **contrato exacto del README**. Separá el controlador liviano, el contexto de presentación y la entrada lazy al engine. La separación debe dejar Three.js fuera del bundle inicial y GSAP fuera del host.

Un Canvas y un renderer persistentes, montados fuera de `motion.div key={view}`, del `Suspense` de la intro y de los diálogos. No uses `key` por destino en el Canvas ni reparentes su elemento DOM. La carga/error del engine no desmonta la app. El fallback conserva arte orbital negro y legible, con el CTA real al destacado.

Frontend puede modificar `src/App.tsx`, `src/components/CosmicScene.tsx`, Header/EventExplorer para integración, estilos compartidos, `useTheme` sólo donde sea necesario, `src/lib/assets.ts` o un resolvedor dedicado, dependencias, `index.html` y pruebas relacionadas. Trailer puede modificar únicamente la intro y su documentación. No alteres los contratos de inscripción ni de publicación, los modelos de datos o las claves de almacenamiento para introducir la escena.

### Controlador: acciones acompañadas por cámara

- Implementá `UniverseDestination`, `UniverseCommand`, `UniverseStatus`, props, callbacks y el contexto liviano `useUniversePresentation()` del README. Los comandos tienen `requestId` monotónico e `issuedAtMs` basado en `performance.now()`.
- `view`, `selectedEvent`, `studioActive` y estado de registro siguen siendo la fuente de verdad de negocio. El controlador visual deriva intenciones reales y no duplica esas estructuras como un segundo router.
- Ante dos clics rápidos, la última intención gana. Cancelá el viaje vigente y comenzá desde la pose actual; ignorá callbacks viejos. No agregues listeners o timelines por cada cambio de vista.
- Separá resultados de cámara de resultados de negocio. Ni `onSettled` ni el estado `ready` llaman a registrar, publicar, cancelar ni abrir el modal. En fallback, teclado y controles siguen funcionando.
- Acordá y prepará el destino de retorno para un evento abierto desde cualquier sección, incluido preview desde estudio. La integración completa de celebración y retornos del wizard se termina en el prompt 3; los flujos actuales no deben romperse en esta etapa.
- Evitá viajes falsos producidos por el cleanup `onWizardChange(false)` de AdminPanel. Si el contrato del wizard debe ampliarse, coordiná el cambio sólo dentro del rol frontend y preservá los consumidores. No esperes a terminar el viaje para mostrar el estudio.
- Derivá `favoriteSatellites` en el host con las reglas de visibilidad actuales: hasta ocho IDs y categorías de favoritos visibles, orden estable y lista vacía en empty state. El engine recibe este dato acotado; no lee `localStorage` ni duplica catálogo o permisos.

### Mundo 3D y primer lenguaje visual

1. Negro espacial `#020205`, estrellas con profundidad y parallax tenue, semilla determinista y geometría compartida. Reservá regiones de calma detrás del texto; no cubras datos con destellos.
2. Hero: planeta violeta oscuro, anillo inclinado y borde de luz lavanda/hueso. El anillo debe ocluirse correctamente por el planeta. Rotación lenta sólo con movimiento habilitado.
3. Mis eventos: planeta mineral teal con tres lunas decorativas en distintos planos; esos objetos no cuentan inscripciones.
4. Favoritos: planeta ámbar con anillo fino. Perfil: cuerpo perlado pequeño. Nave administrativa: silueta coherente con casco, cabina y baliza; respetá la identidad final del prompt 2.
5. Cámara perspectiva con poses/destinos definidos en datos, un controlador y tiempos del brief. Ajustá la composición al viewport: planeta lateral en desktop y región decorativa acotada en móvil, sin empujar títulos fuera de pantalla.
6. Las posiciones, escala y look-at deben dar continuidad espacial. No simules el viaje cambiando materiales de una esfera fija mientras fundís la página. La cámara recorre una curva breve entre cuerpos estables.
7. Usá `useFrame` y refs para cámara/objetos; `delta` y/o reloj monotónico, sin `setState` por frame ni nuevas geometrías, materiales o vectores en el loop. Motion anima sólo UI DOM; GSAP sólo intro. Nunca dos motores sobre el mismo nodo/propiedad.

Las reglas de `transform`/`opacity` siguen vigentes para DOM. En el engine, la extensión pedida por el usuario autoriza transforms de objetos y cámara, más uniforms acotados para superficie/luz; enumerá estas excepciones, no animes propiedades de layout para fabricar el 3D.

### Primer frame, intro y carga

Conservá el default export `CinematicIntro` y `{ onComplete: () => void }`. Su estado adicional llega por el contexto liviano del host, sin importar el engine. Trailer actualiza artwork/fallback y plantilla bootstrap; frontend sincroniza `index.html`.

En este paso, conectá la escena persistente con el ciclo actual de intro sin crear otro Canvas. Prepará el panorama del sistema solar y la llegada a `explore`; el storyboard completo se implementa con el prompt 2. El reloj de bootstrap se conserva al montar React y al llegar los chunks. `boot` continúa desde el elapsed correcto; un chunk tardío no reinicia la apertura ni tapa el hero ya operativo.

`ready` se emite luego de disponer de los recursos críticos y presentar el primer frame 3D, no al resolver el import. `loading`, `fallback` y `context-lost` son estados honestos. No muestres porcentajes estimados o barras basadas en timers. Recursos secundarios se cargan después.

Establecé desde esta etapa el deadline compartido de intro: hasta 4 s, reduced motion hasta 200 ms y Escape. `IntroLoading` también debe tener salida en modo normal, aunque GSAP o el engine no lleguen. El HTML inicial vence su bloqueo visual sin depender de React. No agregues «Saltar intro». Si React todavía no descargó, mantené información de carga honesta; no prometas acceso a una app que aún no existe en el DOM.

Replay empieza un reloj nuevo y llega a la sección que estaba activa. Conservar tab, datos y scroll; no llevar siempre a `explore` ni montar otro renderer.

### DOM, temas y modal

Mantené el header normal/cápsula, barra móvil y scroll natural. HTML semántico, skip link, labels, foco visible y navegación por teclado. Conservá el CTA al destacado de CosmicScene; la región visual puede registrarse con ResizeObserver/IntersectionObserver para componer la cámara y pausar trabajo fuera de pantalla, con cleanup.

El espacio permanece negro aun si hay `supernova-theme-v1=light`. El tema sigue aplicando a superficies, controles y popovers. No sobrescribas la preferencia: ajustá los fondos y el alcance de tokens necesarios para evitar flashes claros. En el resto del producto mantené contraste y color-scheme coherentes.

El Canvas queda detrás del diálogo nativo. Prepará estilos específicos que dejen visible su región decorativa con scrim translúcido y paneles legibles; no intentes superar el top layer por z-index. No reemplaces `showModal()` ni el hook de foco y no muevas el Canvas a un portal. Desactivá la interacción de fondo cuando un diálogo está abierto. El pulido de detalle/pase pertenece al prompt 3.

### Calidad adaptativa y fallo controlado

Aplicá los perfiles `high`, `balanced`, `low` y `auto` con los presupuestos del README. El nivel inicial es conservador; reducí calidad por medición con histéresis y sin remount. Usá instancing/Points, compartí recursos y limitá el número de cuerpos visibles.

Agregá en las preferencias DOM de Mi perfil «Pausar movimiento» / «Reanudar movimiento», con estado accesible y preferencia local independiente del tema. `paused` combina esa preferencia con visibilidad: congela ambiente y resuelve comandos nuevos con pose final/fundido de hasta 200 ms, sin bloquear `onSettled` ni encolar viajes. Ocultar la pestaña detiene el loop; al volver se dibuja el destino vigente sin recuperar vuelos antiguos.

Renderizá bajo demanda en escenas estáticas/reduced. Los viajes invalidan mientras están activos y se detienen al completarse; no dejes un rAF extra permanente detrás del scheduler del renderer. Volver de la pestaña no avanza con un delta enorme ni reinicia la intro.

Sin WebGL, con chunk fallido o contexto perdido: fallback visual, controles operables, request resuelto y sin bucle de reintentos. Declarar propiedad/cleanup de geometrías, materiales, texturas, listeners y timers. No disponer cachés compartidas durante cada viaje.

Para archivos nuevos de `public/`, resolvé rutas con `import.meta.env.BASE_URL`. El helper actual sólo contempla `/images/`; no inventes URLs absolutas `/models/...` que se rompan en `/supernova-eventos/`.

### Verificación ejecutable y entrega

Ejecutá y corregí `npm run build`. Corré `npm run test:e2e` para regresiones del host/intro, catálogo, tema y navegación; si una aserción visual cambió por el fondo negro pedido, actualizala con intención documentada, sin eliminar cobertura funcional.

Agregá comprobaciones significativas de esta entrega: viaje rápido Mis eventos → Favoritos termina en Favoritos; Canvas/renderer no se recrean por navegación; reduced motion no vuela; fallback permite abrir un evento; intro/chunk tardío libera el foco dentro del deadline. Respetá el reloj de los tests existentes: fecha fija de negocio y tiempo monotónico de animación son asuntos distintos.

Revisá localmente 320, 390, 768 y 1440 px, superficies claras/oscuras y scroll, con movimiento habilitado para observar cámara real. Registrá errores de consola y capturas del hero y dos destinos. Si una prueba no puede ejecutarse por el entorno, reportá el bloqueo concreto y completá lo restante; no afirmes que pasó.

Entregá cambios funcionando, resumen de archivos/decisiones, pruebas efectivamente ejecutadas y riesgos concretos. Actualizá en `docs/` el registro de implementación con qué quedó terminado y qué corresponde a los prompts 2 y 3, sin generar prompts adicionales. Todo queda local, sin despliegue.
