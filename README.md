# Supernova Eventos

Micro-app de eventos para Telefónica con estética galáctica, navegación sin sidebar, inscripción con confirmación animada y administración por pasos. Construida con Vite, React y TypeScript.

Es un **prototipo frontend**. Usa datos ficticios y almacenamiento local del navegador. No incluye backend, autenticación SSO, nómina corporativa ni envío real de emails. La vista Administración está disponible para recorrer el mock.

## Ejecutar

Requiere Node.js compatible con la versión de Vite instalada y npm.

```bash
npm install
npm run dev
```

Abrir [http://127.0.0.1:5173](http://127.0.0.1:5173). Para compilar y revisar la versión de producción:

```bash
npm run build
npm run preview
```

El build ejecuta TypeScript y genera `dist/`. La preview se sirve en [http://127.0.0.1:4173/supernova-eventos/](http://127.0.0.1:4173/supernova-eventos/). No se necesitan credenciales ni variables de entorno para la demo.

## Publicar en GitHub Pages

El workflow [Deploy to GitHub Pages](.github/workflows/deploy-pages.yml) instala las dependencias con `npm ci`, ejecuta el build con Node.js 22 y publica únicamente `dist/`. Se ejecuta con cada push a `main` o manualmente desde la pestaña [Actions](https://github.com/Toti-Gauna/supernova-eventos/actions/workflows/deploy-pages.yml).

En **Settings → Pages → Build and deployment**, la fuente debe ser **GitHub Actions**. No hace falta una rama `gh-pages`, un token personal ni secretos adicionales: el workflow usa `GITHUB_TOKEN` con los permisos de Pages y el entorno `github-pages`.

La dirección de la demo es [https://toti-gauna.github.io/supernova-eventos/](https://toti-gauna.github.io/supernova-eventos/). Vite usa `/supernova-eventos/` para el build y la preview; el servidor de desarrollo conserva `/`. Para revisar el build publicado localmente, abrir [http://127.0.0.1:4173/supernova-eventos/](http://127.0.0.1:4173/supernova-eventos/) después de `npm run build` y `npm run preview`.

Las portadas locales se resuelven con la base de Vite al mostrarse, incluidos eventos y borradores ya guardados. La navegación interna no cambia la URL y no necesita un fallback `404.html`. GitHub Pages aloja este prototipo estático; las inscripciones y los borradores siguen siendo locales y los emails no se envían.

## Recorrido

1. Explorar el evento destacado y buscar/filtrar en el catálogo.
2. Guardar experiencias en Favoritos, buscarlas y volver a encontrarlas después de un refresh.
3. Abrir la inscripción fullscreen, confirmar el lugar y revisar el pase con su calendario custom desde Mis eventos.
4. Entrar a Administración y crear un evento con su propia barra de pasos: información, audiencia, plantilla de email y revisión.
5. Probar audiencia de compañía, selección ficticia de nómina o importación local. El preview de email muestra cómo se personalizaría la invitación; no envía mensajes.

Los cambios guardados en `localStorage` sólo existen en este navegador/origen. Para reiniciar el prototipo, borrar el almacenamiento del sitio desde las herramientas del navegador. No introducir datos reales de colaboradores en esta demo.

El portal comienza en modo oscuro, independientemente del tema del sistema. El botón de sol/luna del header permite elegir el modo claro y guarda la preferencia para próximos refresh. La paleta se aplica a todas las vistas, controles, popovers, toasts y al pase. Los scrollbars también siguen el tema.

La escena orbital aparece desde el HTML inicial, antes de descargar React, y continúa mientras llega el chunk de GSAP. No hay una pantalla intermedia de solo logo ni textos en las esquinas de la intro.

La importación admite `.xlsx` y `.csv` de hasta 5 MB y 5.000 personas. Requiere columnas `nombre` y `email`; `area` es opcional. El modelo descargable es CSV compatible con Excel. La demo identifica duplicados y filas inválidas antes de continuar.

## Pruebas de navegador

```bash
npm run test:e2e
```

Playwright usa Chrome local en Windows cuando encuentra su instalación estándar. Se puede configurar `PLAYWRIGHT_CHROME_PATH`; en otros entornos usa Chromium de Playwright. El servidor de desarrollo se inicia automáticamente o se reutiliza en el puerto 5173.

Los veintitrés casos cubren intro en cada refresh, primera pantalla con React bloqueado o GSAP demorado, reducción de movimiento, búsqueda, Favoritos, preferencias, tema claro/oscuro persistido, barra inferior móvil, perfil y sesión demo, controles custom con teclado, TyC opt-in, filtros administrativos con tags y paginado, inscripción con tostadas, pase completo sin scroll en ambos temas, cancelación con acompañantes, wizard, privacidad simulada, importación real XLSX/CSV, header estable desde 320 hasta 2560 px y fechas locales que cruzan medianoche en UTC. Usan personas ficticias y fijan la fecha de los eventos de ejemplo al 7 de octubre de 2026; los casos de intro usan reloj real para GSAP. Las capturas quedan en `test-results/` y el informe en `playwright-report/`.

Validación: build de producción, veintitrés casos de navegador y revisión visual de ambos temas. [Registro y capturas](docs/validation.md).

## Documentación y agentes

- [Arquitectura del prototipo](docs/architecture.md).
- [Prompt completo para implementar backend](docs/backend-prompt.md): contratos propuestos a validar, SSO, nómina, privacidad, inscripciones, email, archivos, pruebas y conexión posterior del FE.
- [Agentes frontend y trailer](agents/README.md) en `agents/frontend/` y `agents/trailer/`, separados dentro de la misma carpeta y adaptados a Codex.

El prompt backend diferencia explícitamente lo preparado en frontend de las integraciones pendientes. La seguridad, entrega de correos y control de cupos deben implementarse en servidor.
