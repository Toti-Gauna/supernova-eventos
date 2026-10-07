import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowDownToLine, ArrowRight, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Copy, Edit3, Eye, Globe2, ListFilter, LockKeyhole, MoreHorizontal, Plus, RotateCcw, Search, Sparkles, Ticket, Trash2, Users, X } from 'lucide-react';
import type { EventItem, EventStatus, Registration } from '../../types';
import { readStorage } from '../../lib/storage';
import { publicAssetUrl } from '../../lib/assets';
import NativeDialog from '../../components/ui/NativeDialog';
import SupernovaSelect from '../../components/ui/SupernovaSelect';
import SupernovaDatePicker from '../../components/ui/SupernovaDatePicker';
import EventWizard from './EventWizard';
import type { SavedEventDraft } from './EventWizard';
import { clearSavedDraft, DRAFT_KEY, exportRegistrations, formatEventDate, newEvent, statusLabels, toLocalDateTime } from './admin.helpers';
import './admin.css';
import './studio.css';
import './dashboard.css';
import './theme.css';

interface AdminPanelProps {
  events: EventItem[];
  registrations?: Registration[];
  onCreate: (event: EventItem) => void;
  onUpdate: (event: EventItem) => void;
  onPreview: (event: EventItem) => void;
  notify: (message: string) => void;
  onWizardChange?: (active: boolean) => void;
}
interface WizardSession { initial: EventItem; editing: boolean; initialStep?: number }
interface DashboardFilters { query: string; status: EventStatus | 'all'; audience: 'all' | 'company' | 'private'; dateFrom: string; dateTo: string }
type FilterKey = keyof DashboardFilters;

