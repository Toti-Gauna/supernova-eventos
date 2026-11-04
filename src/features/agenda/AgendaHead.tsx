import type { ReactNode } from 'react';
import BackButton from '../../components/ui/BackButton';

interface Props {
  titleId: string;
  title: string;
  count: number;
  /** Read after the number by screen readers, e.g. "pases". */
  countLabel: string;
  onBack: () => void;
  /** Optional art next to the title (the section planet in 3D and 2D + 3D). */
  art?: ReactNode;
  artSide?: 'left' | 'right';
  /** Note, search and action: they wrap together below the title on narrow screens. */
  children?: ReactNode;
}

/** One-line page header shared by Mis eventos and Favoritos in every version. */
export default function AgendaHead({ titleId, title, count, countLabel, onBack, art, artSide = 'left', children }: Props) {
  const artSlot = art ? <div className={`agenda-art agenda-art-${artSide}`}>{art}</div> : null;
  return <header className={`agenda-head ${art ? `has-art art-${artSide}` : ''}`.trim()}>
    <BackButton onBack={onBack} iconOnly />
    {artSide === 'left' && artSlot}
    <div className="agenda-title">
      <h1 id={titleId}>{title}</h1>
      <span className="agenda-count num-pill">{count}<span className="sr-only"> {countLabel}</span></span>
    </div>
    {children && <div className="agenda-tools">{children}</div>}
    {artSide === 'right' && artSlot}
  </header>;
}
