# Funciones, reservas y QR de demostración

La original, la 3D y la híbrida comparten los eventos y las reservas locales. Cada evento puede ofrecer varias funciones: elegís la fecha y el horario antes de reservar. Los QR se generan en el navegador; no se envían a un servicio externo.

## Funciones de un evento

`EventItem.sessions` es opcional para conservar los eventos guardados anteriormente. Cada función tiene `id`, `name` opcional, `date`, `endDate`, `doorsDate` opcional, `capacity` y `registered`. Los cupos y las reservas se contabilizan por función. Supernova Sessions ofrece el viernes 23 de octubre de 2026 de 19 a 23 h, con puertas a las 18 h, y el sábado 24 de 21 a 23 h, con puertas a las 20 h.

Estas dos funciones se ven en un catálogo nuevo. Si el navegador ya tenía eventos guardados sin `sessions`, se conserva su función original: no se agregan horarios automáticamente ni se modifican las reservas existentes. Podés sumar funciones desde **Admin → Editar → Agregar función**.

`Registration.sessionId` identifica la función reservada y `sessionSnapshot` conserva sus datos. Una reserva anterior, sin función, pertenece a la función original con ID `${event.id}:main`. `getRegistrationSession` resuelve esta compatibilidad sin trasladar una reserva a otra fecha al agregar funciones anteriores. La UI, el calendario y los archivos de pase usan la función de la reserva.

El editor permite hasta 24 funciones, con nombre, inicio, fin, apertura de puertas y cupo propios. Valida fin posterior al inicio, apertura anterior o igual al inicio, horarios de inicio distintos y cupo que alcance a los inscriptos. Las funciones con reservas conservan sus fechas y no pueden eliminarse. El CSV de inscriptos incluye función, inicio y apertura de puertas. Los borradores siguen guardándose localmente.

## Dos QR con propósitos distintos

- **Usuario:** «Ver mi QR» abre un modal sobre el pase. El QR contiene un JSON con `type: "supernova-demo-pass"`, `version: 1`, `passId`, `eventId` y `sessionId`. No incluye nombre, email, acompañantes ni lista de invitados. Es una referencia a la reserva de demostración; no valida ingresos.
- **Admin:** el QR del evento contiene un enlace de la versión actual con `?evento=<id>&funcion=<id>`. El admin elige la función, copia el enlace o descarga el QR. Al abrirlo, la app muestra ese evento y selecciona esa función. Un borrador debe publicarse localmente antes de compartir su QR.

La descarga es un SVG vectorial con módulos oscuros `#09090b`, fondo blanco y margen de cuatro módulos. El QR se mantiene limpio, sin logo superpuesto ni gradientes. La generación carga `qrcode` solamente al pedir un QR y no requiere WebGL. Ambos modales usan `NativeDialog`, Escape y restitución del foco, con código o enlace textual si falla la generación.

El enlace admin usa el origen donde se ejecuta la app. Si es `127.0.0.1`, otro dispositivo necesita acceso a una instancia de la app: escanearlo no publica el sitio ni inicia un servidor público.

## Dependencias y fuentes

