# Honestidad y datos

## Reglas

1. **Solo lo que el rol puede hacer hoy.** Si una acción solo abre otra pantalla (p. ej. "completar mi declaración" abre el formulario del portal), el trailer muestra eso: el asistente lleva, no hace.
2. **Nada de respuestas de guion engañosas.** Si una consulta devuelve datos de toda la empresa a un usuario común, no se muestra aunque exista.
3. **Datos de ejemplo siempre.** "Usuario de ejemplo", nombres demo del propio código, emails `@<dominio>.local`. Nunca personas reales de las capturas.
4. **El único dato real** permitido es el del propio espectador (primer nombre, iniciales) para personalizar.
5. **Sin enunciados inventados.** Si no hay textos reales de preguntas de un formulario, se muestran en esqueleto (barras de rótulo).
6. **Formatos reales.** Fechas, porcentajes y contadores con el formato del código (`dd/mm/aaaa`, coma decimal).
7. **Estados compatibles.** No mezclar en una misma tarjeta estados que el código no permite juntos.

## Clasificación de funciones

| Estado | Significa | ¿Va al trailer? |
|---|---|---|
| REAL | Pega a endpoints y funciona hoy | Sí |
| MAQUETA | Responde un guion escrito a mano | Solo si lo que muestra es cierto para ese rol |
| COND | Depende de backend, flags o capacidades | Sí, si el flujo visible es real; marcá el riesgo |

## Humor

Solo sobre el esfuerzo de la herramienta. Nunca sobre personas, sanciones, rechazos, conflictos ni dictámenes. En dominios sensibles (compliance, salud, finanzas), mejor sin humor.
