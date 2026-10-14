ñ{# Prompt 2 de 3 · Universo 3D, sistema solar y viajes

Adjuntá el [índice y brief común](../../experiencia-3d/README.md), el Prompt 1 enlazado allí y este archivo completo. Ejecutá con **GPT 6.1 Sol · ULTRA**, después de completar la fundación del Prompt 1. Este prompt especifica el resultado completo de la segunda etapa sobre la fundación existente. No deployes, no publiques, no hagas commits ni push.

**Estado del 8 de octubre de 2026:** Prompt 1 implementado y verificado; Prompt 2 implementado y en verificación final de integración. La base auditada y las referencias de código de este pack describen el punto de partida original. El renderer persistente, el contrato, el reloj y los flujos ya construidos se conservan; esta etapa completa materiales, escenas e interacción. El rol trailer aprobó su QA específico y lo registra en [02-implementado.md](02-implementado.md), separado de la evidencia histórica de Prompt 1. El resultado integrado se documenta en [implementacion-02.md](../../experiencia-3d/implementacion-02.md).

## Resultado que tenés que construir

Convertí el fondo de Supernova en un universo 3D continuo. El sistema solar inicial se acerca al planeta del hero; cada sección tiene un destino reconocible; abrir un evento cambia la escala de la experiencia; crear o editar una experiencia entra a una nave y deja al administrador trabajar dentro de su cabina. El efecto premium surge de materiales, profundidad, encuadre, luz y continuidad. Los formularios, tarjetas, permisos de demo y datos locales siguen siendo los existentes.

Usá Three.js mediante el motor elegido en el Prompt 1. Debe haber **un único Canvas/WebGLRenderer persistente** en el host. La presentación inicial y los viajes usan esa misma escena. La UI sigue siendo HTML semántico; el Canvas no contiene textos esenciales, formularios ni navegación exclusiva. Todas las acciones tienen un control DOM que funciona sin WebGL.

## Leé primero y respetá los límites de edición

Leé `AGENTS.md`, `agents/frontend/AGENTS.md`, `agents/trailer/AGENTS.md`, el estado de Git y los archivos relevantes antes de editar. Conservá los cambios previos, los packs originales y las imágenes de eventos. Las capturas sirven para comparar composición; verificá sus textos y datos contra el código actual.

La base auditada para este pack tiene:

- `src/components/CosmicScene.tsx`: planeta y órbitas SVG con Motion, ticket DOM, pausa por visibilidad y parallax discreto. No tiene Three.js.
- `src/features/intro/CinematicIntro.tsx`: intro DOM/SVG + GSAP de 3,4 segundos, export default y props `{ onComplete: () => void }`.
- `IntroLoading.tsx`, `IntroArtwork.tsx`, `introLifecycle.ts` y `bootstrap.html`: primer frame compartido, aislamiento de foco y reloj de `performance.now()`. El fallback actual solo termina por timer en movimiento reducido: incorporá también el deadline normal.
- `index.html`: copia crítica del bootstrap anterior a React. `App.tsx` la retira después del primer commit; evitá que eso borre el reloj antes de capturarlo.
- Capturas de referencia: `docs/screenshots/home-wide.png`, `intro-desktop.png`, `favorites-desktop.png`, `admin-desktop.png` y `docs/trailer/captures/`.

Delegá dos roles con archivos exclusivos y el contrato común acordado antes de editar:

| Rol      | Puede editar                                                                                                                                                       | Entrega                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Frontend | `src/features/universe/**`, el host `src/App.tsx`, `index.html`, integración de `CosmicScene.tsx` y su CSS, dependencias si quedaron pendientes, pruebas del motor | Renderer persistente, materiales, escenas, cámara, eventos de UI y copia final del bootstrap a `index.html` |
| Trailer  | `src/features/intro/**` y `docs/trailer/**`                                                                                                                        | Primer frame solar, overlay de identidad, storyboard aplicado, fallback, intro accesible y cleanup          |

El trailer especifica la escena 3D en este documento; **el frontend implementa su motor**, aunque se trate de cámara, shaders o composición. El trailer no crea otro Canvas, no importa GSAP en el host y no edita `App.tsx`, `index.html`, `package.json` ni `src/features/universe/**`. El frontend copia el bloque entregado de `bootstrap.html` a `index.html` al integrar; no mantiene dos diseños distintos.

El Prompt 3 completa el polish de pantallas y la revisión transversal. En este prompt dejá el viaje unido a las acciones reales mediante los puntos de integración del Prompt 1; no reemplaces el wizard ni reconstruyas la lógica de inscripción.

## Contrato invariable entre host, universo e intro

Reutilizá `src/features/universe/contracts.ts`, creado por frontend en el Prompt 1. No generes tipos duplicados dentro de la intro. El esquema acordado es:

```ts
type UniverseDestination =
  | { kind: "section"; view: AppView }
  | { kind: "event"; eventId: string; category: EventCategory }
  | { kind: "studio" };

type UniverseCommand = {
  requestId: number;
  issuedAtMs: number;
  destination: UniverseDestination;
  reason:
    | "boot"
    | "navigate"
    | "open-event"
    | "close-event"
    | "open-studio"
    | "close-studio"
    | "registration-success"
    | "replay";
};

type UniverseExperienceProps = {
  command: UniverseCommand;
  favoriteSatellites: readonly {
    eventId: string;
    category: EventCategory;
  }[];
  reducedMotion: boolean;
  paused: boolean;
  quality: "auto" | "low" | "balanced" | "high";
  onSettled: (result: {
    requestId: number;
    outcome: "arrived" | "cancelled" | "fallback";
  }) => void;
  onStatusChange: (
    status: "loading" | "ready" | "fallback" | "context-lost",
  ) => void;
};

// Context de presentación liviano, provisto por frontend:
// useUniversePresentation(): { status, command, introStartedAtMs }
// La implementación usa los tipos del mismo contracts.ts.

// Contrato público de la intro, sin cambios:
// export default function CinematicIntro({ onComplete }: {
//   onComplete: () => void
// })
```

`AppView` conserva los valores existentes: `explore`, `registrations`, `favorites`, `admin`, `profile`. `requestId` crece monótonamente. `issuedAtMs` y `introStartedAtMs` usan el mismo origen de `performance.now()`, nunca `Date.now()`. Boot lee `data-intro-started-at`; replay establece un reloj nuevo. El motor que llega tarde busca el punto actual de la coreografía y no la reinicia.

`ready` significa que se presentaron el primer frame y los recursos críticos, no solamente que terminó un import. La intro consume el context para elegir su lámina DOM o revelar el Canvas; su timeout funciona de manera independiente. Ninguna escritura local, navegación, apertura de modal o envío de formulario espera `onSettled`.

Boot termina en `{ kind: 'section', view: 'explore' }`. Replay termina en la sección que estaba activa y conserva su scroll y estado. Al cerrar un evento se vuelve al destino recordado por el host; si se abrió desde el estudio, vuelve a la cabina. La animación no infiere ese destino desde el URL ni lo recalcula por su cuenta.

## Dirección visual elegida

Se consideraron tres enfoques para el universo. Se elige el cinematográfico con la precisión del tercero para navegación y UI. El aporte lúdico se limita a lunas, interacción y pequeñas respuestas; no deforma la marca.

| Dirección                                                                 | Impacto / claridad / fidelidad / rendimiento / marca, sobre 10 | Veredicto                                                                      |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Cinematográfica: negro, materia, luz rasante, cámara continua             | 9 / 8 / 9 / 8 / 9                                              | Columna vertebral; concentra el presupuesto en un destino protagonista         |
| Lúdica: todos los planetas activos, partículas abundantes, gestos grandes | 8 / 7 / 8 / 5 / 7                                              | Tomar satélites e interacción acotada; descartar saturación y cámara juguetona |
| Precisión: mapa limpio, destinos claros, transiciones breves              | 7 / 10 / 10 / 9 / 9                                            | Tomar control, labels DOM y tiempos breves; sumar materiales y profundidad     |

Estos puntajes son juicio de diseño del pack, no resultados de benchmark. Las reglas del skill para spots DOM se adaptan al pedido explícito de una experiencia Three.js: se autorizan transformaciones de objetos y cámara 3D y materiales. En DOM, animá solo `transform` y `opacity`. No sumes blur animado, aberración cromática, flashes blancos, shake ni sonido automático.

### Materia, luz y capas

| Elemento            | Especificación                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Espacio             | Negro `#020205`, sin grandes manchas moradas. La profundidad se obtiene de tres estratos finitos de estrellas y siluetas lejanas        |
| Texto y UI          | Hueso `#F4F0EA`; muted `#B6ACBF`; acento lavanda existente. Manrope y DM Sans del proyecto, sin nueva familia                           |
| Luz principal       | Dirección aproximadamente `(-8, 6, 5)`, cálida `#FFF0DC`, intensidad inicial 2,2 a calibrar contra el renderer elegido                  |
| Luz de borde        | Desde `(6, 2, -7)`, lavanda `#C9A3FF`, intensidad inicial 1,0. No reemplaza el color distintivo de cada planeta                         |
| Relleno             | Ambiente frío de baja energía, intensidad inicial 0,12. La cara en sombra conserva detalle sin convertirse en gris                      |
| Material planetario | Rugosidad 0,75–0,95; metalness 0–0,08; relieve y variación de color suaves. Sin esfera lisa con un único color                          |
| Atmósfera           | Shell fino de Fresnel, opacidad máxima inicial 0,14 y escala 1,025. Dos shells por protagonista como máximo; uno o ninguno en modo bajo |
| Órbitas y anillos   | Espesor delicado; opacidad inicial 0,12–0,32; inclinación específica. Nunca cruzan por encima del texto DOM                             |
| Nave                | Grafito `#14161B`, paneles de titanio, bordes lavanda, ventanales cálidos. Silueta propia con módulos y detalles repetibles             |
| Capas               | Canvas global atrás; scrims estáticos locales; contenido DOM; header y cápsula; modales y toasts; intro DOM al frente                   |

Los valores de intensidad son punto de partida artístico, no garantía de exposición entre versiones de Three.js. Calibrá en el stack ya instalado sin quemar el borde y documentá el ajuste final. El fondo espacial permanece negro tanto con tema claro como oscuro; los paneles y controles conservan el tema existente y su contraste. No elimines el toggle ni cambies la preferencia guardada.

El logo Supernova permanece vectorial/DOM con su forma y colores actuales. No uses su símbolo como estrella que se estira, explota o cambia de degradé. Ningún bloom sobre toda la pantalla. Primero lográ el resultado con materiales y luz; un glow focal opcional de un único pass solo puede agregarse en calidad alta después de medir.

### Geografía visual del sistema

Unidades normalizadas. Las coordenadas siguientes son una maqueta espacial artística, no una simulación astronómica. Un sol pequeño en `(0, 0, -16)`, radio 1,15, ilumina visualmente el mapa inicial; la iluminación de producto sigue la tabla anterior. Los cuerpos lejanos se ocultan o bajan de detalle al llegar a una sección. Evitá tener cinco mundos grandes dibujados detrás de una tabla.

| Destino                 | Centro base `(x,y,z)`                             | Radio            | Superficie y color                                             | Firma reconocible                                                                   |
| ----------------------- | ------------------------------------------------- | ---------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `section/explore`       | `(0, 0, 0)`                                       | 2,15             | Violeta mineral `#34253E`, bandas suaves y borde hueso/lavanda | Planeta del hero; anillo fino inclinado 26°, radio exterior 3,25                    |
| `section/registrations` | `(26, 2, -12)`                                    | 1,95             | Teal profundo `#163337`, filamentos `#8EBDB8`                  | Tres lunas minerales de radio 0,18 / 0,25 / 0,33; órbitas 2,65 / 3,0 / 3,45         |
| `section/favorites`     | `(-24, -1, -16)`                                  | 1,8              | Ámbar oscuro `#3C2D25`, borde `#E7C49B`                        | Anillo fragmentado estable de 18 piezas y satélites vinculados a favoritos visibles |
| `section/admin`         | `(4, 7, -32)`                                     | Envolvente ≤3,4  | Nave grafito y titanio; luz violeta suave                      | Nave vista desde el exterior con una entrada iluminada; la tabla sigue en DOM       |
| `section/profile`       | `(-9, 10, -26)`                                   | 1,55             | Pizarra perlada `#222734`, borde plata `#C9D1DF`               | Un pequeño observatorio orbital; lectura tranquila y plano casi estático            |
| `event`                 | Cerca del planeta de origen, separado ≥7 unidades | 1,3–1,65         | Variante por categoría, con seed de `eventId`                  | Cuerpo propio con un hito superficial y horizonte visible detrás del detalle DOM    |
| `studio`                | Interior local de la misma nave admin             | Cabina 6 × 4 × 8 | Titanio mate, ventanas al negro espacial                       | Dos costillas laterales, piso discreto, portal frontal. Wizard DOM en el centro     |

Las **tres lunas de Mis eventos son decorativas**: no representan cantidad de inscripciones ni acompañantes. Frontend deriva `favoriteSatellites` de favoritos visibles permitidos por `canViewEvent`, excluye borradores y envía hasta ocho IDs/categorías con identidad y orden estables. El engine no lee storage ni reimplementa permisos. Si hay más, un texto DOM muestra el total real. El anillo fragmentado es decorativo. En empty state queda el planeta con su anillo, sin satélites que aparenten eventos guardados. Eventos borrados, borradores no visibles o inaccesibles no se revelan a través de la escena.

El material de cada evento usa una seed determinística de su ID; la identidad no cambia al refrescar, filtrar o volver atrás. La cantidad de asistentes, cupos o registros jamás alimenta una animación que sugiera datos en vivo. No crees un mesh/material nuevo por cada render o cada cambio de formulario.

| Categoría real | Paleta del mundo del evento | Relieve y firma                                                               |
| -------------- | --------------------------- | ----------------------------------------------------------------------------- |
| Música         | `#402638` / borde `#EDB3CD` | Estratos concéntricos y un monolito bajo. No oscilan como si escucharan audio |
| Bienestar      | `#183431` / borde `#A6D5C2` | Continentes minerales suaves; una luna tranquila                              |
| Tecnología     | `#1C293E` / borde `#A5C6EF` | Redes tenues y un arco geométrico, sin HUD o números inventados               |
| Comunidad      | `#3A2B23` / borde `#E8C49E` | Mesetas agrupadas y pequeños hitos de superficie                              |
| Aprendizaje    | `#2F2543` / borde `#C6B3F1` | Surcos finos y un hito vertical de baja altura                                |

Construí el primer resultado con geometría y materiales procedurales propios. Si hacen falta texturas para mejorar el relieve, usá assets locales con licencia documentada, fallback y carga diferida; no dependas de un CDN en runtime. No sustituyas fotografías reales del catálogo por estas superficies. El documento no exige compras ni modelos generados externos.

## Cámara y relación con la UI

Usá una cámara perspectiva con FOV vertical inicial 38°, near 0,1 y far acotado a 140. Mantené `up=(0,1,0)` y horizonte estable. Estos encuadres son destinos de referencia; ajustalos con la relación de aspecto y con el espacio disponible del layout, sin desplazar el formulario fuera de pantalla.

| Encuadre                | Cámara relativa al destino   | `lookAt` relativo    | Centro visual / ocupación                                                                                    |
| ----------------------- | ---------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Mapa solar inicial      | Absoluta `(16,26,58)`        | Absoluto `(0,0,-12)` | Sistema centrado; identidad DOM abajo, sin labels en meshes                                                  |
| Hero desktop            | `(0, 0.4, 11.2)`             | `(-3.1, 0.25, 0)`    | Planeta aproximadamente en `(73%,40%)`; diámetro 28–34% del ancho; izquierda libre                           |
| Hero móvil              | `(0, 0.5, 27)`               | `(-0.6, 0.45, 0)`    | Punto de partida a 390 × 844; planeta en zona del artwork, diámetro 44–56% del ancho; texto en su bloque DOM |
| Mis eventos / Favoritos | `(0, 0.6, 11.6)`             | `(-2.5, 0.35, 0)`    | Planeta a derecha, no detrás de tickets o inputs; desktop 23–28% del ancho                                   |
| Perfil                  | `(0,0.45,10)`                | `(-1.4,0.3,0)`       | Cuerpo discreto al margen del formulario                                                                     |
| Nave exterior           | `(0,1.8,11.5)`               | `(0,0.4,0)`          | Nave al tercio superior/derecho; la tabla administrativa tiene superficie opaca                              |
| Evento                  | `(0,0.5,6.8)`                | `(0,0.1,0)`          | Horizonte en la banda visual del detalle; contenido por encima del scrim                                     |
| Estudio                 | Posición local `(0,1.3,3.4)` | `(0,1.15,-3.5)`      | Ventana y costillas rodean el wizard; sin texto HUD sobre los pasos                                          |

En el código usá tuplas numéricas con punto decimal. Sumá el centro del destino a las coordenadas relativas. Estos puntos de partida se recalculan para ocupar la región decorativa disponible: usar la misma distancia de cámara en portrait que en desktop agranda mucho el planeta. Medí la región DOM al resize y ajustá distancia/offset con FOV y aspecto para conservar el diámetro proyectado previsto. En móviles, los paneles pueden cubrir parte del mundo: la escena no debe forzar scroll horizontal ni extender el documento.

El hero reserva un slot real para el arte y conserva el ticket `TU PRÓXIMA EXPERIENCIA` como botón. Al bajar al catálogo, el planeta se aleja suavemente o queda en un borde, las estrellas pasan a contraste bajo y las tarjetas conservan protagonismo. El scroll es normal; no hay scroll hijacking, pinning de páginas enteras ni una cámara que impida llegar al footer.

En cada transición interpolá cámara y target desde su estado **actual**, mediante una trayectoria curva de tres puntos: salida, punto elevado/lateral, llegada. La distancia y el tamaño proyectado se ajustan al viewport. La curva evita atravesar el cuerpo; nunca transforma un click rápido en un recorrido extra largo por todo el sistema. La duración máxima es fija aunque los destinos estén separados.

## Storyboard definitivo · primer ingreso

Duración total: **3,6 segundos desde el primer frame de bootstrap**, con deadline absoluto ≤4 segundos. Dos compases de referencia a 120 BPM ayudan a ordenar los énfasis; no hay audio ni espera para completar un compás. El DOM de identidad y la cámara son los únicos dos grupos en movimiento protagonista.

| Tiempo absoluto | Escena y cámara                                                                                                                         | DOM / continuidad                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 0,00–0,45 s     | Mapa solar completo en negro: estrella cálida, cinco cuerpos pequeños, nave lejana. Primera órbita casi estática                        | Bootstrap muestra el mismo sistema en SVG, identidad sin deformación, texto accesible `Preparando Supernova`                                  |
| 0,45–1,20 s     | Desplazamiento oblicuo leve para revelar volumen. Enfatizar el mundo explore con su borde lavanda; los demás bajan a segundo plano      | `supernova` y `conectá sin límites` legibles. No agregar porcentajes ni promesas de carga medida                                              |
| 1,20–2,75 s     | Acercamiento curvo al planeta del hero desde el plano general. Estrella principal sale del encuadre; escala y luz mantienen continuidad | Identidad empieza a retirarse con `opacity` y `translateY` de hasta 8 px. La escena solar DOM se desvanece solo si WebGL ya presentó su frame |
| 2,75–3,25 s     | Frenada suave hasta el encuadre final. Rotación del planeta desacelera y se estabiliza                                                  | Hero y header existentes entran con opacity/transform. El usuario distingue CTA y ticket al terminar                                          |
| 3,25–3,60 s     | Cámara estable, planeta vivo con deriva mínima                                                                                          | Overlay de intro sale; `onComplete` una vez; foco a `#main-content` en primer ingreso o al disparador al repetir                              |

El frame de llegada debe ser exactamente el del universo persistente: no desmontar el renderer, no duplicar la esfera en SVG debajo del canvas, no cortar a otro planeta y no pasar por blanco. La lámina solar DOM es fallback y primer frame, no un segundo render 3D.

### Carga lenta, Escape, replay y reduced motion

- Capturá el reloj de bootstrap antes de remover sus nodos. `IntroLoading` y `CinematicIntro` comparten ese reloj y deadline. Si el import tarda 2 segundos, quedan aproximadamente 1,6 segundos: buscá el tiempo correcto, no repitas la secuencia.
- El HTML crítico también deja de bloquear visualmente al cumplir ≤4 segundos aunque React no haya montado. En ese caso conserva información de carga honesta: no se puede prometer interacción antes de que llegue el JavaScript de la app. Al montar React después del deadline, no vuelvas a abrir la presentación.
- Si WebGL sigue cargando al deadline, la intro termina igual y la app queda operable con arte solar/planetario estático. La escena pasa a `ready` cuando realmente puede dibujar; si llega después del boot, ya llega al encuadre final mediante fade ≤200 ms, sin reproducir el acercamiento tardío.
- Si el chunk o un asset falla, usá `fallback`, conservá el fondo negro y el SVG estático y completá la intro. Un eventual estado `Preparando experiencia visual…` describe el trabajo real y no bloquea formularios. No finjas una barra, contador o porcentaje.
- Escape completa la intro de inmediato, cancela su timeline y el viaje pendiente y coloca el mundo en su pose final. No hay botón `Saltar intro`, según las instrucciones actuales del proyecto. No conviertas Escape en un nuevo request que vuelva a mostrar la intro.
- Movimiento reducido: primer frame solar estático y fade total ≤200 ms, sin órbitas, parallax, viaje o estela. Cambiar la preferencia durante el viaje termina el movimiento de inmediato en su destino. El plazo no aumenta si WebGL tarda.
- Replay desde el footer recorre el sistema y llega a la sección actual; no resetea datos, filtros, selección o scroll. Foco vuelve al botón que lo abrió, si sigue conectado. No reproduce siempre el hero bajo la UI de Favoritos.
- La intro usa `gsap.context(..., root)` y cleanup completo; mantiene lazy import, `Suspense` y portal **solo para el overlay DOM**. No mezcla GSAP y Motion sobre el mismo nodo ni toca directamente cámara o materiales del motor frontend.

## Coreografía de navegación y acciones

La navegación cambia el estado funcional inmediatamente. Los tiempos son el límite de la representación visual; no son tiempo de espera para que aparezca una sección o se guarde un dato. Un nuevo request cancela el anterior y retoma desde la pose actual. No encolés viajes.

| Acción / `reason`                                      | Duración visual                             | Movimiento y señal de llegada                                                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `navigate` entre secciones                             | 0,85 s desktop / 0,65 s móvil; máximo 1,1 s | 0–0,15: pequeña separación del origen; 0,15–0,65: arco entre mundos; 0,65–0,85: frenada. El cuerpo de destino prende su rim; UI hace fade corto sin esperar       |
| `open-event`                                           | 0,75 s desktop / 0,55 s móvil               | Acercamiento al mundo asociado al evento y cambio de escala a horizonte. Foto, título, fecha y formulario DOM permanecen accesibles desde la apertura             |
| `close-event`                                          | 0,6 s / 0,45 s                              | Retirada al destino que recuerda el host; restaura encuadre y foco funcional. Escape cierra según el modal existente sin una animación extra que impida salir     |
| `registration-success`                                 | 0,55 s; reduced ≤0,15 s                     | Una baliza local aparece con escala/opacidad, un único aro se expande y se apaga. Cámara casi inmóvil. El pase ya está visible y guardado antes de iniciar el cue |
| `open-studio`                                          | 1,0 s desktop / 0,7 s móvil                 | Desde admin exterior, acercamiento a la entrada iluminada y paso por su umbral; termina en la cabina de esa misma nave. El wizard abre inmediatamente             |
| `close-studio`                                         | 0,65 s / 0,45 s                             | Sale de la cabina al plano exterior de admin; no pierde borrador. Las confirmaciones de descarte siguen perteneciendo al wizard                                   |
| Pasar de paso dentro del wizard                        | Sin viaje de destino                        | Microrespuesta local ≤0,16 s sobre el control DOM. Cámara quieta; no se entra de nuevo en la nave                                                                 |
| Abrir menú, filtros, notificaciones o cambiar favorito | Sin viaje de destino                        | Feedback DOM y, si corresponde, aparición/desaparición acotada del satélite. No cambia vista ni cámara                                                            |

Crear y editar comparten `studio`. **No hay una segunda nave, un nuevo vuelo por cada paso ni una pantalla espacial de espera antes de escribir.** Vista previa de un borrador puede abrir el detalle del evento y regresar a la cabina sin revelar el borrador fuera del flujo admin.

La confirmación de inscripción no usa confetti interminable ni cambia la navegación a Mis eventos automáticamente. No repitas el cue al reabrir un pase ya existente. Si la validación falla, mostrala en el formulario y no dispares una celebración. No renombres mensajes de demo como si se hubiera enviado un email o aprobado acceso servidor.

`registration-success` sigue siendo una orden con su propio `requestId`, aun cuando tenga el mismo destino; no se descarta por igualdad de destino. `onSettled` se emite una vez por orden, incluyendo canceladas o fallback. Callbacks tardíos de una orden anterior no cambian el destino nuevo ni el foco.

## Interacción real y lectura

La profundidad responde al usuario, pero no exige aprender controles de videojuego:

- Mouse en una zona DOM marcada para la experiencia: parallax amortiguado de cámara, máximo 0,12 unidades o 2°; amplitud cero en touch/coarse pointer y movimiento reducido. Al salir, vuelve al encuadre con una curva suave.
- Hover o foco de un control DOM de destino: highlight localizado del cuerpo/luna correspondiente, sin ejecutar navegación. Click, Enter o Space ejecutan el handler de navegación ya existente y generan la orden del host.
- Si agregás targets 3D clickeables o raycasting, deben tener controles DOM equivalentes con label claro, foco visible y el mismo handler del host. No agregues una acción que solo exista dentro del Canvas. Como máximo tres targets auxiliares simultáneos; la navegación principal sigue en el header.
- Drag o rueda no capturan gestos de página ni cambian zoom global. Scroll, selección de texto, edición y swipe móvil funcionan normalmente. El fondo no intercepta clicks sobre inputs, botones, links, tickets, menus o toasts.
- Durante la intro y cualquier modal, apagá la captación de puntero/raycasting del universo. Conservá render y coreografía del fondo si corresponde; abrir un modal no equivale a `paused`.
- Frontend integra el control DOM `Pausar movimiento` / `Reanudar movimiento` en preferencias/perfil. `paused` combina esa elección con visibilidad real: congela ambiente y resuelve cada intención nueva hacia el destino final por snap o fade ≤200 ms, sin viajes pendientes ni un loop oculto. La elección de pausa no demora navegación, pase ni wizard.
- El Canvas decorativo es `aria-hidden`; descripción breve DOM opcional por sección. La experiencia comunica el destino con el título y contenido reales, no con anuncios continuos de `aria-live` por cada partícula.

El frontend hace los controles y su foco; el trailer hace Escape, aislamiento e intro. Una apertura de evento conserva el comportamiento accesible de `RegistrationModal`; un vuelo nunca retrasa el focus trap. El wizard y los paneles de administración mantienen su superficie legible y los labels actuales.

## Rendimiento, resiliencia y cleanup

Estos son presupuestos iniciales de diseño compartidos con el README; deben medirse, no presentarse como FPS garantizados:

| Calidad    | Estrellas máximas | Triángulos visibles | Draw calls máximos | DPR máximo | Efectos                                                                     |
| ---------- | ----------------: | ------------------: | -----------------: | ---------: | --------------------------------------------------------------------------- |
| `high`     |             1.800 |             100.000 |                 60 |        1,5 | Atmósfera y anillos completos; glow focal opcional solo después de medición |
| `balanced` |               600 |              40.000 |                 35 |       1,25 | Un shell por protagonista; sin postFX                                       |
| `low`      |               180 |              18.000 |                 20 |          1 | Meshes simples, una luz principal y detalle mínimo; sin postFX              |
| Fallback   |         Sin WebGL |                   0 |                  0 |        N/A | SVG/DOM estático, negro espacial, flujos completos                          |

Objetivo de medición: viajes fluidos cercanos a 60 FPS en escritorio y al menos 30 FPS en móvil representativo. Capturá tiempo de frame, draw calls, triángulos y escenario/dispositivo; no afirmes haber probado hardware que no tenés. `auto` empieza conservador y puede bajar calidad por frames sostenidos lentos, con histéresis y sin alternar calidad cada frame. No deduzcas potencia de GPU solo por ancho de viewport.

- Estrellas en uno o pocos buffers/instances, seed estable, sin un elemento React por punto. La estela de viaje, si se usa, tiene pool pequeño y lifetime finito; termina al llegar, cancelar o perder contexto.
- Reutilizá geometrías/materiales. Nivel de detalle de cuerpos lejanos y como máximo origen+destino completos durante un viaje. En boot el mapa solar usa versiones pequeñas de bajo costo. No hagas rebuild del sistema por escribir un nombre o marcar términos.
- No actualices estado React en cada frame. Movimiento e interpolación viven en referencias del motor. No leas layout DOM por frame: medí al resize o cambio de layout y cacheá.
- Pausá al ocultar pestaña; reduced motion o pausa voluntaria producen frame estático y no mantienen animación continua. El estado de destino se resuelve mientras está pausado, y el próximo frame visible ya corresponde a la intención más reciente; no reproduzcas segundos acumulados ni una cola de vuelos.
- Import de Three y motor diferido según fundación. La llegada del chunk 3D no detiene el timeout de intro. Una sola inicialización de renderer por sesión; no desmontar por `key={view}`, ni reparentarlo/portarlo al abrir modales.
- Context loss cambia status a `context-lost`, usa lámina visible y termina órdenes afectadas con `fallback`. Recuperación acotada; no crea renderers repetidos ni un loop de reinicios. Flujos de demo permanecen operativos.
- StrictMode: cancelar RAF, timelines, callbacks, observers, listeners, timers, request activo y tareas asíncronas obsoletas al desmontar. Dispose de texturas/materiales/geometrías creadas; no disposar recursos compartidos todavía en uso. Validá doble montaje y navegación rápida.

## Orden de trabajo y criterio de entrega

1. Leé la fundación, confirmá tipos existentes y montá la versión estática de todos los destinos en el único Canvas; conservá fallback y CTA del hero.
2. Frontend construye materiales, sistema y controlador de cámara. Trailer trabaja en paralelo en primer frame/intro, usando el context ya acordado. Ninguno invade archivos del otro.
3. Uní boot mediante reloj compartido y entrada `ready`; integrá la copia crítica en `index.html`. Probá deadline, Escape y chunk tardío antes de agregar partículas.
4. Completá viajes de sección, evento, cabina y cue de inscripción; verificá cancelación y pose actual. Después sumá interactividad acotada y detalle material.
5. Medí presupuestos y bajá calidad antes de sumar postFX. Capturá resultados visuales y corregí composición en desktop/móvil. Entregá al Prompt 3 con los problemas restantes explícitos.

Considerá esta fase completa cuando la UI real y los destinos coinciden al terminar cada acción; el hero y la intro comparten mundo/cámara; los tres destinos solicitados tienen identidad visible; la cabina abre una vez por ingreso al estudio; y todo funciona con reduced motion o fallback. Un video grabado de planetas, un cambio de SVG por otra esfera plana o una transición de opacity entre fondos no satisface la experiencia 3D solicitada.

## Referencias técnicas del pack

La implementación debe comprobar las versiones y APIs del stack instalado. La guía oficial de [instalación de R3F](https://r3f.docs.pmnd.rs/getting-started/installation) documenta su correspondencia con React; [scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) cubre invalidación, render bajo demanda, DPR y recursos compartidos. Las recomendaciones sobre trabajo por frame están en [performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls). Para fallback/error boundary revisá [Canvas](https://r3f.docs.pmnd.rs/api/canvas), y para recursos/renderer la referencia de [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html). Las cámaras, paletas y presupuestos anteriores son decisiones propuestas para Supernova.

## Verificación ejecutable

Ejecutá al terminar la implementación, no como parte de la lectura del pack:

```powershell
npm run build
npm run test:e2e -- tests/e2e.spec.ts tests/catalog.spec.ts tests/theme.spec.ts
```

Agregá cobertura significativa al scheduler/clock y a los viajes dentro de las pruebas disponibles: boot desde timestamp anterior, chunk tardío después del deadline, reduced y Escape, último request prevalece, `onSettled` único, modal que vuelve al origen, replay en otra sección, inscripción que no espera animación, wizard sin viajes entre pasos y fallback sin WebGL. Corré también las nuevas pruebas con el script existente. No agregues tests que solo inspeccionen constantes del storyboard.

Verificá visualmente a 1440 × 900, 390 × 844 y 320 × 740: boot/mapa, hero, Mis eventos con tres lunas, Favoritos vacío y con datos, evento, pase confirmado, nave admin y cabina. Testeá teclado, foco, Escape, scroll normal, input touch, cambio de tema, preferencia reduced, pestaña oculta, navegación rápida y error/context loss. Las capturas de planetas solas no prueban la legibilidad de formularios ni el flujo.

Dejá capturas y un registro corto en `docs/trailer/experiencia-3d/` con comandos realmente ejecutados, resultado, entorno de medición y límites pendientes. En el cierre reportá qué se construyó y qué se probó; no declares integración backend, emails enviados, nómina real, rendimiento en dispositivos no medidos ni publicación.
