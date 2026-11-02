import React, {useState} from 'react';
import {C,Notebook,Feedback} from './earth-kit';
const rows=[{name:'GPT-5',acc:[65.99,62.35],tao:[68.74,71.41]},{name:'DeepSeek-V3.1',acc:[51.42,52.23],tao:[78.31,78.66]},{name:'Kimik2',acc:[50.61,56.68],tao:[71.03,78.86]}];
export function EarthScene09(){const[metric,setMetric]=useState<'acc'|'tao'>('acc');return <div className="ea-page">
<div className="ea-controls"><button aria-pressed={metric==='acc'} onClick={()=>setMetric('acc')}>最终准确率</button><button aria-pressed={metric==='tao'} onClick={()=>setMetric('tao')}>工具集合覆盖 TAO</button><span>Earth-Bench · Table 1 · %，越高越好</span></div>
<svg viewBox="0 0 1472 420" style={{width:1472,height:420,marginTop:18}} className="ea-chart" role="img" aria-label="三种模型在AP与IF协议下的配对结果">
{[0,25,50,75,100].map(v=><g key={v}><path d={`M${280+v*7.8} 24V360`} stroke={C.line} strokeDasharray="5 8"/><text x={280+v*7.8} y="400" textAnchor="middle" fontSize="28" fill={C.muted}>{v}</text></g>)}
{rows.map((row,i)=>{const y=70+i*116;const [ap,iff]=row[metric];return <g key={row.name}><text x="8" y={y+15} fontSize="28" fill={C.ink}>{row.name}</text><line x1={280+ap*7.8} x2={280+iff*7.8} y1={y+15} y2={y+15} stroke={C.line} strokeWidth="10"/><circle cx={280+ap*7.8} cy={y+15} r="13" fill={C.blue}/><circle cx={280+iff*7.8} cy={y+15} r="13" fill={C.green}/><text x={280+ap*7.8} y={y-12} textAnchor="middle" fontSize="28" fill={C.blue}>AP {ap.toFixed(2)}</text><text x={280+iff*7.8} y={y+60} textAnchor="middle" fontSize="28" fill={C.green}>IF {iff.toFixed(2)}</text></g>})}
<Notebook x={1120} y={70} width={335} height={245} lines={['巡查评分册','过程与答案','分开检查']}/></svg>
<Feedback tone={metric==='acc'?'orange':'blue'}>{metric==='acc'?'Table 1：GPT-5 的 IF Accuracy 从 65.99% 降至 62.35%；DeepSeek-V3.1 与 Kimik2 则上升。步骤提示的影响因模型与指标而异。':'Table 1：GPT-5 的 IF TAO 从 68.74% 升至 71.41%；不同模型变化并不一致，过程改善也不保证答案更正确。'}</Feedback></div>}
