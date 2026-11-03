# Plan por lotes · experiencia premium

El objetivo es que Órbita se sienta premium de punta a punta, empezando por la versión Comercial. Las reglas que valen para todos los lotes:

- menos texto y más acción;
- todo lo importante en la primera pantalla;
- una sola estética (banners de color, cards blancas, CTA en píldora);
- accesible.

Cada lote se cierra con lo mismo:

- `npm run build`, los E2E del área y la suite completa;
- capturas en 1920 × 840, 1440 × 900 y 390 × 844, en tema claro y oscuro;
- un commit y un deploy.

## Lote 1 · Home, Mis eventos y Favoritos (hecho)

- Banda «Que nada te pase de largo» como franja debajo del carrusel.
- **Mis eventos:** encabezado de una línea (título, contador, estado y acción) y cada pase como ticket. El ticket tiene foto, estado, fecha, datos en chips, línea troquelada, «Ver mi pase» y botón de calendario. El vacío ofrece una acción directa.
- **Favoritos:**
  - mismo encabezado, con la búsqueda integrada;
  - si está vacío, muestra tres planes para guardar con un toque.
- Migración de los eventos de ejemplo guardados con la marca anterior.

## Lote 2 · Inscripción y pase

Es el momento de conversión: tiene que sentirse como comprar una entrada.

- Inscripción en una sola pantalla en desktop:
  - foto del evento con el bloque de color de su categoría;
  - funciones como tarjetas seleccionables y resumen fijo con el CTA.
- Pase confirmado como entrada premium: QR protagonista, código, fecha, lugar, acompañantes, acciones (descargar, calendario, compartir el link del evento) y un microfestejo con movimiento reducido respetado.
- Diálogo de QR y de registro de ingreso con la misma estética.
- **Listo cuando:** la inscripción y el pase entran sin scroll en 1440 × 900 y 1920 × 840; los QR se leen desde los píxeles; el foco y Escape funcionan igual que hoy.

## Lote 3 · Perfil, menú de perfil y notificaciones

- Perfil como tarjeta de cuenta:
  - identidad, tipo de acceso (interno o externo) y organización;
  - preferencias con switches grandes y cierre de sesión claro.
- Popovers del header (perfil y notificaciones) con la misma tarjeta y acciones directas, como «Ver mi pase» si hay uno próximo.
- **Listo cuando:** el perfil entra en una pantalla y los popovers se navegan con teclado, cierran con Escape y devuelven el foco.

## Lote 4 · Navegación y header

- Header más liviano en la parte superior y cápsula flotante al hacer scroll, con el wordmark y la sección activa más claros.
- Navegación inferior móvil con indicador activo, contador de pases y área segura iOS.
- Selector de versión y botón de tema integrados en un solo menú compacto.
- **Listo cuando:** no hay saltos de layout entre la parte superior y el scroll; los targets miden 44 px o más; nada se superpone a 320 px.

## Lote 5 · Administración

- Dashboard con KPIs en tarjetas, tabla con filas más aireadas y acciones por fila en un menú. En móvil, la tabla pasa a cards.
- Creador de eventos:
  - pasos compactos y vista previa del banner real del evento (el mismo de la home);
  - acceso (interno, externo o ambos) visible desde el primer paso.
- Registrar pase y editor de funciones con la misma estética.
- **Listo cuando:** crear un evento lleva menos scroll que hoy, la vista previa coincide con la home y los E2E del creador pasan.

## Lote 6 · Sistema visual y microinteracciones

- Tokens únicos:
  - escala de espaciado y radios (12 / 16 / 24 / 28);
  - sombras en tres niveles y duraciones de movimiento (150 / 250 / 400 ms).
- Escala tipográfica, botones en tres tamaños, inputs y toasts unificados.
- Estados de carga con skeleton en lugar de spinners. Hover y press en cards y CTA. Transición suave entre vistas.
- **Listo cuando:** no quedan colores ni radios sueltos fuera de los tokens en Comercial y todo respeta `prefers-reduced-motion`.

## Lote 7 · Calidad, accesibilidad y rendimiento

- Auditoría AA de contraste en ambos temas, foco visible en fondos de color y revisión con lector de pantalla del carrusel, el acceso y la inscripción.
- Imágenes responsive (WebP y `srcset`), precarga de la foto del primer banner y lazy loading del resto.
- Presupuesto: LCP < 2,5 s y CLS < 0,05 en la home Comercial (Lighthouse móvil).
- **Listo cuando:** axe no reporta errores críticos en Comercial y Lighthouse da 90 o más en rendimiento y accesibilidad.

## Lote 8 · Llevar lo mejor a las otras versiones

Aplicar en Original, 3D y 2D + 3D los encabezados de una línea, los tickets de Mis eventos y los favoritos con sugerencias, sin tocar sus fondos espaciales.

- **Listo cuando:** las cuatro versiones comparten los mismos componentes de vistas y solo cambian el fondo y el hero.
