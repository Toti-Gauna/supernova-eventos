# Supernova · tres versiones

Implementación local del 9 de octubre de 2026. Sin deploy.

| Versión | Desarrollo | Código propio |
| --- | --- | --- |
| Original | [Abrir original](http://127.0.0.1:5173/original/) | `src/versions/original/` |
| Universo 3D | [Abrir 3D](http://127.0.0.1:5173/3d/) | `src/features/universe/` |
| Órbitas · 2D + 3D | [Abrir híbrida](http://127.0.0.1:5173/hibrida/) | `src/features/hybrid/` |

[Selector de versiones](http://127.0.0.1:5173/versiones/). La raíz mantiene la versión 3D existente. Cada enlace carga un documento nuevo y su presentación; la original no monta Canvas ni descarga el renderer Three. El footer permite volver al selector sin agregar un sidebar.

La original conserva la presentación anterior a Three, recuperada por lectura de `git show` del commit `c7d93f6`, sin checkout, reset ni cambios al historial. Se copiaron App, header, las vistas modificadas, wizard, modal, intro y tema a un módulo separado. Las rutas de imports y el acceso al selector son adaptaciones de integración. Los componentes que no cambiaron, las fuentes, fotografías y utilidades siguen compartidos. La primera lámina HTML es el sistema solar actual; al montar la original se usa su intro anterior.

La híbrida comparte los flujos y datos con la 3D: inscripción, favoritos, agenda, administración, borradores, validación, pases y calendario. Cambia el motor visual. Las tres versiones conservan las claves locales existentes: probar una experiencia no borra los datos de otra. Los datos siguen siendo ficticios, locales al navegador; los emails, permisos reales y cupos concurrentes requieren backend.

## Recorrido híbrido

1. Sistema solar de la referencia: SVG, negro, órbitas finas y marca intacta.
2. La cámara toma la misma composición y se acerca al planeta violeta del mapa. Su posición y tamaño se calculan desde el SVG visible; el arte pasa a detalles más finos al ampliar.
3. Mis eventos viaja al planeta verde con tres lunas. Favoritos al planeta ámbar, con hasta ocho satélites según los eventos guardados. Perfil tiene una órbita perlada.
4. Abrir un evento viaja a una ilustración propia según su categoría. La confirmación tiene un cue breve junto al pase, lejos del botón de cierre.
5. Administrar muestra una nave ilustrada. Crear experiencia atraviesa su aproximación hasta una cabina de dos capas, con ventanas hacia el espacio. Los pasos del formulario mantienen la cámara quieta.

Los planetas, lunas, nave y cabina son ilustraciones SVG convertidas en texturas locales. Viven sobre planos/billboards a distintas profundidades en un único Canvas Three; perspectiva, desplazamiento de cámara, paralaje y partículas son reales. No hay esferas procedurales ni modelos GLB en la híbrida. El texto y los controles conservan HTML semántico y los diálogos nativos.

La apertura comparte el reloj del bootstrap, dura hasta 3,6 segundos y mantiene un deadline de 4 segundos. Escape y movimiento reducido la liberan; la escena puede pausarse desde el perfil. Sin sonido automático.

## Lectura y evidencia

- [Implementación y contratos](implementacion.md).
- [Galería de escritorio y móvil](captures/README.md).
- [Carga y continuidad del trailer](../trailer/experiencia-hibrida/01-carga-y-continuidad.md).
- Los [tres prompts 3D anteriores](../experiencia-3d/README.md) y sus capturas se conservan.

Para ejecutar: `npm run dev`; abrir las rutas de la tabla. `npm run build` genera las tres entradas lazy en el mismo build. En preview las rutas llevan el prefijo `/supernova-eventos/`, por ejemplo `http://127.0.0.1:4173/supernova-eventos/hibrida/`.
