import { useState } from 'react';
import { C, Scene, Panel, Chips, Feedback, DataTable, text, line } from './nusa-kit';

export function NusaBound() {
  const [rank, setRank] = useState('1');
  const [eps, setEps] = useState('0.1');
  const r = Number(rank), e = Number(eps), lhs = r*e, paper = e*Math.sqrt(r);
  const values = [lhs, paper, lhs];
  return <div onKeyDown={event => { if (event.key.startsWith('Arrow')) event.stopPropagation(); }}>
    <p>本网页代数核验：取 Σₙ = εIᵣ、M = Iᵣ。将同一组矩阵分别代入内积、论文式（5）右端和 Cauchy–Schwarz 上界。</p>
    <Chips label="尾部维数 r" value={rank} options={['1','2','4','8'].map(value=>({value,label:value}))} onChange={setRank}/>
    <Chips label="尾部奇异值 ε" value={eps} options={['0.01','0.1','0.5'].map(value=>({value,label:value}))} onChange={setEps}/>
    <Scene label="对角矩阵与三个代数值：实际内积、式5右端、Cauchy右端" draw={(ctx) => {
      const cell = 180/r;
      for (let i=0;i<r;i+=1) for(let j=0;j<r;j+=1){ctx.fillStyle = i===j ? C.orange : C.light; ctx.fillRect(80+j*cell,50+i*cell,cell-3,cell-3);}
      text(ctx,'Σₙ',80,32,18); text(ctx,'上界检验',480,32,18);
      line(ctx,440,235,1000,235,C.axis);
      values.forEach((value,i)=>{const h=170*value/(lhs||1);const x=490+i*175;ctx.fillStyle=[C.blue,C.red,C.green][i];ctx.fillRect(x,235-h,85,h);text(ctx,value.toFixed(4),x-2,220-h,18);});
    }}/>
    <Panel><span>内积 rε = {lhs.toFixed(4)}</span><span>式（5）ε√r = {paper.toFixed(4)}</span><span>Cauchy rε = {lhs.toFixed(4)}</span></Panel>
    <Feedback tone={r===1?'good':'bad'}>{r===1 ? `r = 1 时三者均为 ${lhs.toFixed(4)}。` : `r = ${r} 时，实际内积比式（5）右端大 ${(lhs-paper).toFixed(4)}，构成该式的矩阵反例；Cauchy 上界在此例取等号。`}</Feedback>
    <DataTable headers={['量', '计算']} rows={[["实际内积", "|Tr(ΣₙM)| = rε"],["论文 Lemma 1 式（5）右端", "σₙ,max ‖M‖F = ε√r"],["Cauchy–Schwarz 上界", "‖Σₙ‖F ‖M‖F = rε"]]}/>
    <details><summary>逐项相乘得到正确的 Frobenius 界</summary><p>|Tr(ΣₙM)| ≤ ‖Σₙ‖F‖M‖F ≤ √r · σₙ,max ‖M‖F。这里 ‖Σₙ‖F = ε√r，‖M‖F = √r，因此上界为 rε。维数因子保留了多个尾部方向共同贡献的大小。</p><p>来源：论文 §3.4，Lemma 1，式（5）；本网页独立构造反例并应用 Cauchy–Schwarz 不等式。</p></details>
    <button className="tiny ghost" onClick={()=>{setRank('1');setEps('0.1');}}>重置</button>
  </div>;
}
