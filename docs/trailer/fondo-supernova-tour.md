# Fondo continuo de Supernova Tour

9 de octubre de 2026. Las versiones 3D e híbrida reutilizan el fondo del proyecto local **Supernova Tour** desde el primer HTML y durante toda la navegación. La versión original conserva su presentación independiente.

## Procedencia

La imagen fuente es `C:/Users/ignacio.gauna/Desktop/old-work-projects/supernova-experience/frontend/public/fondo-principal.png`. Su copia local se conserva en `public/images/tour/fondo-principal.png`, sin regenerarla ni modificar sus píxeles.

| Propiedad | Valor |
| --- | --- |
| Dimensiones | 1672 × 941 px |
| Tamaño | 1.592.401 bytes |
| Formato | PNG RGB, sin transparencia |
| SHA-256 | `808DE84DF27392BFFDCE0FE4600C7D6E63E555D9CD29E319CC57C5F13BEB21F9` |

La procedencia visual es el repositorio del usuario. La exploración acotada de ese proyecto no encontró un archivo de licencia o atribución para la imagen; no se le adjudica una fuente externa.

El comportamiento proviene de `src/components/layout/NebulaBackground.tsx` y `src/design/redesign.css` de ese mismo frontend: imagen al 108 %, zoom de 2 s, deriva de 18 s, resplandor de 5 s y siete partículas con sus posiciones, tonos y desfases originales. Desde el ajuste del 13 de octubre, el fondo conserva únicamente esos movimientos autónomos: mover el mouse no modifica la imagen ni sus capas.

## Contrato de integración

[`bootstrap.html`](../../src/features/background/bootstrap.html) entrega un único `#tour-nebula-backdrop`, fuera de `#root`. Su CSS crítico se obtiene de [`tour-nebula.css`](../../src/features/background/tour-nebula.css) y queda disponible después de la intro. El primer HTML contiene la imagen, el resplandor y las siete partículas. Un script breve fija la pausa inicial antes de React según la preferencia de movimiento reducido, la visibilidad de la página y la elección de pausa ya guardada.

[`TourNebulaBackdrop.tsx`](../../src/features/background/TourNebulaBackdrop.tsx) se monta una vez junto al router de versiones y retorna `null`: administra el nodo existente. Completa `svg.tour-nebula-stars` con 60 círculos, sin crear otro Canvas ni reemplazar la imagen al terminar la intro. Conserva Mulberry32 con semilla `0x5ce7a3`, el orden de muestreo, los radios de 0,5–1,6 px y las fórmulas de deriva y titileo del Tour. Los frames cambian únicamente `transform` y `opacity`; React no renderiza por frame.

El frontend informa la pausa manual con un evento de `window`, `supernova:background-motion`, y `detail: { paused: boolean }`. Se envía al iniciar el controller y cuando cambia la elección del usuario. El fondo también observa `document.hidden` y los cambios de `prefers-reduced-motion`. Los tres motivos detienen rAF y animaciones CSS; al retomar, el reloj de las estrellas excluye el tiempo inactivo. Alejar el hero mediante scroll no pausa este fondo.

El contenedor histórico `.tour-nebula-parallax` permanece estático para conservar el markup del primer HTML. No tiene transform, transición, variables de desplazamiento ni código de pointer/mouse/hover. El controller sólo escucha preferencias, visibilidad y el evento de pausa manual.

El nodo informa `data-motion="running|paused|reduced"`, `data-star-count="60"` y `data-frame`. Este último publica el contador aproximadamente cada 300 ms activos y permanece congelado al pausar. `data-experience="3d|hybrid"` en `html` habilita el fondo; `original` y `versions` lo ocultan y detienen. Los observadores, listeners y frames se limpian en StrictMode, conservando el nodo estático.

## Continuidad de la intro

En las versiones espaciales, `.intro-backdrop` es transparente y `.intro-stars` se oculta para compartir el mismo cielo. La marca, las órbitas, el SVG de primer frame y el reloj de GSAP siguen en [`IntroArtwork.tsx`](../../src/features/intro/IntroArtwork.tsx). Sus ocho grupos `data-solar-body` representan Tierra, Júpiter, Saturno, Mercurio, Venus, Marte, Urano y Neptuno con paletas naturales, continentes y nubes en la Tierra, cuatro lunas y la mancha de Júpiter, y anillos en Saturno y Urano.

Tierra conserva `data-intro-point="0"` en `(300,157)`, con radio 14, dentro de `viewBox="0 0 480 380"`, para entregar la misma referencia al acercamiento de cámara. Desde el ajuste del 13 de octubre, SVG y renderer mantienen ese encuadre hasta 1,2 s: la entrega ocupa 1,0–1,2 s y el zoom comienza al terminarla. Si el renderer llega dentro de ese intervalo, el fundido usa sólo su tiempo restante; si llega después, la entrega es inmediata para evitar superponer la Tierra del mapa con una pose ya en vuelo. El deadline no se extiende.

El fallback de inicio del host se oculta mientras existe la intro y durante el bootstrap, para que no aparezca un planeta adicional a la derecha del sistema solar. Las cámaras entregan la Tierra única al slot derecho del hero. El artwork no agrega imports relativos: la generación de HTML crítico puede renderizarlo en servidor. El frontend regenera el bootstrap solar después de actualizar el artwork e integra los dos bloques en `index.html`.

La duración normal sigue en 3,6 s; Escape y movimiento reducido conservan sus contratos. Este documento describe la implementación y la procedencia. Los resultados de build, navegador y regresión se registran por separado cuando se ejecutan contra la versión integrada.

[`background-motion.spec.ts`](../../tests/background-motion.spec.ts) agrega la regresión del 13 de octubre: congela las animaciones CSS para aislar la deriva autónoma, mueve el puntero y compara las capas en las dos versiones espaciales. También verifica que las estrellas siguen activas y conservan pausa manual, movimiento reducido y visibilidad. Sus tres casos aprobaron dentro de la regresión final de 42/42 pruebas afectadas; [`compact-solar.spec.ts`](../../tests/compact-solar.spec.ts) también comprobó la continuidad del mismo nodo desde la intro y las pausas de planeta/fondo al bajar. [Validación](../validation.md) registra los comandos y las corridas posteriores al ajuste de cámara.
