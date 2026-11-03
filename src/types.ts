export type EventCategory = 'Música' | 'Bienestar' | 'Tecnología' | 'Comunidad' | 'Aprendizaje';
export type EventStatus = 'published' | 'draft' | 'ended';
/** Who can discover an event: internal staff, external guests or both. The server enforces it. */
export type EventAccess = 'internal' | 'external' | 'all';
export type AccessKind = 'internal' | 'external';
export interface AccessProfile { kind: AccessKind; name: string; email: string; organization: string }
export interface AudiencePerson { id: string; name: string; email: string; department: string }
export interface EmailTemplate { subject: string; heading: string; body: string; buttonText: string; accentColor: string }
export interface EventSession {
  id: string;
  name?: string;
  date: string;
  endDate: string;
  doorsDate?: string;
  capacity: number;
  registered: number;
}
export interface EventItem {
  id: string;
  title: string;
  subtitle: string;
  category: EventCategory;
  image: string;
  date: string;
  endDate: string;
  location: string;
  mode: 'Presencial' | 'Online' | 'Híbrido';
  capacity: number;
  registered: number;
  description: string;
  host: string;
  featured: boolean;
  isPrivate: boolean;
  access?: EventAccess;
  status: EventStatus;
  companions: number;
  terms: string;
  audience?: { mode: 'all' | 'payroll' | 'excel'; people: AudiencePerson[] };
  emailTemplate?: EmailTemplate;
  sessions?: EventSession[];
}
export interface Registration {
  id: string; eventId: string; name: string; email: string; companions: number; createdAt: string;
  sessionId?: string;
  sessionSnapshot?: EventSession;
}
export type AppView = 'explore' | 'registrations' | 'favorites' | 'admin' | 'profile';
