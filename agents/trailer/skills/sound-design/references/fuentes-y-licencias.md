# Fuentes de sonido y licencias (relevado en septiembre de 2026)

> Las licencias cambian: verificalas el día que descargues.

## Reglas

1. **Uso interno de empresa = uso comercial.** Descarta planes gratis de IA (ElevenLabs, Stable Audio, Suno), Uppbeat Free, la licencia estándar de YouTube Audio Library, CC-BY-NC y clips "Restricted" de Mixkit.
2. **Empresas grandes no entran en planes "Business" baratos** (Epidemic > US$10M, Artlist pide Enterprise para apps, Musicbed hasta 250 empleados). Enterprise o bancos CC0 + IA paga.
3. **El sonido de marca se crea, no se compra de stock** (Pixabay y SND prohíben usarlo como marca).
4. Guardá `CREDITOS.md` con origen, licencia y fecha de cada archivo.

## Top 5

| Opción | Para qué | Costo |
|---|---|---|
| [ElevenLabs](https://elevenlabs.io/pricing) SFX v2 + Music | Sonidos de marca, risers de duración exacta, tema completo | Starter US$6 / Creator US$22 |
| [Adobe Firefly](https://www.adobe.com/products/firefly/features/sound-effect-generator.html) | Si hay Creative Cloud corporativo: indemnización de PI; voice-to-SFX para timing | créditos del plan |
| [Freesound](https://freesound.org) filtrado a CC0 | Papel, cartas, tecleo | gratis |
| [Sonniss GDC](https://gdc.sonniss.com/) | Whooshes, impactos, risers de calidad de trailer | gratis |
| [SND](https://snd.dev/) + [Kenney](https://kenney.nl/assets/category:Audio) | Microsonidos de UI | gratis |

Con presupuesto: [Splice](https://splice.com/sounds) para risers, sub-drops y loops a 120 BPM.

## Especificaciones para web

| Parámetro | Valor |
|---|---|
| Música | −16 LUFS integrado, true peak ≤ −1 dBTP |
| SFX | pico −3 dBFS; el balance lo hace el motor |
| Formato | AAC en `.m4a` (128–160 kbps música, 96 kbps SFX); nunca Ogg Vorbis (Safari) |
| Herramientas | Audacity u ocenaudio para recortar; Youlean Loudness Meter para medir |
| Nombres | versionados (`-v1`), porque `/public` no se sirve inmutable |