Generador: [`qrcode`](https://github.com/soldair/node-qrcode), mediante su API `create`. Lector de verificación: [`jsQR`](https://github.com/cozmo/jsQR), dependencia de desarrollo que decodifica píxeles de la imagen SVG renderizada. La interfaz no usa un servidor de QR, cámara ni API de validación.

## Contrato BE propuesto

No hay endpoints de emisión ni de control de acceso implementados. Para una integración real, el servidor debe emitir un token opaco o firmado asociado a reserva y función, autorizar la emisión, controlar vencimiento, revocación y reutilización, y registrar el ingreso de forma atómica. El lector de acceso necesitaría permisos propios y manejo explícito de desconexión. El JSON de la demo no es un token seguro y nunca debe aceptarse como autorización de acceso.

La disponibilidad de cada función, las reservas y su cancelación también requieren validación y actualización atómica en el backend. El frontend no puede garantizar cupos entre dispositivos. La persistencia actual usa `localStorage` y datos ficticios.

### Mensaje para Backend

**Contexto de la feature:** admin crea funciones; usuario elige horario, reserva, cancela y muestra su QR. Se espera disponibilidad compartida y control de acceso real al integrar un servidor.

**Qué ya quedó preparado en frontend:** editor y selector de funciones, reservas compatibles con datos anteriores, QR descargables y enlaces de evento en las tres versiones. La demostración local está completa.

**Dependencia backend detectada:** persistencia entre dispositivos, cupos concurrentes, identidad, permisos y emisión/revocación/validación de tokens requieren servidor.

**Cambio requerido en backend:** nuevos campos en request/response, persistencia, autorización y validación. Validar que las funciones tengan IDs estables; que el cupo no baje de los inscriptos; que reservar/cancelar y marcar ingreso sean operaciones atómicas; y que reintentos no dupliquen reservas ni liberaciones. El servidor debe autorizar al organizador a editar su evento, al usuario a consultar/cancelar su propia reserva y al personal de acceso a validar ingresos.

**Propuesta de contrato a validar:** método y ruta HTTP quedan por confirmar; estos son flujos funcionales propuestos, sin endpoints implementados.

```json
{
  "guardarFunciones": {
    "eventId": "supernova-sessions",
    "expectedRevision": 1,
    "sessions": [{ "id": "supernova-sessions:main", "date": "2026-10-23T22:00:00.000Z", "endDate": "2026-10-24T02:00:00.000Z", "doorsDate": "2026-10-23T21:00:00.000Z", "capacity": 240 }]
  },
  "reservarFuncion": {
    "eventId": "supernova-sessions",
    "sessionId": "supernova-sessions:main",
    "companions": 0,
    "idempotencyKey": "clave-unica-por-operacion"
  },
  "respuestaReserva": {
    "registrationId": "identificador-del-servidor",
    "sessionId": "supernova-sessions:main",
    "accessToken": "token-opaco-o-firmado-emitido-por-servidor",
    "expiresAt": "fecha-confirmada-por-servidor"
  }
}
```

La identidad sale de la sesión autenticada; el request no otorga roles ni decide el contador de inscriptos. El formato y los errores definitivos deben acordarse antes de conectar la UI.

### Siguiente paso Frontend cuando BE esté listo

**Estado actual del frontend:** demo completa con guardado local. La reserva compartida y el QR válido para ingreso real siguen fuera de esta implementación.

**Dependencia pendiente:** confirmar contratos de funciones, reservas, cancelación, token y validación de acceso, incluyendo permisos, idempotencia, conflicto de cupos, revocación y errores.

**Implementación frontend posterior:** conectar services/client y autenticación según el patrón acordado; reemplazar el guardado local por respuestas del servidor; incorporar tipos y estados de carga/error; generar el QR con el token emitido y refrescar disponibilidad/estado del pase. Mantener el modo demo explícito y no convertir su JSON de identificadores en una credencial real.

**Archivos o zonas afectadas:** `App.tsx`, la app original, `types.ts`, el editor de funciones, `RegistrationModal`, `MyEvents`, los helpers de funciones y `src/features/qr/`.

**Riesgos y criterio de cierre:** verificar dos usuarios reservando el último cupo, reintentos de reserva/cancelación, roles rechazados, reserva conservada al refrescar, token vencido/revocado y lectura repetida del mismo pase. La integración real se cierra cuando esos flujos funcionan con persistencia y autorización del servidor.

## Verificación

El 9 de octubre de 2026 se ejecutó `npx playwright test tests/qr.spec.ts --output=test-results-qr --reporter=line`: **6/6 finales aprobadas**, con un worker y Chrome headless local, en 1,1 min según el reporter.

Las pruebas decodifican el SVG que ve el usuario usando un lector independiente y comprueban IDs de reserva y función en las tres versiones, ausencia de datos personales, descarga SVG, enlace admin que selecciona la segunda función, Escape y restitución de foco. En 320 × 667 px verifican que las acciones del admin entren enteras dentro del viewport y del dialog, y decodifican el QR a su tamaño real de 180 px. También bloquean el chunk del generador y verifican que sigan disponibles el código textual y el pase, sin errores JavaScript no manejados en ese caso.

La [revisión final móvil](cambios-eventos/captures-qr/admin-mobile-final/README.md) tiene seis escenarios y doce PNG: QR admin de las tres versiones en ambos temas, más selector y pase claros en 320 px. No hubo errores JavaScript, HTTP, solicitudes fallidas ni problemas en las mediciones de layout. La fila de acciones del QR termina a 623,73 px, dentro de los 667 px del viewport, en los seis escenarios. Los tres pases claros entran sin scroll ni acciones superpuestas. No se verificaron cámaras ni dispositivos móviles físicos.

Se conservaron [48 capturas anteriores al último pulido](cambios-eventos/captures-qr/README.md) para comparar. La revisión final es la referencia de QR admin compacto y contraste del selector/pase claros.
## QR dentro del pase y registro de ingresos · 13 de octubre de 2026

El QR se muestra directamente en el pase y en su SVG descargable. Conserva el payload de demostración con `type`, `version`, `passId`, `eventId` y `sessionId`, sin nombre ni email. El admin ofrece **Registrar pase** con lectura local de imágenes y entrada de código, validación contra reservas vigentes y registro explícito del ingreso. La reserva, el evento, la función y el estado se vuelven a comprobar antes de guardar; un pase ya usado no admite un segundo ingreso.

Los ingresos se persisten localmente en `supernova-pass-check-ins-v1`, con `passId`, `eventId`, `sessionId`, `admittedAt` y cantidad de personas. No modifican los cupos ni reemplazan una inscripción. La demo sólo reconoce los pases de ese navegador. La cámara se activa exclusivamente al tocar **Abrir cámara**, solicita permiso y prioriza la trasera. Se libera el stream al leer un QR, detener la lectura, cerrar el diálogo o salir de la pestaña; también se detiene un permiso que responde después de cerrar. La lectura usa el mismo decoder local que los archivos. Se conservan la imagen y el código cuando no hay acceso a cámara.

El resultado muestra los datos humanos de la reserva local, incluido el email, pero el payload del QR sigue conteniendo únicamente identificadores. La elección de evento y función no se cambia según el QR; un pase de otra función se rechaza y la admisión requiere confirmación explícita. El acceso desde celulares exige HTTPS (o `localhost` durante desarrollo), según [Media Capture](https://www.w3.org/TR/mediacapture-streams/#dom-mediadevices-getusermedia). No se envían imágenes ni video a un servidor.

Para producción, el contrato propuesto requiere un token opaco o firmado emitido por servidor, verificación de evento/función y permisos del operador, estado vigente de la reserva, reglas de horario de acceso y un registro atómico e idempotente contra duplicados. El servidor devuelve un resultado equivalente a válido, inexistente/cancelado, otra función, vencido o ya ingresado, más los datos mínimos necesarios para admitir al titular. Son capacidades propuestas: no hay endpoints ni integración de acceso real implementados.

La [entrega de legibilidad y pases](cambios-eventos/legibilidad-y-registro-de-pases.md) describe el recorrido actual y su evidencia.

