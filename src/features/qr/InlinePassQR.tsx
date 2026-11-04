import { useEffect, useState } from 'react';
import type { EventItem, Registration } from '../../types';
import { generateQrSVG, passPayload, qrDataURL } from './qr';

interface Props { event: EventItem; pass: Registration; size?: number; className?: string }

export default function InlinePassQR({ event, pass, size = 128, className = '' }: Props) {
  const payload = passPayload(event, pass);
  const [generated, setGenerated] = useState<{ payload: string; src?: string; failed?: boolean }>();
  useEffect(() => {
    let active = true;
    void generateQrSVG(payload).then(
      svg => { if (active) setGenerated({ payload, src: qrDataURL(svg) }); },
      () => { if (active) setGenerated({ payload, failed: true }); },
    );
    return () => { active = false; };
  }, [payload]);
  const current = generated?.payload === payload ? generated : undefined;
  return <div className={`ticket-inline-qr ${className}`.trim()}>
    {current?.src ? <img src={current.src} alt="QR de tu pase" width={size} height={size} />
      : <span role="status">{current?.failed ? 'No pudimos generar el QR. Usá el código de tu pase.' : 'Preparando tu QR…'}</span>}
  </div>;
}
