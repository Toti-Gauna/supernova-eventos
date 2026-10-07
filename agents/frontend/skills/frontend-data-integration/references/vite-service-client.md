# Vite · cliente HTTP y backend separado

Esta micro-app usa React + TypeScript + Vite. Vite no implementa routes API ni un backend de producción. Mantené la UI separada de un cliente HTTP tipado y conectalo a un servidor independiente cuando exista un contrato confirmado.

## Cadena de datos

```text
screen o feature
  → hook de dominio si se necesita estado asíncrono
  → service o cliente HTTP tipado
  → API backend
```

- Reutilizá las capas existentes; no crees wrappers vacíos solo para cumplir el esquema.
- Base URL configurable con una variable pública `VITE_*`. Estas variables se publican en el navegador: nunca contienen secretos, claves de email ni credenciales DB.
- Los mocks/localStorage son una simulación local y no garantizan autorización, concurrencia ni entrega de email.
- Usá payloads y estados definidos en el contrato. Abortá requests obsoletas y distinguí errores de permisos, validación y red.
- No presentes rutas propuestas como si existieran. Documentá el handoff y los puntos del mock a reemplazar.
- El servidor valida permisos, audiencia, cupo y unicidad de inscripción. La UI solo comunica los estados que devuelve.

Validá la integración con el build y pruebas de los flujos relevantes. El backend real puede probarse únicamente cuando hay un endpoint disponible y autorizado.
