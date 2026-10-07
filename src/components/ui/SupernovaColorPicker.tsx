import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import './controls.css';

const colors = ['#b998f5', '#d1b8ff', '#89cbbb', '#d9a2c8', '#c4b07a', '#6fa8da', '#211432'];
export default function SupernovaColorPicker({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return <div className="supernova-color-picker"><div className="supernova-color-palette" role="group" aria-label="Paleta de colores Supernova">{colors.map(color => <button key={color} type="button" aria-label={`Usar color ${color}`} aria-pressed={value.toLowerCase() === color} style={{ backgroundColor: color, color: color === '#211432' ? '#efddff' : undefined }} onClick={() => onChange(color)}>{value.toLowerCase() === color && <Check size={13} />}</button>)}</div><div className="supernova-color-value"><span aria-hidden="true" style={{ backgroundColor: value }} /><input id={id} className="supernova-control" aria-label="Color del botón" type="text" maxLength={7} placeholder="#b998f5" value={text} onChange={event => { const next = event.target.value; setText(next); if (/^#[\da-f]{6}$/i.test(next)) onChange(next); }} onBlur={() => setText(value)} /></div></div>;
}
