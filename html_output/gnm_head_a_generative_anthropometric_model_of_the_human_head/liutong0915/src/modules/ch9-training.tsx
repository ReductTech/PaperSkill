import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

type Kind = 'hero'|'analogy'|'shell'|'motion'|'data'|'basis'|'lbs'|'regions'|'anatomy'|'fit'|'sampler'|'training'|'results';
const C = { bg:'#f5f8f0', light:'#b8c9a7', dark:'#76906a', tool:'#92400e', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', text:'#21324a', muted:'#68778f', line:'#d7deea' };

function head(ctx:CanvasRenderingContext2D,x:number,y:number,s:number,color:string,complete=true,open=0){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s); ctx.lineWidth=4/s; ctx.strokeStyle=color; ctx.fillStyle='#dbe6ef';
  ctx.beginPath(); ctx.ellipse(0,-24,52,68,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle=color; ctx.beginPath(); ctx.arc(-20,-37,5,0,Math.PI*2); ctx.arc(20,-37,5,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=complete?C.green:C.red; ctx.lineWidth=5/s; ctx.beginPath(); ctx.ellipse(0,5,25,7+open*18,0,0,Math.PI*2); ctx.stroke();
  if(complete){ ctx.fillStyle='#fff'; for(let i=-2;i<=2;i++)ctx.fillRect(i*8-3,0,6,8); ctx.fillStyle=C.orange; ctx.beginPath(); ctx.ellipse(0,14+open*10,15,5,0,0,Math.PI*2); ctx.fill(); }
  ctx.fillStyle='#dbe6ef'; ctx.strokeStyle=color; ctx.beginPath(); ctx.moveTo(-35,40); ctx.lineTo(-55,85); ctx.lineTo(55,85); ctx.lineTo(35,40); ctx.fill(); ctx.stroke(); ctx.restore();
}
function bench(ctx:CanvasRenderingContext2D,w:number,h:number){ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=C.light;ctx.fillRect(0,h-34,w,34);ctx.strokeStyle=C.dark;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,h-34);ctx.lineTo(w,h-34);ctx.stroke();}
function pill(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string,active:boolean){ctx.fillStyle=active?color:'#fff';ctx.strokeStyle=color;ctx.lineWidth=active?4:2;ctx.beginPath();ctx.roundRect(x,y,w,h,12);ctx.fill();ctx.stroke();}
function label(ctx:CanvasRenderingContext2D,t:string,x:number,y:number,color=C.text){ctx.fillStyle=color;ctx.font='700 20px "Segoe UI",sans-serif';ctx.fillText(t,x,y);}

const labels:Record<Kind,string[]> = {
  hero:[], analogy:[], shell:['传统外壳','GNM 完整'], motion:['同步张嘴'], data:['相机','灯光','受试者','表情'], basis:[], lbs:['上一步','下一步','重置'], regions:['左眼','右眼','下脸'], anatomy:['牙齿','舌头','眼球'], fit:[], sampler:['身份','表情','下一步'], training:['周期升温','直接拉满'], results:['15,000 扫描','2,000 合成','开始比较']
};

function Workshop({kind,chapterId,moduleId}:{kind:Kind}&WidgetProps){
  const canvasRef=useRef<HTMLCanvasElement>(null); const raf=useRef<number|undefined>(); const startRef=useRef(performance.now());
  const [choice,setChoice]=useState(0); const [value,setValue]=useState(kind==='fit'?65:0); const [step,setStep]=useState(0); const [toggle,setToggle]=useState(kind==='fit'); const [running,setRunning]=useState(false);
  const dims=kind==='analogy'?{w:560,h:140}:kind==='hero'?{w:480,h:180}:{w:1080,h:280};
  const feedback=useMemo(()=>{
    if(kind==='shell') return choice?{c:'good',t:'完整几何为张嘴、伸舌和凝视提供可控支点。'}:{c:'bad',t:'外形存在，但嘴内和眼球缺少独立几何约束。'};
    if(kind==='motion') return running?{c:'good',t:'同样动作输入下，GNM 的牙齿和舌头随下脸协调运动。'}:{c:'',t:'两侧从同一中性姿态出发，点击后同步比较。'};
    if(kind==='data'){const a=['22 台高分辨率相机覆盖约 150°×60°。','14 盏可控灯提供均匀漫射照明。','数据集包含约 5,000 位受试者。','静态表情采集约产生 150,000 个样本。'];return {c:'',t:a[choice]};}
    if(kind==='basis') return {c:'',t:'横向主要改变身份形状，纵向主要改变当前表情；这里只展示二维切片。'};
    if(kind==='lbs') return {c:step===3?'good':'',t:['先在模板上叠加身份与表情偏移。','身份变化同时更新关节位置。','四个关节产生各自的仿射变换。','每个顶点按蒙皮权重融合这些变换。'][step]};
    if(kind==='regions') return toggle?{c:'good',t:'局部基把控制限制在连续区域，邻界仅作平滑重叠。'}:{c:'bad',t:'假想全局变化会把不相关区域耦合进同一方向。'};
    if(kind==='anatomy') return {c:'',t:['牙齿：5,000 个程序化形状学习身份差异。','舌头：约 2,500 个样本学习可变姿态。','眼球：双球几何与独立瞳孔参数。'][choice]};
    if(kind==='fit') return !toggle&&value>70?{c:'bad',t:'地标更近，但内部结构可能发生穿插。'}:value<35?{c:'',t:'地标约束偏弱，模型尚未贴合观测。'}:{c:'good',t:'观测贴合与解剖可行性同时受约束。'};
    if(kind==='sampler') return {c:step===4?'good':'',t:['选择身份或表情语义分支。','条件向量提供可解释类别。','64 维 z 保留同类内部随机变化。','解码器映射到 GNM 系数。','输出可控的完整头部网格。'][step]};
    if(kind==='training') return choice?{c:'bad',t:'直接把 KL 权重拉满是对照情形，不是论文报告的训练日程。'}:value>=4000?{c:'good',t:'论文日程在前 4,000 步把 wKL 逐渐升到 0.05。'}:{c:'',t:'逐步升温减少潜变量被条件分支忽略的风险。'};
    if(kind==='results') return running?{c:'good',t:choice===0?'共同脸部区域、15,000 个留出扫描：GNM 平均误差 0.748 mm。':'2,000 张合成单视图、7,000 个真值地标：GNM 平均误差 1.683 mm。'}:{c:'',t:'先选择协议，再在同一标尺上比较；扫描到网格距离越低越好。'};
    return {c:'',t:''};
  },[kind,choice,value,step,toggle,running]);

  useEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;let ctx:CanvasRenderingContext2D;try{ctx=setupCanvas(canvas,dims.w,dims.h);}catch{return;}
    const draw=(time:number)=>{const w=dims.w,h=dims.h,t=((time-startRef.current)%3200)/3200;bench(ctx,w,h);
      if(kind==='hero'){const old=moduleId==='old';head(ctx,w/2,h/2+18,0.78,old?C.red:C.green,!old,0.45+0.4*Math.sin(t*Math.PI));label(ctx,old?'空壳':'完整',24,34,old?C.red:C.green);}
      else if(kind==='analogy'){const n=Number(chapterId.replace(/\D/g,''))||1;head(ctx,300,78,0.5,C.blue,n!==1,0.12);ctx.strokeStyle=C.orange;ctx.lineWidth=6;ctx.beginPath();const x=70+easeInOutQuad(t)*155;ctx.moveTo(x,34);ctx.lineTo(x+42,82);ctx.stroke();label(ctx,['检查','测量','塑形','摆姿','遮罩','放置','对齐','选择','调节','比较'][n-1]||'检查',420,40,C.blue);}
      else if(kind==='shell'){head(ctx,300,145,1,C.blue,choice===1,0.3);const parts=choice?4:1;for(let i=0;i<4;i++){pill(ctx,650,40+i*48,300,34,i<parts?C.green:C.red,i<parts);}}
      else if(kind==='motion'){const p=running?Math.min(1,(time-startRef.current)/1600):0;head(ctx,280,145,.85,C.red,false,p);head(ctx,800,145,.85,C.green,true,p);label(ctx,'外壳',225,45,C.red);label(ctx,'GNM',755,45,C.green);}
      else if(kind==='data'){const vals=['22','14','≈5000','≈150000'];for(let i=0;i<22;i++){const a=(-.95+i/21*1.9);ctx.fillStyle=i%4===choice?C.orange:C.blue;ctx.beginPath();ctx.arc(330+230*Math.sin(a),210-150*Math.cos(a),5,0,Math.PI*2);ctx.fill();}head(ctx,330,165,.65,C.blue,true,0);label(ctx,vals[choice],720,140,C.orange);}
      else if(kind==='basis'){const bx=value||0,ph=step||0;ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.strokeRect(70,35,390,210);ctx.beginPath();ctx.moveTo(265,35);ctx.lineTo(265,245);ctx.moveTo(70,140);ctx.lineTo(460,140);ctx.stroke();ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(265+bx*55,140-ph*30,13,0,Math.PI*2);ctx.fill();head(ctx,760,150,1+bx*.04,C.blue,true,Math.abs(ph)*.12);label(ctx,'β',430,132,C.blue);label(ctx,'φ',275,58,C.blue);}
      else if(kind==='lbs'){const xs=[100,330,570,820];for(let i=0;i<4;i++){pill(ctx,xs[i],105,160,70,i<=step?C.blue:C.line,i===step);if(i<3){ctx.strokeStyle=i<step?C.green:C.line;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(xs[i]+160,140);ctx.lineTo(xs[i+1],140);ctx.stroke();}}label(ctx,String(step+1),510,48,C.orange);}
      else if(kind==='regions'){head(ctx,350,155,1.05,C.blue,true,.2);ctx.globalAlpha=.55;ctx.fillStyle=toggle?C.green:C.red;ctx.beginPath();if(choice<2)ctx.ellipse(330+choice*45,105,42,33,0,0,Math.PI*2);else ctx.ellipse(350,175,70,58,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=toggle?C.green:C.red;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(600,70);ctx.bezierCurveTo(760,choice===2?220:80,850,90,990,130);ctx.stroke();}
      else if(kind==='anatomy'){head(ctx,260,155,.9,C.blue,true,.45);ctx.strokeStyle=[C.orange,C.purple,C.green][choice];ctx.lineWidth=5;if(choice===0){for(let i=0;i<7;i++)ctx.strokeRect(650+i*35,105,25,42);}else if(choice===1){ctx.beginPath();ctx.ellipse(785,145,110,42,0,0,Math.PI*2);ctx.stroke();}else{ctx.beginPath();ctx.arc(785,140,75,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(815,140,38,0,Math.PI*2);ctx.stroke();}label(ctx,['5000','≈2500','10000'][choice],760,52,C.orange);}
      else if(kind==='fit'){for(let i=0;i<8;i++){ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(220+i*65,80+(i%2)*110,6,0,Math.PI*2);ctx.fill();}head(ctx,520+value*1.5,155,.75,toggle?C.green:C.red,true,.15);ctx.strokeStyle=C.line;ctx.lineWidth=3;ctx.strokeRect(760,70,250,130);ctx.fillStyle=C.blue;ctx.fillRect(780,175,42,value*-1);ctx.fillStyle=toggle?C.green:C.red;ctx.fillRect(850,175,42,toggle?-85:-20);}
      else if(kind==='sampler'){const xs=[55,250,445,640,835];for(let i=0;i<5;i++){pill(ctx,xs[i],95,145,80,i<=step?(choice?C.purple:C.blue):C.line,i===step);if(i<4){ctx.strokeStyle=i<step?C.green:C.line;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(xs[i]+145,135);ctx.lineTo(xs[i+1],135);ctx.stroke();}}label(ctx,choice?'382':'253',900,55,C.orange);}
      else if(kind==='training'){ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(80,220);ctx.lineTo(720,220);ctx.lineTo(720,55);ctx.stroke();ctx.strokeStyle=choice?C.red:C.green;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(80,220);ctx.lineTo(choice?81:80+Math.min(value,4000)/4000*360,choice?55:220-Math.min(value,4000)/4000*145);ctx.lineTo(680,choice?55:75);ctx.stroke();label(ctx,(choice ? .05 : Math.min(.05,value/4000*.05)).toFixed(3),820,120,choice?C.red:C.green);}
      else if(kind==='results'){const prog=running?Math.min(1,(time-startRef.current)/1700):0;const vals=choice===0?[.748,.971,.968]:[1.683,2.172];const names=choice===0?['GNM','FLAME','F-w/o']:['GNM','FLAME'];const max=choice===0?1.1:2.4;vals.forEach((v,i)=>{const y=70+i*70;ctx.fillStyle=i===0?C.green:C.red;ctx.fillRect(180,y,(v/max)*720*prog,36);label(ctx,names[i],45,y+28,i===0?C.green:C.red);label(ctx,(v*prog).toFixed(3),930,y+28,C.text);});}
      if(!canvas.classList.contains('is-ready'))canvas.classList.add('is-ready');raf.current=requestAnimationFrame(draw);};
    const start=()=>{if(!raf.current)raf.current=requestAnimationFrame(draw)};const stop=()=>{if(raf.current)cancelAnimationFrame(raf.current);raf.current=undefined};const disconnect=observeCanvas(canvas,start,stop);return()=>{stop();disconnect()};
  },[kind,chapterId,moduleId,dims.w,dims.h,choice,value,step,toggle,running]);

  const drag=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(kind!=='basis')return;const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*dims.w;const y=(e.clientY-r.top)/r.height*dims.h;setValue(Math.round(clamp((x-265)/55,-3,3)*10)/10);setStep(Math.round(clamp((140-y)/30,-3,3)*10)/10);};
  if(kind==='hero'||kind==='analogy')return <canvas ref={canvasRef} width={dims.w} height={dims.h}/>;
  return <div><canvas ref={canvasRef} width={dims.w} height={dims.h} tabIndex={kind==='basis'?0:undefined} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);drag(e)}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))drag(e)}} onKeyDown={e=>{if(kind==='basis'){if(e.key==='ArrowLeft')setValue(v=>clamp(v-.25,-3,3));if(e.key==='ArrowRight')setValue(v=>clamp(v+.25,-3,3));if(e.key==='ArrowUp')setStep(v=>clamp(v+.25,-3,3));if(e.key==='ArrowDown')setStep(v=>clamp(v-.25,-3,3));}}}/>
    {kind==='basis'?<div className="ctrl"><span>β <b className="val">{value.toFixed(1)}</b></span><span>φ <b className="val">{Number(step).toFixed(1)}</b></span></div>:null}
    {kind==='fit'?<div className="ctrl"><label>地标权重 <span className="val">{value}</span></label><input type="range" min="0" max="100" value={value} onChange={e=>setValue(+e.target.value)}/><button className={`chip ${toggle?'active':''}`} onClick={()=>setToggle(v=>!v)}>解剖约束</button></div>:null}
    {kind==='training'?<div className="ctrl"><label>训练步 <span className="val">{value}</span></label><input type="range" min="0" max="8000" step="250" value={value} onChange={e=>setValue(+e.target.value)}/>{labels[kind].map((x,i)=><button key={x} className={`chip ${choice===i?'active':''}`} onClick={()=>setChoice(i)}>{x}</button>)}</div>:null}
    {!['basis','fit','training'].includes(kind)?<div className="ctrl">{labels[kind].map((x,i)=>{
      const active=(kind==='lbs'||kind==='sampler') ? i!==2&&choice===i : choice===i;
      const atEnd=step===(kind==='lbs'?3:4);
      return <button key={x} className={`chip ${active?'active':''}`} onClick={()=>{
        if(kind==='lbs'&&i===0)setStep(s=>Math.max(0,s-1));
        else if(kind==='lbs'&&i===1)setStep(s=>Math.min(3,s+1));
        else if(kind==='lbs'&&i===2){setStep(0);setChoice(0);}
        else if(kind==='sampler'&&i===2)setStep(s=>Math.min(4,s+1));
        else if(kind==='motion'||kind==='results'){startRef.current=performance.now();setRunning(true);}
        else setChoice(i);
      }} disabled={kind==='sampler'&&i===2&&atEnd}>{x}</button>;
    })}{kind==='regions'?<button className={`chip ${toggle?'active':''}`} onClick={()=>setToggle(v=>!v)}>{toggle?'GNM 局部':'全局假想'}</button>:null}</div>:null}
    <div className={`feedback ${feedback.c}`}>{feedback.t}</div></div>;
}

