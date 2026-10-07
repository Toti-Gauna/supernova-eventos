---
name: trailer-qa
description: "Revisión adversarial de un trailer antes de cerrarlo: seis lentes independientes (correctitud y ciclo de vida, rendimiento, accesibilidad, fidelidad y honestidad, nivel premium, consistencia con el repo), cada hallazgo con evidencia y verificado intentando refutarlo, corrección solo de lo bloqueante o alto y verificación final ejecutada. Usala al terminar la construcción o ante cambios grandes."
---

# Trailer QA

## Propósito

Encontrar lo que rompe, lo que se ve barato y lo que miente, sin llenar el informe de falsos positivos.

## Cuándo usarla

- Al terminar la integración.
- Después de cambios grandes en escenas, motor o sonido.

## Cuándo no usarla

- Ajustes de texto o de un cue.

## Lentes

1. **Correctitud y ciclo de vida:** cuándo se muestra y cuándo no (roles, rutas, deep links, pantallas angostas), "visto" y logout, limpieza total, StrictMode/HMR, storage que falla, seek hacia atrás.
2. **Rendimiento:** CPU 4x, sin "Layout" en la cinta, tick < 3 ms, solo `transform`/`opacity`, un canvas, `will-change` acotado, chunk fuera del bundle compartido, audio pedido recién al montar.
3. **Accesibilidad:** diálogo modal, foco inicial y atrapado, Esc, resumen para lectores, movimiento reducido (láminas), contraste AA, nada que parpadee más de 3 veces por segundo.
4. **Fidelidad y honestidad:** cada pieza contra la captura y el componente real; ninguna promesa que el rol no tenga; ningún dato de terceros; formatos reales.
5. **Nivel premium:** verlo a 1x, a 0,25x y con sonido. ¿Cortes y cues en el golpe (±1 cuadro)? ¿Momentos "PowerPoint"? ¿Supers legibles? ¿Una sola familia de curvas? Proponer mejoras con tiempos y curvas, no adjetivos.
6. **Consistencia con el repo:** idioma y comentarios, sin `any` ni `console.log`, reutiliza lo que existe, documentación desactualizada corregida.

## Proceso

1. Un revisor por lente, independientes.
2. Cada hallazgo con archivo:línea, reproducción y severidad (`bloqueante`, `alto`, `medio`, `bajo`).
3. **Verificación adversarial:** otro revisor intenta refutarlo; si no se reproduce ni se demuestra leyendo el código, se descarta.
4. Corregir solo bloqueantes y altos, con el cambio mínimo.
5. Ejecutar `tsc`, lint, tests y build, y reportar la salida real.

## Salida esperada

Tabla por lente (hallazgo, severidad, evidencia, estado) y la salida real de las verificaciones.
