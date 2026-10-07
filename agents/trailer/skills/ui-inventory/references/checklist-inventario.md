# Checklist de inventario por pieza

Para cada pieza que aparece en el trailer, completá:

| Campo | Qué anotar |
|---|---|
| Componente real | archivo:línea del JSX (no del import) |
| Exportado | sí / no; si sí, props y dependencias del módulo |
| Clases | el string completo, con variantes `dark:`, `hover:`, `focus-within:` |
| Textos | literales exactos, con tildes, mayúsculas y puntuación |
| Íconos | helper y path (`Icono d={D_RAYO}`), tamaño |
| Medidas | alto, ancho máximo, radio, padding (para calcular anclas a otra escala) |
| Estados | normal, hover, activo, deshabilitado, elegido, cargando |
| Degradés | dirección y paradas (se cruzan por capas: CSS no los interpola) |
| Animación propia | framer-motion, `setInterval`, clases `animate-*`: si tiene, se replica |
| Datos | de dónde salen los valores de la captura; cuáles son de ejemplo |

## Trampas frecuentes

- **Tono por estado completo:** helpers como `resolveStatusTone` necesitan el estado largo ("Cerrada - No existen conflictos de interés"). Con el texto corto el chip sale gris.
- **Responsive:** `hidden lg:block` o `sm:px-6` responden al viewport, no a un escenario escalado.
- **Módulos que parecen livianos:** un componente puro dentro de un archivo que importa servicios arrastra todo al chunk.
- **Capturas viejas:** conteos y descripciones cambian; el working tree manda.
- **Tema:** si la app no usa next-themes, averiguá de dónde sale (contexto, clase en `<html>`) y nunca lo escribas desde el trailer.
