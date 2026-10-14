# Prompt 2 · universo y viajes

Implementación local del [prompt 2](../trailer/experiencia-3d/02-universo-y-viajes.md), sobre la fundación del prompt 1. Sin deploy, publicación ni push. Fecha: 8 de octubre de 2026.

## Qué cambió

El único Canvas persistente comparte la apertura solar y el recorrido de la app. Los planetas tienen materiales procedurales más suaves, terminador de luz, atmósfera fina y rasgos propios: anillo violeta en Explorar, tres lunas en Mis eventos, dieciocho fragmentos y hasta ocho satélites de favoritos, observatorio en Perfil. Los mundos de eventos mantienen identidad determinista por ID y categoría.

La nave tiene casco, proa iluminada, puerta y cabina. Crear, editar o retomar atraviesa su entrada una vez; cambiar pasos del wizard conserva la cámara. Las tres capas de estrellas y el pool de partículas de viaje tienen límites por calidad. No se agregaron modelos, texturas remotas, postprocesado ni sonido.

Los encabezados reservan una región para el planeta sin superponer texto. El detalle del evento incorpora una banda de horizonte medida por el motor; fotos, condiciones y formulario siguen siendo HTML. La capa DOM de origen queda visualmente oculta mientras el diálogo está abierto, de modo que su texto no atraviese las superficies transparentes del evento y del pase. La inscripción válida guarda el pase inmediatamente y emite un único cue; falla de validación y reapertura del pase no lo repiten. El pase conserva su layout compacto.

El reloj compartido divide la apertura en mapa, aproximación y frenado. El shell empieza a aparecer a los 2,75 segundos si WebGL está listo; permanece inerte hasta terminar. Bootstrap precarga Manrope 400 local antes de React. El plazo de cuatro segundos, Escape y reduced motion conservan prioridad sobre los chunks demorados.

Hover y foco de controles con `data-universe-target` cambian una luz localizada sin emitir navegación. El parallax queda dentro de la región visual, limitado y desactivado en diálogos, intro, touch, pausa y reduced motion. Replay desde el footer excluye la pausa por región fuera de pantalla desde su primer commit.

## Contratos y recursos

No se amplió `AppView` ni se modificaron `UniverseExperienceProps`, `UniverseCommand` o `UniverseSettled`. App mantiene eventos, reservas, favoritos y borradores locales. La telemetría DOM de desarrollo registra cámara, calidad, frames, draw calls, triángulos, cue y resoluciones; no se agrega a la interfaz de producto.

Presupuestos: low 180 estrellas/DPR 1; balanced 600/DPR máximo 1,25; high 1800/DPR máximo 1,5. Auto parte de balanced y baja a low después de dos ventanas lentas consecutivas, sin remontar el Canvas. Pausa, reduced motion y fallos mantienen las acciones DOM disponibles.

## Verificación

`npm run build` aprobado con TypeScript y Vite: 2134 módulos, motor lazy de **260,42 kB gzip**, intro lazy de 28,42 kB gzip. No se agregaron assets externos al universo; la fuente crítica existente pesa 14,11 kB. Vite conserva su advertencia por el motor de 961,67 kB minificado; permanece fuera del bundle inicial y debajo del presupuesto de 450 KiB gzip.

**48 casos E2E diferentes aprobados.** `npm run test:e2e` terminó con 47 aprobados y un selector antiguo ambiguo: `bootstrap.locator('svg')` encontraba el mapa y el nuevo símbolo de marca. Se corrigió a `.intro-orbital-map`; la repetición dirigida aprobó ese caso. No se cambió la implementación para esconder una falla de producto. La suite cubrió catálogo, temas, inscripciones, pases, calendario, wizard, permisos demo, Canvas persistente, destinos interrumpidos, resolución única, foco, replay, pausa, reduced motion, visibility, touch y fallos de chunk/contexto.

