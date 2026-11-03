import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import './controls.css';

const colors = ['#1eb2f5', '#4ec5ff', '#2348de', '#7b6cf6', '#e0479e', '#18c39a', '#052c50'];
export default function SupernovaColorPicker({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return <div className="supernova-color-picker"><div className="supernova-color-palette" role="group" aria-label="Paleta de colores Órbita">{colors.map(color => <button key={color} type="button" aria-label={`Usar color ${color}`} aria-pressed={value.toLowerCase() === color} style={{ backgroundColor: color, color: color === '#211432' ? '#efddff' : undefined }} onClick={() => onChange(color)}>{value.toLowerCase() === color && <Check size={13} />}</button>)}</div><div className="supernova-color-value"><span aria-hidden="true" style={{ backgroundColor: value }} /><input id={id} className="supernova-control" aria-label="Color del botón" type="text" maxLength={7} placeholder="#b998f5" value={text} onChange={event => { const next = event.target.value; setText(next); if (/^#[\da-f]{6}$/i.test(next)) onChange(next); }} onBlur={() => setText(value)} /></div></div>;
}
