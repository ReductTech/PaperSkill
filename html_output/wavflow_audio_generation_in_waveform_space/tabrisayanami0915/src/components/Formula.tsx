import React,{useState} from 'react';
import type {FormulaDef} from '../types';
export function Formula({formula}:{formula:FormulaDef}){
 const [active,setActive]=useState<string|null>(null);
 const symbol=formula.symbols.find(s=>s.sym===active);
 return <div className="formula-explain">
 <p className="fe-hint">选择符号查看定义</p>
 <div className="fe-lead">{formula.lead}</div>
 <div className="fe-formula">{formula.unicode}</div>
 <div className="formula-symbols">{formula.symbols.map(s=><button className={s.sym===active?'btn-toggle active':'btn-toggle'}
 key={s.sym} aria-pressed={s.sym===active} onClick={()=>setActive(active===s.sym?null:s.sym)}>{s.sym}</button>)}</div>
 {symbol?<div className="fe-explain" aria-live="polite"><span className="fe-explain-sym">{symbol.sym}</span><span className="fe-explain-desc">{symbol.desc}</span></div>:null}
 </div>;
}
