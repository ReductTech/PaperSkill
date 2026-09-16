import {useEffect, useRef} from 'react';
import {Formula} from '../components/Formula';
import type {FormulaDef} from '../types';

// Add keyboard access locally without changing the bundled Formula component.
export function InteractiveFormula({formula}:{formula:FormulaDef}) {
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{ref.current?.querySelectorAll<HTMLElement>('[data-sym]').forEach(el=>{
  el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','解释符号 '+el.dataset.sym);
 });},[formula]);
 return <div className="paper-formula" ref={ref} onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&(e.target as HTMLElement).matches('[data-sym]')){e.preventDefault();e.stopPropagation();(e.target as HTMLElement).click();}}}><Formula formula={formula}/></div>;
}
