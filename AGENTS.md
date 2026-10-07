# Supernova Eventos · instrucciones para Codex

Este proyecto es una micro-app de eventos en React, TypeScript y Vite. La interfaz es una maqueta funcional: las inscripciones, los eventos y los borradores se persisten localmente; el envío de emails y la nómina real requieren backend. No presentes una simulación como una integración real.

## Roles separados

- Para UI, flujos, formularios, estado y responsive, leé [`agents/frontend/AGENTS.md`](agents/frontend/AGENTS.md).
- Para intro, escenas, GSAP, motion graphics y revisión de movimiento, leé [`agents/trailer/AGENTS.md`](agents/trailer/AGENTS.md).
- Si una tarea cubre ambos, delegá cada rol con archivos exclusivos. El frontend integra el host; el trailer mantiene `src/features/intro/` y `docs/trailer/`. Acordá props antes de editar.

Los roles heredan el modelo de la sesión. Los skills se leen bajo demanda y sus referencias se resuelven respecto del directorio del skill. [`agents/README.md`](agents/README.md) explica cómo invocarlos.

## Reglas del proyecto

- Leé los archivos y el estado de trabajo antes de editar. Conservá cambios del usuario y los packs originales.
- Implementá el trabajo autorizado de forma autónoma; preguntá solamente si falta una decisión indispensable. Las decisiones visuales y reversibles se resuelven con criterio.
- Español rioplatense. Sin sidebar. Header normal arriba y cápsula flotante al hacer scroll.
- Usá HTML semántico, navegación con teclado, foco visible, labels, Escape y restitución de foco en modales. Respetá `prefers-reduced-motion`.
- Animá `transform` y `opacity`. Limpiá timelines, listeners y timers en StrictMode. Ningún sonido automático.
- Datos ficticios exclusivamente. Los permisos FE sirven para la demo; la autorización final corresponde al servidor.
- Documentá contratos propuestos y dependencias BE en `docs/`. No inventes endpoints como si existieran.
- Verificá con `npm run build`; corré las pruebas de los flujos modificados si están disponibles. Reportá solamente verificaciones ejecutadas.

