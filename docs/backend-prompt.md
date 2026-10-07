# Prompt para implementar el backend de Supernova Eventos

Copiar este documento como instrucción de trabajo para el equipo o agente backend. **No existe un backend en este repositorio.** Los modelos, rutas y decisiones de infraestructura que siguen son una **propuesta a validar**, no contratos entregados por Telefónica. El alcance implementado hoy es un frontend de demostración con datos ficticios y persistencia local.

## Instrucción de trabajo

Implementá el backend de la micro-app Supernova Eventos para colaboradores de Telefónica. Conservá los flujos del frontend Vite/React/TypeScript y su estética; reemplazá los mocks mediante una capa de integración tipada. Antes de elegir stack o conectar sistemas, inspeccioná el repositorio, acordá el contrato y documentá las decisiones. No supongas el esquema de la Tabla de nómina, el protocolo SSO, los roles corporativos, las credenciales, el proveedor de correo ni una infraestructura que no te hayan entregado. Podés avanzar con adaptadores, datos sintéticos y pruebas hasta disponer de esas definiciones.

Entregá código ejecutable, migraciones, OpenAPI, pruebas relevantes, configuración de ejemplo sin secretos, instrucciones para desarrollo y despliegue y un informe de integración frontend. No confundas una pantalla que simula una acción con una integración real.

## Producto y flujos que debe soportar

1. Home con evento destacado, catálogo paginado, búsqueda y filtros por categoría, modalidad y disponibilidad. Sólo devolver eventos visibles para la identidad autenticada.
2. Detalle e inscripción fullscreen con confirmación de identidad, cantidad de acompañantes y aceptación de términos cuando corresponda. Una confirmación persistida habilita pase fullscreen, calendario mensual custom, descarga ICS y cancelación. El calendario sólo presenta la fecha del evento; no modifica la reserva.
3. Mis eventos: futuras inscripciones, eventos finalizados y estado actual de cada inscripción. El calendario usa datos del evento y zona horaria real.
4. Administración con listado, métricas verificables y creador por pasos: información general, audiencia, plantilla de email y revisión/publicación. Permitir guardar borradores, volver a editarlos y publicar con validación completa.
5. Audiencia de invitaciones a toda la compañía, selección desde la Tabla de nómina o importación Excel/CSV con vista previa antes de confirmar.
6. Plantilla de email específica por evento con vista previa individual. Crear una campaña, enviar prueba, programar, consultar resultado y reintentar errores bajo reglas explícitas.
7. Mis favoritos: guardar y quitar eventos de forma idempotente, consultar los guardados con búsqueda y paginación. Persistirlos por identidad y compañía; revalidar visibilidad al devolverlos y no mostrar borradores ni eventos privados cuyo acceso se haya revocado.
8. Mi perfil con identidad corporativa de solo lectura y preferencias de comunicaciones persistidas. Reemplazar el cierre de sesión local de la demo por la invalidación de la sesión verificada y el logout acordado con el host.

El dashboard administrativo ahora aplica filtros por nombre, estado, audiencia y fechas, muestra métricas de los resultados y pagina hasta diez eventos por vista. Definir el rango de fechas en la zona del evento y devolver conteo total y métricas para el conjunto autorizado filtrado, no solo para la página actual. El frontend no debe calcular esas métricas a partir de una respuesta incompleta. TyC se omite cuando su toggle está desactivado; las condiciones publicadas deben quedar versionadas.

El frontend no envía correos, no lee nómina real, no implementa SSO ni aplica autorización confiable. Cambiar a la vista Administración en el mock es una herramienta de demostración. `localStorage` puede modificarse desde el navegador y no debe convertirse en fuente de autoridad.

## Preguntas de integración a resolver al inicio