export const HeroComparison:React.FC<WidgetProps>=(p)=><Workshop kind="hero" {...p}/>;
export const StudioAnalogy:React.FC<WidgetProps>=(p)=><Workshop kind="analogy" {...p}/>;
export const Ch1Shell:React.FC<WidgetProps>=(p)=><Workshop kind="shell" {...p}/>;
export const Ch1Anatomy:React.FC<WidgetProps>=(p)=><Workshop kind="motion" {...p}/>;
export const Ch2Data:React.FC<WidgetProps>=(p)=><Workshop kind="data" {...p}/>;
export const Ch3Basis:React.FC<WidgetProps>=(p)=><Workshop kind="basis" {...p}/>;
export const Ch4Lbs:React.FC<WidgetProps>=(p)=><Workshop kind="lbs" {...p}/>;
export const Ch5Regions:React.FC<WidgetProps>=(p)=><Workshop kind="regions" {...p}/>;
export const Ch6Anatomy:React.FC<WidgetProps>=(p)=><Workshop kind="anatomy" {...p}/>;
export const Ch7Fit:React.FC<WidgetProps>=(p)=><Workshop kind="fit" {...p}/>;
export const Ch8Sampler:React.FC<WidgetProps>=(p)=><Workshop kind="sampler" {...p}/>;
export const Ch9Training:React.FC<WidgetProps>=(p)=><Workshop kind="training" {...p}/>;
export const Ch10Results:React.FC<WidgetProps>=(p)=><Workshop kind="results" {...p}/>;
