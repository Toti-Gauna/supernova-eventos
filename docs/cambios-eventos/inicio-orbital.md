# Inicio orbital

El inicio de las versiones [3D](http://127.0.0.1:5173/3d/) e [Híbrida](http://127.0.0.1:5173/hibrida/) reúne los primeros eventos a la izquierda y el planeta a la derecha. La versión [Original](http://127.0.0.1:5173/original/) conserva su composición clásica. Se mantienen el header superior, su cápsula al hacer scroll y la navegación inferior en móvil.

## Descubrir desde el primer vistazo

El hero muestra un título breve, un buscador y una selección de tres eventos: dos vigentes en orden cronológico y el último finalizado. Cada fila incluye imagen, nombre, fecha, horario, categoría, estado y un botón de favoritos. El evento vencido aparece identificado como **Vencido · Ver detalles**.

La selección usa los mismos permisos y filtros que el catálogo. Excluye borradores y eventos privados a los que el perfil demo no tiene acceso. Cuando hay varias funciones, la fecha y el horario corresponden a la función presentada; abrirla conserva esa selección y permite elegir los otros horarios dentro del evento.

Si no hay próximos eventos o finalizados que coincidan con los filtros, se muestra un estado vacío. No se rellenan esas filas con resultados inventados ni con eventos que incumplen la búsqueda.

## Un buscador y un catálogo completo

En las versiones espaciales hay un único campo **Buscar experiencias**, ubicado arriba de las filas del hero. Su búsqueda actualiza tanto esa selección como el catálogo de abajo. Categoría, modalidad, fecha y favoritos también afectan ambos bloques. Los próximos del hero conservan su orden cronológico, mientras el catálogo admite sus opciones de ordenación.

**Ver eventos** lleva al catálogo y le transfiere el foco. Allí siguen los grupos temporales, los filtros y la paginación de tres eventos por página. Las filas iniciales no reemplazan el catálogo completo. En Original, el buscador continúa dentro del catálogo.

Los favoritos comparten el mismo estado y guardado local en todas las versiones. Guardar un plan desde el hero se refleja en su card y en Favoritos.

## Detalles y navegación

Las filas abren el detalle del evento mediante botones con el nombre **Abrir [evento]**. Los eventos finalizados permiten consultar sus detalles y mantienen cerrada la inscripción. Los controles para guardar planes son botones independientes, con su estado de favorito indicado mediante `aria-pressed`.

El buscador conserva el atajo `/`. Las acciones admiten navegación con Tab y foco visible; Escape cierra el detalle, y el modal devuelve el foco al control que lo abrió. En móvil, el título y el planeta comparten el bloque superior; el buscador y las filas ocupan el ancho disponible debajo.

## Composición espacial

La dirección visual del planeta toma de la referencia las bandas oscuras, la luz de borde y las órbitas finas. El arte mantiene su lugar a la derecha del contenido, con profundidad y movimiento según la versión elegida. El marcador `.cosmos-planet-slot` comunica a la cámara el espacio disponible para el planeta y se adapta al viewport.

La pantalla de carga conserva su recorrido. Este cambio del inicio integra los eventos con el paisaje espacial sin modificar la intro. En móvil el título visible se reduce a **Entrá en órbita.**, el planeta ocupa 130 px y el acceso al evento destacado es circular. La acción **Ver eventos** permanece por encima de la navegación inferior a 320 × 667.

## Implementación y alcance

- [EventExplorer.tsx](../../src/features/explore/EventExplorer.tsx) integra los layouts `orbital` y `classic`, los filtros, el buscador y la selección inicial.
- [OrbitEventPreview.tsx](../../src/features/explore/OrbitEventPreview.tsx) presenta cada fila con sus acciones independientes.
- [explorer.css](../../src/features/explore/explorer.css) y [orbit-event-preview.css](../../src/features/explore/orbit-event-preview.css) definen la composición responsive.
- [orbital-home.spec.ts](../../tests/orbital-home.spec.ts) contiene los casos de geometría, búsqueda, consulta de vencidos y separación de Original.

Los datos son ficticios y el guardado permanece local en este navegador. Los permisos de esta demo pertenecen al frontend; la autorización real y las inscripciones compartidas requieren backend.

## Verificación final

Build aprobado, regresión integrada de 94/94 E2E y nueve pruebas afectadas repetidas tras ampliar la compatibilidad del archivo, todas aprobadas. Esa repetición incluye un caso nuevo de catálogo inicial con eventos propios agregados; la suite vigente tiene 95 casos únicos. Las tres pruebas del inicio comprueban geometría y búsqueda, consulta de vencidos con foco restaurado y móvil de 320 px con el botón libre de la navegación inferior.

[38 capturas del build local en 18 contextos](captures-orbital/README.md) muestran la composición espacial, el catálogo, los eventos adicionales y Original en ambos temas. [Validación del proyecto](../validation.md) detalla el alcance de las corridas. No hubo deploy.