- ¿La micro-app se abre de forma independiente, mediante un enlace del portal o dentro de un iframe? ¿Qué orígenes son confiables y cuáles son las restricciones de cookies/CSP?
- ¿Qué mecanismo SSO ofrece el host y cómo se verifica la identidad en servidor? Obtener issuer, audience, mecanismo de validación, expiración, logout y claves/certificados oficiales; no deducirlos de capturas.
- ¿Qué identificador estable vincula identidad, colaborador y Tabla de nómina? ¿Cómo se representan bajas, cambios de email y pertenencia a compañía?
- ¿Qué tecnología y esquema real tiene la Tabla de nómina? ¿Hay API o réplica autorizada de lectura? ¿Qué columnas, filtros y permisos se pueden usar?
- ¿Qué roles y alcances corporativos autorizan crear, publicar, exportar asistentes, enviar campañas y registrar asistencia?
- ¿Qué proveedor de email, remitente verificado y dominio se usarán? ¿Qué límites, políticas de comunicaciones y tratamiento de bajas aplican?
- ¿Qué zonas horarias, política de retención, residencia de datos y reglas de acompañantes deben aplicarse?

Registrar las respuestas en una decisión de arquitectura. Hasta entonces usar un proveedor SSO ficticio exclusivo de desarrollo y un adaptador de nómina sintético; jamás habilitarlos en producción.

## Identidad, autorización y privacidad

- El servidor autentica cada operación y obtiene `userId`, compañía y roles de una fuente verificada. No aceptar rol, email o compañía como autoridad enviados por el cliente, en query strings o en una selección visual.
- Si se integra por intercambio de token del host, verificarlo con su mecanismo oficial y emitir una sesión de la app. Si hay iframe/postMessage, acordar protocolo y validar origen exacto; nunca aceptar mensajes de cualquier origen. No guardar secretos ni tokens de producción en `localStorage`.
- Elegir sesión/cookie segura o bearer según la integración real. Para cookies configurar HttpOnly, Secure, SameSite y protección CSRF según el despliegue. CORS y CSP deben usar listas explícitas de orígenes.
- Proponer roles `employee`, `event_editor`, `event_publisher`, `communications_admin`, `checkin_operator` y `event_admin`, sujetos a mapeo corporativo. Aplicar RBAC y alcance de compañía en servidor. Un editor no obtiene permiso de envío automáticamente.
- Un evento público se muestra a colaboradores autenticados de su compañía. Un evento privado exige pertenencia a su audiencia autorizada en **listado, búsqueda, detalle, inscripción, calendario y archivos**. No basta ocultar tarjetas en frontend.
- Separar audiencia de notificación de política de visibilidad. Un evento público puede tener invitaciones segmentadas; eso no restringe el acceso. Un evento privado usa una lista autorizada explícita. El wizard de la demo actualmente convierte audiencias segmentadas en eventos privados y audiencia de compañía en abierta; ampliar esta opción requiere un cambio de contrato y de UI, no asumir que el mock ya las administra independientemente. Definir si la lista privada se congela al publicar o se actualiza con nómina y qué ocurre con bajas; recomendación inicial: snapshot auditable al publicar, con cambios explícitos.
- No exponer emails, nombres de invitados, listas de nómina ni credenciales en DTOs públicos. Para evitar enumeración, devolver un error indistinguible de inexistencia cuando alguien no tiene acceso al evento privado.
- La identidad inscripta proviene de SSO. Permitir nombre preferido sólo como dato de presentación. No permitir que cambiar un email en el modal inscriba a otra persona.
- Registrar acciones administrativas, acceso a exportaciones y cambios de privacidad con actor, recurso, instante UTC y resultado. Nunca guardar tokens, cuerpos completos de nómina ni emails personalizados en logs generales.

## Modelo propuesto a validar

Usar almacenamiento transaccional. PostgreSQL es una opción propuesta si no existe estándar corporativo; no es requisito ni una integración existente. Identificadores opacos, auditoría, versión de concurrencia y fechas UTC. Mantener zona IANA del evento, por ejemplo `America/Montevideo`, separada del instante.

