# Funciones, navegación y QR

Las tres versiones conservan sus rutas independientes: `/original/`, `/3d/` y `/hibrida/`. El menú **Ajustes** del header (antes, el botón **Cambiar versión**) permite elegir otra presentación. Los eventos, pases, favoritos y borradores se comparten en el navegador. No se publicó ni desplegó este cambio.

## Recorrido del usuario

Las versiones espaciales muestran buscador y tarjetas legibles con **dos funciones próximas disponibles y la próxima reserva del usuario**, junto a un planeta pequeño. El catálogo continúa debajo. Los encabezados secundarios son compactos, los planetas alternan lados y el fondo de Tour conserva sus partículas sin reaccionar al mouse. [Legibilidad y registro de pases](legibilidad-y-registro-de-pases.md) describe esta entrega. [Inicio orbital](inicio-orbital.md) conserva el recorrido anterior como historial. Original mantiene su layout clásico.

El hero lleva directamente al catálogo con **Ver eventos**, sin el párrafo largo ni los datos sociales. La navegación permite volver desde Mis eventos, Favoritos, Perfil, administración y el detalle del evento. Cerrar un detalle devuelve el foco al control que lo abrió.

Un evento puede ofrecer varias funciones. Cada una muestra fecha, apertura de puertas, inicio y disponibilidad propios. Al cambiar de horario, el formulario conserva los datos y ajusta los acompañantes al cupo disponible. Una función completa o terminada no impide reservar otra. Si ya tenés un pase, **Elegir otra función** permite reservar otra fecha del mismo evento.

El pase, Mis eventos, el calendario visual, el archivo ICS y la descarga del pase usan la función reservada. Los calendarios tienen un UID por función para poder guardar ambas fechas. Una cancelación libera solamente los lugares de esa reserva, incluyendo acompañantes. Las reservas repetidas en el mismo turno se deduplican por evento y función.

## Administración

**Agregar función** permite definir hasta 24 horarios por evento, con nombre, inicio, fin, apertura opcional y cupo. El editor valida fechas distintas, fin posterior al inicio, puertas antes del show y cupos enteros. Los horarios con inscriptos se conservan y no se pueden quitar; el cupo debe cubrir los lugares ocupados. La exportación CSV identifica cada función.

El QR del admin comparte el evento y una función elegida, conservando la versión de la app. El QR del usuario aparece dentro del pase y de su descarga, sin nombre ni email en su payload. **Registrar pase** valida una imagen QR o código contra la reserva vigente y permite registrar un ingreso local sin duplicados. Los borradores todavía no tienen un enlace público.

## Compatibilidad y alcance

Los eventos anteriores sin `sessions` conservan su función original; las reservas anteriores sin `sessionId` siguen asociadas a ella aunque se agregue una fecha previa. No se reemplazan eventos locales existentes por nuevos datos de muestra. En una instalación limpia, Supernova Sessions ofrece viernes 23 de octubre de 2026 a las 19 h y sábado 24 a las 21 h; en datos anteriores se pueden agregar funciones desde administración.

La demo incluye seis experiencias próximas y el archivo ficticio **Bajo la misma órbita**, finalizado el 4 de octubre de 2026. Se añade una sola vez al catálogo anterior únicamente si conserva los seis IDs originales, incluso si ya tiene eventos propios adicionales; sus campos editados, eventos agregados y pases se mantienen. Un catálogo enteramente personalizado no recibe eventos adicionales y un archivo eliminado no reaparece al recargar o cambiar de versión. La marca `supernova-demo-archive-v1` se guarda después de persistir los eventos.

La persistencia usa `localStorage` y datos ficticios. Los QR de pase son de demostración y no autorizan ingresos reales. [Datos, QR y contratos BE propuestos](../qr-y-funciones.md) documenta la integración futura y los límites de los enlaces entre dispositivos.

## Revisión visual

- [Entrega actual: tarjetas legibles, planetas compactos, QR y registro de pases](captures-readability/README.md).
- [Inicio orbital anterior: planetas, tres eventos y catálogo al bajar](captures-orbital/README.md).
- [Hero, selector de versiones, navegación y foco](captures-navigation/README.md).
- [Funciones, pases y QR en las tres versiones](captures-qr/README.md).

Las capturas previas de la experiencia híbrida se conservan como registro de esa implementación.

## Verificación anterior · 9 de octubre

Build aprobado; 94/94 E2E en la corrida integrada y 9/9 pruebas afectadas después del último ajuste de compatibilidad, incluyendo un caso nuevo de catálogo con eventos propios adicionales. Son 95 casos únicos cubiertos. [Validación completa](../validation.md) registra las pruebas y los límites de la demo.
