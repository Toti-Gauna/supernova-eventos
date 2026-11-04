# Plan por lotes · experiencia premium

El objetivo es que Órbita se sienta premium de punta a punta, empezando por la versión Comercial. Las reglas que valen para todos los lotes:

- menos texto y más acción;
- todo lo importante en la primera pantalla;
- una sola estética (banners de color, cards blancas, CTA en píldora);
- accesible, en tema claro y oscuro.

Cada lote se cierra con:

- `npm run build`, los E2E del área y la suite completa;
- capturas en 1920 × 840, 1440 × 900 y 390 × 844, en tema claro y oscuro;
- un commit y un deploy.

Los lotes 2 a 8 se hicieron juntos el 4 de noviembre de 2026; el detalle de lo verificado está en [validation.md](../validation.md).

## Lote 1 · Home, Mis eventos y Favoritos (hecho)

- Banda «Que nada te pase de largo» como franja debajo del carrusel.
- Mis eventos con encabezado de una línea y cada pase como ticket. El vacío ofrece una acción directa.
- Favoritos con la búsqueda en el encabezado y, si está vacío, tres planes para guardar con un toque.
- Migración de los eventos de ejemplo guardados con la marca anterior.

## Lote 2 · Inscripción y pase (hecho)

- **Inscripción en una pantalla (escritorio).** A la izquierda, el banner del evento con el bloque de su categoría, las funciones como tarjetas seleccionables y «Sobre la experiencia» plegado. A la derecha, la tarjeta fija «Tu entrada»: datos, acompañantes, términos, resumen y «Confirmar mi lugar». En teléfono, el total y el CTA quedan en una barra fija.
- **Pase como entrada.** Ticket horizontal con foto, datos y un talón troquelado con el QR sobre blanco y el código. Acciones: calendario, descargar, compartir el evento y ver el QR.
- **Compartir.** Usa el menú del sistema si existe. Si no, copia el link del evento (`?evento=…&funcion=…`) y lo avisa; nunca dice que se envió algo.
- **Festejo.** Confetti con transform y opacity, solo en una confirmación nueva. No se renderiza con movimiento reducido.
- **Diálogos de QR** con la misma estética. El QR de un evento en Comercial abre `/comercial/`.
- **Medido:** inscripción y pase sin scroll en 1440 × 900 y 1920 × 840, en ambos temas; los QR se leen desde los píxeles en pantalla.

## Lote 3 · Perfil, menú de perfil y notificaciones (hecho)

- **Perfil como tarjeta de cuenta:** identidad, tipo de acceso, organización y email, más atajos «N pases» y «N favoritos». Al lado, Preferencias con switches grandes y «Cerrar sesión» a todo el ancho. En 3D y 2D + 3D suma «Pausar/Reanudar movimiento».
- **Notificaciones.** Si hay un pase próximo, aparece como mini ticket con «Ver mi pase»; al cerrarlo, el foco vuelve a la campana.
- **Menú de perfil:** bloque de color con iniciales, datos, «Ver mi perfil» y «Cerrar sesión».
- **Medido:** el perfil entra en una pantalla en Comercial y Original (1440 × 900 y 390 × 844). Los popovers se recorren con teclado, cierran con Escape y devuelven el foco.
- **Pendiente:** en 3D y 2D + 3D, el perfil en 390 × 844 necesita scroll por el título con planeta.

## Lote 4 · Navegación y header (hecho)

- **Header sin barra arriba.** Al hacer scroll aparece la cápsula detrás del mismo layout: nada se mueve.
- **Navegación inferior móvil** con píldora activa, contadores de pases y favoritos, y área segura de iOS (`viewport-fit=cover`).
- **Menú «Ajustes»:** junta el switch de modo oscuro y la lista de versiones, con la versión actual marcada.
- **Medido:** header de 76 px en escritorio y 64 px en teléfono, arriba y con scroll. Sin superposiciones de 320 a 2560 px y targets de 44 px o más.

## Lote 5 · Administración (hecho)

- **Dashboard:**
  - título con contador y tres botones píldora de la misma altura;
  - KPIs en tarjetas;
  - tabla con la barra de filtros encima y filas más aireadas;
  - por fila, «Editar» más el menú «Más acciones»: vista previa, QR, duplicar y exportar;
  - en 900 px o menos, cada fila pasa a card.
