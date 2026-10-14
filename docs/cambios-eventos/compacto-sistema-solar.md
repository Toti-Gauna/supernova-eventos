# Eventos a primera vista · sistema solar

El pedido de esta entrega es recuperar la rapidez de una página de eventos tradicional y conservar la identidad Supernova. Se aplica a **3D** y **2D + 3D**; la versión Original mantiene su composición independiente. No se hace deploy.

El inicio tiene un encabezado breve, buscador y tres filas: dos eventos próximos y uno vencido cuando los datos y filtros los permiten. El catálogo continúa debajo, con filtros, tarjetas y paginación. Los encabezados de Mis eventos, Favoritos, Perfil y Administración ocupan una parte de la página y dejan entrar el contenido útil en el primer recorrido.

## Composición y planetas

| Vista | Cuerpo | Composición |
| --- | --- | --- |
| Explorar | Tierra, continentes y nubes | Planeta a la derecha, eventos a la izquierda |
| Mis eventos | Júpiter y cuatro lunas | Planeta a la izquierda, título y acciones a la derecha |
| Favoritos | Saturno y sus anillos | Planeta a la derecha |
| Perfil | Neptuno | Planeta a la izquierda |
| Detalle de eventos | Mercurio, Venus, Marte o Urano | Asignación estable por ID del evento |
| Administración | Nave | Composición compacta a la izquierda |
| Crear evento | Interior de la nave | Formulario HTML accesible |

Las ilustraciones son interpretaciones del sistema solar; los tamaños, tiempos y órbitas están compuestos para la interfaz. La híbrida mantiene ilustraciones sobre planos y cámara espacial; la 3D proyecta las mismas superficies vectoriales sobre esferas. La rotación y las nubes se animan sin girar la iluminación. La pausa de Perfil, el movimiento reducido y la pestaña oculta detienen la animación.

## Fondo de Supernova Tour

Se leyó el repositorio local `C:/Users/ignacio.gauna/Desktop/old-work-projects/supernova-experience/frontend`. El recurso `public/fondo-principal.png` se copió sin modificar a [public/images/tour/fondo-principal.png](../../public/images/tour/fondo-principal.png): 1672 × 941, 1.592.401 bytes, SHA-256 `808DE84DF27392BFFDCE0FE4600C7D6E63E555D9CD29E319CC57C5F13BEB21F9`.

Se adaptaron `NebulaBackground.tsx` y `redesign.css`: la misma semilla y algoritmo de 60 estrellas con deriva y titileo, las siete partículas violetas/magenta/cian/rosa, parallax y los tiempos de movimiento y respiración de la nebulosa. Las estrellas pasan de Canvas 2D a círculos SVG para conservar un solo Canvas para los planetas. Se completaron la pausa por pestaña oculta y el movimiento reducido de todas las capas.

El nodo del fondo está fuera de React desde el primer HTML y permanece durante carga, navegación, detalle e ingreso a la nave. El controlador administra su movimiento sin reemplazarlo ni reiniciar sus animaciones. El fondo continúa al bajar al catálogo aunque la escena de planetas salga de pantalla. La carga conserva la marca y el sistema solar, ahora con los ocho planetas, y se acerca a la Tierra del inicio.

El paso `prebuild` sincroniza los estilos y el markup críticos desde sus fuentes; no es necesario copiar manualmente el primer frame a `index.html`.

## Verificación

El cierre de build, pruebas de flujos y capturas se registra en [validación](../validation.md). La [galería solar](captures-solar/README.md) corresponde a esta composición; las galerías anteriores se conservan como historial.

Los pases, QR, funciones e inscripciones siguen siendo una demo local. No se envían emails ni se agregó un backend.
