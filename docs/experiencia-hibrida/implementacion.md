# Implementación · versión híbrida y preservación

## Límites y propiedad

`src/versions/VersionRouter.tsx` selecciona la experiencia por el último segmento de la URL. La original es un App independiente, con su presentación recuperada de `c7d93f6`; la espacial usa el App actual, con `variant='3d' | 'hybrid'`. La raíz y `/3d/` conservan el renderer anterior. `/hibrida/` usa `HybridHost`; `/versiones/` ofrece los tres accesos.

El catálogo, registros y permisos de demostración siguen en el App existente. El renderer híbrido no escribe eventos, inscripciones, audiencia ni borradores. Se comparten `UniverseExperienceProps`, `UniverseCommand`, `UniverseDestination`, `UniverseSettled` y `UniverseStatus`, el controlador de última intención y las regiones `data-universe-surface`. La introducción agrega únicamente la prop opcional `variant`; su default mantiene la 3D.

Las versiones recargan el documento al cambiar: sus CSS e intros se cargan por entrada lazy. La original tiene su propio `useTheme` sin activar el fondo espacial. La recuperación y el motor 3D anterior permanecen en `src/features/universe/`.

## Arte y cámara

- `HybridArtwork.ts`: SVG autocontenidos, paleta exacta del loader, anillos posteriores/delanteros, lunas, mapa solar, nave y dos capas de cabina. Texturas `data:image/svg+xml`, sin solicitudes a terceros, URLs remotas ni dependencia del prefijo.
- `HybridWorld.tsx`: planos ilustrados, billboards, lunas, satélites de favoritos y cue. Sólo el destino actual y el anterior durante un viaje son visibles. Las ilustraciones se mantienen cacheadas por URL y reutilizan las mismas variantes de color.
- `HybridCameraRig.tsx`: rig aislado a partir del recorrido verificado, con cámara inicial calculada desde el rectángulo del SVG. Violeta: `(300,157)`, radio `14`, viewBox `480×380`. Recalcula en cada apertura/replay. Mantiene el mapa hasta 1,9 s y hace el acercamiento con distancia exponencial y la misma curva quintic hasta 3,25 s. La aplicación se libera a 3,6 s.
- `HybridExperience.tsx`: un Canvas persistente, readiness después de dibujar, partículas y tres buffers de estrellas; DPR 1,25 por defecto, 1 en baja calidad. Auto reduce estrellas/DPR tras dos ventanas lentas. Movimiento reducido, pestaña oculta, fuera de pantalla y pausa usan render bajo demanda.
- `HybridHost.tsx`: fondo estático de reserva, frontera de errores y segunda entrada lazy para reintentar un módulo rechazado.

Los viajes usan `performance.now()` y request IDs. Una nueva orden parte de la pose actual y cancela el recorrido anterior. Los resultados se deduplican con un registro acotado a 64 IDs. Reencuadrar el formulario como pase sucede antes del cue de 550 ms. Los pasos del wizard conservan el mismo comando de cabina.

Los listeners de scroll, resize, pointer, media y WebGL se limpian al desmontar. El R3F administra geometrías/materiales; el cache de texturas tiene un conjunto finito de variantes locales, compartido entre recorridos. La pérdida/restauración real de contexto conserva el Canvas y recupera el destino actual con una nueva orden. Un error de módulo/React usa el fallback y el reintento explícito del perfil.

## Validación ejecutada

Build TypeScript + Vite aprobado. Galería: 48 capturas y seis recorridos en ambos temas, con viewports 1440×900, 390×844 y 320×667. Cero errores JS/consola/requests fallidas y cero desbordes horizontales. Un Canvas durante navegación, evento, pase y estudio; una inscripción en cada recorrido. Las capturas estáticas registraron hasta 7 draw calls y 8 triángulos; la telemetría confirmó cero `SphereGeometry`.

18 poses adicionales de la intro, en escritorio y móvil, verifican posición y diámetro del planeta a 1,4 s con tolerancia de 2 px. Se capturaron con reloj controlado de Playwright; no son mediciones de FPS ni de rendimiento GPU. El reloj vivo de la galería y sus callbacks también quedan en los JSON. **64/64 E2E integrados aprobados, sin skips**, conservando los 58 anteriores. **18/18 comprobaciones de preview** bajo `/supernova-eventos/`: las tres versiones, ambos temas y tres anchos, más inscripción/pase de la original en sus seis contextos. La original no descarga Three; fuentes/fotos están prefijadas y no hubo errores o requests fallidas. Ver [validación](../validation.md) y [reporte preview](captures/preview/review.json).

Los viewports móviles están emulados en Chrome de Windows. No se verificó hardware móvil físico ni heap JS; los recursos estables/caches finitos no demuestran ausencia absoluta de fugas. Los warnings de tamaño de chunk de Vite corresponden al renderer Three compartido y lazy.
