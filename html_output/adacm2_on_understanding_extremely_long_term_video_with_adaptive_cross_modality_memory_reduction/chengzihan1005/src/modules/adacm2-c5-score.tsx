import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C={bg:'#f5f8f0',env:'#b8c9a7',dark:'#76906a',blue:'#27446e',green:'#228d5c',red:'#c43f52',orange:'#f07e47',purple:'#7c3aed',text:'#21324a',muted:'#68778f',line:'#d7deea'};
function base(canvas:HTMLCanvasElement,w:number,h:number){const ctx=setupCanvas(canvas,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);return ctx}
function evidence(ctx:CanvasRenderingContext2D,x:number,y:number,color:string,mark=''){ctx.fillStyle='#fff';ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,y,54,58,8);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.fillRect(x+8,y+9,38,5);if(mark){ctx.fillStyle=C.text;ctx.font='bold 19px Segoe UI';ctx.textAlign='center';ctx.fillText(mark,x+27,y+45)}}
const Analogy:React.FC<{mode:number}>=({mode})=>{const ref=useRef<HTMLCanvasElement>(null);const raf=useRef<number|null>(null);useEffect(()=>{const cv=ref.current;if(!cv)return;const ctx=setupCanvas(cv,560,140);let t=0;const draw=()=>{t+=.015;ctx.clearRect(0,0,560,140);ctx.fillStyle=C.bg;ctx.fillRect(0,0,560,140);ctx.fillStyle=C.env;ctx.fillRect(35,95,490,16);const p=(Math.sin(t)+1)/2;if(mode===4){evidence(ctx,60+p*350,30,C.blue,'t');ctx.strokeStyle=C.dark;ctx.strokeRect(430,35,75,70)}else if(mode===5){evidence(ctx,220,32,C.blue,'Σ');ctx.strokeStyle=C.orange;ctx.lineWidth=5;ctx.beginPath();ctx.arc(247,60,25+p*8,0,Math.PI*2);ctx.stroke()}else if(mode===6){ctx.strokeStyle=C.dark;ctx.strokeRect(110,32,340,70);for(let i=0;i<6;i++)evidence(ctx,125+i*52,42,i<3?C.green:C.red,'')}else{ctx.strokeStyle=C.dark;ctx.strokeRect(100,34,360,68);ctx.fillStyle=C.green;ctx.fillRect(100,34,Math.min(350,80+p*280),68);ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(100+Math.min(350,80+p*280),25,11,0,Math.PI*2);ctx.fill()}cv.classList.add('is-ready');raf.current=requestAnimationFrame(draw)};const stop=()=>{if(raf.current)cancelAnimationFrame(raf.current);raf.current=null};const start=()=>{if(!raf.current)raf.current=requestAnimationFrame(draw)};const off=observeCanvas(cv,start,stop);return()=>{stop();off()}},[mode]);return <canvas ref={ref} width={560} height={140}/>};
export const C4Analogy:React.FC<WidgetProps>=()=> <Analogy mode={4}/>;
export const C5Analogy:React.FC<WidgetProps>=()=> <Analogy mode={5}/>;
export const C6Analogy:React.FC<WidgetProps>=()=> <Analogy mode={6}/>;
export const C7Analogy:React.FC<WidgetProps>=()=> <Analogy mode={7}/>;