| Entidad | Campos y responsabilidad propuestos |
| --- | --- |
| Company | Identificador de compañía y configuración autorizada; no derivarlo del dominio del email sin acuerdo. |
| User | Identidad corporativa estable, referencia a compañía y datos mínimos sincronizados; roles resueltos en servidor. |
| Event | Título, subtítulo, categoría, descripción, organizador, ubicación o URL de acceso, modalidad, inicio/fin, zona horaria, capacidad, límite de acompañantes, imagen referenciada por asset, destacado, privacidad, términos/versiones, estado y versión de edición. |
| AudienceDefinition | Fuente `all`, `payroll` o `excel`, filtros o importación referenciada; propósito de visibilidad y/o notificación. |
| AudienceMember | Snapshot de usuario/destinatario autorizado con identificador corporativo cuando existe; origen, versión y estado. No usar sólo el email como clave de identidad. |
| AudienceImport | Archivo, checksum, tamaño, estado de procesamiento, columnas mapeadas, conteos, errores por fila, expiración y actor. |
| EmailTemplateVersion | Evento, versión inmutable, asunto, título, texto/campos permitidos, CTA, color validado y autor. |
| EmailCampaign | Evento, versión de plantilla, snapshot de audiencia, tipo, programación, zona horaria, estado y actor. |
| EmailDelivery | Destinatario, campaña, estado, intentos, identificador del proveedor, próxima tentativa y causa de error redactada. |
| Registration | Evento, usuario, estado, acompañantes, plazas, versión de términos aceptada, fecha, cancelación y clave de idempotencia. |
| Favorite | Usuario, compañía, evento y fecha de guardado. Unicidad por `(eventId, userId)`; no concede acceso ni reserva una plaza. |
| WaitlistEntry | Orden estable de espera, plazas solicitadas y estado; sólo si se aprueba el alcance de lista de espera. |
| Ticket | Inscripción, token opaco o hash, revocación y uso para asistencia; no incluir PII dentro del QR. |
| Asset | Ubicación del objeto, tipo, tamaño, dueño, checksum, estado de revisión y permisos. |
| OutboxMessage | Evento interno producido en la misma transacción que el cambio de negocio; entregado luego por un worker. |
| AuditRecord | Actor y compañía, operación, recurso, cambios mínimos, timestamp y correlation ID. |

Crear migraciones e índices para: eventos por compañía/estado/fecha; búsqueda según motor elegido; miembros de audiencia por evento/usuario; inscripciones por usuario y fecha; estado y próxima tentativa de envíos; imports y assets por propietario. Asegurar unicidad de una inscripción lógica por `(eventId, userId)`, membresía por `(audienceVersionId, userId)` y una entrega por `(campaignId, recipientId, notificationType)`. Definir unicidad de destinatarios sin identidad SSO de acuerdo con las reglas de importación, sin permitir su inscripción por email arbitrario.

Separar estados persistidos del evento de disponibilidad calculada. El FE actual usa `draft`, `published`, `ended`; extender sólo con un contrato aprobado, por ejemplo `cancelled`. `published` no garantiza cupo ni que la ventana de inscripción siga abierta. Definir `registrationOpensAt`, `registrationClosesAt`, `startsAt`, `endsAt`, estado calculado y motivo de bloqueo. Determinar quién marca finalización y cómo se reconcilia tras una caída del scheduler. Ninguna transición puede depender del reloj del navegador.

## Inscripciones y plazas

