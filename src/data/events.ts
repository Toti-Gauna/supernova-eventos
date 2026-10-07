import type { EventItem } from '../types';

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'supernova-sessions', title: 'Supernova Sessions', subtitle: 'Una noche. Muchas conexiones.',
    category: 'Música', image: '/images/concert.jpg', date: '2026-10-23T19:00:00-03:00', endDate: '2026-10-23T23:00:00-03:00',
    location: 'Terraza Movistar · Buenos Aires', mode: 'Presencial', capacity: 240, registered: 186,
    description: 'Cuando cae el sol, las mejores conexiones empiezan. Te invitamos a una noche de música en vivo, un DJ set especialmente curado y algo rico para compartir en nuestra terraza. Vení a encontrarte con el equipo fuera de la rutina y a llevarte un recuerdo que siga sonando.\n\nTu entrada incluye acceso al show, una bebida de bienvenida y todas las ganas de pasarla bien. Podés venir con un acompañante.',
    host: 'Equipo de Experiencias', featured: true, isPrivate: false, status: 'published', companions: 1,
    terms: 'Evento exclusivo para colaboradores de Telefónica y un acompañante por persona. Al inscribirte aceptás el registro fotográfico del evento. Si no podés asistir, liberá tu lugar desde Mis eventos.',
  },
  {
    id: 'reset-mind', title: 'Un respiro para vos', subtitle: 'Desconectá para volver a conectar.',
    category: 'Bienestar', image: '/images/wellness.jpg', date: '2026-10-28T09:00:00-03:00', endDate: '2026-10-28T10:30:00-03:00',
    location: 'Espacio Bienestar · Buenos Aires', mode: 'Presencial', capacity: 40, registered: 28,
    description: 'Hacé una pausa que cambia tu día. Una experiencia de respiración consciente, movimiento suave y meditación guiada para encontrar tu equilibrio. No necesitás experiencia previa: traé ropa cómoda, nosotros ponemos el resto.\n\nAl terminar, compartimos un desayuno saludable y herramientas para llevar este bienestar a tu rutina.',
    host: 'Equipo de Bienestar', featured: false, isPrivate: false, status: 'published', companions: 0, terms: '',
  },
  {
    id: 'next-frontier', title: 'El futuro empieza acá', subtitle: 'Ideas que nos llevan más lejos.',
    category: 'Tecnología', image: '/images/innovation.jpg', date: '2026-11-05T15:00:00-03:00', endDate: '2026-11-05T17:00:00-03:00',
    location: 'Auditorio Central + streaming', mode: 'Híbrido', capacity: 350, registered: 124,
    description: 'Explorá la próxima frontera de la inteligencia artificial junto a personas que están construyendo el futuro. Charlas cortas, demos prácticas y una conversación abierta sobre las ideas que transforman nuestra forma de trabajar.\n\nElegí venir al auditorio o sumarte online. Hay lugar para tus preguntas y para tu curiosidad.',
    host: 'Telefónica Innovación', featured: false, isPrivate: false, status: 'published', companions: 0, terms: '',
  },
  {
    id: 'connection-day', title: 'Conexiones que importan', subtitle: 'Un encuentro, nuevas historias.',
    category: 'Comunidad', image: '/images/community.jpg', date: '2026-11-12T18:00:00-03:00', endDate: '2026-11-12T21:00:00-03:00',
    location: 'Campus Telefónica · Buenos Aires', mode: 'Presencial', capacity: 160, registered: 62,
    description: 'Una tarde para conocernos mejor. Dinámicas creativas, buena comida y conversaciones con personas de otros equipos. Porque las grandes ideas también nacen en los encuentros más simples.',
    host: 'Cultura y Comunidad', featured: false, isPrivate: false, status: 'published', companions: 1, terms: '',
  },
  {
    id: 'creative-lab', title: 'Laboratorio de ideas', subtitle: 'Dale espacio a tu creatividad.',
    category: 'Aprendizaje', image: '/images/workshop.jpg', date: '2026-11-18T14:00:00-03:00', endDate: '2026-11-18T16:00:00-03:00',
    location: 'Encuentro online · Microsoft Teams', mode: 'Online', capacity: 100, registered: 39,
    description: 'Pensá distinto, probá nuevas herramientas y descubrí tu lado creativo. Un workshop participativo para convertir desafíos cotidianos en oportunidades, junto a un equipo facilitador y colegas de toda la compañía.',
    host: 'Aprendizaje y Desarrollo', featured: false, isPrivate: false, status: 'published', companions: 0, terms: '',
  },
  {
    id: 'outside-orbit', title: 'Fuera de la rutina', subtitle: 'La próxima aventura es compartida.',
    category: 'Bienestar', image: '/images/outdoor.jpg', date: '2026-11-21T08:00:00-03:00', endDate: '2026-11-21T17:00:00-03:00',
    location: 'Reserva natural · Tigre', mode: 'Presencial', capacity: 60, registered: 48,
    description: 'Un día al aire libre para movernos, respirar y compartir. Senderismo de dificultad baja, almuerzo en equipo y momentos para disfrutar la naturaleza. Incluye traslado desde el campus. Podés venir con un acompañante.',
    host: 'Equipo de Experiencias', featured: false, isPrivate: false, status: 'published', companions: 1, terms: 'La actividad está sujeta a condiciones meteorológicas. Usá calzado cómodo y avisá al equipo si necesitás alguna adaptación.',
  },
];