export const C4Step:React.FC<WidgetProps>=()=>{const ref=useRef<HTMLCanvasElement>(null);const steps=['视频帧','视觉特征','位置编码','KV 追加','查询更新'];const [step,setStep]=useState(0);useEffect(()=>{const cv=ref.current;if(!cv)return;const ctx=base(cv,1080,280);steps.forEach((s,i)=>{const x=55+i*200,active=i<=step;ctx.fillStyle=active?(i===step?C.orange:C.blue):'#fff';ctx.strokeStyle=active?C.blue:C.line;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,80,150,70,12);ctx.fill();ctx.stroke();if(i<4){ctx.strokeStyle=i<step?C.green:C.line;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+150,115);ctx.lineTo(x+200,115);ctx.stroke()}ctx.fillStyle=active?'#fff':C.text;ctx.font='bold 20px Segoe UI';ctx.textAlign='center';ctx.fillText(s,x+75,122)});ctx.fillStyle=C.text;ctx.font='bold 26px Segoe UI';ctx.fillText(`${step+1}/5`,540,220);cv.classList.add('is-ready')},[step]);const notes=['读取第 t 帧，尚未进入缓存。','视觉编码器得到 xₜ∈Rᴾˣᶜ。','加入 E(t)，形成带时序的 fₜ。','Kₜ、Vₜ 追加当前帧特征。','跨模态注意力更新可学习查询 Qₜ。'];return <div><canvas ref={ref} width={1080} height={280}/><div className="ctrl-row"><button className="btn secondary" disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))}>上一步</button><button className="btn" disabled={step===4} onClick={()=>setStep(Math.min(4,step+1))}>{step===4?'已完成':'下一步'}</button><button className="btn secondary" onClick={()=>setStep(0)}>重置</button></div><div className={`feedback ${step===4?'good':''}`}>{notes[step]}</div></div>};

export const C5Score:React.FC<WidgetProps>=()=>{
  const ref=useRef<HTMLCanvasElement>(null);
  const marks=['人','衣','1','0','球','草'];
  const rows=[
    [0.02,0.12,0.36,0.35,0.10,0.05],
    [0.03,0.11,0.35,0.37,0.09,0.05],
    [0.02,0.15,0.34,0.34,0.10,0.05],
  ];
  const scores=marks.map((_,i)=>rows.reduce((sum,row)=>sum+row[i],0));
  const [col,setCol]=useState(0),[phase,setPhase]=useState(0);
  const order=marks.map((_,i)=>i);
  if(phase===2)order.sort((a,b)=>scores[b]-scores[a]);
  useEffect(()=>{
    const cv=ref.current;if(!cv)return;const ctx=base(cv,1080,280);
    for(let r=0;r<3;r++)for(let c=0;c<6;c++){
      const x=65+c*92,y=35+r*42;
      ctx.fillStyle=c===col?C.orange:`rgba(39,68,110,${0.16+rows[r][c]*1.5})`;
      ctx.fillRect(x,y,72,30);
      ctx.fillStyle=c===col?'#fff':C.text;ctx.font='bold 15px Segoe UI';ctx.textAlign='center';
      ctx.fillText(rows[r][c].toFixed(2),x+36,y+21);
    }
    order.forEach((index,position)=>{
      const score=scores[index],h=phase>=1?score*105:8,x=650+position*60;
      ctx.fillStyle=phase===2?(position<3?C.green:C.env):index===col?C.orange:C.blue;
      ctx.fillRect(x,220-h,38,h);
      ctx.fillStyle=C.text;ctx.font='17px Segoe UI';ctx.textAlign='center';ctx.fillText(marks[index],x+19,245);
    });
    ctx.fillStyle=C.text;ctx.font='bold 30px Segoe UI';ctx.textAlign='center';
    ctx.fillText(phase===0?'查看':phase===1?'列求和':'降序排序',540,210);
    cv.classList.add('is-ready');
  },[col,phase]);
  return <div><canvas ref={ref} width={1080} height={280} role="img" aria-label="教学示例：三行注意力矩阵、列求和与排序"/><div className="chip-row">{marks.map((m,i)=><button key={m} className={`chip ${col===i?'active':''}`} onClick={()=>setCol(i)}>{m}</button>)}<button className="btn" onClick={()=>setPhase((phase+1)%3)}>{phase===0?'对本列求和':phase===1?'按分数排序':'重新查看'}</button></div><div className={`feedback ${phase===2?'good':''}`}>{phase===0?`已选择“${marks[col]}”列；三行分数为 ${rows.map(row=>row[col].toFixed(2)).join(' + ')}。`:phase===1?`列和 ${rows.map(row=>row[col].toFixed(2)).join(' + ')} = ${scores[col].toFixed(2)}；这是该视觉 token 的教学分数。`:`已按列和降序排序：${order.map(i=>marks[i]).join(' → ')}。这些数字仅用于解释公式。`}</div></div>;
};