- Propuesta: `capacity` representa plazas totales y una inscripción ocupa `1 + companions`. Confirmar esta regla de negocio. Devolver por separado titulares confirmados, plazas ocupadas y plazas disponibles; no usar un único contador ambiguo para todas las métricas.
- Validar existencia/visibilidad, publicación, ventana, identidad activa, límite de acompañantes, términos vigentes y cupo en una transacción. Bloquear o actualizar condicionalmente la fila de capacidad; garantizar que dos peticiones por la última plaza no sobrevendan el evento.
- La unicidad `(eventId, userId)` debe persistir aunque haya reintentos concurrentes. Cancelar y reinscribirse modifica esa inscripción o sigue la política acordada; no crear duplicados históricos activos.
- `POST` usa `Idempotency-Key` vinculada a usuario, operación y hash de payload. La misma clave/payload devuelve el mismo resultado; misma clave con payload diferente produce conflicto. Una restricción en base de datos complementa el cache de idempotencia.
- Cancelación idempotente libera todas las plazas asociadas y revoca el ticket. Guardar quién canceló y cuándo. Una baja corporativa debe seguir una política explícita y no dejar un QR válido sin acceso.
- La lista de espera es ampliación propuesta: si se implementa, explicitar `waitlisted`, orden y política para grupos con acompañantes. Promoción transaccional, vencimiento de oferta, revalidación de identidad/audiencia y notificación por outbox. No anunciar plaza confirmada antes de concretar la promoción.
- Confirmación y email salen de una inscripción persistida. Una caída del proveedor de correo no revierte ni duplica la inscripción; mostrar estado y permitir recuperar la entrada.
- Cambiar fechas, cancelar un evento, reducir capacidad o alterar términos después de publicar requiere reglas explícitas. Impedir reducir capacidad por debajo de plazas confirmadas salvo flujo administrativo definido. Guardar versión de términos realmente aceptada; no reemplazar su historial.

## Nómina y Excel/CSV

Implementar `PayrollDirectory` como adaptador de lectura con `search`, `getById`, `resolveAudience` y resolución de estado activo. Conectar al esquema real cuando lo entreguen. Consultas paginadas, filtros permitidos, parámetros enlazados y permisos de mínimo privilegio. No reflejar el esquema interno directamente a la API pública. No descargar toda la nómina al navegador.

Importación en dos fases: subir/procesar/vista previa y confirmar. Acordar límites; propuesta inicial configurable de 5 MB y 5.000 filas para XLSX/CSV, coincidente con los límites de la demo, con límites de memoria, tiempo y contenido descomprimido. Un nombre/extensión o MIME suministrado por el usuario no valida el contenido.

Aceptar sólo formatos aprobados, sin macros ni ejecución de fórmulas; revisar archivos malformados, ZIP bombs, exceso de hojas/filas/celdas y encabezados ambiguos. Escanear/quarantinar archivos según infraestructura. Guardarlos privados con nombres generados, eliminar temporales al vencer su retención y no reutilizar rutas proporcionadas por el cliente.

Permitir mapeo explícito de columnas a email, identificador corporativo, nombre y departamento según los datos aprobados. Dar errores por fila sin exponer información innecesaria. Recortar espacios, validar sintaxis y longitud, normalizar para deduplicar bajo una regla documentada, resolver contra nómina y distinguir duplicados, desconocidos e inactivos. Si la política exige colaboradores, un email válido pero ajeno a la compañía no puede convertirse en acceso privado. No suponer que un identificador importado es verdadero sin resolución oficial.

La vista previa muestra totales, válidos, duplicados, rechazados y muestra limitada. Confirmar con versión/checksum para impedir que la lista cambie entre revisión y publicación. Exportar errores de forma segura: neutralizar celdas que podrían interpretarse como fórmulas en CSV/Excel. Los bytes del archivo y el contenido de filas nunca se escriben en logs generales.

El FE actual puede leer `.xlsx` y `.csv` localmente como demostración, con límite de 5 MB y 5.000 personas. El modelo descargable es CSV y puede abrirse con Excel. El backend repite la validación; jamás acepta `people` enviados por cliente como audiencia autorizada sin resolverlos. La compatibilidad `.xls` heredada no está implementada.

## Plantillas y campañas de email

