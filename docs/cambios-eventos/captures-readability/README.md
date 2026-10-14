# Galería de legibilidad y registro de pases

13 de octubre de 2026. Capturas del build de producción servido localmente bajo `/supernova-eventos/`, generadas con [`readable-events-review.mjs`](../../../scripts/readable-events-review.mjs). El [reporte JSON](readable-review.json) registra tamaños, regiones, QR, continuidad del fondo y errores de navegador.

La galería reúne 72 imágenes en 12 contextos. Cada presentación espacial incluye inicio, Mis eventos, pase con QR, Favoritos, administración, validación de pase y perfil. Original aporta dos controles de su presentación independiente.

| Versiones | Tema | Viewport |
| --- | --- | --- |
| Híbrida y 3D | Oscuro | 1920 × 814, 1280 × 600, 390 × 844 |
| Híbrida y 3D | Claro | 1440 × 900, 320 × 667 |
| Original | Oscuro | 1440 × 900, 320 × 667 |

## Vistas para revisar

- [Inicio híbrido a 1280 × 600](hybrid-dark-1280x600-explorar.png): dos funciones disponibles, una reserva vigente y Tierra pequeña.
- [Mis eventos](hybrid-dark-1280x600-mis-eventos.png): Júpiter a la izquierda del encabezado compacto.
- [Inicio móvil claro](hybrid-light-320x667-explorar.png): fotos, títulos y acciones accesibles por encima del dock.
- [Pase móvil con QR](hybrid-light-320x667-pase-con-qr.png): QR de 112 px, fecha, titular, calendario y acciones.
- [Registrar pase en móvil](hybrid-light-320x667-registrar-pase.png): resultado válido y confirmación de ingreso visible.
- [Favoritos 3D](3d-light-1440x900-favoritos.png): Saturno pequeño a la derecha.
- [Administración 3D](3d-dark-1280x600-admin.png): nave en la región del título, sin cruzar los filtros.
- [Original en escritorio](original-dark-1440x900-original.png).

Las reservas y el registro de ingreso son ficticios y locales. El reloj de negocio se fija al 13 de octubre; el movimiento reducido permite comparar las composiciones. Las capturas no miden FPS, tiempo GPU ni rendimiento en teléfonos físicos. La lectura real del QR inline y descargado, los casos inválidos y la prevención de duplicados se comprueban mediante las pruebas enlazadas en [validación](../../validation.md).

Las galerías anteriores se conservan como historial. No hubo deploy ni publicación.
