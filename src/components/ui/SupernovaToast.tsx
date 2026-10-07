import { motion, useReducedMotion } from 'motion/react';
import { Check, CircleAlert, Info, X } from 'lucide-react';
import './toast.css';

interface Props {
  message: string;
  onDismiss: () => void;
  tone?: 'success' | 'error' | 'info';
}

/** Keep this inside its caller: native dialogs need feedback in their own top layer. */
export default function SupernovaToast({ message, onDismiss, tone = 'info' }: Props) {
  const reduced = useReducedMotion();
  const Icon = tone === 'error' ? CircleAlert : tone === 'success' ? Check : Info;
  return <motion.div className={`supernova-toast supernova-toast-${tone}`} role={tone === 'error' ? 'alert' : 'status'}
    initial={{ opacity: 0, y: reduced ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : 8 }} transition={{ duration: reduced ? 0 : .22 }}>
    <span className="toast-symbol" aria-hidden="true"><Icon size={17} /></span><p>{message}</p><button type="button" aria-label="Cerrar aviso" onClick={onDismiss}><X size={15} /></button>
  </motion.div>;
}
