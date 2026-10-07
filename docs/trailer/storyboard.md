# Storyboard · conexiones en órbita

## Brief

Audiencia: colaboradores y administradores. Intro de marca en la app. Timeline de 3,4 segundos, sin sonido ni indicadores de progreso. El host la monta en cada refresh y permite repetirla desde el footer. Por pedido explícito del usuario, no tiene botón «Saltar intro»; Escape sigue disponible.

La escena habla de encuentro y usa la marca real. No simula carga de datos, envíos de email ni acceso a nómina.

## Dirección

Se evaluaron eclipse cinematográfico, una estrella como personaje y convergencia orbital. Se eligió la convergencia: pequeños puntos de luz llegan desde cuatro direcciones, revelan el símbolo de Supernova y dejan lugar a una identidad compacta. El eclipse gigante competía con el wordmark; la estrella como personaje requería más tiempo para construir una historia.

La marca conserva su dibujo. Las órbitas se mueven como grupos SVG; los puntos convergen mediante traslaciones y la identidad aparece dentro de una máscara. Gradientes y grano son estáticos. Toda animación cambia únicamente `transform` u `opacity`.

La escena concentra toda la información en el centro: se eliminaron los cuatro textos de las esquinas. La paleta clara mantiene violetas y acentos aqua sobre un fondo marfil frío. El primer frame HTML y el fallback de `Suspense` usan el mismo dibujo y una entrada CSS con el reloj de la escena, para que no aparezca un splash de solo marca antes de las órbitas.

## Secuencia

| Tiempo | Acción | Propósito |
|---|---|---|
| 0–1,35 s | Aparece el halo y dos órbitas cruzadas se acomodan. | Crear profundidad con una composición pequeña. |
| 0,20–1,46 s | Cuatro puntos se acercan al centro. | Representar conexiones sin una barra de carga ficticia. |
| 1,02–1,70 s | El símbolo real aparece con una luz contenida. | Fijar el foco en la marca. |
| 1,12–2,30 s | Se revela «supernova», luego «conectá sin límites» y el caption. | Mantener jerarquía y legibilidad. |
| 1,65–2,70 s | Las órbitas avanzan 9°. | Dar continuidad al encuentro. |
| 2,75–3,40 s | La composición y después el escenario se apagan. | Revelar la home. |

Con movimiento reducido, la composición completa queda estática y termina a los 150 ms. Si la preferencia cambia durante la reproducción, se cierra de inmediato. No hay sonido ni tickers adicionales.

## Escena del hero

El planeta usa SVG nativo: superficie de bandas, deriva lenta de la luz, corona, estrella y dos viajeros orbitales. El viajero principal tiene una cola luminosa y pasa por delante o por detrás del cuerpo mediante un recorte; el secundario introduce un acento aqua. El parallax está limitado a 14 × 11 px y responde solo al mouse.

Las animaciones CSS se pausan fuera del viewport, cuando el documento queda oculto y mientras la intro vuelve inerte la app. Con `prefers-reduced-motion` se eliminan y se cancela el parallax. Las escenas son de 420 px en desktop y 340 px en móvil para conservar espacio para el contenido.

Capturas revisadas: [intro desktop](captures/intro-convergence-desktop.png), [intro móvil](captures/intro-convergence-mobile.png) y [hero](captures/hero-motion-desktop.png).

