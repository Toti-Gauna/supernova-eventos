# Capturas y mediciones · Prompt 2

Revisión completada: 58 capturas, 3 recorridos medidos y 0 errores de página/consola.

Comando ejecutado: `node scripts/universe-motion-review.mjs`. URL: `http://127.0.0.1:5173/`. Chromium 155.0.8059.40. Chromium local, viewport emulado; no equivale a hardware móvil físico.

Se recapturaron sólo las16 imágenes de evento, formulario y pase con `UNIVERSE_REVIEW_SCOPE=dialogs` tras ocultar el DOM de origen. Las42 capturas restantes y las3 mediciones live conservan su registro inicial; sus timestamps están en el JSON.

Renderer observado: `ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x000046A8) Direct3D11 vs_5_0 ps_5_0, D3D11)`. Pausa voluntaria persistida para destinos. En mapa solar se pausa el reloj completo de Playwright (rAF, performance y timers), conservando la escena renderizada.

| Escena | Oscuro 1440 | Claro 1440 | Oscuro 390 | Claro 390 | Oscuro 320 | Claro 320 |
|---|---|---|---|---|---|---|
| Hero | [Ver](hero-dark-1440.png) | [Ver](hero-light-1440.png) | [Ver](hero-dark-390.png) | [Ver](hero-light-390.png) | [Ver](hero-dark-320.png) | [Ver](hero-light-320.png) |
| Mis eventos | [Ver](mis-eventos-dark-1440.png) | [Ver](mis-eventos-light-1440.png) | [Ver](mis-eventos-dark-390.png) | [Ver](mis-eventos-light-390.png) | [Ver](mis-eventos-dark-320.png) | [Ver](mis-eventos-light-320.png) |
| Favoritos vacío | [Ver](favoritos-vacio-dark-1440.png) | [Ver](favoritos-vacio-light-1440.png) | [Ver](favoritos-vacio-dark-390.png) | [Ver](favoritos-vacio-light-390.png) | [Ver](favoritos-vacio-dark-320.png) | [Ver](favoritos-vacio-light-320.png) |
| Favoritos con datos | [Ver](favoritos-con-datos-dark-1440.png) | [Ver](favoritos-con-datos-light-1440.png) | [Ver](favoritos-con-datos-dark-390.png) | [Ver](favoritos-con-datos-light-390.png) | [Ver](favoritos-con-datos-dark-320.png) | [Ver](favoritos-con-datos-light-320.png) |
| Nave admin | [Ver](nave-admin-dark-1440.png) | [Ver](nave-admin-light-1440.png) | [Ver](nave-admin-dark-390.png) | [Ver](nave-admin-light-390.png) | [Ver](nave-admin-dark-320.png) | [Ver](nave-admin-light-320.png) |
| Cabina | [Ver](cabina-dark-1440.png) | [Ver](cabina-light-1440.png) | [Ver](cabina-dark-390.png) | [Ver](cabina-light-390.png) | [Ver](cabina-dark-320.png) | [Ver](cabina-light-320.png) |
| Mapa solar | [Ver](mapa-solar-dark-1440.png) | [Ver](mapa-solar-light-1440.png) | [Ver](mapa-solar-dark-390.png) | [Ver](mapa-solar-light-390.png) | [Ver](mapa-solar-dark-320.png) | [Ver](mapa-solar-light-320.png) |
| Evento | [Ver](evento-dark-1440.png) | [Ver](evento-light-1440.png) | [Ver](evento-dark-390.png) | [Ver](evento-light-390.png) | [Ver](evento-dark-320.png) | [Ver](evento-light-320.png) |
| Pase confirmado | [Ver](pase-dark-1440.png) | [Ver](pase-light-1440.png) | [Ver](pase-dark-390.png) | [Ver](pase-light-390.png) | [Ver](pase-dark-320.png) | [Ver](pase-light-320.png) |
| Formulario móvil | — | — | [Ver](evento-formulario-dark-390.png) | [Ver](evento-formulario-light-390.png) | [Ver](evento-formulario-dark-320.png) | [Ver](evento-formulario-light-320.png) |

| Viewport | Calidad final | Calls máximas | Triángulos máximos | Frame mediano ms | Frame p95 ms | Pool estela |
|---|---|---|---|---|---|---|
| 1440 × 900 | balanced | 8 | 9268 | 16 | 30 | 32 → 0 |
| 390 × 844 | balanced | 7 | 9268 | 16 | 30 | 32 → 0 |
| 320 × 740 | balanced | 7 | 9268 | 16 | 24 | 32 → 0 |

Deltas reales entre callbacks del render R3F con motion habilitado: se guarda uno de cada tres frames y el motor descarta deltas >=250ms. Incluye navegación y cue, no es tiempo GPU ni un benchmark de un teléfono. Los detalles del entorno, estados de llegada, cue y errores están en [motion-review.json](motion-review.json).