- Conservar inicialmente los campos del mock: asunto, encabezado, cuerpo, texto de CTA y color. Definir versión de esquema y una lista cerrada de variables, por ejemplo `{{nombre}}`, `{{evento}}`, `{{fecha}}`, `{{ubicacion}}`, `{{enlace}}`. Validar variables desconocidas antes de publicar.
- Resolver datos individuales en servidor al preparar la entrega. Escapar valores según contexto, sanitizar contenido enriquecido y generar HTML compatible con email desde una estructura segura. No ejecutar plantillas arbitrarias, JavaScript, handlers HTML ni expresiones del usuario. CTA y URL de imágenes deben provenir de rutas/orígenes permitidos.
- Permitir preview con una identidad sintética y prueba sólo a destinatarios permitidos. No usar preview para enumerar datos de empleados. Guardar versión inmutable de plantilla y snapshot de audiencia en la campaña; cambios posteriores no alteran entregas históricas.
- Separar invitaciones, confirmaciones/cancelaciones operativas y recordatorios. Definir con responsables de comunicaciones cuáles permiten opt-out y cómo aplica una suscripción general. Respetar lista de supresión y bajas del proveedor; no hacer una invitación masiva pasar por mensaje transaccional para eludir preferencias.
- Programación en instante UTC más zona elegida. Soportar guardado, programado, en cola, enviando, completado, parcialmente fallido y cancelado; aceptar estados equivalentes si se documentan. En una campaña cancelada no se puede recuperar lo ya entregado.
- Crear campaña y outbox de manera atómica, y procesar con workers. Usar claves idempotentes y bloqueo/lease de trabajo; reintentos con backoff, máximo de intentos y dead-letter/revisión para errores permanentes. No prometer entrega exactamente una vez si el proveedor carece de idempotencia: resolver timeouts ambiguos consultando entrega o siguiendo política acordada para minimizar duplicados.
- Verificar autenticidad de webhooks, deduplicar eventos del proveedor y manejar eventos fuera de orden. Guardar estados aceptado/entregado/rebotado/suprimido según señales reales. Aperturas/clics son métricas opcionales sujetas a aprobación; no atribuirlas a un click local del FE.
- Limitar tasa por compañía y proveedor, proteger contra envíos accidentales duplicados, y requerir permiso de publicación/envío. Al publicar devolver por separado resultado de evento y estado de campaña; si aún está en cola, la UI no debe decir que todos recibieron el correo.

## Calendario, entrada y asistencia

Generar ICS desde servidor para inscripciones autorizadas con UID estable, timestamps válidos, timezone/UTC coherentes, escapes y CRLF. La revisión del evento debe incrementar una secuencia para actualizaciones. El enlace de descarga requiere autorización o un token corto con alcance concreto; no incluir secretos ni listado de asistentes.

Una entrada demo no es verificación de acceso. Si se incorpora QR real, generar token aleatorio firmado u opaco verificable en servidor, revocable, con expiración y sin PII embebida. El check-in requiere rol, registro de uso y operación idempotente; comunicar ya utilizado, cancelado o inválido. Calendar/RSVP/QR no deben saltarse la regla de audiencia privada. No agregar enlaces de inscripción automática sin revisión de seguridad ni habilitar check-in offline sin un diseño adicional.

## API REST propuesta a validar

Base sugerida `/api/v1`. Auth y separación de servicios dependen del host real. Publicar OpenAPI con schemas, límites, ejemplos sintéticos, estados de error y mecanismos de autorización.

