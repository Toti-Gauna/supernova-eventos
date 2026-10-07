---
name: ai-video-prompt
description: "Escribe prompts completos para video generativo (Higgsfield Genjutsu, Kling, Veo, Runway, Pika) a partir de un storyboard: verifica qué entrada exige cada herramienta, arma el prompt principal y una versión corta, la tabla de referencias, la línea de tiempo con cues, el brief de música y las advertencias de licencia. Usala cuando el trailer sea un video."
---

# AI Video Prompt

## Propósito

Que el video salga premium en pocas iteraciones: la herramienta correcta, las entradas que realmente pide y un prompt que describe estilo, planos y sonido sin ambigüedad.

## Cuándo usarla

- Spots, teasers o trailers como archivo de video.

## Cuándo no usarla

- Trailers dentro de la app (usá `gsap-trailer-engine`).

## Proceso

1. **Verificá la herramienta en la web** antes de escribir (cambian seguido). Ejemplo: Genjutsu es **video-a-video** (4–30 s de video fuente + hasta 30 referencias), no genera desde imágenes solas. Ver `references/herramientas.md`.
2. **Video base** si la herramienta lo exige: animatic con los recortes (PowerPoint Morph, Keynote Magic Move, Canva, Figma) o grabación de la app real siguiendo la línea de tiempo.
3. **Prompt principal en inglés** (los modelos responden mejor), con los textos de UI en el idioma original y entre comillas:
   - concepto y estilo de referencia;
   - mundo y look (fondo, luz, paleta con hex, tipografía, "UI text must stay sharp");
   - protagonista (la marca) y lenguaje de movimiento;
   - shot list con tiempos y referencias por número ("Image 7");
   - sonido (instrumental, BPM, instrumentos, SFX sincronizados);
   - "AVOID".
4. **Versión corta** por si la herramienta trunca.
5. **Línea de tiempo** con supers sugeridos (mejor ponerlos en edición: los modelos deforman texto nuevo) y cues.
6. **Audio:** si la herramienta no genera sonido, brief para un generador de música con licencia comercial y lista de SFX (`sound-design`).
7. **Consejos de iteración:** probar un tramo de 8–10 s, Object Swap para piezas deformadas, cierre de marca compuesto en edición.

## Salida esperada

Un `.md` con: requisitos de la herramienta, tabla de referencias, prompt principal, prompt corto, línea de tiempo, guion del video base, audio, consejos y fuentes consultadas.
