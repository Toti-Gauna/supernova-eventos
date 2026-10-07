import { useEffect, useId, useRef, useState } from 'react';
import type { AriaAttributes, KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import './controls.css';

export interface SupernovaSelectProps extends Pick<AriaAttributes, 'aria-invalid' | 'aria-describedby'> {
  id?: string;
  label?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function SupernovaSelect({ id, label, value, options, onChange, className = '', disabled, required, ...aria }: SupernovaSelectProps) {
  const generatedId = useId();
  const controlId = id || `supernova-select-${generatedId}`;
  const menuId = `${controlId}-options`;
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(Math.max(0, options.findIndex(option => option.value === value)));
  const openRef = useRef(false);
  const activeRef = useRef(active);
  const searchText = useRef('');
  const searchTimer = useRef<number | undefined>(undefined);
  const selected = options.find(option => option.value === value);

  function positionMenu() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect || !menu.current) return;
    const availableBelow = window.innerHeight - rect.bottom - 12;
    const height = Math.min(280, options.length * 42 + 12);
    const above = availableBelow < Math.min(height, 170) && rect.top > availableBelow;
    menu.current.style.width = `${Math.min(Math.max(rect.width, 180), window.innerWidth - 24)}px`;
    menu.current.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 180) - 12))}px`;
    menu.current.style.top = above ? 'auto' : `${rect.bottom + 7}px`;
    menu.current.style.bottom = above ? `${window.innerHeight - rect.top + 7}px` : 'auto';
    menu.current.style.maxHeight = `${Math.max(100, Math.min(280, above ? rect.top - 19 : availableBelow))}px`;
  }

  function setActiveIndex(index: number) { activeRef.current = index; setActive(index); }
  function close() { openRef.current = false; menu.current?.hidePopover(); setOpen(false); }
  function show() {
    if (disabled || !options.length) return;
    setActiveIndex(Math.max(0, options.findIndex(option => option.value === value)));
    positionMenu();
    menu.current?.showPopover();
    openRef.current = true; setOpen(true);
  }
  function choose(index: number) { if (options[index]) onChange(options[index].value); close(); trigger.current?.focus({ preventScroll: true }); }

  useEffect(() => {
    if (!open) return;
    const update = () => positionMenu();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [open, options.length]);
  useEffect(() => { if (open) menu.current?.querySelector<HTMLElement>(`[data-option-index="${active}"]`)?.scrollIntoView({ block: 'nearest' }); }, [active, open]);
  useEffect(() => () => window.clearTimeout(searchTimer.current), []);

  function handleKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!openRef.current) { show(); return; }
      setActiveIndex(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (activeRef.current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (openRef.current) choose(activeRef.current); else show();
    } else if (event.key === 'Escape' && openRef.current) {
      event.preventDefault(); event.stopPropagation(); close();
    } else if (event.key === 'Tab') { close(); }
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      searchText.current += event.key.toLocaleLowerCase('es');
      window.clearTimeout(searchTimer.current);
      searchTimer.current = window.setTimeout(() => { searchText.current = ''; }, 600);
      const match = options.findIndex(option => option.label.toLocaleLowerCase('es').startsWith(searchText.current));
      if (match >= 0) { if (!openRef.current) show(); setActiveIndex(match); }
    }
  }

  return <div className={`supernova-select ${className}`}>
    <button ref={trigger} id={controlId} className="supernova-control supernova-select-trigger" type="button" role="combobox" aria-label={label} aria-expanded={open} aria-controls={menuId} aria-haspopup="listbox" aria-required={required} aria-activedescendant={open ? `${menuId}-${active}` : undefined} disabled={disabled} {...aria} onClick={() => open ? close() : show()} onKeyDown={handleKey}><span>{selected?.label || 'Seleccioná una opción'}</span><ChevronDown size={15} className={open ? 'is-open' : ''} /></button>
    <div ref={menu} id={menuId} className="supernova-select-menu supernova-control-popover" popover="auto" role="listbox" aria-label={label} onToggle={event => { openRef.current = event.newState === 'open'; setOpen(openRef.current); }}>
      {options.map((option, index) => <button type="button" role="option" tabIndex={-1} id={`${menuId}-${index}`} data-option-index={index} key={option.value} aria-selected={option.value === value} className={index === active ? 'is-active' : ''} onPointerMove={() => setActiveIndex(index)} onMouseDown={event => event.preventDefault()} onClick={() => choose(index)}><span>{option.label}</span>{option.value === value && <Check size={14} />}</button>)}
    </div>
  </div>;
}
