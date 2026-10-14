# Hero y selector de versiones

Revisión local del 9 de octubre de 2026, con Chrome 155, movimiento reducido y una sola instancia de navegador. El reporte reproducible está en [navigation-review.json](navigation-review.json); el script está en [navigation-review.mjs](../../../scripts/navigation-review.mjs).

Se verificaron 9 combinaciones: Original, 3D e Híbrida, a 1440 × 900, 390 × 900 y 320 × 667. No hubo desbordamiento horizontal, errores de página/consola ni solicitudes fallidas. La captura del menú corresponde al header en cápsula después de usar **Ver eventos**.

En las 9 combinaciones, el selector mostró los tres enlaces con la versión actual marcada; Escape desde un enlace y el botón de cerrar devolvieron el foco a **Cambiar versión**. **Ver eventos** llevó al catálogo y le transfirió el foco. El menú y las acciones del header quedaron dentro del viewport.

| Versión | Ancho | Hero | Inicio del catálogo | Hero y catálogo | Selector flotante |
| --- | ---: | ---: | ---: | --- | --- |
| Original | 1440 | 302 px | 378 px | [Captura](original-1440-hero.png) | [Captura](original-1440-versiones.png) |
| 3D | 1440 | 302 px | 378 px | [Captura](3d-1440-hero.png) | [Captura](3d-1440-versiones.png) |
| Híbrida | 1440 | 302 px | 378 px | [Captura](hibrida-1440-hero.png) | [Captura](hibrida-1440-versiones.png) |
| Original | 390 | 276,5 px | 340,5 px | [Captura](original-390-hero.png) | [Captura](original-390-versiones.png) |
| 3D | 390 | 376,5 px | 440,5 px | [Captura](3d-390-hero.png) | [Captura](3d-390-versiones.png) |
| Híbrida | 390 | 376,5 px | 440,5 px | [Captura](hibrida-390-hero.png) | [Captura](hibrida-390-versiones.png) |
| Original | 320 | 270,3 px | 334,3 px | [Captura](original-320-hero.png) | [Captura](original-320-versiones.png) |
| 3D | 320 | 370,3 px | 434,3 px | [Captura](3d-320-hero.png) | [Captura](3d-320-versiones.png) |
| Híbrida | 320 | 370,3 px | 434,3 px | [Captura](hibrida-320-hero.png) | [Captura](hibrida-320-versiones.png) |

Las medidas de inicio del catálogo se toman antes del scroll. La revisión visual se hizo en modo oscuro; no representa una medición de rendimiento ni una prueba de dispositivos físicos. Los flujos de QR y selección de funciones se verifican en la revisión integrada.
