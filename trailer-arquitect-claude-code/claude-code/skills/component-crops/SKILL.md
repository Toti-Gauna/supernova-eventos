---
name: component-crops
description: "Prepara referencias visuales para video con IA a partir de capturas de la app: recorta componentes individuales, los centra en lienzos 16:9 del color de la app, renderiza la marca en alta resolución desde su SVG, recrea piezas con datos basura y reemplaza datos personales. Usala cuando el pedido sea un video generado con IA (Higgsfield, Kling, Veo) y haya capturas."
---

# Component Crops

## Propósito

Los generadores de video tienden a "animar encima de la foto" si reciben una sola captura. Con **componentes individuales** como referencias, arman el spot con las piezas reales.

## Cuándo usarla

- Video con IA que tiene que mostrar la UI del producto.
- Capturas con datos reales, textos basura ("dddd") o piezas muy chicas.

## Cuándo no usarla

- Trailer in-app (usá réplicas DOM, no imágenes).

## Proceso

1. **Herramienta:** Python + Pillow instalado en una carpeta temporal (`pip install --target <scratch>/pylib pillow`), sin tocar el entorno del usuario. Ejemplo completo en `references/recortes_ejemplo.py`.
2. **Colores:** tomá muestras de fondo y superficies de las capturas (el fondo real, no negro puro).
3. **Recortes:** una pieza por archivo, con los píxeles de padding justos; filas de listas y tarjetas por separado.
4. **Lienzo 16:9 (1920×1080)** del color de la app, pieza centrada al 86 % × 78 % como máximo, escala ≤ 3. Evita que el modelo recorte tiras anchas al encuadrar.
5. **Marca desde el SVG:** renderizá el logo con su geometría y degradé exactos (supersampling ×4), PNG transparente de 1024 px, y una hoja con sus estados si tiene animación.
6. **Recrear lo basura:** burbujas o textos de prueba se re-dibujan con las clases del componente (fuente real descargada, p. ej. Inter) y un texto verosímil.
7. **Datos personales:** reemplazá nombres y emails reales copiando celdas de filas de ejemplo; verificá con un zoom.
8. **Revisión:** hoja de contactos de todos los recortes y comparación del logo contra el original.
9. **Límite de referencias:** respetá el máximo de la herramienta (p. ej. 30 en Higgsfield Genjutsu) y numerá los archivos en el orden de carga.

## Salida esperada

- Carpeta `componentes/` con archivos numerados y nombres descriptivos.
- Tabla archivo → qué es → en qué plano se usa.
- Lista de cambios respecto de las capturas (texto recreado, datos reemplazados).