| Método y ruta propuestos | Finalidad |
| --- | --- |
| `GET /session` | Identidad mínima, permisos efectivos y compañía activa. |
| `GET /me/profile`, `PATCH /me/preferences` | Perfil corporativo propio y preferencias permitidas; no aceptar cambios de identidad o rol. |
| `POST /auth/exchange`, `POST /auth/logout` | Sólo si el mecanismo SSO necesita estas rutas. |
| `GET /events` | Catálogo visible; `q`, `category`, `mode`, `from`, `to`, `cursor`, `limit`. |
| `GET /events/:id` | Detalle autorizado sin audiencia ni datos privados de asistentes. |
| `GET /me/registrations` | Inscripciones del usuario, paginadas. |
| `GET /me/favorites` | Favoritos visibles del usuario; búsqueda, orden y paginación. |
| `PUT /me/favorites/:eventId` | Guardar un evento visible, de forma idempotente. |
| `DELETE /me/favorites/:eventId` | Quitar un favorito propio, de forma idempotente. |
| `POST /events/:id/registrations` | Inscribir identidad actual, con idempotencia. |
| `DELETE /me/registrations/:id` | Cancelar inscripción propia de forma idempotente. |
| `GET /me/registrations/:id/calendar.ics` | Calendario de inscripción autorizada. |
| `GET /me/registrations/:id/ticket` | Entrada/token del usuario si se habilita. |
| `GET /admin/events` | Listado según permisos, filtros por nombre/estado/audiencia/fechas, paginación, conteo total y métricas del conjunto filtrado. |
| `POST /admin/events` | Crear borrador. |
| `GET /admin/events/:id`, `PATCH /admin/events/:id` | Leer/actualizar con versión o ETag. |
| `POST /admin/events/:id/publish` | Validar todos los pasos y publicar de forma idempotente. |
| `POST /admin/events/:id/cancel` | Cancelar según reglas acordadas y generar notificaciones. |
| `GET /admin/payroll` | Búsqueda paginada y limitada para administradores autorizados. |
| `POST /admin/audience-imports` | Subida privada XLSX/CSV e inicio de procesamiento. |
| `GET /admin/audience-imports/:id` | Estado, preview y errores de la importación propia/autorizada. |
| `POST /admin/audience-imports/:id/confirm` | Confirmar una versión procesada de audiencia. |
| `PUT /admin/events/:id/audience` | Guardar definición validada; referencias de nómina/importación. |
| `PUT /admin/events/:id/email-template` | Crear una nueva versión de plantilla. |
| `POST /admin/events/:id/email-preview` | Render sintético o identidad permitida. |
| `POST /admin/events/:id/email-test` | Envío de prueba con límites y permiso. |
| `POST /admin/events/:id/campaigns` | Crear/programar campaña con audiencia/plantilla/versiones explícitas. |
| `GET /admin/campaigns/:id`, `POST /admin/campaigns/:id/cancel` | Consultar/cancelar trabajo pendiente. |
| `POST /admin/assets`, `GET /admin/assets/:id` | Subida privada y estado; decidir multipart o URL presignada. |
| `GET /admin/events/:id/registrations` | Asistentes paginados bajo permiso, sin compartir lista al catálogo. |
| `POST /admin/events/:id/exports` | Exportación protegida, auditable y con vencimiento. |
| `POST /admin/check-ins` | Validar entrada y registrar asistencia si se aprueba alcance. |
| `POST /webhooks/email/:provider` | Eventos autenticados del proveedor. |
| `GET /health/live`, `GET /health/ready` | Salud del proceso y dependencias, sin secretos. |

Ejemplo de inscripción propuesto:

```http
POST /api/v1/events/event_example/registrations
Idempotency-Key: 9da6e8ef-3fd4-4eca-81d6-a7a4cbf87f1b
Content-Type: application/json
```

```json
{
  "companions": 1,
  "acceptedTermsVersion": "terms_v1"
}
```

Respuesta sugerida `201`; un reintento idempotente devuelve el mismo recurso conforme al contrato:

```json
{
  "data": {
    "id": "registration_example",
    "eventId": "event_example",
    "status": "confirmed",
    "companions": 1,
    "seats": 2,
    "createdAt": "2026-10-07T15:00:00Z"
  },
  "meta": {
    "requestId": "request_example"
  }
}
```

No incluir `name`, `email` ni `userId` como identidad elegible en la petición de inscripción. Esos datos vienen de sesión. El DTO privado puede devolver datos mínimos para la entrada autorizada.

Errores tipados propuestos:

```json
{
  "error": {
    "code": "CAPACITY_EXCEEDED",
    "message": "Ya no quedan plazas para esta inscripción.",
    "fieldErrors": {},
    "requestId": "request_example"
  }
}
```