export const C6Cleaner:React.FC<WidgetProps>=()=>{const ref=useRef<HTMLCanvasElement>(null);const [a,setA]=useState(.1),[b,setB]=useState(.1),[done,setDone]=useState(false);useEffect(()=>{const cv=ref.current;if(!cv)return;const ctx=base(cv,1080,280);const n=40,recent=Math.max(1,Math.round(n*a)),old=n-recent,keep=Math.max(1,Math.round(old*b));for(let i=0;i<n;i++){const isRecent=i>=n-recent;const rank=[...Array(old).keys()].sort((x,y)=>((y*29)%41)-((x*29)%41));const kept=rank.slice(0,keep).includes(i);const color=!done?C.line:isRecent?C.blue:kept?C.green:C.red;ctx.fillStyle=color;ctx.globalAlpha=done&&!isRecent&&!kept?0.25:1;ctx.fillRect(45+(i%20)*49,65+Math.floor(i/20)*70,34,48);ctx.globalAlpha=1}ctx.fillStyle=C.orange;ctx.fillRect(45+(n-recent)%20*49,45,4,150);ctx.fillStyle=C.text;ctx.font='bold 25px Segoe UI';ctx.fillText(`${recent} recent · ${done?keep:old} old kept`,430,245);cv.classList.add('is-ready')},[a,b,done]);const r=a+(1-a)*b;return <div><canvas ref={ref} width={1080} height={280}/><div className="ctrl"><label>最近比例 α <span className="val">{a.toFixed(2)}</span></label><input type="range" min="5" max="40" value={a*100} onChange={e=>{setA(+e.target.value/100);setDone(false)}}/><label>旧缓存保留 β <span className="val">{b.toFixed(2)}</span></label><input type="range" min="5" max="70" value={b*100} onChange={e=>{setB(+e.target.value/100);setDone(false)}}/></div><button className="btn" onClick={()=>setDone(true)}>执行记忆清理</button><div className={`feedback ${done?(r<.4?'good':'bad'):''}`}>{!done?'蓝色分隔线将划出最近区；调整参数后执行清理。':r<.4?'最近线索完整保留；旧档案只留下高相关部分。':'当前设置保留过多旧缓存，显存压力仍然较高。'}</div></div>};

export const C7Limit:React.FC<WidgetProps>=()=>{const ref=useRef<HTMLCanvasElement>(null);const [a,setA]=useState(.1),[b,setB]=useState(.1);const r=a+(1-a)*b;useEffect(()=>{const cv=ref.current;if(!cv)return;const ctx=base(cv,1080,280);ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(80,230);ctx.lineTo(1000,230);ctx.lineTo(1000,35);ctx.stroke();ctx.strokeStyle=C.red;ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<80;i++){const x=80+i*11,y=230-i*2.2;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.strokeStyle=r<1?C.green:C.red;ctx.lineWidth=5;ctx.beginPath();let cache=0;for(let i=0;i<80;i++){cache=r*(cache+1);const x=80+i*11,y=230-Math.min(175,cache*55);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.fillStyle=C.text;ctx.font='bold 30px Segoe UI';ctx.fillText(`r=${r.toFixed(2)}`,820,55);cv.classList.add('is-ready')},[a,b,r]);const good=r<.5,bad=r>=.95;return <div><canvas ref={ref} width={1080} height={280}/><div className="ctrl"><label>α <span className="val">{a.toFixed(2)}</span></label><input type="range" min="0" max="100" value={a*100} onChange={e=>setA(+e.target.value/100)}/><label>β <span className="val">{b.toFixed(2)}</span></label><input type="range" min="0" max="100" value={b*100} onChange={e=>setB(+e.target.value/100)}/></div><div className={`feedback ${bad?'bad':good?'good':''}`}>{bad?'r 接近 1：缓存极限会急剧增大；r=1 时没有有限极限。':good?'r<1 且较小：历史贡献快速衰减，缓存趋于有限上界。':'r<1：仍然收敛，但保留越多，上界越高。'}</div></div>};
