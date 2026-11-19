import type { ReactNode } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import './camf.css';

export const fmt = (value: number) => value.toFixed(3);
export function Term({ children, meaning }: { children: ReactNode; meaning: string }) {
  return <SymbolHint meaning={meaning}>{children}</SymbolHint>;
}
export function Sheet({ detail = .5, progress = 1 }: { detail?: number; progress?: number }) {
  return <svg viewBox="0 0 640 360" role="img" aria-label="观察速写：整体轮廓和局部笔触">
    <rect width="640" height="360" fill="#eef3f4"/>
    <path d="M55 325 H600" stroke="#bcc8cc" strokeWidth="7"/>
    <path d="M110 40 L515 58 L490 315 L92 296 Z" fill="white" stroke="#9baeb9" strokeWidth="3"/>
    <path d="M240 270 Q130 145 380 85 Q455 225 240 270 Z" fill="#e4eee7" stroke="#27446e" strokeWidth="6" strokeDasharray="650" strokeDashoffset={650 * (1 - progress)}/>
    <path d="M240 270 L380 85" stroke="#76906a" strokeWidth="5"/>
    {[0,1,2,3,4,5].map(index => <path key={index} d={`M${264+index*16} ${238-index*22} l-65 -22 m65 22 l58 -8`} stroke="#228d5c" strokeWidth="4" opacity={detail} strokeDasharray="140" strokeDashoffset={140*(1-progress)}/>)}
    <g transform={`translate(${430-100*progress} ${285-125*progress}) rotate(-35)`}><path d="M0 -60 H18 V55 L9 75 L0 55 Z" fill="#f07e47" stroke="#92400e" strokeWidth="3"/><path d="M3 59 L9 75 L15 59" fill="#21324a"/></g>
  </svg>;
}
export function Feedback({ children, tone = 'blue' }: { children: ReactNode; tone?: string }) {
  return <div className={`camf-feedback ${tone}`} aria-live="polite">{children}</div>;
}
export function Range({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label className="camf-range"><span>{label}<b>{value}</b></span><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))}/></label>;
}