```powershell
npm run build
npm run test:e2e
npm run test:e2e -- tests/theme.spec.ts --grep "la escena orbital" --reporter=list --output=test-results/prompt-2-bootstrap
node scripts/universe-motion-review.mjs
node docs/trailer/experiencia-3d/intro-check-02.mjs
node scripts/universe-preview-check.mjs
```

La [galería](captures/prompt-2/README.md) contiene 58 capturas a 1440 × 900, 390 × 844 y 320 × 740, con ambos temas: mapa, hero, Mis eventos, Favoritos vacío/con datos, evento, formulario móvil, pase, nave y cabina. Los destinos usan el Canvas real pausado; el primer frame solar conserva el SVG liviano sobre esa escena, con su reloj congelado. La apertura tiene ocho capturas adicionales y sus tiempos en el [registro trailer](../trailer/experiencia-3d/02-implementado.md).

Las tres mediciones con movimiento habilitado usaron Chrome headless 155.0.8059.40 en Windows, renderer ANGLE / Intel Iris Xe / D3D11, DPR 1. Son viewports emulados del mismo escritorio.

| Viewport | Calidad | Calls máximas | Triángulos máximos | Delta mediano | Delta p95 | Pool de viaje |
| --- | --- | --- | --- | --- | --- | --- |
| 1440 × 900 | balanced | 8 | 9268 | 16 ms | 30 ms | 32 → 0 |
| 390 × 844 | balanced | 7 | 9268 | 16 ms | 30 ms | 32 → 0 |
| 320 × 740 | balanced | 7 | 9268 | 16 ms | 24 ms | 32 → 0 |

Son intervalos reales entre callbacks de render de R3F, muestreados cada tres frames y excluyendo deltas de 250 ms o más; no son tiempo GPU ni una certificación de 60 FPS. Se observaron picos de 139/123/113 ms respectivamente. El [JSON](captures/prompt-2/motion-review.json) conserva entorno, viajes, presupuesto, cue, resoluciones y errores. Cámara real, pool apagado al llegar, inscripción sin segundo cue, mismo Canvas y callbacks sin duplicados se verificaron en las tres mediciones. Las 58 capturas, incluido el mapa solar completo, registraron máximos de **18 draw calls y 15.036 triángulos**; todas usaron balanced y respetaron su presupuesto. No se midió hardware móvil físico ni CPU 4×.

La revisión visual encontró texto de la sección de origen detrás del evento/pase transparente. Después del arreglo se recapturaron los 16 estados afectados, conservando las 42 capturas restantes y los tres recorridos iniciales en su JSON. El modo dirigido `UNIVERSE_REVIEW_SCOPE=dialogs` registra esa segunda revisión con timestamp. **11/11 pruebas afectadas volvieron a aprobar**, incluyendo retorno/foco, preview/borrador, nueva inscripción/cue, touch, diálogo nativo, pase/calendario y contraste claro.

`node scripts/universe-preview-check.mjs` aprobó **18 verificaciones** del build local bajo `/supernova-eventos/`: ambos temas a 1440, 390 y 320 px, tres destinos, WebGL, mismo Canvas, espacio negro, fotografías y fuente crítica con URL bajo el prefijo. Sin errores HTTP, requests fallidos ni errores JavaScript. El [reporte de producción local](captures/prompt-2/production-review.json) se guardó separado del histórico del prompt 1. Bootstrap e `index.html` quedaron sincronizados y `git diff --check` no detectó errores de whitespace.

## Cierre previsto en Prompt 3

El prompt 3 conserva el acabado final de interacción y flujos. En 320 px, las superficies claras del wizard cubren gran parte de las nervaduras: el marco sigue visible, pero la composición de cabina móvil necesita una jerarquía más expresiva sin reducir la legibilidad. El pase mantiene la composición compacta existente; su integración visual definitiva también corresponde al prompt 3.

La app sigue siendo una demo local, sin backend, SSO, envío de emails ni nómina real. No se deployó, publicó, hizo commit ni push.
