import {useState} from 'react';
import {Feedback,fmt} from './camf-kit';
const names=['CAMO','NC4K','COD10K','CHAMELEON'];
const values=[[[.671,.783,.674,.663],[.729,.818,.717,.720]],[[.125,.069,.068,.089],[.105,.054,.055,.067]]];
export function ResultsScene(){
  const [metric,setMetric]=useState(0);
  const [dataset,setDataset]=useState(0);
  const [baseline,method]=values[metric];
  const gain=(method[dataset]-baseline[dataset])*(metric===0?1:-1);
  return <div className="camf-page"><div className="camf-controls"><label>指标 <select aria-label="结果指标" value={metric} onChange={event=>setMetric(Number(event.target.value))}><option value={0}>Fᵂβ ↑</option><option value={1}>MAE ↓</option></select></label><p>DUTS · 同 EVA02-L 主干 · 相同超参数</p></div><div className="camf-result-chart">{names.map((name,index)=><div className={`camf-result-row ${dataset===index?'selected':''}`} key={name}><button onClick={()=>setDataset(index)} aria-pressed={dataset===index}>{name}</button><div>{[baseline,method].map((series,methodIndex)=><div className="camf-bar-row" key={methodIndex}><span>{methodIndex?'CaMF':'EVP'}</span><div className="camf-bar-track"><div className={methodIndex?'method':''} style={{width:`${series[index]/(metric===0?1:.15)*100}%`}}/></div><b>{fmt(series[index])}</b></div>)}</div></div>)}</div><Feedback tone="green">{names[dataset]}：{metric===0?'提高':'降低'} {fmt(gain)}，相对{metric===0?'提高':'下降'} {(gain/baseline[dataset]*100).toFixed(2)}%。横轴 0–{metric===0?'1':'0.15'}；Table II 算术差，不是显著性检验。</Feedback></div>;
}
