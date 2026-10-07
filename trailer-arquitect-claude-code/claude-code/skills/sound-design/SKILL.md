---
name: sound-design
description: "Diseña y construye el sonido de un trailer: partitura por compás, cue sheet afinado y sincronizado con la imagen, síntesis WebAudio de respaldo pre-renderizada, archivos reales opcionales con manifiesto, mezcla y loudness para web, y fuentes con licencia comercial válida para uso corporativo. Usala cuando el trailer lleve música o efectos."
---

# Sound Design

## Propósito

Que el trailer **suene premium sin depender de archivos** y que las grabaciones reales, cuando existan, ganen solas y caigan al cuadro.

## Cuándo usarla

- Trailer con música o efectos (in-app o video).
- Para recomendar dónde conseguir sonidos y con qué licencia.

## Cuándo no usarla

- Trailer mudo por decisión explícita.

## Proceso

1. **Partitura:** BPM, tonalidad, forma por compás (intro, build, riser, **silencio real**, drop, groove, lift, silencio, final). Todo en la grilla.
2. **Cue sheet como datos:** `{ t, id, g, nota?, dur? }` por versión; tonales afinados en el acorde vigente ("el estado se escucha"). Contrato audiovisual: ningún toque sin sonido ni sonido sin toque.
3. **Síntesis de respaldo:** una receta WebAudio por id, pre-renderizada con `OfflineAudioContext` antes del gesto; música renderizada entera. Aleatoriedad con semilla. Ver `references/recetas-sintesis.md`.
4. **Archivos reales:** manifiesto opcional; se intenta cada archivo y, si falla, se sintetiza solo ese. Desfase de códec medido o declarado. Nombres versionados.
5. **Mezcla:** bus de música, bus de SFX, compresor y techo, master .6, ducking en los golpes, silencios con rampas de 15 ms.
6. **Fuentes y licencias:** `references/fuentes-y-licencias.md`. Uso interno de empresa = uso comercial.

## Salida esperada

- Partitura y cue sheet por versión.
- Motor de audio (grafo, recetas, música, motor) con tests de la partitura.
- Guía de compra/creación de sonidos con licencias y la lista de ids.
