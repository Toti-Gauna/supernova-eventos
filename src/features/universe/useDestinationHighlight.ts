import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

export interface DestinationHighlight { key: string }

/** DOM owns every action; this observer only changes the visible material rim. */
export function useDestinationHighlight(disabled: boolean) {
  const highlight = useRef<DestinationHighlight>({ key: '' });
  const { invalidate, gl } = useThree();
  useEffect(() => {
    let hovered = '';
    let focused = '';
    const target = (node: EventTarget | null) => node instanceof Element
      ? node.closest<HTMLElement>('[data-universe-target]')?.dataset.universeTarget ?? '' : '';
    const apply = () => {
      const blocked = disabled || !!document.querySelector('dialog[open], [data-cinematic-intro]');
      highlight.current.key = blocked ? '' : focused || hovered;
      if (import.meta.env.DEV) gl.domElement.dataset.universeHighlight = highlight.current.key;
      invalidate();
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && window.matchMedia('(pointer: fine)').matches) {
        hovered = target(event.target); apply();
      }
    };
    const leave = (event: PointerEvent) => { hovered = target(event.relatedTarget); apply(); };
    const focus = (event: FocusEvent) => { focused = target(event.target); apply(); };
    const blur = (event: FocusEvent) => { focused = target(event.relatedTarget); apply(); };
    const clear = () => { hovered = ''; focused = ''; apply(); };
    const mutation = new MutationObserver(apply);
    mutation.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'], childList: true });
    document.addEventListener('pointerover', enter, { passive: true });
    document.addEventListener('pointerout', leave, { passive: true });
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', blur);
    window.addEventListener('blur', clear);
    apply();
    return () => {
      mutation.disconnect();
      document.removeEventListener('pointerover', enter);
      document.removeEventListener('pointerout', leave);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', blur);
      window.removeEventListener('blur', clear);
      highlight.current.key = '';
    };
  }, [disabled, gl, invalidate]);
  return highlight;
}