- **Creador:**
  - stepper compacto;
  - el acceso (interno, interno y externo, o externo) se elige en el paso 1 y el paso 2 muestra su resumen;
  - la vista previa es el banner real de la home.
- **Registrar pase:**
  - a pantalla completa en teléfono, con la cámara como protagonista;
  - Cámara / Imagen / Código como selector segmentado;
  - aviso compacto si no hay permiso de cámara;
  - resultado como ticket, con «Registrar otro».
- **Medido:** el paso 1 del creador bajó de 2233 a 1488 px en 1440 × 900; los pasos 2 y 4 entran en una pantalla. Registrar pase ocupa exactamente 360 × 740 y 390 × 844, sin scroll en los estados de cámara y código.

## Lote 6 · Sistema visual y microinteracciones (hecho)

- **Tokens compartidos** en `src/tokens.css`:
  - radios 8 / 12 / 16 / 24 / 28;
  - sombras en tres niveles, con valores propios para tema oscuro;
  - duraciones 150 / 250 / 400 ms y curva de salida;
  - controles de 40 / 46 / 54 px;
  - anillo de foco.
- **Utilidades:** `.sr-only`, `.icon-only` (ícono centrado sin restos de texto oculto) y `.num-pill` (números centrados ópticamente).
- **Comercial:**
  - botones en tres tamaños, efecto al presionar y un mismo anillo de foco;
  - toasts navy en claro y blancos en oscuro;
  - paginación en píldoras;
  - skeleton detrás de las fotos y footer en una línea.
- **Skeleton** en lugar del spinner al cargar administración.
- **Centrado de íconos.** Una auditoría automática mide el centro de cada ícono respecto de su control en todas las vistas. Corrigió el botón «volver», cuya flecha quedaba 4 px corrida.

## Lote 7 · Calidad, accesibilidad y rendimiento (hecho, con un objetivo pendiente)

- **Accesibilidad.** `tests/a11y.spec.ts` audita Comercial con axe en claro y oscuro: home, inscripción, pase, Mis eventos, Favoritos, perfil, administración y acceso. Sin violaciones graves ni críticas. Contrastes corregidos: wordmark, chips y contadores sobre cian, etiquetas de categoría, «Mi pase», «SSO demo» y la etiqueta de acceso externo.
- **Imágenes.** Las fotos de eventos tienen copias WebP de 640, 800 y 1200 px con `srcset` (entre 30 % y 88 % más livianas que los JPG). El banner principal carga con prioridad alta; Comercial, Original y la página de versiones ya no descargan el fondo espacial.
- **Código.** La inscripción se carga al primer uso y se precarga con la primera señal de intención (puntero, toque o teclado).
- **Lighthouse móvil**, mediana de tres corridas:

  | Pantalla | Rendimiento | Accesibilidad | LCP | Peso |
  |---|---|---|---|---|
  | Home Comercial, antes | 87 | 96 | 3,6 s | 359 KB |
  | Home Comercial, ahora | 90 | 100 | 3,4 s | 318 KB |
  | Acceso, antes | 90 | 96 | 3,3 s | 358 KB |
  | Acceso, ahora | 94 | 96 | 2,8 s | 209 KB |

- **Pendiente:** LCP menor a 2,5 s. La foto del banner depende de que cargue el JavaScript; para bajarlo hace falta prerenderizar la home o precargar la imagen del primer banner desde el HTML.

## Lote 8 · Lo mejor en las otras versiones (hecho)

- Las cuatro versiones usan las mismas vistas de Mis eventos y Favoritos (`src/features/agenda/`); solo cambian el fondo y, en 3D y 2D + 3D, el planeta junto al título.
- **Tickets.** Las muescas son recortes reales (máscara CSS), así que el fondo se ve a través sobre colores planos, nebulosa o planetas.
- **Estados.** «Tu próximo» marca solo el primer pase que no empezó; uno en curso dice «En curso» y los finalizados van al final.
- **Acceso.** La pantalla de ingreso es dividida en todas las versiones: escenario de marca y panel con dos tarjetas grandes para elegir la puerta.
