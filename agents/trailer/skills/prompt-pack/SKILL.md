---
name: prompt-pack
description: "Deja una carpeta de prompts autocontenidos y un plan paso a paso para construir, rehacer o extender un trailer con cualquier agente: brief, dirección creativa, arquitectura y contrato, motor, sonido, piezas, un prompt por escena, integración, QA, guía de sonido, anexos de investigación y código de referencia. Usala cuando la dirección creativa esté elegida y antes de construir."
---

# Prompt Pack

## Propósito

Que el trailer no dependa de una conversación: cada parte se puede reconstruir pasándole a un agente un archivo, y el plan dice en qué orden y qué se puede hacer en paralelo.

## Cuándo usarla

- Después de `creative-direction`, antes de construir.
- Para trailers nuevos de otras features: se copian brief y arquitectura y se reescriben dirección y escenas.

## Cuándo no usarla

- Cambios de una línea en un trailer existente.

## Proceso

1. Creá la carpeta con la estructura de `references/estructura-carpeta.md`.
2. **Brief** (`01`): decisiones cerradas, qué tiene que lograr cada versión, reglas de fidelidad y técnicas, qué no tocar. Va adjunto a todos los prompts.
3. **Dirección creativa** (`02`): el storyboard del juez tal cual, con cabecera de ajustes.
4. **Arquitectura** (`03`) antes que todo lo demás: tipos, línea de tiempo como datos, núcleo puro, contrato de escena.
5. **Un prompt por escena** en `escenas/`, con su sección del storyboard copiada, piezas, continuidad, estado de entrada y verificación.
6. **Integración y QA** al final.
7. **Anexos:** los informes de investigación (inventarios, infraestructura, reglamento, fuentes, direcciones, veredicto) y `referencia/` con código verificado en `.txt` (para que `tsc` no lo compile).
8. **Plan paso a paso** (`PLAN.md`): fases, dependencias, qué va en paralelo y criterio de "listo" por fase. No introduzcas aprobaciones para decisiones reversibles ya autorizadas.

Para una intro breve, condensá el pack en `README.md`, `storyboard.md` y `qa.md`: las escenas, el audio y los anexos se agregan solo si la implementación los necesita.

## Reglas de cada prompt

- Arranca con "Adjuntá …" (qué otros archivos necesita).
- Dice qué archivos crea o toca, y cuáles **no**.
- Termina con una sección de verificación ejecutable.
- Si toca archivos con cambios sin commitear del usuario: ediciones quirúrgicas ancladas por texto.

## Salida esperada

- La carpeta completa y el plan, con un índice (`00_LEEME.md`).
