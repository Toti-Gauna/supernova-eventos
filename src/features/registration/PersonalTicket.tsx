import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { Check, MapPin, Ticket } from 'lucide-react';
import type { PointerEvent } from 'react';
import type { EventItem, EventSession, Registration } from '../../types';
import Brand from '../../components/Brand';
import { formatEventDate } from '../../lib/calendar';
import { eventImageProps } from '../../lib/assets';
import InlinePassQR from '../qr/InlinePassQR';
import './ticket-qr.css';

const companionsLabel = (pass: Registration) => pass.companions ? `Vos + ${pass.companions} acompañante${pass.companions > 1 ? 's' : ''}` : 'Pase individual';
const hour = (date: string) => formatEventDate(date, { hour: '2-digit', minute: '2-digit', hour12: false });
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default function PersonalTicket({ event, pass }: { event: EventItem; pass: Registration }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0), y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 150, damping: 24 });
  const rotateY = useSpring(y, { stiffness: 150, damping: 24 });
  const contentX = useTransform(rotateY, value => value * 1.4);
  const contentY = useTransform(rotateX, value => -value * 1.4);
  const lightX = useTransform(rotateY, [-2.5, 2.5], ['-35%', '45%']);
  const lightY = useTransform(rotateX, [-2.5, 2.5], ['-15%', '15%']);
  const illumination = useMotionValue(0);
  const lightOpacity = useSpring(illumination, { stiffness: 100, damping: 22 });
  function move(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(-((event.clientY - rect.top) / rect.height - .5) * 5);
    y.set(((event.clientX - rect.left) / rect.width - .5) * 5);
    illumination.set(.8);
  }
  return <div className="ticket-perspective">
    <motion.div className="personal-ticket" onPointerMove={move} onPointerLeave={() => { x.set(0); y.set(0); illumination.set(0); }}
      style={{ rotateX: reduced ? 0 : rotateX, rotateY: reduced ? 0 : rotateY }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 28, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduced ? 0 : .8, delay: reduced ? 0 : .16, ease: [.16, 1, .3, 1] }}>
      <span className="ticket-foil" aria-hidden="true" /><span className="ticket-light-mask" aria-hidden="true"><motion.span className="ticket-interactive-light" style={{ x: reduced ? 0 : lightX, y: reduced ? 0 : lightY, opacity: reduced ? 0 : lightOpacity }} /></span><span className="ticket-watermark" aria-hidden="true">✦</span>
      <motion.div className="ticket-content" style={{ x: reduced ? 0 : contentX, y: reduced ? 0 : contentY, z: reduced ? 0 : 14 }}>
      <div className="ticket-top"><Brand compact /><span className="ticket-confirmed"><Check size={12} /> CONFIRMADO</span></div>
      <div className="ticket-main"><span className="ticket-category">{event.category} <i /> {event.mode}</span><h3>{event.title}</h3>
        <div className="ticket-details-row"><div>
          <div className="ticket-datetime"><span><small>FECHA</small><strong>{formatEventDate(event.date)}</strong></span><span><small>HORA</small><strong>{hour(event.date)} h</strong></span></div>
          <span className="ticket-location"><MapPin size={14} />{event.location}</span>
        </div><InlinePassQR event={event} pass={pass} /></div>
      </div>
      <div className="ticket-tear" aria-hidden="true"><i /><span /><i /></div>
      <div className="ticket-bottom"><div><span>ESTE MOMENTO ES PARA</span><strong>{pass.name}</strong><small>{companionsLabel(pass)}</small></div><div className="ticket-code"><Ticket size={26} /><span>{pass.id}</span></div></div>
      </motion.div>
    </motion.div>
  </div>;
}

/**
 * Comercial pass: a real-looking entry ticket. Photo with the category block on one side,
 * the facts in the middle and a perforated stub where the QR is the protagonist.
 * `event` is already resolved to the pass's function.
 */
export function CommercialPassTicket({ event, pass, session }: { event: EventItem; pass: Registration; session?: EventSession }) {
  const reduced = useReducedMotion();
  const slug = event.category.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const day = capitalize(formatEventDate(event.date, { weekday: 'long', day: 'numeric', month: 'long' }));
  return <motion.article className={`cx-ticket category-${slug}`} aria-label="Tu pase"
    initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .5, delay: reduced ? 0 : .08, ease: [.22, 1, .36, 1] }}>
    <div className="cx-ticket-media" aria-hidden="true">
      <img {...eventImageProps(event.image, '(max-width: 760px) 100vw, 300px')} alt="" onError={image => { image.currentTarget.style.opacity = '0'; }} />
      <span className="cx-ticket-block" />
      <span className="cx-ticket-date"><strong>{formatEventDate(event.date, { day: '2-digit' })}</strong>{formatEventDate(event.date, { month: 'short' }).replace('.', '').toUpperCase()}</span>
    </div>
    <div className="cx-ticket-main">
      <div className="cx-ticket-top"><span className="cx-ticket-status"><Check size={13} aria-hidden="true" />Confirmado</span><span className="cx-ticket-category">{event.category} · {event.mode}</span></div>
      <h3>{event.title}</h3>
      <dl className="cx-ticket-facts">
        <div><dt>Fecha</dt><dd>{day}</dd></div>
        <div><dt>Hora</dt><dd>{hour(event.date)} – {hour(event.endDate)} h{session?.doorsDate && <small>Puertas {hour(session.doorsDate)} h</small>}</dd></div>
        <div className="cx-ticket-place"><dt>Lugar</dt><dd>{event.location}</dd></div>
        <div className="cx-ticket-holder"><dt>Pase de</dt><dd>{pass.name}<small>{companionsLabel(pass)}</small></dd></div>
      </dl>
    </div>
    <div className="cx-ticket-stub">
      <InlinePassQR event={event} pass={pass} size={264} className="cx-ticket-qr" />
      <span className="cx-ticket-code"><small>Código</small><code>{pass.id}</code></span>
    </div>
  </motion.article>;
}
