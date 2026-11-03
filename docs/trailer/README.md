# Intro Órbita

**Marca y paleta (3 de noviembre de 2026).** El producto se llama Órbita: el wordmark de las dos intros dice `órbita`, en minúscula, con Manrope 400 (la única cara precargada para el primer frame HTML), más grande y con tracking menos cerrado que antes. El diálogo se anuncia como «Te damos la bienvenida a Órbita» y el bootstrap como «Preparando Órbita». Los colores siguen el [brief de Órbita](../orbita/README.md), inspirado en Personal: noche navy `#030B1C`, cian `#4EC5FF` / `#1EB2F5` en el símbolo, las órbitas y los acentos, azul `#2348DE` en el halo, violeta `#7B6CF6` con moderación y magenta `#E0479E` solo como chispa. La intro es siempre oscura, también la original, que perdió su variante clara. Sol, planetas y lunas conservan sus colores porque deben coincidir con el renderer 3D. [Capturas](captures/orbita/).

Dependencia con frontend: `MAP_ART` en `src/features/hybrid/HybridArtwork.ts` copia las órbitas, las líneas, los puntos y la nave del mapa SVG. Debe usar los mismos valores (`#1eb2f5` / `#bfe6ff` en las órbitas, `#4ec5ff` en las líneas, el punto y la luz de la nave, `#e0479e` en la chispa, `#76829a` / `#9fb3d1` en la nave) para que el fundido de 1,0–1,2 s no cambie de color.

La [experiencia híbrida 2D + 3D](experiencia-hibrida/01-carga-y-continuidad.md) conserva este sistema solar y se acerca al planeta violeta con su propia cámara. La original usa su intro recuperada en `src/versions/original/features/intro/`; la 3D mantiene el recorrido existente. [Accesos a las tres versiones](../experiencia-hibrida/README.md).

Apertura solar implementada en [CinematicIntro.tsx](../../src/features/intro/CinematicIntro.tsx), con estilos propios en [intro.css](../../src/features/intro/intro.css). Duración visual de 3,6 segundos y deadline absoluto de 4 segundos desde el primer frame HTML. Con movimiento reducido, el bootstrap conserva su primer frame hasta 150 ms y el overlay React completa de inmediato al montar. Sin audio, barra de progreso ni botón para saltar. Escape permite continuar.

El host muestra la intro en cada refresh y la carga con `React.lazy` + `Suspense`; GSAP vive exclusivamente en el chunk de esta feature. El footer permite volver a verla. El componente mantiene el contrato:

```tsx
<CinematicIntro onComplete={finishIntro} />
```

La primera respuesta HTML contiene el [bootstrap](../../src/features/intro/bootstrap.html), con CSS crítico y un sistema solar SVG liviano; aparece incluso antes de descargar React. El host retira ese nodo y sus estilos después del primer commit. Durante la descarga del chunk, `Suspense` usa [IntroLoading](../../src/features/intro/IntroLoading.tsx), que comparte [IntroArtwork](../../src/features/intro/IntroArtwork.tsx) con la escena final. Las tres fases comparten `performance.now()` y el instante de comienzo, sin reiniciar el wordmark al llegar JavaScript. Si React tarda más que el plazo, el arte se retira y queda la nota «La aplicación todavía se está cargando».

El fondo de la intro es `#030B1C` en los dos temas; en 3D e híbrida se ve detrás el cielo persistente del Tour. Cuando frontend anuncia el primer frame válido del único Canvas persistente, el SVG entrega la imagen a los cuerpos 3D; GSAP anima solamente el overlay DOM. [introHandoff.ts](../../src/features/intro/introHandoff.ts) conserva ese fundido al pasar de Suspense al componente lazy. El símbolo de estrella en órbita y Manrope conservan su identidad; la intro no crea otro renderer ni lee datos personales.

La intro usa un portal, vuelve inerte la app, enfoca su escenario y mantiene allí Tab y Shift+Tab. Al salir restaura el foco del replay o enfoca `main-content` en el primer ingreso. Esto evita abrir visualmente el enlace «Ir al contenido» después de cada refresh.

El contexto GSAP se revierte al desmontar; listeners y timers se limpian también en StrictMode. La finalización es única. Con `prefers-reduced-motion: reduce`, React no agrega un timer después del primer frame HTML: libera el overlay inmediatamente y conserva tiempo para su commit. La salida se observó a los 28 ms en replay y a los 187 ms con CPU 4×, dentro del máximo de 200 ms. El fallback mantiene foco, Escape y aislamiento mientras descarga la escena; el host contiene un import rechazado sin cerrar la app.

El storyboard solar vigente y sus comprobaciones se registran en [02-implementado.md](experiencia-3d/02-implementado.md). El cierre de la tercera entrega se documenta en [03-cierre.md](experiencia-3d/03-cierre.md) y se reproduce con `node docs/trailer/experiencia-3d/intro-check-03.mjs`, contra Vite local. [storyboard.md](storyboard.md), [qa.md](qa.md) y sus scripts conservan la evidencia histórica de la intro anterior de 3,4 segundos; sus expectativas de hero SVG y fondo claro no describen el universo actual.

