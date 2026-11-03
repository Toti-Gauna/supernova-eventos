# Versión Comercial

Cuarta versión de Órbita, en [`/comercial/`](http://127.0.0.1:5173/comercial/). Lleva a todo el sitio la estética del banner «No te lo pierdas»: bloques cian y azul cortados en diagonal, títulos navy firmes, datos en píldoras blancas, CTA en píldora navy y fotos con borde blanco. Es la versión más cercana a la composición de [personal.com.ar](https://www.personal.com.ar/).

## Qué cambia respecto de las otras versiones

- **Sin espacio.** No hay nebulosa animada, estrellas, planetas, escena 3D ni intro cinematográfica. El primer cuadro solar del HTML se oculta desde el `<head>` y React lo retira al montar. No se descargan los chunks de Three ni de la intro.
- **Tema claro por defecto.** Comercial guarda su propia preferencia en `orbita-commercial-theme-v1`, así que cambiar su tema no altera el de Original, 3D o 2D + 3D. El modo oscuro mantiene los banners brillantes sobre navy.
- **Home tipo promo.** `CommercialHero` reemplaza al hero espacial con un carrusel de hasta cuatro eventos vigentes (primero el destacado), armado con `FeaturedBanner`:
  - pestañas con barra de progreso, como el carrusel de Personal;
  - flechas en escritorio y botón «Ver todas las experiencias»;
  - rotación cada 7 segundos, que se detiene con hover, con foco, con el botón de pausa o con movimiento reducido (en ese caso no rota);
  - en pantallas angostas las pestañas son la navegación, sin flechas sobre el banner.
- **Una pantalla.** En 1920 × 840 el banner mide unos 330 px y el título del catálogo aparece en la primera pantalla; en teléfonos la foto del banner se reduce a una franja superior.
- **Menos texto, más acción.** El catálogo arranca con una sola barra:
  - «Experiencias» con su contador, y búsqueda, orden y filtros en la misma fila;
  - debajo, chips de categoría con el ícono en el color de cada una («Todas» en lugar de «Todo el universo»);
  - sin antetítulo, frase de cierre ni bajada en las cards; el resumen de resultados queda para lectores de pantalla.

  La banda de novedades queda en título y botón, y el footer sin texto de relleno.
- **Tu próximo pase.** Si la persona tiene una inscripción vigente, el carrusel muestra un atajo con el evento y la fecha que abre el pase en un toque. Sin pase, ese lugar es «Ver todas las experiencias».
- **Estilo.** Header blanco con el wordmark en cian, cards blancas con sombra suave, CTA navy alineados al pie de cada card. Las reglas están en `src/commercial.css`, todas bajo `html[data-experience='commercial']`.

## Lo que comparte

Usa la app de la versión Original con `variant="commercial"`: mismos eventos, pases, favoritos, borradores, accesos interno y externo, administración y QR. La sesión y los datos guardados se conservan al cambiar de versión desde el header o desde [la página de versiones](http://127.0.0.1:5173/versiones/).

## Pruebas

`tests/commercial.spec.ts` cubre:

- ausencia de espacio, de canvas, de intro y de sus descargas;
- tema claro independiente;
- carrusel con pestañas, flechas, inscripción y salto al catálogo;
- rotación automática y pausa;
- atajo «Tu próximo pase» que abre el pase y devuelve el foco;
- cambio de versión conservando la sesión y los favoritos.

`tests/access.spec.ts` verifica la pantalla de acceso también en `/comercial/`, y que entre sin scroll en 1366 × 660 y en 390 × 844 (con el selector de tarjetas).
