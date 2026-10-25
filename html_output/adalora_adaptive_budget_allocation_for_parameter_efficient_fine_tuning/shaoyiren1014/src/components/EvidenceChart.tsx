import type {EvidenceRow} from '../data/performanceArena';
import {budgetLabel} from '../data/evidenceFormat';
export default function EvidenceChart({rows,metric,label,scaleValues}:{rows:EvidenceRow[];metric:string;label:string;scaleValues:number[]}){
 const min=Math.floor(Math.min(...scaleValues))-1,max=Math.ceil(Math.max(...scaleValues))+1;
 return <figure className="evidence-chart arena-chart" data-source-type="paper_evidence"><figcaption><strong>{label}</strong><span>报告值越高越好 · 同一指标内比较</span></figcaption><div className="arena-axis"><span>{min}</span><span>{max}</span></div><div className="arena-points">{rows.map(r=><div className="arena-point-row" key={r.method}><div><strong>{r.method}</strong><small>{budgetLabel(r)}</small></div><div className="point-track" aria-hidden="true"><span className={`point ${r.method==='AdaLoRA'?'ada-point':''}`} style={{left:`${(r.values[metric]-min)/(max-min)*100}%`}}/></div><output>{r.values[metric].toFixed(2)}</output></div>)}</div><p className="chart-footnote">局部坐标范围 {min}–{max}，同一数据集与指标的各预算共用此范围。圆点位置表示数值，不用长度夸大收益。不表示差距已通过显著性检验。</p></figure>;
}
