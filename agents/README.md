# Agentes de Supernova para Codex

Los dos roles están separados dentro de la misma carpeta y conservan sus skills y referencias independientes:

```text
agents/
  frontend/AGENTS.md
  frontend/skills/
  trailer/AGENTS.md
  trailer/skills/
```

El `AGENTS.md` de la raíz enruta las tareas al rol correspondiente. Esta carpeta es un pack de instrucciones del proyecto: no instala plugins, no cambia el modelo de Codex y no modifica su configuración global.

## Usar el frontend

```text
Leé agents/frontend/AGENTS.md y los skills relevantes.
Implementá [flujo] en este proyecto React + TypeScript + Vite.
Respetá el sistema visual y verificá el resultado.
```

## Usar el trailer

```text
Leé agents/trailer/AGENTS.md.
Para [intro o presentación], releva la UI y definí un storyboard breve.
Implementá con GSAP, acceso con teclado, reduced motion y cleanup.
Integración: componente lazy con onComplete; no audio automático.
```

## Trabajar en paralelo

Asigná a cada subagente archivos propios. El rol frontend mantiene los flujos y el host de la intro. El rol trailer mantiene `src/features/intro/**` y `docs/trailer/**`. Comparten un contrato `CinematicIntro({ onComplete })`; el host decide frecuencia, storage y replay.

Los originales quedan en `codex/` y `trailer-arquitect-claude-code/`. Las copias de este directorio eliminan el modelo específico del pack de origen, los supuestos de otro framework y los paths personales del proyecto anterior. El motor y las referencias de integración usan Vite, `React.lazy` y `Suspense`.

Ver [`docs/trailer/README.md`](../docs/trailer/README.md) para la intro implementada y su storyboard.

