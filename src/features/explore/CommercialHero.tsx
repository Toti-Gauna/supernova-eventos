import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, Ticket } from 'lucide-react';
import type { EventItem, EventSession } from '../../types';
import { formatEventDate } from '../../lib/calendar';
import FeaturedBanner from './FeaturedBanner';
import './commercial-hero.css';

export interface HeroSlide { event: EventItem; session?: EventSession; joined: boolean }
interface Props { slides: HeroSlide[]; nextPass?: { event: EventItem; session: EventSession }; onOpen: (event: EventItem, sessionId?: string) => void; onExplore: () => void }

const ROTATION_SECONDS = 7;

/**
 * Personal-style promo carousel. The active tab's progress bar drives rotation:
 * its CSS animation ends, the next slide shows. Hover, focus, the pause button and
 * reduced motion (which removes the animation) all stop it.
 */
export default function CommercialHero({ slides, nextPass, onOpen, onExplore }: Props) {
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = Math.min(active, Math.max(0, slides.length - 1));
  const slide = slides[current];
  function go(index: number) {
    setActive((index + slides.length) % slides.length);
    setCycle(value => value + 1);
  }

  return <section className={`commercial-hero section-container ${paused ? 'is-paused' : ''}`} aria-roledescription="carrusel" aria-label="Experiencias destacadas">
    <h1 className="sr-only">Órbita, eventos que nos conectan</h1>
    {slide ? <div className="commercial-hero-stage">
      <div className="commercial-hero-slide" aria-live={paused || slides.length < 2 ? 'polite' : 'off'}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={slide.event.id} role="group" aria-roledescription="diapositiva" aria-label={`${current + 1} de ${slides.length}`} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} transition={{ duration: .32, ease: [.22, 1, .36, 1] }}>
            <FeaturedBanner event={slide.event} session={slide.session} joined={slide.joined} onOpen={() => onOpen(slide.event, slide.session?.id)} label={slide.event.featured ? 'DESTACADO' : 'PRÓXIMAMENTE'} className="commercial-slide" headingId="commercial-hero-title" />
          </motion.div>
        </AnimatePresence>
      </div>
      {slides.length > 1 && <>
        <button type="button" className="commercial-hero-arrow is-prev" aria-label="Experiencia destacada anterior" onClick={() => go(current - 1)}><ChevronLeft size={24} /></button>
        <button type="button" className="commercial-hero-arrow is-next" aria-label="Experiencia destacada siguiente" onClick={() => go(current + 1)}><ChevronRight size={24} /></button>
      </>}
    </div> : <div className="commercial-hero-empty"><h2>Muy pronto, nuevas experiencias.</h2><p>Mientras tanto, mirá todo lo que ya pasó en Órbita.</p></div>}
    <div className="commercial-hero-controls">
      {slides.length > 1 && <div className="commercial-hero-tabs" role="group" aria-label="Elegir experiencia destacada">
        {slides.map((item, index) => <button key={item.event.id} type="button" className={`commercial-tab ${index === current ? 'is-active' : ''}`} aria-current={index === current ? 'true' : undefined} onClick={() => go(index)}>
          <span className="commercial-tab-bar" aria-hidden="true">{index === current && <span key={cycle} style={{ animationDuration: `${ROTATION_SECONDS}s` }} onAnimationEnd={() => go(current + 1)} />}</span>
          <span className="commercial-tab-label">{item.event.title}</span>
        </button>)}
      </div>}
      {slides.length > 1 && <button type="button" className="commercial-hero-pause" aria-pressed={paused} aria-label={paused ? 'Reanudar rotación de destacados' : 'Pausar rotación de destacados'} onClick={() => setPaused(value => !value)}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>}
      {nextPass
        ? <button type="button" className="commercial-hero-pass" onClick={() => onOpen(nextPass.event, nextPass.session.id)}>
          <span className="commercial-hero-pass-icon" aria-hidden="true"><Ticket size={17} /></span>
          <span className="commercial-hero-pass-copy"><small>Tu próximo pase</small><strong>{nextPass.event.title}</strong></span>
          <span className="commercial-hero-pass-date">{formatEventDate(nextPass.session.date, { day: '2-digit', month: 'short' }).replace('.', '')}</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </button>
        : <button type="button" className="commercial-hero-all" onClick={onExplore}>Ver todas las experiencias <ArrowDown size={16} /></button>}
    </div>
  </section>;
}
