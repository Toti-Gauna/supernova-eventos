# Lenguaje visual premium (recetas probadas)

## Ángulos del panel

| Ángulo | Tesis | Riesgo |
|---|---|---|
| Cinematográfico (Apple) | La marca es la única luz; paneles de vidrio en profundidad; rampas lento → rápido; silencio antes del drop. | Costo de GPU con muchos planos 3D. |
| Lúdico (Google/Anthropic) | La marca como personaje que activa piezas; toque = sonido. | Deformar la marca; humor fuera de tono. |
| Precisión (Linear/Vercel) | Grilla, trazos que dibujan piezas, cortes secos, exactitud. | Frío; cuesta entender el producto. |

## Recetas

- **Vidrio sin `backdrop-filter`:** `linear-gradient(180deg, rgba(255,255,255,.05), transparent 40%), rgba(15,23,42,.72)` + borde `rgba(148,163,184,.14)` + sombra estática. Glow de estado como `div` radial con opacidad animada.
- **Sheen:** `<span>` de 45 % de ancho, `skewX(-20deg)`, degradé transparente → `rgba(186,230,253,.16)` → transparente, `xPercent −150 → 350` en 0,9 s. Uno por compás como máximo.
- **Filo iluminado:** `<span>` de 1 px arriba del panel que se enciende cuando pasa la luz (agendado, no medido por cuadro).
- **Halo de la marca:** radial de 900 px que sigue al logo con `quickTo`.
- **Punto final de los supers = núcleo del logo:** el "." es un círculo con el degradé de marca.
- **Primer plano = layout nuevo:** re-renderizar la pieza a mayor escala (CSS `zoom`), no escalarla con transform.
- **El estado se escucha:** cada chip de estado suena en una nota del acorde.
- **Rayos del drop:** 12 `div` de 2 px sobre los ángulos de la marca, `scaleX 0 → 1` y fade en 0,5 s `expo.out`.

## Curvas

- Firma de cámara: `CustomEase "rampa" = "M0,0 C0.7,0 0.12,1 1,1"` (llega al 94 % justo al golpe si arranca en el "&").
- UI: la curva del sistema de movimiento del repo (p. ej. `0.16,1,0.3,1`).
- Resorte: aproximación del spring de la marca, solo para la marca y las presiones.

## Transiciones firma

Atravesar el vidrio (z-through + flash), colapso y estallido (silencio + rayos), barrido de luz (banda diagonal), enfoque selectivo (blur ≤ 6 px sobre ≤ 5 elementos chicos), corte seco con línea de corte (una sola vez).

## Prohibido

Video o capturas como UI, Lottie, three.js para un spot, `backdrop-filter`, blur a pantalla completa, glitch, aberración cromática, lens flares, partículas infinitas, más de un canvas, texto con el degradé de marca fuera del nombre, más de un super a la vez.
