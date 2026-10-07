import { useState } from 'react';
import { Building2, Check, CheckCircle2, FileSpreadsheet, Search, Trash2, Upload, Users, X } from 'lucide-react';
import type { EventItem } from '../../types';
import { demoPayroll } from '../../data/payroll';
import { downloadAudienceSample, parseAudienceFile } from './admin.helpers';
import type { AudienceImportResult } from './admin.helpers';
import SupernovaSelect from '../../components/ui/SupernovaSelect';

interface AudienceStepProps {
  audience: NonNullable<EventItem['audience']>;
  onChange: (audience: NonNullable<EventItem['audience']>) => void;
  error?: string;
}

const audienceModes = [
  { mode: 'all', icon: Building2, title: 'Toda la compañía', description: 'Una invitación abierta a todos.', detail: 'Acceso abierto' },
  { mode: 'payroll', icon: Users, title: 'Tabla de nómina', description: 'Elegí a quienes querés invitar.', detail: 'Selección personalizada' },
  { mode: 'excel', icon: FileSpreadsheet, title: 'Importar invitados', description: 'Traé tu lista en Excel o CSV.', detail: '.xlsx · .csv' },
] as const;

export default function AudienceStep({ audience, onChange, error }: AudienceStepProps) {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [importResult, setImportResult] = useState<AudienceImportResult | null>(null);
  const [filename, setFilename] = useState('');
  const [dragging, setDragging] = useState(false);
  const selectedIds = new Set(audience.people.map(person => person.id));
  const filteredPayroll = demoPayroll.filter(person =>
    (department === 'all' || person.department === department) &&
    `${person.name} ${person.email} ${person.department}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const departments = [...new Set(demoPayroll.map(person => person.department))];
  const allVisibleSelected = filteredPayroll.length > 0 && filteredPayroll.every(person => selectedIds.has(person.id));

  function changeMode(mode: NonNullable<EventItem['audience']>['mode']) {
    if (audience.mode === mode) return;
    onChange({ mode, people: [] });
    setUploadError('');
    setImportResult(null);
    setFilename('');
  }

  function togglePerson(id: string) {
    const person = demoPayroll.find(candidate => candidate.id === id);
    if (!person) return;
    onChange({ ...audience, people: selectedIds.has(id) ? audience.people.filter(candidate => candidate.id !== id) : [...audience.people, person] });
  }

  function toggleAllVisible() {
    onChange({ ...audience, people: allVisibleSelected
      ? audience.people.filter(person => !filteredPayroll.some(visible => visible.id === person.id))
      : [...audience.people, ...filteredPayroll.filter(person => !selectedIds.has(person.id))],
    });
  }

  async function importFile(file?: File) {
    if (!file || uploading) return;
    setUploading(true);
    setUploadError('');
    try {
      const result = await parseAudienceFile(file);
      setImportResult(result);
      setFilename(file.name);
      onChange({ mode: 'excel', people: result.people });
      if (!result.people.length) setUploadError('No encontramos personas válidas. Revisá las columnas nombre y email.');
    } catch (issue) {
      setUploadError(issue instanceof Error ? issue.message : 'No pudimos leer el archivo. Probá con el modelo de ejemplo.');
    } finally { setUploading(false); }
  }

  async function downloadSample() {
    try { await downloadAudienceSample(); }
    catch { setUploadError('No pudimos descargar el modelo. Volvé a intentarlo.'); }
  }

  return (
    <div className="wizard-step-content">
      <div className="wizard-section-heading"><span className="admin-eyebrow">EL ENCUENTRO EMPIEZA CON ELLOS</span><h2>¿A quiénes vamos a invitar?</h2><p>Encontrá la audiencia ideal para esta experiencia.</p></div>
      <div className="audience-options" role="radiogroup" aria-label="Audiencia del evento">
        {audienceModes.map(({ mode, icon: Icon, title, description, detail }) => (
          <button key={mode} type="button" role="radio" aria-checked={audience.mode === mode} className={`audience-option ${audience.mode === mode ? 'is-selected' : ''}`} onClick={() => changeMode(mode)}>
            <span className="audience-option-icon"><Icon size={21} /></span><span className="audience-radio">{audience.mode === mode && <Check size={12} />}</span>
            <strong>{title}</strong><span>{description}</span><small>{detail}</small>
          </button>
        ))}
      </div>
      {error && <p className="admin-field-error" role="alert">{error}</p>}
      {audience.mode === 'all' && (
        <div className="audience-all-panel"><div className="audience-all-art"><Building2 size={34} /><span /><span /><span /></div><h3>Las mejores conexiones no tienen límites.</h3><p>El evento será visible para toda la compañía. Cada persona podrá reservar su lugar hasta completar el cupo.</p><div className="admin-note"><CheckCircle2 size={15} /> Audiencia abierta · Sin lista de invitados</div></div>
      )}
      {audience.mode === 'payroll' && (
        <div className="audience-people-panel">
          <div className="admin-inline-note"><span className="admin-demo-dot" /> Nómina de ejemplo · 12 personas ficticias. La base real se conectará con el backend.</div>
          <div className="audience-search-row"><label className="admin-search"><Search size={17} /><input aria-label="Buscar en la nómina" placeholder="Buscar nombre, email o área…" value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setQuery('')}><X size={15} /></button>}</label><SupernovaSelect label="Filtrar por área" value={department} onChange={setDepartment} options={[{ value: 'all', label: 'Todas las áreas' }, ...departments.map(area => ({ value: area, label: area }))]} /></div>
          <div className="audience-selection-bar"><label><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} disabled={!filteredPayroll.length} /> Seleccionar visibles</label><span>{audience.people.length} seleccionados</span>{audience.people.length > 0 && <button type="button" onClick={() => onChange({ ...audience, people: [] })}>Limpiar</button>}</div>
          <div className="audience-roster">
            {filteredPayroll.length ? filteredPayroll.map(person => (
              <label className={`audience-person ${selectedIds.has(person.id) ? 'is-selected' : ''}`} key={person.id}><input type="checkbox" checked={selectedIds.has(person.id)} onChange={() => togglePerson(person.id)} /><span className="admin-person-avatar">{person.name.split(' ').map(word => word[0]).join('').slice(0, 2)}</span><span className="audience-person-info"><strong>{person.name}</strong><small>{person.email}</small></span><span className="admin-area-tag">{person.department}</span></label>
            )) : <div className="admin-empty-small"><Search size={25} /><p>No encontramos personas con esa búsqueda.</p><button type="button" onClick={() => { setQuery(''); setDepartment('all'); }}>Ver toda la nómina</button></div>}
          </div>
        </div>
      )}
      {audience.mode === 'excel' && (
        <div className="audience-import-panel">
          <label className={`audience-dropzone ${dragging ? 'is-dragging' : ''} ${uploading ? 'is-uploading' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void importFile(event.dataTransfer.files[0]); }}>
            <input type="file" accept=".xlsx,.csv" disabled={uploading} aria-label="Importar lista de invitados" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ''; }} />
            <span className="audience-upload-icon"><Upload size={26} /></span><strong>{uploading ? 'Leyendo tu lista…' : 'Tu lista. Sus próximas conexiones.'}</strong><span>{uploading ? 'Validando personas y eliminando duplicados.' : <>Arrastrá un archivo o <b>buscalo en tu equipo</b></>}</span><small>Excel o CSV · Hasta 5 MB · Máximo 5.000 personas</small>
          </label>
          <div className="audience-template-row"><span>Columnas requeridas: <b>nombre</b> y <b>email</b>. <b>area</b> es opcional.</span><button type="button" onClick={() => void downloadSample()}><FileSpreadsheet size={15} /> Descargar modelo</button></div>
          {uploadError && <p className="admin-field-error" role="alert">{uploadError}</p>}
          {audience.people.length > 0 && <div className="import-success"><CheckCircle2 size={20} /><div><strong>{audience.people.length} personas listas para invitar</strong><small>{filename || 'Lista recuperada de tu borrador'}{importResult && ` · ${importResult.duplicates} duplicados omitidos · ${importResult.issues.length} filas inválidas`}</small></div><button type="button" aria-label="Eliminar lista importada" onClick={() => { onChange({ ...audience, people: [] }); setImportResult(null); setFilename(''); }}><Trash2 size={17} /></button></div>}
          {importResult && importResult.issues.length > 0 && <details className="import-issues"><summary>Revisar {importResult.issues.length} filas omitidas</summary><ul>{importResult.issues.slice(0, 10).map(issue => <li key={issue.row}>Fila {issue.row}: {issue.reason}</li>)}</ul>{importResult.issues.length > 10 && <p>Y {importResult.issues.length - 10} filas más. Corregí el archivo y volvé a importarlo.</p>}</details>}
          {audience.people.length > 0 && <div className="audience-imported-list">{audience.people.slice(0, 5).map(person => <div key={person.id}><span className="admin-person-avatar">{person.name[0]}</span><span><strong>{person.name}</strong><small>{person.email}</small></span><button type="button" aria-label={`Quitar a ${person.name}`} onClick={() => onChange({ ...audience, people: audience.people.filter(candidate => candidate.id !== person.id) })}><X size={14} /></button></div>)}{audience.people.length > 5 && <p>+ {audience.people.length - 5} personas más en tu lista</p>}</div>}
        </div>
      )}
    </div>
  );
}
