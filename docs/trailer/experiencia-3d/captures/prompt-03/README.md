# Capturas de apertura y viajes · Prompt 3

9 de octubre de 2026. Chrome headless 155.0.8059.40, Windows local, superficies en tema claro y movimiento habilitado. Las capturas se tomaron con el reloj real, sin `animations: disabled` ni congelar el Canvas. Los casos de reduced motion tienen mediciones en el [reporte aprobado](intro-report.json), no una simulación visual de movimiento.

Son 21 imágenes. Los archivos de 1100, 1800 y 2750 ms nombran el instante objetivo; el JSON conserva el elapsed real al muestrear. Los ocho frames de viajes verificaron `travelling=true` antes y después de la captura, cámara distinta de origen y el mismo nodo Canvas al llegar. El renderer informó Intel Iris Xe mediante ANGLE/Direct3D11, DPR 1. Estas son capturas de viewports de escritorio, no teléfonos físicos.

| Estado | 1440 × 900 | 390 × 844 |
| --- | --- | --- |
| Primer frame antes de React | [Solar HTML](solar-before-react.png) | [Solar HTML](solar-bootstrap-390.png) |
| Apertura hacia 1,1 s | [Frame](solar-live-1100-1440.png) | [Frame](solar-live-1100-390.png) |
| Handoff hacia 1,8 s | [Frame](solar-live-1800-1440.png) | [Frame](solar-live-1800-390.png) |
| Aproximación al hero hacia 2,75 s | [Frame](solar-live-2750-1440.png) | [Frame](solar-live-2750-390.png) |
| Llegada al hero | [Hero](solar-arrival-1440.png) | [Hero](solar-arrival-390.png) |
| Viaje a Mis eventos | [Frame intermedio](viaje-mis-eventos-mid-1440.png) | [Frame intermedio](viaje-mis-eventos-mid-390.png) |
| Viaje a Favoritos | [Frame intermedio](viaje-favoritos-mid-1440.png) | [Frame intermedio](viaje-favoritos-mid-390.png) |
| Acercamiento a un evento | [Frame intermedio](viaje-evento-mid-1440.png) | [Frame intermedio](viaje-evento-mid-390.png) |
| Abordaje de la nave | [Frame intermedio](abordaje-nave-mid-1440.png) | [Frame intermedio](abordaje-nave-mid-390.png) |

También se conservaron [bootstrap a 320 × 740](solar-bootstrap-320.png), [chunk de GSAP pendiente](solar-pending-lazy.png) y [UI después del import rechazado](intro-import-fallback.png).

Los frames de abordaje corresponden a la revisión anterior al último pulido de la cabina: metal grafito, estructura más fina, luces suaves y viga apartada del título. Los plazos y la continuidad siguen representados por este reporte; la composición actual está en la [galería final de frontend](../../../../experiencia-3d/captures/prompt-3/README.md). Trailer no volvió a abrir el navegador después de ese ajuste visual.

La revisión final aprobó sin errores de página ni HMR. El [reporte incompleto previo](intro-report-incomplete.json) identifica una salida reduced de 305 ms con CPU 4× antes de corregirla; la corrida final observó 187 ms. Ambos reportes están diferenciados para no presentar un intento fallido como validación.

El [cierre del rol trailer](../../03-cierre.md) registra alcance, plazos y límites. La galería general de frontend conserva los estados finales de secciones, pase, evento y cabina, con ambos temas y alturas bajas.
