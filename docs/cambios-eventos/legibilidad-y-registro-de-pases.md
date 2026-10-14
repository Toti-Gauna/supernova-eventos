# Eventos legibles y registro de pases · 13 de octubre de 2026

El inicio espacial muestra fotos y textos más grandes. Las tres filas ofrecen **dos próximas funciones disponibles para anotarse y la próxima función en la que el usuario tiene una reserva**. La tercera fila abre su pase. Si no existe una reserva vigente con esos filtros, se muestra un estado vacío; no se inventa una inscripción ni se coloca un evento vencido en su lugar.

La selección resuelve funciones concretas, evita funciones completas, terminadas o ya reservadas y conserva los filtros del catálogo. Un evento con otra función disponible puede ofrecerla aunque el usuario ya tenga una reserva en un horario diferente. El catálogo sigue debajo con búsqueda, filtros y paginación.

Las tarjetas priorizan imágenes de 72 px, títulos de 18 px, fecha y horario de 13 px, y acciones de al menos 44 px. En celulares las fotos son de 64 px y los títulos permiten dos líneas. El hero reparte aproximadamente 70 % al contenido y 30 % al planeta, cuyo diámetro se limita a 230 px. Los encabezados secundarios reservan unos 110–120 px y alternan el planeta entre izquierda y derecha. El detalle de un evento también reduce su espacio decorativo para acercar la información y el formulario.

El fondo mantiene la nebulosa y las partículas autónomas de Tour, pero ninguna capa ni cámara reacciona al movimiento del mouse. Las rotaciones, los viajes, la pausa manual y el movimiento reducido conservan sus funciones.

## QR en el pase

El QR negro sobre blanco aparece dentro del pase, con margen de lectura de cuatro módulos. **Descargar pase** genera un SVG que incluye ese mismo QR junto al evento, horario y datos del titular. **Ver mi QR** sigue disponible para ampliarlo. El QR contiene sólo identificadores de pase, evento y función; no incluye nombre ni email.

## Registrar pase en administración

El botón **Registrar pase** abre un diálogo con evento y función. **Abrir cámara** solicita el permiso del navegador y prioriza la cámara trasera del celular. El lector reconoce el QR del video y detiene la cámara al encontrarlo, al cerrar o al ocultar la pestaña. Se puede reintentar un permiso rechazado, leer una imagen PNG, JPG, WebP o SVG —incluido el pase descargado— o pegar el contenido del QR o su código. La lectura ocurre localmente; no se suben imágenes ni video.

Desde un celular, el acceso a cámara requiere HTTPS; `localhost` permite la prueba local. Es un requisito del navegador documentado en la [especificación de Media Capture](https://www.w3.org/TR/mediacapture-streams/#dom-mediadevices-getusermedia). Si la cámara no está disponible o el permiso se rechaza, permanecen la imagen y el código.

La validación exige una reserva vigente y coincidencia del evento y la función. Rechaza formatos y versiones inválidas, identificadores inexistentes, datos adulterados y funciones terminadas o eliminadas. Si el pase es válido, muestra titular, email, evento, función, fecha, horario, ubicación, acompañantes, lugares, código y estado del ingreso y ofrece **Registrar ingreso**. Leer el QR no admite a la persona automáticamente. La confirmación vuelve a comprobar los datos y evita guardar un ingreso duplicado. Las reservas canceladas dejan de ser válidas.

Los ingresos se guardan en `supernova-pass-check-ins-v1`. En navegadores con Web Locks se serializa el registro entre pestañas del mismo origen. Esto es una **demo local**: sólo reconoce las reservas guardadas en ese navegador. La autorización de acceso real y la validación entre dispositivos requieren servidor; el [contrato propuesto](../qr-y-funciones.md) detalla ese límite.

## Evidencia

La carga espacial transfiere el sistema solar a la cámara entre 1,0 y 1,2 s. La Tierra conserva el centro y diámetro del SVG, se acerca primero en esa posición y después aterriza en la región derecha del hero. El planeta violeta de respaldo se retiró y los fallbacks quedan ocultos durante la intro. La misma referencia de encuadre se usa en 3D e híbrida; se conserva el límite de cuatro segundos, Escape, movimiento reducido y el fondo persistente. [Cierre y capturas de la intro](../trailer/experiencia-3d/03-cierre.md).

Los resultados ejecutados se registran en [validación](../validation.md). Las capturas de esta composición están en la [galería de legibilidad](captures-readability/README.md); las anteriores se conservan como historial. No se hace deploy.
