# Carga: acercamiento a Tierra y llegada al hero

El script [intro-earth-review.mjs](../../../../scripts/intro-earth-review.mjs) prepara una carga con movimiento reducido, conserva el Canvas y el fondo y repite la presentación con movimiento normal. Instala el reloj Playwright antes de navegar para compartir la misma referencia temporal con GSAP.

La revisión cubre las versiones 3D y 2D + 3D en 1920 × 814, 1440 × 1000, 390 × 844 y 320 × 667. Captura las poses de 100, 900, 1100, 1200, 1800, 2400, 2750, 3250 y 3650 ms.

Las comprobaciones comparan la Tierra de WebGL con la del SVG inicial, revisan que quede dentro del plano lejano y que el fallback esté oculto durante la carga. Luego verifican el acercamiento sin deriva lateral y la llegada al espacio reservado del hero, manteniendo un único Canvas y el mismo fondo. La presentación debe terminar antes de 4 segundos.

Todavía no se ejecutó esta revisión. Este documento no acredita resultados ni rendimiento en dispositivos físicos.
