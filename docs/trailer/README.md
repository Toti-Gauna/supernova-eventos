# Intro Supernova

Apertura implementada en [CinematicIntro.tsx](../../src/features/intro/CinematicIntro.tsx), con estilos propios en [intro.css](../../src/features/intro/intro.css). Duración del timeline: 3,4 segundos. Sin audio, barra de progreso ni botón para saltar. Escape permite continuar.

El host muestra la intro en cada refresh y la carga con `React.lazy` + `Suspense`; GSAP vive exclusivamente en el chunk de esta feature. El footer permite volver a verla. El componente mantiene el contrato:

```tsx
<CinematicIntro onComplete={() => setShowIntro(false)} />
```

La primera respuesta HTML contiene el [bootstrap](../../src/features/intro/bootstrap.html), con CSS crítico y la misma geometría orbital; aparece incluso antes de descargar React. El host retira ese nodo y sus estilos después del primer commit. Durante la descarga del chunk, `Suspense` usa [IntroLoading](../../src/features/intro/IntroLoading.tsx), que comparte [IntroArtwork](../../src/features/intro/IntroArtwork.tsx) con la escena final. Ninguna fase muestra una pantalla de solo logo. Las tres fases comparten un reloj para conservar el avance de la entrada; si la descarga tarda, la escena deja una salida suave sin reiniciar el wordmark.

Los textos de las cuatro esquinas se quitaron. La identidad, el mensaje central y las órbitas permanecen. Tanto la primera respuesta HTML como la escena lazy adaptan su paleta a `html[data-theme='light']`; la versión oscura sigue siendo el valor inicial del portal.

La intro usa un portal, vuelve inerte la app, enfoca su escenario y mantiene allí Tab y Shift+Tab. Al salir restaura el foco del replay o enfoca `main-content` en el primer ingreso. Esto evita abrir visualmente el enlace «Ir al contenido» después de cada refresh.

El contexto GSAP se revierte al desmontar; listeners y timer de reduced motion se limpian también en StrictMode. La finalización es única. Con `prefers-reduced-motion: reduce` muestra una composición estática y continúa a los 150 ms del reloj compartido. El fallback también mantiene foco, Escape y aislamiento de la app mientras descarga la escena.

El [storyboard](storyboard.md) describe la dirección. La [validación](qa.md) registra los checks ejecutados; [motion-check.mjs](motion-check.mjs) reproduce la revisión contra el servidor local.