const emptyFilters: DashboardFilters = { query: '', status: 'all', audience: 'all', dateFrom: '', dateTo: '' };
const statusOptions = [{ value: 'all', label: 'Todos los estados' }, { value: 'published', label: 'Publicados' }, { value: 'draft', label: 'Borradores' }, { value: 'ended', label: 'Finalizados' }];
const audienceOptions = [{ value: 'all', label: 'Todas las audiencias' }, { value: 'company', label: 'Toda la compañía' }, { value: 'private', label: 'Audiencia privada' }];
const filterLabels: Record<FilterKey, string> = { query: 'Nombre', status: 'Estado', audience: 'Audiencia', dateFrom: 'Desde', dateTo: 'Hasta' };
const filterKeys = Object.keys(filterLabels) as FilterKey[];
function normalizeText(value: string) { return value.toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function isFilterActive(key: FilterKey, value: string) { return value !== emptyFilters[key]; }
function displayFilterValue(key: FilterKey, value: string) {
  if (key === 'status') return statusOptions.find(option => option.value === value)?.label || value;
  if (key === 'audience') return audienceOptions.find(option => option.value === value)?.label || value;
  if (key === 'dateFrom' || key === 'dateTo') return value ? new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : 'Cualquier fecha';
  return value || 'Cualquier nombre';
}

function savedDraft(): SavedEventDraft | null {
  const draft = readStorage<SavedEventDraft | null>(DRAFT_KEY, null);
  return draft && draft.event && typeof draft.event.id === 'string' && typeof draft.event.title === 'string' ? draft : null;
}

export default function AdminPanel({ events, registrations = [], onCreate, onUpdate, onPreview, notify, onWizardChange }: AdminPanelProps) {
  const [draftFilters, setDraftFilters] = useState<DashboardFilters>({ ...emptyFilters });
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>({ ...emptyFilters });
  const [moreFilters, setMoreFilters] = useState(false);
  const [filtersDialog, setFiltersDialog] = useState(false);
  const [wizard, setWizard] = useState<WizardSession | null>(null);
  const [storedDraft, setStoredDraft] = useState<SavedEventDraft | null>(savedDraft);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const reducedMotion = useReducedMotion();
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  const filterSearch = useRef<HTMLInputElement | null>(null);
  const filtersDialogTrigger = useRef<HTMLButtonElement | null>(null);
  const wizardChangeCallback = useRef(onWizardChange);
  wizardChangeCallback.current = onWizardChange;
  const wizardIsActive = Boolean(wizard);
  const normalizedQuery = normalizeText(appliedFilters.query);
  const filteredEvents = events.filter(event => {
    const localDate = toLocalDateTime(event.date).slice(0, 10);
    return (appliedFilters.status === 'all' || event.status === appliedFilters.status)
      && (appliedFilters.audience === 'all' || event.isPrivate === (appliedFilters.audience === 'private'))
      && ((!appliedFilters.dateFrom && !appliedFilters.dateTo) || Boolean(localDate))
      && (!appliedFilters.dateFrom || localDate >= appliedFilters.dateFrom)
      && (!appliedFilters.dateTo || localDate <= appliedFilters.dateTo)
      && normalizeText(event.title).includes(normalizedQuery);
  });
  const published = filteredEvents.filter(event => event.status === 'published');
  const drafts = filteredEvents.filter(event => event.status === 'draft');
  const totalRegistrations = filteredEvents.reduce((total, event) => total + event.registered, 0);
  const totalCapacity = published.reduce((total, event) => total + event.capacity, 0);
  const occupiedCapacity = published.reduce((total, event) => total + event.registered, 0);
  const occupancy = totalCapacity ? Math.round(occupiedCapacity / totalCapacity * 100) : 0;
  const activeFilterKeys = filterKeys.filter(key => isFilterActive(key, appliedFilters[key]));
  const filtersChanged = filterKeys.some(key => draftFilters[key] !== appliedFilters[key]);
  const extraFilterCount = (['audience', 'dateFrom', 'dateTo'] as const).filter(key => isFilterActive(key, draftFilters[key])).length;
  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const visibleEvents = filteredEvents.slice(safePage * pageSize, safePage * pageSize + pageSize);

  useEffect(() => { onWizardChange?.(wizardIsActive); }, [wizardIsActive, onWizardChange]);
  useEffect(() => () => { wizardChangeCallback.current?.(false); }, []);

  function updateFilter<K extends FilterKey>(key: K, value: DashboardFilters[K]) { setDraftFilters(current => ({ ...current, [key]: value })); }
  function applyFilters(submit: FormEvent<HTMLFormElement>) {
    submit.preventDefault();
    const invalidControl = submit.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalidControl) { notify('Revisá la fecha ingresada. Usá el calendario o el formato día/mes/año.'); invalidControl.focus(); return; }
    if (draftFilters.dateFrom && draftFilters.dateTo && draftFilters.dateFrom > draftFilters.dateTo) { notify('La fecha desde debe ser anterior o igual a la fecha hasta.'); return; }
    const next = { ...draftFilters, query: draftFilters.query.trim() };
    setAppliedFilters(next); setDraftFilters(next); setPage(0);
  }
  function resetFilters() { setDraftFilters({ ...emptyFilters }); setAppliedFilters({ ...emptyFilters }); setPage(0); }
  function removeFilter(key: FilterKey) {
    setAppliedFilters(current => ({ ...current, [key]: emptyFilters[key] }));
    setDraftFilters(current => ({ ...current, [key]: emptyFilters[key] }));
    setPage(0);
  }
  function closeFilterDetails() {
    setFiltersDialog(false);
    window.requestAnimationFrame(() => { if (!filtersDialogTrigger.current?.isConnected) filterSearch.current?.focus({ preventScroll: true }); });
  }

  useEffect(() => {
    if (!openMenu) return;
    function closeMenu(event: MouseEvent) { if (!(event.target as HTMLElement).closest('.admin-event-menu')) setOpenMenu(null); }
    function escapeMenu(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') { setOpenMenu(null); menuTrigger.current?.focus(); }
    }
    const firstItem = menuTrigger.current?.parentElement?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    firstItem?.focus();
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', escapeMenu);
    return () => { document.removeEventListener('click', closeMenu); document.removeEventListener('keydown', escapeMenu); };
  }, [openMenu]);

  function handleMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); items[event.key === 'Home' ? 0 : items.length - 1]?.focus(); }
    if (event.key === 'Tab') setOpenMenu(null);
  }

  function startWizard(event?: EventItem) {
    setWizard({ initial: event ? structuredClone(event) : newEvent(), editing: Boolean(event) });
    setOpenMenu(null);
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  function closeWizard() { setWizard(null); setStoredDraft(savedDraft()); window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }); }

  function saveEvent(event: EventItem, editing: boolean) {
    if (editing && events.some(existing => existing.id === event.id)) onUpdate(event);
    else onCreate(event);
    setWizard(null);
    setStoredDraft(null);
    notify(event.status === 'draft' ? 'Borrador guardado. Tu próxima experiencia puede esperar.' : 'Evento publicado en esta demo. La plantilla está guardada; no se enviaron emails.');
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  function resumeDraft() {
    if (!storedDraft) return;
    setWizard({ initial: storedDraft.event, editing: storedDraft.editing, initialStep: storedDraft.step });
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  function discardDraft() {
    clearSavedDraft();
    setStoredDraft(null);
    notify('Borrador automático descartado.');
  }

  function duplicateEvent(event: EventItem) {
    onCreate({ ...structuredClone(event), id: crypto.randomUUID(), title: `${event.title} · copia`, registered: 0, featured: false, status: 'draft' });
    setOpenMenu(null);
    notify('Experiencia duplicada como borrador. Podés editarla antes de publicar.');
  }

  function exportData(eventId?: string) {
    const rows = eventId ? registrations.filter(registration => registration.eventId === eventId) : registrations;
    if (!rows.length) { notify('Todavía no hay inscripciones realizadas en esta demo para exportar.'); setOpenMenu(null); return; }
    exportRegistrations(events, rows);
    setOpenMenu(null);
    notify(`Exportamos ${rows.length} ${rows.length === 1 ? 'inscripción' : 'inscripciones'} de esta demo.`);
  }

  if (wizard) return <section className="admin-panel is-studio-session"><EventWizard initial={wizard.initial} editing={wizard.editing} initialStep={wizard.initialStep} onClose={closeWizard} onSave={saveEvent} onPreview={onPreview} /></section>;

  return <motion.section className="admin-panel admin-dashboard" initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }}>
    <header className="dashboard-heading"><h1>Administrar experiencias</h1><div className="dashboard-heading-actions">
      <button type="button" className="admin-outline-button" onClick={() => exportData()}><ArrowDownToLine size={16} /><span>Exportar inscripciones</span></button>
      <button type="button" className="admin-primary-button" onClick={() => startWizard()}><Plus size={17} />Crear experiencia</button>
    </div></header>

    <form className="dashboard-filters" aria-label="Filtros de experiencias" onSubmit={applyFilters}>
      <div className="dashboard-filters-main">
        <label className="dashboard-search-field"><span>Nombre</span><span className="dashboard-search-input"><Search size={16} /><input ref={filterSearch} aria-label="Buscar experiencias en administración" placeholder="Buscar por nombre…" value={draftFilters.query} onChange={change => updateFilter('query', change.target.value)} />{draftFilters.query && <button type="button" aria-label="Limpiar nombre" onClick={() => updateFilter('query', '')}><X size={14} /></button>}</span></label>
        <div className="dashboard-filter-field dashboard-status-field"><label htmlFor="dashboard-status">Estado</label><SupernovaSelect id="dashboard-status" label="Estado" value={draftFilters.status} options={statusOptions} onChange={value => updateFilter('status', value as DashboardFilters['status'])} /></div>
        <button type="button" className={`dashboard-more-filters ${moreFilters ? 'is-open' : ''}`} aria-expanded={moreFilters} aria-controls="dashboard-extra-filters" onClick={() => setMoreFilters(current => !current)}><ListFilter size={16} />Más filtros{extraFilterCount > 0 && <span>{extraFilterCount}</span>}<ChevronDown size={14} /></button>
        <div className="dashboard-filter-actions"><button className="dashboard-search-button" type="submit"><Search size={15} />Buscar</button><button className="dashboard-reset-button" type="button" onClick={resetFilters}><RotateCcw size={14} />Reiniciar filtros</button></div>
      </div>
      <AnimatePresence>{moreFilters && <motion.div id="dashboard-extra-filters" className="dashboard-filters-more" initial={{ opacity: 0, y: reducedMotion ? 0 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }} transition={{ duration: .16 }}>
        <div className="dashboard-filter-field"><label htmlFor="dashboard-audience">Audiencia</label><SupernovaSelect id="dashboard-audience" label="Audiencia" value={draftFilters.audience} options={audienceOptions} onChange={value => updateFilter('audience', value as DashboardFilters['audience'])} /></div>
        <div className="dashboard-filter-field"><label htmlFor="dashboard-date-from">Fecha desde</label><SupernovaDatePicker id="dashboard-date-from" label="Fecha desde" value={draftFilters.dateFrom} onChange={value => updateFilter('dateFrom', value)} mode="date" /></div>
        <div className="dashboard-filter-field"><label htmlFor="dashboard-date-to">Fecha hasta</label><SupernovaDatePicker id="dashboard-date-to" label="Fecha hasta" value={draftFilters.dateTo} onChange={value => updateFilter('dateTo', value)} mode="date" /></div>
      </motion.div>}</AnimatePresence>
      {filtersChanged && <span className="dashboard-pending-filters" role="status">Tenés cambios sin aplicar. Buscá para actualizar los resultados.</span>}
    </form>
    {activeFilterKeys.length > 0 && <div className="dashboard-applied-filters"><span>Aplicados</span>{activeFilterKeys.map(key => <button type="button" key={key} onClick={click => { filtersDialogTrigger.current = click.currentTarget; setFiltersDialog(true); }} aria-label={`Ver filtros aplicados: ${filterLabels[key]}, ${displayFilterValue(key, appliedFilters[key])}`}><span>{filterLabels[key]}:</span>{displayFilterValue(key, appliedFilters[key])}<ChevronRight size={12} /></button>)}</div>}

    <div className="dashboard-metrics" aria-label="Resumen de los resultados">
      <div className="dashboard-metric"><span className="dashboard-metric-icon violet"><CalendarDays size={18} /></span><div><span>Publicadas</span><strong>{published.length.toString().padStart(2, '0')}</strong></div></div>
      <div className="dashboard-metric"><span className="dashboard-metric-icon mint"><Users size={18} /></span><div><span>Inscripciones</span><strong>{totalRegistrations.toLocaleString('es-AR')}</strong></div></div>
      <div className="dashboard-metric"><span className="dashboard-metric-icon pink"><Ticket size={18} /></span><div><span>Ocupación de cupos</span><strong>{occupancy}<em>%</em></strong></div></div>
      <div className="dashboard-metric"><span className="dashboard-metric-icon amber"><Sparkles size={18} /></span><div><span>Borradores</span><strong>{drafts.length.toString().padStart(2, '0')}</strong></div></div>
    </div>
    {storedDraft && <div className="dashboard-resume-draft"><Edit3 size={16} /><div><strong>Borrador sin terminar</strong><span>{storedDraft.event.title || 'Tu nueva experiencia'}</span></div><button type="button" onClick={resumeDraft}>Seguir creando<ArrowRight size={14} /></button><button type="button" className="dashboard-discard-draft" aria-label="Descartar borrador automático" onClick={discardDraft}><Trash2 size={15} /></button></div>}

    <div className="admin-events-section dashboard-table-section">
      <div className="admin-table-wrap"><table className="admin-event-table"><thead><tr><th>EXPERIENCIA</th><th>FECHA</th><th>AUDIENCIA</th><th>INSCRIPCIONES</th><th>ESTADO</th><th><span className="admin-visually-hidden">Acciones</span></th></tr></thead><tbody>{visibleEvents.map(event => {
        const percentage = event.capacity ? Math.min(100, event.registered / event.capacity * 100) : 0;
        return <motion.tr key={event.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : .15 }}><td><div className="admin-event-cell"><img src={publicAssetUrl(event.image)} alt="" /><div><button type="button" onClick={() => onPreview(event)}>{event.title}</button><span>{event.category}<i />{event.mode}</span></div></div></td><td><span className="admin-table-date">{formatEventDate(event.date)}</span><small>{new Date(event.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} h</small></td><td><span className="admin-table-audience">{event.isPrivate ? <LockKeyhole size={13} /> : <Globe2 size={14} />}{event.isPrivate ? 'Privada' : 'Compañía'}</span>{event.isPrivate && <small>{event.audience?.people.length || 0} invitados</small>}</td><td><span className="admin-table-registration"><strong>{event.registered}</strong><span> / {event.capacity}</span></span><span className={`admin-table-progress ${percentage >= 90 ? 'is-almost-full' : ''}`}><span style={{ width: `${percentage}%` }} /></span></td><td><span className={`admin-status-badge ${event.status}`}>{event.status === 'published' && <span />}{statusLabels[event.status]}</span></td><td><div className="admin-row-actions"><button type="button" aria-label={`Vista previa de ${event.title}`} title="Vista previa" onClick={() => onPreview(event)}><Eye size={16} /></button><button type="button" aria-label={`Editar ${event.title}`} title="Editar experiencia" onClick={() => startWizard(event)}><Edit3 size={16} /></button><div className="admin-event-menu"><button type="button" aria-label={`Más acciones para ${event.title}`} aria-expanded={openMenu === event.id} aria-haspopup="menu" onClick={click => { menuTrigger.current = click.currentTarget; setOpenMenu(openMenu === event.id ? null : event.id); }}><MoreHorizontal size={19} /></button><AnimatePresence>{openMenu === event.id && <motion.div className="admin-row-dropdown" role="menu" aria-label={`Acciones de ${event.title}`} onKeyDown={handleMenuKey} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><button type="button" role="menuitem" onClick={() => duplicateEvent(event)}><Copy size={15} />Duplicar como borrador</button><button type="button" role="menuitem" onClick={() => exportData(event.id)}><ArrowDownToLine size={15} />Exportar inscripciones</button></motion.div>}</AnimatePresence></div></div></td></motion.tr>;
      })}</tbody></table></div>
      {!visibleEvents.length && <div className="dashboard-table-empty"><Search size={23} /><h2>{events.length ? 'No encontramos experiencias.' : 'Creá tu primera experiencia.'}</h2><p>{events.length ? 'Probá con otro nombre o ajustá los filtros.' : 'Tu próximo encuentro empieza con una idea.'}</p><button type="button" className="admin-outline-button" onClick={events.length ? resetFilters : () => startWizard()}>{events.length ? 'Reiniciar filtros' : 'Crear experiencia'}<ArrowRight size={14} /></button></div>}
      <div className="dashboard-pagination"><span className="dashboard-results-count" role="status">{filteredEvents.length ? `${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, filteredEvents.length)} de ${filteredEvents.length} experiencias` : '0 experiencias'}</span><div className="dashboard-pagination-controls"><div className="dashboard-page-size-field"><label htmlFor="dashboard-page-size">Filas por página</label><SupernovaSelect id="dashboard-page-size" label="Filas por página" value={String(pageSize)} options={[{ value: '5', label: '5' }, { value: '10', label: '10' }]} onChange={value => { setPageSize(Number(value)); setPage(0); }} className="dashboard-page-size" /></div><div className="dashboard-page-buttons"><button type="button" aria-label="Página anterior" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft size={17} /><span>Anterior</span></button><span aria-label={`Página ${safePage + 1} de ${pageCount}`}>{safePage + 1} / {pageCount}</span><button type="button" aria-label="Página siguiente" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}><span>Siguiente</span><ChevronRight size={17} /></button></div></div></div>
    </div>
    <span className="dashboard-demo-note"><CheckCircle2 size={12} />Datos de demostración</span>

    {filtersDialog && <NativeDialog className="admin-filter-dialog" labelledBy="admin-filter-dialog-title" onClose={closeFilterDetails}><motion.div className="dashboard-filter-modal" initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><div className="dashboard-filter-modal-heading"><span><ListFilter size={19} /><h2 id="admin-filter-dialog-title">Filtros aplicados</h2></span><button type="button" aria-label="Cerrar filtros" onClick={closeFilterDetails}><X size={18} /></button></div><p>{filteredEvents.length} {filteredEvents.length === 1 ? 'experiencia coincide' : 'experiencias coinciden'} con esta búsqueda.</p><div className="dashboard-filter-modal-list">{filterKeys.map(key => <div key={key}><span>{filterLabels[key]}</span><strong>{displayFilterValue(key, appliedFilters[key])}</strong>{isFilterActive(key, appliedFilters[key]) ? <button type="button" aria-label={`Quitar filtro ${filterLabels[key]}`} onClick={() => removeFilter(key)}><X size={14} />Quitar</button> : <small>Sin filtro</small>}</div>)}</div><div className="dashboard-filter-modal-actions"><button type="button" onClick={resetFilters} disabled={!activeFilterKeys.length}><RotateCcw size={14} />Reiniciar todos</button><button className="admin-primary-button" type="button" onClick={closeFilterDetails}>Listo</button></div></motion.div></NativeDialog>}
  </motion.section>;
}
