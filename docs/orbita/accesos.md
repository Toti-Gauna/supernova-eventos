# Accesos de personal interno y externo

Órbita tiene dos puertas de entrada. En esta maqueta las dos son **simuladas**: no hay SSO, no se valida ninguna invitación en un servidor y la sesión vive en `localStorage` (`orbita-access-v1`). Sirven para mostrar el recorrido y separar qué ve cada tipo de persona; la autorización real corresponde al backend.

## Qué ve cada acceso

| | Personal interno | Personal externo |
| --- | --- | --- |
| Quiénes | Colaboradoras y colaboradores con cuenta corporativa | Invitadas e invitados, proveedores, prensa y equipos externos |
| Ingreso en la demo | «Ingresar con cuenta corporativa» entra como Alex García (`alex.garcia@demo.personal.test`) | Nombre, email, organización opcional y código de invitación. Código de demo: `ORBITA-2026` |
| Catálogo | Eventos `internal` y `all` | Eventos `external` y `all` |
| Administración | Sí (en la demo, todo interno es admin) | No: el header oculta Administrar y la vista se bloquea |
| Inscripción | Prellenada con los datos corporativos | Prellenada con los datos de la invitación |
| Enlace directo a un evento de otro acceso | Aviso: «Este evento es solo para personal externo.» | Aviso: «Este evento es solo para personal interno.» |

Cerrar sesión vuelve a la pantalla de acceso, anuncia el cierre y lleva el foco al título.

## Acceso por evento

Cada evento declara `access: 'internal' | 'external' | 'all'`. Se elige en el paso **Audiencia** del creador («¿Quiénes pueden verlo?»), se muestra en la revisión y en la tabla de administración, y las cards del personal interno marcan «Abierto a invitados» o «Solo invitados externos».

- Un evento sin `access`, guardado antes de este cambio, se trata como `internal`. Los eventos de ejemplo recuperan el acceso declarado en `src/data/events.ts` (`withAccessDefaults`).
- `access` se combina con la audiencia de invitaciones existente: un evento privado sigue exigiendo que el email esté en la lista.
- Con acceso `external`, la Tabla de nómina no se ofrece como audiencia: la nómina es personal interno.

Eventos de ejemplo: Órbita Fest, El futuro empieza acá y Laboratorio de ideas son `all`; el resto es `internal`.

## Contrato propuesto para el backend

**Nada de esto existe todavía.** Es una propuesta para acordar con backend; complementa [el prompt de backend](../backend-prompt.md).

### Identidad

- **Interno:** SSO corporativo (OIDC/SAML según lo que ofrezca el host). El servidor obtiene `userId`, email, compañía y roles de la fuente verificada; nunca del cliente.
- **Externo:** invitación nominativa emitida por un admin. El servidor genera un código o enlace de un solo uso con vencimiento, lo asocia a un email y a uno o más eventos, y lo canjea por una sesión de alcance `external`. Limitar intentos y registrar canjes.
- Sesión por cookie `HttpOnly`/`Secure`/`SameSite` con expiración corta; logout que invalida en servidor.

### Endpoints sugeridos

| Método y ruta | Uso | Respuesta |
| --- | --- | --- |
| `GET /me` | Identidad de la sesión | `{ kind: 'internal' \| 'external', name, email, organization, roles[] }` |
| `POST /auth/invitations/redeem` | Canje de invitación externa | `{ code, email, name, organization? }` → sesión `external` o `400/410/429` |
| `POST /auth/logout` | Cierre de sesión | `204` |
| `GET /events` | Catálogo filtrado por acceso y audiencia | Solo eventos visibles para la sesión |
| `GET /events/:id` | Detalle | `404` si la sesión no puede verlo (no revelar existencia) |
| `POST /admin/events/:id/invitations` | Emitir invitaciones externas | Lista de emails → invitaciones con vencimiento |

`EventItem.access` se persiste en el evento y el servidor lo aplica en catálogo, detalle, inscripción, favoritos, pases y check-in. El cliente solo lo usa para presentar.

### Preguntas abiertas

- ¿Los externos pueden traer acompañantes? Hoy se respeta el límite del evento.
- ¿Un mismo email puede tener acceso interno y externo? Proponemos que prime la identidad corporativa.
- ¿Qué datos de externos se conservan después del evento y por cuánto tiempo?
- ¿Quién puede emitir invitaciones externas: cualquier admin o un rol específico?
