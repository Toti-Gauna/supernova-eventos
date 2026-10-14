# Trailer híbrido · carga y acercamiento

La referencia del usuario se conserva en `IntroArtwork.tsx` y en el bootstrap HTML: órbitas elípticas, planeta violeta con anillo, verde con lunas, ámbar, perlados, nave, sol y lockup Supernova sobre negro. No se generaron imágenes bitmap: el arte SVG permite compartir colores y escalar sin pixelar.

El contrato del host mantiene `onComplete` y suma `variant?: '3d' | 'hybrid'` con default 3D. La timeline existente y la identidad de marca siguen intactas. La híbrida usa su propia cámara y arte; no modifica el renderer volumétrico anterior.

| Tiempo | Composición |
| --- | --- |
| 0–1,2 s | Primera lámina solar e identidad, con entrada breve de marca. |
| 1,2–1,85 s | Transferencia del SVG al mismo mapa ilustrado del Canvas, cuando el renderer está listo. |
| 1,9–2,55 s | Acercamiento al violeta; anillos y borde pasan progresivamente a detalle fino. |
| 2,55–3,25 s | Dolly hasta el espacio del hero; se revela su contenido a partir de 2,75 s. |
| 3,25–3,6 s | Pose final e intro liberada. |

La posición de cámara se calcula con el rectángulo real del SVG y su `preserveAspectRatio`, no con offsets independientes. La coordenada `(300,157)` y el radio 14 determinan la pose inicial; la paleta radial es la misma. El mapa de fondo y las otras miniaturas se desvanecen durante el acercamiento, mientras el planeta violeta conserva su lugar en el espacio.

Escape, `prefers-reduced-motion`, foco modal y restitución, StrictMode, Suspense y deadline de 4 segundos siguen usando el ciclo de vida existente. Si WebGL o la descarga del renderer falla, el contenido funciona con el arte de reserva y no espera al motor. Sin audio.

[Secuencia de 18 poses y datos](../../experiencia-hibrida/captures/intro/review.json). [Galería](../../experiencia-hibrida/captures/README.md). `scripts/hybrid-intro-review.mjs` reproduce el replay desde el hero con el motor ya caliente y reloj controlado. A 1,4 segundos verifica alineación del SVG y su proyección con tolerancia de 2 px, en 1440×900 y 390×844. Esta captura de poses no mide tiempo de GPU ni duración de descarga inicial.
