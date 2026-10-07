---
name: trailer-discovery
description: "Aclara el alcance de un trailer o presentación de producto antes de diseñarlo: audiencia y roles, dónde y cuándo se ve, formato (in-app con GSAP o video con IA), duración, sonido y frecuencia. Usa esta skill al inicio de cualquier pedido de trailer, spot, intro o presentación animada. Hace preguntas breves y de alto valor solo cuando cambian el resultado."
---

## Propósito

Evitar diseñar un trailer sobre supuestos equivocados. Cinco decisiones cambian todo lo demás: **para quién**, **dónde se ve**, **en qué formato**, **cuánto dura** y **cómo suena**.

## Cuándo usarla

Siempre al inicio de un pedido de trailer, spot, intro, presentación animada o video promocional de una feature.

## Cuándo no usarla

- El pedido ya trae todas las decisiones de la tabla.
- Es un ajuste puntual a un trailer existente (una escena, un sonido, un texto).

## Decisiones a cerrar

| Decisión | Opciones típicas | Por qué importa |
|---|---|---|
| Audiencia | un rol, todos, **una versión por rol** | Cada rol puede hacer cosas distintas: mostrarle a un colaborador funciones de admin es prometer lo que no tiene. |
| Formato | **in-app** (DOM + GSAP), **video con IA** (Higgsfield, Kling, Veo), los dos | In-app: texto nítido, liviano, personalizable, costo cero. Video IA: bueno para redes, pero deforma texto y pide licencias. |
| Dónde y cuándo | al primer ingreso, desde un botón, en una landing | Define montaje, persistencia ("visto") y exclusiones (deep links, tareas contra reloj). |
| Frecuencia | una vez por usuario, por sesión, siempre | Una vez por usuario + "volver a verlo" es lo habitual. |
| Duración | 15, 30 o 60 s | A 120 BPM, 30–32 s son 15–16 compases: alcanza para 5–6 ideas. |
| Sonido | sin sonido, síntesis, archivos reales | Autoplay bloqueado después de un login con recarga: hace falta una "pantalla de puerta". Uso interno de empresa = uso comercial (licencias). |

## Presupuesto de preguntas

- **1 a 3 preguntas** como estándar; **hasta 4** si faltan audiencia y formato.
- Una sola ronda. Con opciones concretas y una recomendada.
- Lo técnico (dónde montar, qué librería) no se pregunta: se decide leyendo el repo.

## Proceso

1. Leé el pedido y las referencias (capturas, carpetas, links).
2. Revisá lo mínimo del repo para no preguntar lo que el código responde (roles, rutas, stack, si ya hay GSAP o framer-motion).
3. Preguntá solo lo que cambie audiencia, formato, momento, duración o sonido.
4. Dejá las decisiones escritas en el brief (`prompt-pack`).
5. Seguí con `ui-inventory`.

## Salida esperada

- Tabla de decisiones cerradas.
- Supuestos explícitos para lo que no se preguntó.
- Qué queda fuera del alcance.
