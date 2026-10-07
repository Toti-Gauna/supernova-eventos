---
name: creative-direction
description: "Produce la dirección creativa de un trailer premium: un panel de tres direcciones con ángulos distintos (cinematográfica, lúdica, precisión), un juez con rúbrica que elige y sintetiza, y un storyboard definitivo al segundo por versión, con supers, transiciones, cue sheet y partitura. Usala después del inventario de UI y antes de escribir código o prompts de escenas."
---

# Creative Direction

## Propósito

Llegar a un storyboard **construible y premium** sin depender de una sola idea. Tres direcciones independientes cubren el espacio; un juez con criterios explícitos elige la columna vertebral e injerta lo mejor de las otras.

## Cuándo usarla

- Trailer nuevo o re-diseño completo.
- Cuando hay más de una audiencia y cada versión necesita su arco.

## Cuándo no usarla

- Ajuste de una escena dentro de un storyboard aprobado: editá el storyboard directo.

## Proceso

1. **Panel (en paralelo, independientes):** tres directores, cada uno defendiendo un ángulo sin diluirlo. Ángulos base en `references/lenguaje-visual-premium.md`:
   - Cinematográfico (profundidad, vidrio, luz, silencio, rampas).
   - Lúdico (la marca como personaje, ritmo juguetón).
   - Precisión (grilla, trazos, cortes secos, exactitud).
   Cada uno mira las capturas, lee la marca y el sistema de movimiento del repo, y entrega un storyboard completo por versión con la plantilla de `references/plantilla-storyboard.md`.
2. **Juez:** puntúa con `references/rubrica-juez.md`, elige la columna vertebral, lista injertos y descartes con motivo, y escribe el **storyboard definitivo** con tiempos absolutos, coordenadas del escenario, cues con nota y ganancia, y partitura por compás. Verifica contra el código cada texto y dato.
3. **Fuente de verdad:** el storyboard del juez se copia tal cual al prompt de dirección creativa (`prompt-pack`), con una cabecera de ajustes de implementación si los hay.

## Reglas que el storyboard tiene que cumplir

- Grilla temporal: BPM fijo (120 → golpe 0,5 s, compás 2 s); cortes en el tiempo 1; anticipaciones en el "&" del 4.
- Máximo dos movimientos simultáneos (cámara + un grupo) y tres elementos en foco.
- Un super a la vez, ≤ 6 palabras, ≥ 1,0–1,25 s en pantalla.
- Silencio real antes de cada drop.
- La marca no se deforma (sin squash, sin MorphSVG sobre el logo, sin otro degradé).
- Solo `transform` y `opacity`; excepciones enumeradas.
- Versión con movimiento reducido diseñada, no un descarte.

## Salida esperada

- Tres direcciones (anexos) y el veredicto con la tabla de puntajes.
- Storyboard definitivo por versión: tabla de escenas, escena por escena (objetivo, composición con coordenadas, coreografía, cámara, super, cues), transiciones entre pares, controles, cierre y salida, movimiento reducido, cue sheet completo, partitura, presupuesto de rendimiento y prerrequisitos en el código.
