# Órbita · identidad y dirección visual

La micro-app de eventos pasa a llamarse **Órbita**. El pedido tiene cuatro puntos:

1. El producto se llama Órbita.
2. Accesos distintos para personal interno y externo ([modelo y contrato propuesto](accesos.md)).
3. Colorimetría y composición más cercanas a la marca Personal.
4. Inspiración en los eventos de Personal.

«Personal» se interpreta como la marca: desde diciembre de 2025 Telecom Argentina integra todos sus servicios bajo Personal («Cada vez más Personal»). La paleta y la composición se tomaron de [personal.com.ar](https://www.personal.com.ar/), relevada el 3 de noviembre de 2026. No se usan su logo, sus fuentes propietarias (Pulso) ni sus piezas gráficas: Órbita conserva su marca, su símbolo de estrella en órbita y sus fuentes (DM Sans y Manrope).

## Nombre

- Wordmark en minúscula: `órbita`, con la sección `EVENTOS`. Título del documento: «Órbita — Eventos que nos conectan».
- Los textos visibles dicen Órbita. Los identificadores internos (`supernova-*` en `localStorage`, eventos `supernova:*`, componentes `Supernova*`, ids de eventos y la ruta `/supernova-eventos/` de GitHub Pages) se conservan para no perder datos guardados ni romper enlaces.
- La organización visible pasa de Telefónica a Personal en textos genéricos (footer, perfil, términos). Los datos de personas siguen siendo ficticios.

## Paleta

Tokens de referencia. En CSS se exponen como variables en `:root` y `html[data-theme='light']`.

| Rol | Noche (oscuro) | Día (claro) | Origen en Personal |
| --- | --- | --- | --- |
| Fondo | `#030B1C` | `#F5F7FA` | navy `#052C50`, grises `#FAFAFA` / `#F2F4F6` |
| Panel | `#0B1730` | `#FFFFFF` | cards blancas |
| Superficie elevada | `#102041` | `#EAF1FB` | celeste pálido `#E8F8FF` |
| Texto | `#EEF5FF` | `#052C50` | navy `#052C50` |
| Texto secundario | `#9FB3D1` | `#4A5D78` | `#4A4A68` |
| Acento | `#4EC5FF` | `#2348DE` | cian `#4EC5FF` / azul `#2348DE` |
| Acento fuerte | `#1EB2F5` | `#0B51DF` | `#1EB2F5` / `#0B51DF` |
| Violeta | `#7B6CF6` | `#4E26B1` | `#5A50F9`, `#4E26B1`, `#3C009F` |
| Magenta | `#E0479E` | `#CB437F` | `#CB437F` y el magenta de sus banners |
| Verde | `#18C39A` | `#0E9C7A` | `#18C39A` |
| Línea | `#BFE6FF1A` | `#052C501A` | — |

Degradés:

- **Gradiente Órbita** (CTA y bandas): `linear-gradient(110deg, #1EB2F5 0%, #2348DE 55%, #5A50F9 100%)`.
- **Bloque festival** (banner destacado): cian `#1EB2F5` cortado en diagonal por magenta `#D94FD0`, como los banners promocionales de Personal.
- **Espacio**: la nebulosa pasa de violeta a azul noche con brillos cian y algún acento magenta; deja de dominar el violeta.

### Colores por categoría

Inspirados en los íconos de servicio de Personal (cada servicio tiene un color propio). Se usan en las píldoras de categoría, en los planetas y en los acentos de cada card.

| Categoría | Color | Variante clara |
| --- | --- | --- |
| Música | `#E0479E` magenta | `#C7357F` |
| Bienestar | `#18C39A` verde | `#0E9C7A` |
| Tecnología | `#1EB2F5` cian | `#0A8FD0` |
| Comunidad | `#7B6CF6` violeta | `#5A50F9` |
| Aprendizaje | `#4D7CFF` azul | `#2348DE` |

## Composición

Las reglas viven en `src/orbita.css` (cargado al final) y en los componentes nuevos.

- Wordmark y títulos más firmes (700). La pantalla de acceso usa encabezado centrado con bajada, como «¡Conocé todas las ofertas!» en Personal. El catálogo conserva su encabezado a la izquierda para no mover la composición orbital ni el inicio móvil.
- Cards navy o blancas con radio 22 px, una franja superior y una píldora sólida con el color de su categoría.
- CTA principales sólidos, en píldora, con el acento de cada tema. «Me sumo» pasa a ser una píldora suave.
- La banda de novedades usa el gradiente Órbita a todo el ancho del contenedor, con un aro como motivo, al estilo de las bandas promocionales de Personal.
- Banner «No te lo pierdas» (`FeaturedBanner`) entre el catálogo y la banda: bloque cian cortado en diagonal por el color de la categoría, título de cartel de festival, datos en píldoras y CTA «Quiero ir». Es el guiño a los eventos de Personal (Personal Fest). Toma el evento destacado vigente o el próximo.
  Es compacto a propósito: unos 330 px de alto en 1920 × 840 y 275 px en 1366 × 660, con el título limitado a dos líneas, para que el contenido siguiente asome en la primera pantalla. En teléfonos la foto pasa a una franja superior. El foco del CTA es un anillo navy con halo blanco, visible sobre el cian.
- La pantalla de acceso es un panel de vidrio (blur) que entra en una sola pantalla y difumina el fondo de cada versión. Las dos tarjetas llevan la píldora sobre el borde superior, como las cards de servicios de Personal. En teléfonos, un selector «Personal interno / Personal externo» muestra una tarjeta por vez.
- La [versión Comercial](comercial.md) lleva esta estética a todo el sitio, sin espacio ni planetas.
- Se mantienen el header normal arriba, la cápsula flotante al hacer scroll, la navegación inferior en móvil y la ausencia de sidebar.