Definir `401 AUTH_REQUIRED`, `403 FORBIDDEN`, `404 EVENT_NOT_FOUND`, `409 ALREADY_REGISTERED`, `409 CAPACITY_EXCEEDED`, `409 VERSION_CONFLICT`, `409 IDEMPOTENCY_CONFLICT`, `422 VALIDATION_FAILED`, `422 TERMS_VERSION_MISMATCH`, `413 FILE_TOO_LARGE` y `429 RATE_LIMITED`. No filtrar detalles internos en mensajes. Incluir causas de evento no inscribible en un DTO autorizado. El cliente debe preservar borradores ante errores, recuperar sesión expirada y ofrecer reintento sólo cuando sea seguro.

## Mapeo desde el frontend actual

Los tipos en `src/types.ts` describen el mock. No copiarlos sin revisión a tablas ni aceptar todos sus campos en un request. La audiencia y plantilla son datos administrativos.

| Campo FE actual | Integración backend esperada |
| --- | --- |
| `EventItem.id` | Identificador estable generado por servidor. |
| `date`, `endDate` | Adapter de `startsAt`, `endsAt` ISO-8601 y `timezone`; no parsear una cadena de presentación. |
| `category` | Código estable/entidad de catálogo con etiqueta española; acordar categorías corporativas. |
| `image` | URL controlada de asset o CDN aprobado; no persistir base64 arbitrario como modelo final. |
| `registered` | Adaptar desde plazas ocupadas o titulares según decisión visual; servidor deriva el contador. |
| `capacity`, `companions` | Capacidad de plazas y máximo permitido por inscripción; valores validados por servidor. |
| `isPrivate` | Política de visibilidad aplicada por servidor, independiente de selección de emails. |
| `audience.mode`, `audience.people` | Referencias/filtros/importe validados, sólo disponibles a administración; snapshot versionado. |
| `emailTemplate` | DTO administrativo y versión; no demuestra que se envió una campaña. |
| `Registration.name`, `email` | Datos de identidad devueltos por sesión/servidor; no confiarlos al cliente. |
| `Registration.createdAt` | Fecha de creación asignada por servidor, no `Date.now()` del navegador. |
| Identificadores de Favoritos en `localStorage` | Favoritos propios devueltos por servidor; guardar/quitar con mutaciones y revalidar visibilidad. No migrar favoritos demo a identidades corporativas. |

Proponer `EventSummary` público, `EventDetail` público autorizado, `AdminEvent`, `RegistrationDTO`, `AudiencePreview` y `CampaignDTO` separados. Incluir capacidades del usuario (`canRegister`, `registrationDisabledReason`, permisos) cuando ayuden a la UI, pero repetir autorización al ejecutar la acción.

## Calidad, seguridad y operación

- Validación de schemas y límites en todos los inputs; consultas parametrizadas; control por recurso/compañía en cada endpoint. Evitar IDOR con identificadores opacos **y autorización**.
- Rate limits por identidad/origen para búsqueda de nómina, inscripción, importaciones y emails. Tamaños máximos, deadlines, protección del parser y control de concurrencia para trabajos pesados.
- Separar secretos del código, rotarlos y dar privilegios mínimos a DB, storage y proveedor. Frontend `VITE_*` es información pública; jamás colocar allí claves privadas.
- Retención y borrado aprobados para imports, destinatarios, registros, archivos y auditorías. Proteger PII en reposo/tránsito según infraestructura. Restringir exportaciones y dar URLs temporales; no habilitar buckets públicos para audiencia/entradas.
- Métricas reales: eventos publicados, titulares/plazas, cancelaciones, asistencia y estados de entrega, con definiciones documentadas. Logs estructurados redactados, correlation IDs y alertas de cola atrasada, fallos de importación o falta de cupos.
- Configuración sugerida a documentar: URL DB, orígenes frontend/host, integración SSO, nómina, storage, proveedor de correo/remitente, URLs públicas, zona predeterminada, límites de importación, rate limits, retención y scheduler. Nombres concretos dependen del stack acordado.
- Preparar `.env.example` sin secretos, seeds exclusivamente sintéticos, modo desarrollo explícito y un despliegue separado del frontend con TLS, migraciones controladas, backups/recovery, worker y health checks. No asumir un cron del proceso web como único mecanismo confiable.

