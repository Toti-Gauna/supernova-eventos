# Capturas y mediciones · Prompt 3

Revisión completada: 80 capturas y 3 recorridos medidos.

Comando: `node scripts/universe-final-review.mjs`. Alcance: `final` (variable `UNIVERSE_FINAL_SCOPE`). URL: `http://127.0.0.1:5173/`. Chrome 155.0.8059.40. Chrome local con WebGL real y viewport emulado. No es una prueba sobre dispositivos móviles físicos.

Se conservaron 58 capturas aprobadas y se renovaron 22. Timestamps UTC: retenidas 2026-10-09T14:49:57.688Z a 2026-10-09T14:58:05.894Z; renovadas 2026-10-09T15:13:53.551Z a 2026-10-09T15:14:56.198Z. Cada PNG lleva capturedAt y retained en el JSON.

Cada recorrido lleva su timestamp; la primera revisión visual y de recursos se conserva en [revision-01/](revision-01/).

Pausa voluntaria persistida mantiene los destinos estáticos. El cue se captura a 320 ms con el reloj completo (rAF, performance y timers) pausado; se identifica en su metadata. animations:disabled sólo congela DOM. Las mediciones de recorridos usan reloj vivo.

| Escena | Oscuro 1440 | Claro 1440 | Oscuro 390 | Claro 390 | Oscuro 320 | Claro 320 |
|---|---|---|---|---|---|---|
| hero | [Ver](hero-dark-1440x900.png) | [Ver](hero-light-1440x900.png) | [Ver](hero-dark-390x844.png) | [Ver](hero-light-390x844.png) | [Ver](hero-dark-320x667.png) | [Ver](hero-light-320x667.png) |
| mis-eventos | [Ver](mis-eventos-dark-1440x900.png) | [Ver](mis-eventos-light-1440x900.png) | [Ver](mis-eventos-dark-390x844.png) | [Ver](mis-eventos-light-390x844.png) | [Ver](mis-eventos-dark-320x667.png) | [Ver](mis-eventos-light-320x667.png) |
| favoritos-vacio | [Ver](favoritos-vacio-dark-1440x900.png) | [Ver](favoritos-vacio-light-1440x900.png) | [Ver](favoritos-vacio-dark-390x844.png) | [Ver](favoritos-vacio-light-390x844.png) | [Ver](favoritos-vacio-dark-320x667.png) | [Ver](favoritos-vacio-light-320x667.png) |
| favoritos | [Ver](favoritos-dark-1440x900.png) | [Ver](favoritos-light-1440x900.png) | [Ver](favoritos-dark-390x844.png) | [Ver](favoritos-light-390x844.png) | [Ver](favoritos-dark-320x667.png) | [Ver](favoritos-light-320x667.png) |
| evento | [Ver](evento-dark-1440x900.png) | [Ver](evento-light-1440x900.png) | [Ver](evento-dark-390x844.png) | [Ver](evento-light-390x844.png) | [Ver](evento-dark-320x667.png) | [Ver](evento-light-320x667.png) |
| mis-eventos-con-pase | [Ver](mis-eventos-con-pase-dark-1440x900.png) | [Ver](mis-eventos-con-pase-light-1440x900.png) | [Ver](mis-eventos-con-pase-dark-390x844.png) | [Ver](mis-eventos-con-pase-light-390x844.png) | [Ver](mis-eventos-con-pase-dark-320x667.png) | [Ver](mis-eventos-con-pase-light-320x667.png) |
| perfil | [Ver](perfil-dark-1440x900.png) | [Ver](perfil-light-1440x900.png) | [Ver](perfil-dark-390x844.png) | [Ver](perfil-light-390x844.png) | [Ver](perfil-dark-320x667.png) | [Ver](perfil-light-320x667.png) |
| nave | [Ver](nave-dark-1440x900.png) | [Ver](nave-light-1440x900.png) | [Ver](nave-dark-390x844.png) | [Ver](nave-light-390x844.png) | [Ver](nave-dark-320x667.png) | [Ver](nave-light-320x667.png) |
| evento-formulario | — | — | [Ver](evento-formulario-dark-390x844.png) | [Ver](evento-formulario-light-390x844.png) | [Ver](evento-formulario-dark-320x667.png) | [Ver](evento-formulario-light-320x667.png) |
| cabina | [Ver](cabina-dark-1440x900.png) | [Ver](cabina-light-1440x900.png) | [Ver](cabina-dark-390x844.png) | [Ver](cabina-light-390x844.png) | [Ver](cabina-dark-320x667.png) | [Ver](cabina-light-320x667.png) |
| pase | [Ver](pase-dark-1440x900.png) | [Ver](pase-light-1440x900.png) | [Ver](pase-dark-390x844.png) | [Ver](pase-light-390x844.png) | [Ver](pase-dark-320x667.png) | [Ver](pase-light-320x667.png) |
| pase-seis-filas | [Ver](pase-seis-filas-dark-1440x900.png) | [Ver](pase-seis-filas-light-1440x900.png) | [Ver](pase-seis-filas-dark-390x844.png) | [Ver](pase-seis-filas-light-390x844.png) | [Ver](pase-seis-filas-dark-320x667.png) | [Ver](pase-seis-filas-light-320x667.png) |
| pase-cue | [Ver](pase-cue-dark-1440x900.png) | [Ver](pase-cue-light-1440x900.png) | [Ver](pase-cue-dark-390x844.png) | [Ver](pase-cue-light-390x844.png) | [Ver](pase-cue-dark-320x667.png) | [Ver](pase-cue-light-320x667.png) |

Pases con seis filas y poca altura: [1280 × 550, dark](pase-seis-filas-dark-1280x550.png), [390 × 667, dark](pase-seis-filas-dark-390x667.png), [1280 × 550, light](pase-seis-filas-light-1280x550.png), [390 × 667, light](pase-seis-filas-light-390x667.png).

| Viewport | Frame mediano / p95 ms | Calls / triángulos máximos | Recursos tras calentamiento |
|---|---|---|---|
| 1440 × 900 | 16 / 20 | 12 / 9824 | geometries: 23–23; textures: 1–1; programs: 11–11; sceneObjects: 49–49 |
| 390 × 844 | 16 / 18 | 12 / 9824 | geometries: 23–23; textures: 1–1; programs: 11–11; sceneObjects: 49–49 |
| 320 × 667 | 16 / 18 | 12 / 9824 | geometries: 23–23; textures: 1–1; programs: 11–11; sceneObjects: 49–49 |

Deltas de callbacks R3F con movimiento habilitado; el engine conserva uno de cada tres frames y descarta deltas >=250 ms. No mide tiempo GPU. gl.info.memory.geometries/textures, gl.info.programs.length y nodos scene.traverse; dos ciclos de calentamiento y cuatro ciclos medidos en el mismo destino. Una meseta local no demuestra ausencia de fugas.

Errores JS/consola registrados: 0. Detalles en [final-review.json](final-review.json). Las capturas históricas de prompts 1 y 2 se conservaron.
