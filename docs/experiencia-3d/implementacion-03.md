# Prompt 3 · flujos y cierre de calidad

Implementación local del [prompt 3](03-flujos-y-calidad.md), sobre las entregas 1 y 2. Fecha: 9 de octubre de 2026. Sin deploy, publicación, commit ni push.

## Resultado

El pase reserva una región espacial a la derecha de su encabezado. Al confirmar, el planeta se encuadra allí antes del pulso de 550 ms; la cámara permanece quieta durante la señal. Abrir un pase existente usa la misma composición sin repetir la celebración. El calendario y las acciones conservan su lugar en el layout compacto.

La nave exterior tiene una proa más reconocible e iluminada. Las nervaduras interiores adaptan su ancho al viewport y aparecen en los márgenes de 18 px del creador móvil. La revisión visual afinó su metal grafito y luces, segmentó los postes y movió la viga superior detrás del header para dejar libre el título. Crear, editar y retomar comparten cabina; cambiar de paso y editar campos no inicia otros viajes.

La reserva local usa una guarda síncrona: dos submits en el mismo turno crean un pase, descuentan plazas una vez y emiten una sola confirmación. Cancelar repetidamente tampoco libera plazas adicionales. El wizard conserva el debounce de 600 ms, pero guarda su última edición antes de salir, en `pagehide` y al desmontarse. Publicar o guardar el borrador explícitamente cancela esa recuperación temporal para no resucitar un borrador ya terminado.

Abrir un evento desde el catálogo scrolleado excluye inmediatamente la pausa del hero fuera de pantalla. El universo conserva pausa voluntaria, visibilidad de pestaña y movimiento reducido. La intro tiene un boundary propio: si su import falla, libera la app, el foco y el bloqueo del documento; también cubre replay después del rechazo.

## Recuperación

Perfil ofrece «Reintentar ambiente» cuando la escena está en fallback o perdió contexto. La recuperación de contexto y shaders conserva el renderer y Canvas; cada click habilita un intento, sin bucles. La restauración manual tiene un límite de 1,5 segundos. Si vuelve `ready`, el controlador crea una solicitud nueva para el destino actual con encuadre directo: no revive una intención anterior ni vuelve a resolver una solicitud ya cerrada como fallback.

Una excepción que desmontó el árbol React del renderer requiere recrear ese árbol mediante el reintento explícito. Una entrada lazy rechazada tiene una segunda entrada estática `UniverseExperience?retry=1`, resuelta por Vite tanto en desarrollo como bajo el prefijo de producción. Son dos entradas pequeñas que comparten Three/R3F y la escena; no se duplican esas dependencias. Persisten los datos locales, formularios y navegación. Una falla persistente vuelve al fondo estático.

## Verificaciones ejecutadas

`npm run build` aprobado: 2136 módulos. El bloque 3D compartido pesa **258,36 kB gzip**, la entrada normal **3,48 kB gzip** y la alternativa **3,50 kB gzip**. La intro conserva **28,42 kB gzip**. Vite avisa que el bloque compartido de 954,97 kB minificado supera 500 kB; sigue fuera del bundle principal y debajo del presupuesto de 450 KiB gzip. No se agregaron GLB, texturas remotas, sonido ni postprocesado.

La [revisión trailer](../trailer/experiencia-3d/03-cierre.md) aprobó ocho frames de viajes con movimiento real y continuidad del Canvas, sin HMR ni errores inesperados. La apertura normal liberó en 3623 ms a 1440 y 390 px; el fallback lazy en 3655 ms. Con CPU 4×, replay normal liberó en 3528 ms y reducido en 187 ms. Ese chequeo detectó que un timer adicional de 150 ms superaba el límite reducido; la intro React ahora libera inmediatamente si la preferencia está activa, mientras el bootstrap conserva su primer frame estático hasta 150 ms. Escape antes de `ready` liberó en 45 ms. El rechazo de import de intro y su replay dejaron la app utilizable.

`npm run test:e2e -- --reporter=list` aprobó **58/58 pruebas en una única corrida integrada de 5,3 minutos**, sin casos omitidos. Incluye los recorridos anteriores de catálogo, términos, acompañantes, cupos, cancelación, calendario, publicación demo, audiencia Excel/CSV, plantilla, temas, teclado, touch y foco, además de diez regresiones de esta etapa: Escape durante la aproximación, doble submit, email inválido, evento completo, flush antes de 600 ms y reload, pérdida/restauración real de contexto, retry de import rechazado, shader inválido sin romper la reserva, vuelo desde catálogo scrolleado y recuperación de una excepción React dentro del engine.

Después del pulido de cabina y pase, **10/10 pruebas afectadas volvieron a aprobar**. La revisión de lectura hizo opaco el calendario claro y oscureció sus cabeceras; también separó el planeta móvil del botón de cierre y aclaró el aviso/cancelación sobre el fondo negro. **2/2 pruebas de pase y contraste se repitieron después de esos últimos ajustes y aprobaron**. No se modificaron las pruebas para ocultar fallas de producto.

