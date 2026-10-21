import { useState } from 'react';
import { C, Scene, Panel, Chips, Feedback, DataTable, text, line, paint } from './nusa-kit';

const thresholds=['0.80','0.90','0.95','0.99','0.999'];
const measurements=[[68.29,74.87,82.28],[68.82,75.07,82.74],[68.58,75.08,82.79],[68.49,74.89,82.70],[68.11,72.89,79.16]];

export function NusaRho() {
  const [selected,setSelected]=useState('0.95');
  const index=thresholds.indexOf(selected),row=measurements[index];
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <p>ρ 决定受保护主空间的能量比例。论文在 Full-shot MTIL 中比较五个阈值，报告相同协议下的 Transfer、Avg 和 Last。</p>
    <Chips label="能量阈值 ρ" value={selected} options={thresholds.map(value=>({value,label:value}))} onChange={setSelected}/>
    <Scene label="不同能量阈值下的论文实测结果，三个准确率柱和保护区域示意" draw={(ctx)=>{
      paint(ctx,70,55,300,170,0.55,.55+index*.08);text(ctx,'保护区域',80,34,18);
      line(ctx,495,235,1000,235,C.axis);text(ctx,'准确率 (%)',500,34,18);
      row.forEach((value,i)=>{const x=530+i*160,h=value*1.75;ctx.fillStyle=[C.blue,C.green,C.purple][i];ctx.fillRect(x,235-h,85,h);text(ctx,value.toFixed(2),x,220-h,18);});text(ctx,'0',475,241,14,C.muted);text(ctx,'100',464,60,14,C.muted);
    }}/>
    <Panel><span>Transfer {row[0].toFixed(2)}%</span><span>Avg {row[1].toFixed(2)}%</span><span>Last {row[2].toFixed(2)}%</span></Panel>
    <Feedback tone={index===4?'bad':'good'}>ρ = {selected} 时，Avg 为 {row[1].toFixed(2)}%，Last 为 {row[2].toFixed(2)}%。{index===2?'该设置对应论文 Full-shot 默认阈值。':`相对 ρ = 0.95，Avg 变化 ${(row[1]-measurements[2][1]).toFixed(2)} 个百分点，Last 变化 ${(row[2]-measurements[2][2]).toFixed(2)} 个百分点。`}</Feedback>
    <DataTable headers={['ρ','Transfer (%)','Avg (%)','Last (%)']} rows={thresholds.map((rho,i)=>[rho,...measurements[i].map(n=>n.toFixed(2))])} caption="论文 Table 4(b)，Full-shot MTIL"/>
    <details><summary>阈值、能量与秩</summary><p>k 是累计平方奇异值首次达到 ρ‖W‖²F 的位置。固定 W 时，提高 ρ 使 k 单调不减，可用尾部维数 d−k 单调不增。ρ = 0.999 时，Avg 比默认阈值低 2.19 个百分点，Last 低 3.63 个百分点。</p></details>
    <button className="tiny ghost" onClick={()=>setSelected('0.95')}>重置</button>
  </div>;
}
