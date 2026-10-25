import { useState } from 'react';
import { StudyCanvas, palette, drawPaper, drawArrow, drawLabel } from './studio-kit';

const G=[[3,0],[0,2],[4,0],[0,1]];
const steps=['原梯度','去预训练','去旧任务'];
export function Ch4Second(){
  const [step,setStep]=useState(0);
  const matrix=G.map((row,i)=>i<step?[0,0]:row);
  const energy=matrix.flat().reduce((sum,n)=>sum+n*n,0);
  return <>
    <div className="chip-row" role="group" aria-label="矩阵投影步骤">{steps.map((label,i)=><button key={label} className={`chip ${step===i?'selected':''}`} aria-pressed={step===i} onClick={()=>setStep(i)}>{i+1}. {label}</button>)}</div>
    <StudyCanvas ariaLabel={`第${step+1}步，梯度矩阵的平方能量为${energy}，已移除${30-energy}。`} draw={(c)=>{
      drawPaper(c,24,20,480,240);drawPaper(c,576,20,480,240);
      drawLabel(c,'输入梯度',52,51);drawLabel(c,'当前梯度',604,51);
      [G,matrix].forEach((values,panel)=>{const ox=52+552*panel;values.forEach((row,i)=>{const y=76+i*40;c.fillStyle=i<step&&panel===1?'#c43f5214':'#d7deea44';c.fillRect(ox,y,418,28);row.forEach((value,j)=>{c.fillStyle=i<2?palette.orange:palette.green;c.fillRect(ox+j*215,y+3,value*45,22);});});});
      drawArrow(c,517,140,561,140,palette.blue,3);
    }}/>
    <table className="paper" style={{width:'100%'}}><caption>4×2 教学梯度矩阵，e₁ 为预训练主方向，e₂ 为旧任务方向</caption><thead><tr><th>输入方向</th><th>原 G 第一列</th><th>原 G 第二列</th><th>当前第一列</th><th>当前第二列</th></tr></thead><tbody>{G.map((row,i)=><tr key={i} style={{background:i<step?'#fdf0ed':undefined}}><th>e{['₁','₂','₃','₄'][i]}</th><td>{row[0]}</td><td>{row[1]}</td><td>{matrix[i][0]}</td><td>{matrix[i][1]}</td></tr>)}</tbody></table>
    <div className="ctrl"><button className="tiny ghost" disabled={step===0} onClick={()=>setStep(step-1)}>上一步</button><button className="tiny" disabled={step===2} onClick={()=>setStep(step+1)}>下一步</button><button className="tiny ghost" onClick={()=>setStep(0)}>重置投影</button><span>步骤 {step+1} / 3</span></div>
    <div className="feedback good" aria-live="polite">{step===0?'原能量为 3²+2²+4²+1²=30。':step===1?'减去 e₁e₁ᵀG，第一行清零；移除能量 9，剩余 21。':'再减去 e₂e₂ᵀG，第二行清零；累计移除 13，残差能量为 17。'}</div>
    <p>保护基 Q=[e₁,e₂] 的两列互相垂直且长度为 1。QQᵀ 是 4×4 矩阵，在本例中仅保留输入的前两行；I−QQᵀ 保留后两行。论文 §3.2，式 (5)。</p>
  </>;
}
