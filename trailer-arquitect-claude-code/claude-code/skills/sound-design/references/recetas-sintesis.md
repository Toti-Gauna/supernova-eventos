# Recetas de síntesis (WebAudio)

Envolventes exponenciales hasta 0,0001. Pre-renderizar a buffers.

| id | Receta |
|---|---|
| brillo | glock FM, 1175 + 2350 Hz (o arpegio con relación 3,01), 0,6 s + reverb |
| latido_sub | seno 55 Hz, 0,2 s |
| florecer | ruido pasa-bajos 200 → 2500 Hz en 0,6 s + seno 110 Hz que crece |
| blip / chip | seno + triangular, 35–50 ms, en la nota del cue |
| whoosh_corto | ruido pasa-banda 600 → 4000 Hz en 0,3 s, envolvente en campana |
| whoosh_largo | ruido rosa, pasa-bajos 400 → 3000 Hz en 0,8 s, paneo que se mueve |
| click | impulso de 2 ms + seno 1,2 kHz de 20 ms |
| pop | seno 440 → 880 Hz en 40 ms + ruido mínimo |
| tecleo | ruido 12 ms pasa-altos 4 kHz, ±8 % de altura con semilla |
| tick | seno 2,4 kHz, 20 ms (desafinación ±50 cents con semilla) |
| reparto | ruido 80 ms pasa-banda 2–5 kHz, caída rápida |
| riser | ruido pasa-banda 400 → 8000 Hz exponencial + sierra 110 → 440 Hz filtrada; corte seco |
| drop | sub 55 → 38 Hz en 1,2 s (WaveShaper tanh para armónicos en parlantes chicos) + bombo + golpe de acorde + ráfaga pasa-altos 3 kHz |
| impacto | seno 80 → 50 Hz en 0,3 s + aire |
| sheen | ruido pasa-altos 7 kHz, 0,6 s, suave |
| vidrio | ruido pasa-banda 800 → 5000 Hz en 0,5 s + brillo 8–12 kHz |
| barrido | ruido pasa-banda 2 → 9 kHz en 0,6 s con paneo |
| papel | ruido pasa-bajos 300 → 3000 Hz en 0,5 s + crujidos con semilla |
| cascada | 40 clics de 3–6 kHz en 0,75 s |
| descarga | whoosh 0,3 s + thunk (seno 90 Hz, 0,12 s) |
| exito | dos notas (E6 + B6), 0,8 s + reverb |
| resolver | D6 → F#6, 80 ms cada una |
| platillo_invertido | ruido pasa-altos con envolvente invertida de 1,5 s |
| absorber | seno de 30 ms con altura ascendente por índice |
| acorde_final | Dmaj9: pad (2 sierras ±7 cents) + felt piano + glock 1568 + 2093 Hz + sub, 3,5 s |

**Música de respaldo:** pluck (2 sierras ±7 cents, lowpass con envolvente), marimba FM (moduladora ×4), palmas (ruido bandpass 1100 Hz, 3 golpes de 0/11/22 ms), sub (seno + lowpass 180 Hz), bombo (seno 160 → 48 Hz). Reverb con respuesta al impulso sintética (ruido estéreo × e^(−t/0,7), 2,5 s).