Pruebas necesarias: autorización por rol y compañía; evento privado que no aparece en búsqueda ni se accede por ID; identidad cliente manipulada; dos peticiones compitiendo por última plaza; reintentos idempotentes; acompañantes y cancelación; términos obsoletos; ventanas temporales y zonas horarias; carrera de publicación/edición; parsing, deduplicación y resolución de imports; fórmulas/archivos malformados; plantilla con variables inválidas o HTML peligroso; job repetido, caída del worker/proveedor, webhook duplicado y cancelación de campaña; revocación de entrada; exportación protegida. Incluir integración DB real de prueba para transacciones y una prueba frontend de punta a punta con la API.

## Mensaje para Backend

**Contexto de la feature**

- Flujo: catálogo, inscripción y creador administrativo Supernova Eventos.
- Acción: publicar eventos con audiencias y emails individuales; permitir que colaboradores autorizados se inscriban.
- Resultado esperado: persistencia corporativa, privacidad verificable, cupo consistente y notificaciones trazables.

**Qué ya quedó preparado en frontend**

- Interfaz Vite/React/TypeScript con datos sintéticos, inscripción local y wizard administrativo.
- Lectura de audiencia ficticia y archivos en navegador para demostrar la revisión; email como preview.
- El estado de demo puede persistir en el mismo navegador. No se comparte entre usuarios ni dispositivos.

**Dependencia backend detectada**

- Identidad SSO, roles, nómina real, uploads seguros, audiencias privadas, cupos concurrentes, persistencia y entrega de emails requieren servidor.

**Cambio requerido en backend**

- [x] Endpoint nuevo y contrato OpenAPI a acordar.
- [x] Persistencia y migraciones.
- [x] Autorización y validación de servidor.
- [x] Procesamiento de archivos.
- [x] Workers, integración de nómina y proveedor de email.

**Propuesta de contrato a validar**

- Métodos/rutas y payloads de las secciones anteriores; comenzar con `GET /session`, catálogo visible, inscripción idempotente y CRUD de borradores.
- Acordar cupos/acompañantes, privacidad, zonas y campos antes de conectar el FE. Extender luego imports y campañas con la misma disciplina.

## Siguiente paso Frontend cuando Backend esté listo

1. Leer OpenAPI y definiciones confirmadas; crear `src/services` o un cliente/repositorio tipado según la convención elegida. Adaptar DTOs a componentes sin exponer listas administrativas en el catálogo.
2. Sustituir seeds y `src/lib/storage.ts` como fuente principal por queries y mutaciones remotas; reservar almacenamiento local sólo para preferencias/borradores aprobados. No migrar identidades ni inscripciones demo como registros reales.
3. Resolver identidad y permisos mediante sesión verificada. Eliminar la conmutación libre de rol como mecanismo de acceso de producción.
4. Conectar búsqueda paginada, detalle y cupos; preservar carga/error/empty states y control de carreras entre respuestas.
5. Conectar inscripción fullscreen a la operación idempotente. Presentar confirmación/entrada sólo con respuesta persistida; actualizar contador e inscripciones tras cancelar. Conectar Favoritos a consultas y mutaciones propias; conservar estados vacíos y errores, y revalidar la visibilidad tras cambios de acceso.
6. Conectar wizard a borradores y edición versionada. Reemplazar parseo local de audiencia por imports del servidor y validar el snapshot antes de publicar.
7. Conectar preview y jobs de email; diferenciar evento publicado, campaña en cola y entrega final. Añadir programación/lista de espera/check-in sólo si se implementan y aprueban.
8. Validar por rol, compañía, evento privado, cupo concurrente, error/reintento, refresh y sesión expirada. La integración se cierra cuando estos flujos persisten y funcionan con API real; que la demo se vea terminada no satisface ese criterio.
