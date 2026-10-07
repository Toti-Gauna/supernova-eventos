---
name: ui-inventory
description: "Releva la UI real que va a aparecer en un trailer: piezas con archivo:línea, clases Tailwind exactas, textos, íconos, estados y qué se puede reutilizar tal cual o hay que replicar. También qué puede hacer cada rol de verdad (real, maqueta o condicional) y qué datos sensibles traen las capturas. Usala antes de diseñar escenas."
---

# UI Inventory

## Propósito

Que cada pieza del trailer sea **indistinguible de la app** y que cada escena prometa **solo lo que existe**. Es la base de fidelidad y honestidad de todo lo demás.

## Cuándo usarla

- Antes de la dirección creativa o de escribir escenas.
- Cuando el trailer tiene versiones por rol.
- Cuando hay capturas de referencia (pueden estar desactualizadas o traer datos reales).

## Cuándo no usarla

- El inventario ya existe y el código no cambió desde entonces.

## Proceso

1. **Piezas visibles:** por cada pieza que va a salir en pantalla, encontrá el componente real y anotá archivo:línea, clases exactas (claro y `dark:`), textos, íconos, tamaños, radios, sombras, degradés y estados. Ver `references/checklist-inventario.md`.
2. **¿Reutilizar o replicar?** Solo se reutiliza lo puramente presentacional **sin** framer-motion, servicios, `setInterval` ni imports pesados. Todo lo demás se replica copiando clases. Anotá el porqué.
3. **Funciones por rol:** para cada rol, qué acciones existen hoy y si son **REAL** (pega a endpoints), **MAQUETA** (guion) o **COND** (depende de backend o flags). Ver `references/honestidad-y-datos.md`.
4. **Textos que prometen de más:** listalos (descripciones de paleta, bienvenidas, respuestas de guion con datos de toda la empresa). El trailer no los cita.
5. **Capturas:** compará contra el código. Donde difieren, gana el código. Marcá toda persona o email real.
6. **Tema y responsive:** cómo se aplica el tema (clase en `<html>`, contexto propio), qué prefijos responsivos usa cada pieza.

## Salida esperada

- Inventario por pieza con archivo:línea y clases exactas.
- Tabla "reutilizar tal cual" vs "replicar" con motivo.
- Tabla de funciones por rol (REAL / MAQUETA / COND) y límites de honestidad.
- Lista de datos sensibles a reemplazar y de diferencias captura ↔ código.
