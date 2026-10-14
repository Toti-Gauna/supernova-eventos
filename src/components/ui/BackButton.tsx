import { ArrowLeft } from 'lucide-react';
import './back-button.css';

interface Props { onBack: () => void; label?: string; className?: string }

export default function BackButton({ onBack, label = 'Volver a eventos', className = '' }: Props) {
  return <button type="button" className={`back-button ${className}`.trim()} onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />{label}</button>;
}
