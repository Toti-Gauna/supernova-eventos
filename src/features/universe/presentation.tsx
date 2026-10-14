import { createContext, useContext, type ReactNode } from 'react';
import type { UniversePresentation } from './contracts';

const UniversePresentationContext = createContext<UniversePresentation | null>(null);

export function UniversePresentationProvider({ value, children }: { value: UniversePresentation; children: ReactNode }) {
  return <UniversePresentationContext.Provider value={value}>{children}</UniversePresentationContext.Provider>;
}

export function useUniversePresentation(): UniversePresentation {
  const presentation = useContext(UniversePresentationContext);
  if (!presentation) throw new Error('UniversePresentationProvider debe envolver la experiencia.');
  return presentation;
}
