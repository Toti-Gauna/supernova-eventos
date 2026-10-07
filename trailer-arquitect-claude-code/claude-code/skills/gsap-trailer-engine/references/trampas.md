# Trampas verificadas (GSAP 3.15, @gsap/react 2.1, React 18, Next 12)

## GSAP y React

- `useGSAP` con dependencias y sin `revertOnUpdate: true` **no** revierte la corrida anterior: timelines y tickers duplicados.
- Usá el `contextSafe` **del hook** (el del callback es opcional y en TS estricto molesta). Lo que corre después de un `await` o un `setTimeout` queda fuera del contexto.
- El contexto no conoce `gsap.ticker.add`, listeners, `ResizeObserver`, `AudioContext` ni timers: cleanup manual.
- `gsap.matchMedia()` se engancha al contexto activo; lo que devuelve un handler corre al revertir.
- Los `defaults` de un timeline padre **no** llegan a timelines hijos creados antes de insertarse.
- Tipos: `gsap.core.Timeline` acepta cualquier propiedad (`[key: string]: any`): un typo no da error. `MorphSVGVars` no tipa `smooth` ni `curveMode`.
- GSAP escribe transforms de SVG en el atributo `transform`; framer-motion en `style.transform`: nunca los dos sobre el mismo nodo.
- Transform de rotación en el `<g>` padre y escala en el hijo; si van juntos, el `style.transform` reemplaza al atributo.

## Reloj y audio

- El ticker de GSAP usa `Date.now` con `lagSmoothing` (500/33): después de un tirón queda atrasado. Con audio, manda el reloj de audio; `lagSmoothing(0)` solo mientras el trailer está abierto.
- Después de un login por SSO (recarga completa) no hay activación de usuario: `AudioContext` nace `suspended` y `resume()` sin gesto queda pendiente. Pantalla de puerta con "Reproducir con sonido".
- En Safari, `new AudioContext()` y `resume()` tienen que ser las primeras líneas del handler del clic.
- Latencia de salida: la imagen tiene que **esperar** al sonido (`getOutputTimestamp`), sobre todo con Bluetooth.
- Nunca `tl.call(() => play())`: los callbacks caen en el cuadro (±16 ms) y se disparan todos juntos al saltar.

## Texto y 3D

- SplitText antes de `document.fonts.ready` corta con la fuente de respaldo.
- Con `will-change`, Chrome no re-rasteriza: un texto que crece desde `scale < 1` queda borroso. Escala por `zoom` o terminar en 1 y soltar `will-change`.
- `opacity < 1`, `filter`, `overflow: hidden`, `clip-path` o `mix-blend-mode` en un ancestro `preserve-3d` aplanan el 3D.
- Prefijos responsivos de Tailwind responden al viewport, no al escenario escalado.
- Con `darkMode: "class"` no se puede forzar claro dentro de un `html.dark`: la pieza clara usa clases sin `dark:`.

## Next y la app

- `next/dynamic({ ssr: false })` para que GSAP no entre al bundle compartido.
- Next no agrega el `basePath` a `fetch` ni a `new Audio()`.
- `useReducedMotion()` no puede decidir qué se renderiza (hidratación): decidir en efectos o con `gsap.matchMedia`.
- Un `logout` que hace `localStorage.clear()` borra la marca de "visto": preservar las claves del trailer.
- Un deep link consumido durante el loader ya no se ve al terminar: calcularlo al montar el host y congelarlo.
