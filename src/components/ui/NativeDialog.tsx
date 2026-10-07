import { useRef, type ReactNode } from 'react';
import { useDialog } from '../../hooks/useDialog';

interface Props { children: ReactNode; labelledBy: string; onClose: () => void; className?: string }

export default function NativeDialog({ children, labelledBy, onClose, className = '' }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const startedOnBackdrop = useRef(false);
  useDialog(dialog);

  return <dialog ref={dialog} className={`native-dialog ${className}`} aria-labelledby={labelledBy}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onPointerDown={event => { startedOnBackdrop.current = event.target === event.currentTarget; }}
    onClick={event => { if (startedOnBackdrop.current && event.target === event.currentTarget) onClose(); }}>
    {children}
  </dialog>;
}
