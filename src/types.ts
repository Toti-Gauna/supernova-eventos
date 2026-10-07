export type EventCategory = 'Música' | 'Bienestar' | 'Tecnología' | 'Comunidad' | 'Aprendizaje';
export type EventStatus = 'published' | 'draft' | 'ended';
export interface AudiencePerson { id: string; name: string; email: string; department: string }
export interface EmailTemplate { subject: string; heading: string; body: string; buttonText: string; accentColor: string }
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
  status: EventStatus;
  companions: number;
  terms: string;
  audience?: { mode: 'all' | 'payroll' | 'excel'; people: AudiencePerson[] };
  emailTemplate?: EmailTemplate;
}
export interface Registration {
  id: string; eventId: string; name: string; email: string; companions: number; createdAt: string;
}
export type AppView = 'explore' | 'registrations' | 'favorites' | 'admin' | 'profile';