La revisión del build local bajo `/supernova-eventos/` aprobó **18 comprobaciones** en ambos temas a 1440, 390 y 320 px: WebGL disponible, mismo Canvas, destinos actuales, fotografías y fuente crítica con prefijo correcto, espacio negro y sin overflow. Agregó un escenario de recuperación real: abort del primer entry 3D, navegación a Perfil en fallback y reintento que solicitó el segundo archivo hashed, recuperó la escena y conservó el favorito. Sin errores inesperados HTTP, requests o JavaScript. El [reporte de producción](captures/prompt-3/production-review.json) distingue el request fallido provocado por la prueba. La primera ejecución del escenario comprobaba la tarjeta antes de que entrara el DOM de Favoritos; se corrigió su espera al contenido visible y se repitió sin cambiar runtime.

La [galería final](captures/prompt-3/README.md) reúne **80 capturas**, en oscuro y claro, a 1440 × 900, 390 × 844 y 320 × 667, más pases de seis filas a 1280 × 550 y 390 × 667. Se revisaron hero, secciones, eventos, formulario, pase, cue, Perfil, exterior de nave y cabina. El calendario, ambas acciones, aviso demo y cancelación quedaron íntegros dentro del viewport, sin scroll del pase ni overflow horizontal. El cue se congeló a 320 ms sólo para sus imágenes; las mediciones usaron reloj vivo. Trailer aporta [21 capturas de apertura y viajes](../trailer/experiencia-3d/captures/prompt-03/README.md).

La primera revisión detectó el marco de cabina demasiado brillante/grueso y el calendario claro translúcido. Se conservó en [revision-01](captures/prompt-3/revision-01/README.md). El pulido recapturó las composiciones afectadas; la última corrida renovó los 22 pases/calendarios/cues y los tres recorridos medidos, conservando las 58 imágenes ya aprobadas, incluidas las seis cabinas refinadas. Los timestamps distinguen esas revisiones en el [JSON](captures/prompt-3/final-review.json). No se borraron capturas de los prompts 1 y 2.

## Mediciones finales

Chrome headless **155.0.8059.40**, Windows, ANGLE / **Intel Iris Xe / D3D11**, DPR 1, calidad balanced. Cada viewport realizó dos ciclos de calentamiento y cuatro medidos: secciones, nave/cabina y tres eventos de categorías distintas, con lectura final en Explorar. El Canvas mantuvo su identidad. Tras calentamiento, los cuatro registros conservaron **23 geometrías, 1 textura, 11 programas y 49 nodos** en los tres tamaños. Es una meseta local de contadores, no una prueba de ausencia total de fugas ni una medición del heap JavaScript.

| Viewport | Delta R3F mediano / p95 | Pico de las últimas 180 muestras | Calls / triángulos máximos de los recorridos |
| --- | --- | --- | --- |
| 1440 × 900 | 16 / 20 ms | 65 ms | 12 / 9824 |
| 390 × 844 | 16 / 18 ms | 79 ms | 12 / 9824 |
| 320 × 667 | 16 / 18 ms | 33 ms | 12 / 9824 |

Los deltas son intervalos entre callbacks de R3F, muestreados cada tres frames; se excluyen los de 250 ms o más. No miden tiempo GPU ni certifican FPS sostenidos. El pool de viaje llegó a 32 partículas y volvió a cero; se observó la confirmación y quedó apagada al cerrar. Los recorridos respetaron los presupuestos por tier. Las 80 composiciones estáticas registraron máximos de 9 calls y 9412 triángulos. La corrida final terminó sin errores de página ni consola. No se probó un teléfono físico, teclado virtual real ni GPU móvil.

Comandos principales ejecutados:

```powershell
npm run build
npm run test:e2e -- --reporter=list
node docs/trailer/experiencia-3d/intro-check-03.mjs
node scripts/universe-final-review.mjs
$env:UNIVERSE_FINAL_SCOPE='final'
node scripts/universe-final-review.mjs
$env:UNIVERSE_PREVIEW_OUTPUT='docs/experiencia-3d/captures/prompt-3'
$env:UNIVERSE_PREVIEW_RECOVERY='1'
node scripts/universe-preview-check.mjs
```

También se ejecutaron las repeticiones dirigidas de 10 y 2 pruebas con `--grep`, los scopes de recaptura de composiciones, checks de sintaxis de los scripts y `git diff --check`. Se comprobaron 181 enlaces locales en el índice, prompt, registros y galerías de cierre: todos existen. El índice y los registros de arquitectura/validación reflejan el cierre de los tres prompts.

## Alcance

La app sigue siendo una demo con datos ficticios y persistencia local. SSO, nómina, cupos concurrentes y envío de emails requieren el backend propuesto en [backend-prompt.md](../backend-prompt.md). No se presenta ningún envío de email como realizado.
