# Contrato de escena

```ts
export interface DefinicionEscena {
  id: string;
  /** DOM estático: <div data-escena="id" style={{ visibility: "hidden", opacity: 0 }}> con piezas en absoluto. */
  Componente: React.FC<{ opciones: OpcionesTrailer }>;
  /** Timeline relativo (0 = inicio de la escena). Anticipaciones de hasta −0,25 s permitidas. */
  construir: (ctx: ContextoEscena) => gsap.core.Timeline;
  /** Puntos de aterrizaje (cruces de QA con ?dev=1). */
  puntos?: Record<string, readonly [number, number]>;
}

export interface ContextoEscena {
  raiz: HTMLElement;                        // [data-escena]
  q: (sel: string) => Element[];            // gsap.utils.selector(raiz)
  camara: HTMLElement;                      // rig 3D, solo dentro de la ventana propia
  capas: Record<string, unknown>;           // aurora, halo, flash, rayos, barrido…
  logo: unknown;                            // API del logo/marca que viaja (poses, viajes)
  inicio: number; duracion: number;
  en: (tAbsoluto: number) => number;        // traduce los tiempos del storyboard
  opciones: { version: string; liviano: boolean; datos: { primerNombre: string; iniciales: string } };
}
```

## Reglas

1. Coordenadas del storyboard como constantes; posiciones con `style`, no con clases arbitrarias.
2. `ctx.en(tAbs)` para que el código se lea igual que el storyboard.
3. Estado de entrada explícito de todo lo que la escena anima (piezas, logo, cámara, capas).
4. **Continuidad por réplica:** una escena nunca anima el DOM de otra; renderiza su copia en el estado final de la anterior.
5. Solo `ctx.q('[data-t="…"]')` para seleccionar.
6. Las escenas compartidas cambian textos y piezas por versión, nunca tiempos.
7. `will-change` con `set` al entrar y `clearProps` al salir; lo que no está en escena, `autoAlpha 0`.
8. El logo vive fuera de la cámara: si la cámara se mueve con el logo posado, el logo se mueve con ella.
