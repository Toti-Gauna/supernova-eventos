# Estructura de la carpeta de prompts

```text
docs/Trailer - <Feature>/
  PLAN.md                         plan paso a paso
  componentes/                    recortes (si hay video con IA)
  PROMPT - <herramienta>.md       prompt de video (si hay video con IA)
  prompts/
    00_LEEME.md                   índice, orden, cómo usar cada prompt
    01_brief.md                   va adjunto a todos
    02_direccion_creativa.md      fuente de verdad (storyboard del juez)
    03_arquitectura_y_contrato.md fundación: tipos, línea, núcleo, maestro, reloj
    04_motor_overlay_y_controles.md
    05_sonido.md
    06_piezas_ui.md
    07_integracion.md
    08_revision_calidad.md
    09_sonidos_recomendados.md    guía (no es prompt)
    escenas/
      00_glifo_y_capas.md         la marca y las capas globales
      E01_<id>.md …               una por escena
      L_laminas.md                movimiento reducido
    anexos/                       informes de investigación y direcciones
    referencia/                   código verificado en .txt
```

## Orden y paralelismo

| Fase | Prompts | Paralelo |
|---|---|---|
| 1. Fundación | 03 | no |
| 2. Base | 04, 05, 06, escenas/00 | sí (archivos distintos) |
| 3. Escenas | escenas/E*, L | sí (una por agente) |
| 4. Integración | 07 | no |
| 5. QA | 08 | sí (una lente por agente), después corrección única |

Cada fase deja la app compilando (`tsc`) y los tests en verde.
