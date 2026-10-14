/** Reserves a readable region in the DOM for the persistent camera composition. */
export default function UniverseSurface({ side = 'right', compact = false }: { side?: 'left' | 'right'; compact?: boolean }) {
  return <div className="universe-section-art" data-universe-surface="" data-universe-side={side} data-universe-composition={compact ? 'section-compact' : undefined} aria-hidden="true" />;
}
