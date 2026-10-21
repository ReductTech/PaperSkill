import { useState } from 'react';
import { StudyCanvas, palette, drawPaper, drawPencil, drawArrow, drawLabel } from './studio-kit';

const base=[[3,0],[0,2],[1,0],[0,1]], initial=[[0,0],[0,0],[4,0],[0,1]], trained=[[0,0],[0,0],[3,0],[0,.5]];
const plus=(a:number[][],b:number[][],sign=1)=>a.map((row,i)=>row.map((v,j)=>v+sign*b[i][j]));
const offset=plus(base,initial,-1);
const weights=[base,plus(base,initial),plus(offset,initial),plus(offset,trained)];
const stages=['原权重','直接加支路','扣除补偿','训练后合并'];
const expressions=['W','W+AB₀','(W−AB₀)+AB₀','(W−AB₀)+AB_T'];
const fmt=(n:number)=>Number(n.toFixed(2)).toString();

export function Ch6Main(){
  const [step,setStep]=useState(0),[comparison,setComparison]=useState(false);
  const current=weights[step],output=[current[2][0]+current[3][0],current[2][1]+current[3][1]];
  const error=Math.hypot(output[0]-1,output[1]-1);
  return <>
    <div className="chip-row" role="group" aria-label="初始化与合并阶段">{stages.map((name,i)=><button className={`chip ${step===i?'selected':''}`} key={name} aria-pressed={step===i} onClick={()=>setStep(i)}>{i+1}. {name}</button>)}</div>
    <StudyCanvas ariaLabel={`${stages[step]}，输入零零一一的输出为${output.join('、')}。`} draw={c=>{
      drawPaper(c,24,20,480,240);drawPaper(c,536,20,520,240);drawLabel(c,'叠加的笔画',48,48);drawLabel(c,'当前输出',562,48);
      c.lineCap='round';c.strokeStyle=palette.blue;c.lineWidth=4;c.beginPath();c.moveTo(90,173);c.lineTo(185,99);c.lineTo(270,173);c.stroke();
      if(step===1){c.strokeStyle=palette.red;c.lineWidth=5;c.beginPath();c.moveTo(122,173);c.lineTo(217,99);c.lineTo(302,173);c.stroke();drawPencil(c,315,173,-.6,palette.red);}
      if(step===2){c.strokeStyle='#c43f5225';c.setLineDash([5,5]);c.beginPath();c.moveTo(122,173);c.lineTo(217,99);c.lineTo(302,173);c.stroke();c.setLineDash([]);c.fillStyle='#f0c3b5';c.beginPath();c.roundRect(295,162,42,23,5);c.fill();}
      if(step===3){c.strokeStyle=palette.green;c.beginPath();c.moveTo(270,173);c.lineTo(344,125);c.stroke();drawPencil(c,357,125,-.6,palette.green);}
      c.strokeStyle=palette.border;c.lineWidth=1;c.beginPath();c.moveTo(596,225);c.lineTo(1006,225);c.stroke();
      [1,1].forEach((value,i)=>{c.strokeStyle=palette.blue;c.setLineDash([5,4]);c.strokeRect(628+i*188,225-value*30,94,value*30);c.setLineDash([]);});
      output.forEach((value,i)=>{c.fillStyle=step===1?palette.red:palette.green;c.fillRect(648+i*188,225-value*30,54,Math.max(2,value*30));});
      drawArrow(c,440,140,488,140,palette.blue,3);
    }}/>
    <div className="ctrl"><button className="tiny ghost" disabled={step===0} onClick={()=>setStep(step-1)}>上一步</button><button className="tiny" disabled={step===3} onClick={()=>setStep(step+1)}>下一步</button><button className="tiny ghost" onClick={()=>{setStep(0);setComparison(false);}}>重置补偿</button><span>步骤 {step+1} / 4</span><button className={`chip ${comparison?'selected':''}`} aria-pressed={comparison} onClick={()=>setComparison(!comparison)}>{comparison?'收起初始对照':'未补偿 / 已补偿对照'}</button></div>
    <p>教学例子取输入 x=(0,0,1,1)，秩 r=2、缩放系数 α=2，因此 s=α/r=1。A=[e₃,e₄]，初始 B₀=diag(4,1)，训练终值设为 B_T=diag(3,0.5)。</p>
    <table className="paper" style={{width:'100%'}}><caption>当前总权重：{expressions[step]}（4×2）</caption><thead><tr><th>输入行</th><th>第一输出列</th><th>第二输出列</th></tr></thead><tbody>{current.map((row,i)=><tr key={i}><th>{i+1}</th><td>{fmt(row[0])}</td><td>{fmt(row[1])}</td></tr>)}</tbody></table>
    <div className="metrics"><div className="metric"><div className="l">原输出 xW</div><div className="v">(1, 1)</div></div><div className="metric"><div className="l">当前输出</div><div className="v">({output.map(fmt).join(', ')})</div></div><div className="metric"><div className="l">与原输出的距离</div><div className="v">{error.toFixed(3)}</div></div></div>
    <div className={`feedback ${step===1?'bad':'good'}`} aria-live="polite">{step===0?'x 的前两项为 0，所以输出等于 W 的第 3、4 行之和：(1,0)+(0,1)=(1,1)。':step===1?'直接加上非零初始支路后，输出成为 (1,1)+(4,1)=(5,2)，训练起点发生偏移。':step===2?'冻结权重先减去 AB₀，再加回同一支路：W′+AB₀=W，初始输出恢复为 (1,1)。':'训练改变 B 后再合并：W_new=W+A(B_T−B₀)，输出为 (1,1)+(−1,−0.5)=(0,0.5)。'}</div>
    {comparison&&<table className="paper" style={{width:'100%'}}><caption>初始状态对照：相同的 A 和 B₀</caption><thead><tr><th>处理方式</th><th>冻结权重</th><th>初始总权重</th><th>初始输出</th></tr></thead><tbody><tr><th>未补偿</th><td>W</td><td>W+AB₀</td><td>(5, 2)</td></tr><tr><th>已补偿</th><td>W−AB₀</td><td>W</td><td>(1, 1)</td></tr></tbody></table>}
    <p>补偿保证初始化时总权重一致；任务训练结束后，B_T−B₀ 给出本次学习的净改变量。论文 §3.2 初始化步骤与算法 1。</p>
  </>;
}
