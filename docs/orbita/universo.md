# Órbita · universo, nebulosa y planetas

El fondo espacial, los planetas y la nave pasan del violeta/lila de Supernova a la noche de Órbita: azul marino dominante, brillos cian y azul, y violeta o magenta solo como acentos. Fuente de verdad: [README.md](README.md) (paleta y colores por categoría).

No cambian la geometría, las posiciones, las poses de cámara, los tiempos, el comportamiento con movimiento reducido ni los identificadores internos (`supernova:*`, `supernova-*`, nombres de objetos three.js).

## Nebulosa (`src/features/background/`)

- **Imagen nueva:** `public/images/tour/fondo-orbita.webp` (1672 × 941, WebP calidad 0,95, unos 140 KB). `fondo-principal.png` (1,6 MB) se conserva sin tocar y deja de usarse.
- La imagen se recoloreó una sola vez, fuera de línea, en Chrome headless: cada píxel pasa a OKLCH, se conserva su luminosidad y se remapea el tono. El índigo del cuerpo pasa a azul marino (≈ 260°, como `#030B1C`/`#0B1730`), los violetas de la nebulosa a azul y cian (≈ 235–246°, como `#1EB2F5`) y solo los núcleos más rosados quedan violeta y magenta. El croma de las zonas oscuras baja un 20 % para que el navy no sature. No hay `filter` permanente nuevo: se mantiene el `brightness(.85) saturate(1.05)` que ya tenía.
- `tour-nebula.css`: fondo `#030b1c`, brillo inferior azul `#2348DE`, brillo lateral cian `#1EB2F5`, apenas magenta `#E0479E` a la derecha y sombra en navy. Las partículas usan cian `#4EC5FF` (3), azul `#4D7CFF` (2), violeta `#7B6CF6` (1) y magenta `#E0479E` (1); `bootstrap.html` cambió sus `data-tone` en consecuencia. Estrellas `#eef5ff`.
- `index.html` se regeneró con `node docs/trailer/sync-bootstrap.mjs --write-index`; la imagen sigue usando `%BASE_URL%`.
- `html` y `body` en modo universo siguen en `#020205`: `tests/universe.spec.ts` lo verifica y la nebulosa los cubre por completo.

## Planetas por categoría

Los planetas de evento conservan su cuerpo y su textura (Mercurio, Venus, Marte o Urano según el id, igual que antes) y se tiñen hacia el color de su categoría. El shader conserva la luminancia de la textura, así que cráteres, bandas y terminador siguen visibles; el 86 % del tono pasa a la categoría (`CATEGORY_TINT_MIX`). El borde, la atmósfera, el hito y la señal de inscripción usan una variante clara del mismo color.

| Categoría | Antes (código) | Ahora | Borde |
| --- | --- | --- | --- |
| Música | rosa `#edb3cd` / `rose` | magenta `#E0479E` | `#F59BCD` |
| Bienestar | verde menta `#a6d5c2` / `teal` | verde `#18C39A` | `#8DE8CF` |
| Tecnología | celeste `#a5c6ef` / `blue` | cian `#1EB2F5` | `#9ADCFF` |
| Comunidad | ámbar `#e8c49e` / `amber` | violeta `#7B6CF6` | `#BDB4FF` |
| Aprendizaje | lila `#c6b3f1` / `violet` | azul `#4D7CFF` | `#A9C0FF` |

- La tabla vive en `CATEGORY_TINTS` (`src/features/universe/scene.config.ts`) y la usan el planeta 3D (`Planet.tsx`), las lunas de favoritos y el planeta ilustrado de la versión híbrida (`HybridWorld.tsx`).
- La señal de inscripción híbrida usa las paletas `rose`, `teal`, `cyan` (nueva), `violet` y `blue` de `HybridArtwork.ts`, recoloreadas a la categoría.
- Tierra, Júpiter, Saturno y Neptuno (secciones), el Sol, las lunas decorativas y el mapa solar siguen naturales. Las lunas genéricas pasan de perla lila a gris neutro.

## Nave, luces y escenas

- Luz de relleno de la escena 3D: `#c9a3ff` → `#62bfff`. Partículas de viaje: `#d8cced` → `#bfe6ff`.
- Nave 3D: acento cian `#4EC5FF` con emisión `#1EB2F5` (la geometría sigue llamándose `lavender`) y luces de cabina `#6cc9ff`.
- Nave y cabina ilustradas: acero neutro, motor y filetes cian. El rótulo dice `ÓRBITA · FLIGHT DECK`.
- Mapa orbital de apertura (`MAP_ART`): mismos colores que el mapa de la intro (`#1EB2F5`/`#BFE6FF`, línea y punto `#4EC5FF`, punto magenta `#E0479E`, nave `#76829A`/`#9FB3D1`), así el traspaso de 1,0–1,2 s no cambia de color.
- `CosmicScene` (portada de la versión original y respaldo del hero): planeta azul noche con borde cian, órbitas cian/azul y el satélite secundario como único punto magenta.
- `universe.css`, `hybrid.css` y `cosmic-scene.css`: textos sobre el espacio con `#eef5ff`/`#9fb3d1`, vidrios en navy y overlays de diálogos en `#030b1c` con alfa. En tema claro, el resumen de resultados, la sección `EVENTOS` de la marca y el contador de cada fase quedan legibles sobre el espacio.

## Verificación

Capturas en [`captures/universo/`](captures/universo/) (Chrome headless con SwiftShader, movimiento reducido salvo en el traspaso):

- `3d-*`, `hibrida-*` y `original-*`: 1440 × 900 en tema oscuro y claro, y 390 × 844 en oscuro.
- `3d-planetas-por-categoria.png`: los cinco planetas de evento en primer plano. `3d-evento-tecnologia.png` y `hibrida-evento-musica.png`: el viaje al planeta de un evento.
- `hibrida-traspaso-1100ms.png` y `3d-traspaso-1100ms.png`: reloj congelado en t = 1,1 s de la intro repetida. A la izquierda, el mapa de la intro; a la derecha, la escena sola. Coinciden la posición y los tonos.
- `hibrida-admin-nave.png` y `hibrida-estudio-cabina.png`: nave y cabina ilustradas.
