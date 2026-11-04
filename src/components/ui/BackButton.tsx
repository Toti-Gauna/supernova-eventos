import { ArrowLeft } from 'lucide-react';
import './back-button.css';

interface Props { onBack: () => void; label?: string; className?: string; iconOnly?: boolean }

export default function BackButton({ onBack, label = 'Volver a eventos', className = '', iconOnly = false }: Props) {
  return <button type="button" className={`back-button ${iconOnly ? 'icon-only' : ''} ${className}`.replace(/\s+/g, ' ').trim()} onClick={onBack} title={iconOnly ? label : undefined}><ArrowLeft size={iconOnly ? 18 : 16} aria-hidden="true" />{iconOnly ? <span className="sr-only">{label}</span> : label}</button>;
}
