import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = { bg:'#f5f8f0', env:'#b8c9a7', dark:'#76906a', blue:'#27446e', green:'#228d5c', red:'#c43f52', orange:'#f07e47', purple:'#7c3aed', text:'#21324a', muted:'#68778f', line:'#d7deea' };

function card(ctx: CanvasRenderingContext2D, x:number, y:number, w:number, h:number, color:string, clue='') {
  ctx.fillStyle='#fff'; ctx.strokeStyle=color; ctx.lineWidth=3; ctx.beginPath(); ctx.roundRect(x,y,w,h,8); ctx.fill(); ctx.stroke();
  ctx.fillStyle=color; ctx.fillRect(x+8,y+10,w-16,5); if(clue){ctx.fillStyle=C.text;ctx.font='bold 22px Segoe UI';ctx.textAlign='center';ctx.fillText(clue,x+w/2,y+h-16);}
}
function lens(ctx:CanvasRenderingContext2D,x:number,y:number,color=C.blue){ctx.strokeStyle=color;ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,y,30,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x+22,y+22);ctx.lineTo(x+52,y+52);ctx.stroke();}
function setup(canvas:HTMLCanvasElement,w:number,h:number){const ctx=setupCanvas(canvas,w,h);ctx.clearRect(0,0,w,h);ctx.fillStyle=C.bg;ctx.fillRect(0,0,w,h);return ctx;}

const Analogy:React.FC<{mode:number}> = ({mode}) => {
  const ref=useRef<HTMLCanvasElement>(null); const raf=useRef<number|null>(null);
  useEffect(()=>{const cv=ref.current;if(!cv)return;const ctx=setupCanvas(cv,560,140);let t=0;
    const draw=()=>{t+=0.012;ctx.clearRect(0,0,560,140);ctx.fillStyle=C.bg;ctx.fillRect(0,0,560,140);ctx.strokeStyle=C.dark;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(34,104);ctx.lineTo(526,104);ctx.stroke();
      for(let i=0;i<8;i++)card(ctx,48+i*58,58,42,40,i===5?C.green:C.line,i===5?'10':'');
      const x=70+390*((Math.sin(t)+1)/2);lens(ctx,x,48,mode===1?C.red:mode===3?C.purple:C.blue);cv.classList.add('is-ready');raf.current=requestAnimationFrame(draw)};
    const stop=()=>{if(raf.current)cancelAnimationFrame(raf.current);raf.current=null};const start=()=>{if(!raf.current)raf.current=requestAnimationFrame(draw)};const off=observeCanvas(cv,start,stop);return()=>{stop();off()};},[mode]);
  return <canvas ref={ref} width={560} height={140}/>;
};

const Hero:React.FC<{guided:boolean}> = ({guided}) => {
  const ref=useRef<HTMLCanvasElement>(null);
  const raf=useRef<number|null>(null);

  useEffect(()=>{
    const cv=ref.current;if(!cv)return;
    let t=0;
    const draw=()=>{
      t+=0.016;
      const ctx=setup(cv,520,160);
      const scanX=48+((Math.sin(t*(guided?0.78:0.58))+1)/2)*420;
      ctx.strokeStyle=C.dark;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(24,112);ctx.lineTo(496,112);ctx.stroke();
      for(let i=0;i<10;i++){
        const x=30+i*46;
        const center=x+17;
        const clue=i===7;
        const keep=guided?clue||i>7:!clue&&i%2===0;
        const near=Math.max(0,1-Math.abs(center-scanX)/92);
        card(ctx,x,66,34,36,keep?(clue?C.green:C.blue):C.red,clue?'10':'');
        if(!keep){ctx.globalAlpha=.35;ctx.fillStyle=C.red;ctx.fillRect(x,66,34,36);ctx.globalAlpha=1;}
        if(near>0.72){
          ctx.globalAlpha=0.16+near*0.18;ctx.strokeStyle=guided?C.green:C.red;ctx.lineWidth=2;
          ctx.strokeRect(x-4,62,42,44);ctx.globalAlpha=1;
        }
      }
      ctx.globalAlpha=.08;ctx.fillStyle=guided?C.green:C.red;ctx.fillRect(scanX-5,34,10,78);ctx.globalAlpha=1;
      // The cover magnifier is a CSS overlay so its motion remains visible
      // even when the browser throttles Canvas animation in an inactive tab.
      cv.classList.add('is-ready');
      raf.current=requestAnimationFrame(draw);
    };
    const stop=()=>{if(raf.current!==null)cancelAnimationFrame(raf.current);raf.current=null;};
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce){draw();stop();return stop;}
    raf.current=requestAnimationFrame(draw);
    return stop;
  },[guided]);

  return <canvas ref={ref} width={520} height={160}/>;
};
export const HeroOld:React.FC<WidgetProps>=()=> <Hero guided={false}/>;
export const HeroNew:React.FC<WidgetProps>=()=> <Hero guided/>;
export const C1Analogy:React.FC<WidgetProps>=()=> <Analogy mode={1}/>;
export const C2Analogy:React.FC<WidgetProps>=()=> <Analogy mode={2}/>;
export const C3Analogy:React.FC<WidgetProps>=()=> <Analogy mode={3}/>;

export const C1Pressure:React.FC<WidgetProps>=()=>{
  const ref=useRef<HTMLCanvasElement>(null);const [mins,setMins]=useState(10);const [method,setMethod]=useState<'all'|'guided'>('all');
  useEffect(()=>{const cv=ref.current;if(!cv)return;const ctx=setup(cv,1080,280);ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(70,220);ctx.lineTo(750,220);ctx.lineTo(750,40);ctx.stroke();const points=30;ctx.strokeStyle=method==='all'?C.red:C.green;ctx.lineWidth=5;ctx.beginPath();for(let i=0;i<points;i++){const x=70+i*(680/(points-1));const p=i/(points-1);const raw=method==='all'?p:0.15*(1-Math.exp(-5*p));const y=220-raw*160*(mins/130);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.fillStyle=C.env;ctx.fillRect(835,55,120,170);const fill=method==='all'?clamp(mins/130,0,1):Math.min(.28,.08+mins/900);ctx.fillStyle=fill>.75?C.red:method==='guided'?C.green:C.blue;ctx.fillRect(835,225-fill*170,120,fill*170);ctx.fillStyle=C.text;ctx.font='bold 28px Segoe UI';ctx.textAlign='center';ctx.fillText(`${Math.round(fill*100)}%`,895,45);cv.classList.add('is-ready');},[mins,method]);
  const good=method==='guided';return <div><canvas ref={ref} width={1080} height={280}/><div className="ctrl"><label>视频时长 <span className="val">{mins} 分钟</span></label><input type="range" min="1" max="130" value={mins} onChange={e=>setMins(+e.target.value)}/></div><div className="chip-row"><button className={`chip ${method==='all'?'active':''}`} onClick={()=>setMethod('all')}>全部保留</button><button className={`chip ${method==='guided'?'active':''}`} onClick={()=>setMethod('guided')}>问题引导</button></div><div className={`feedback ${good?'good':mins>80?'bad':''}`}>{good?'问题引导：只保留相关旧线索与最近信息。':mins>80?'全部保留：时长增加会持续推高缓存。':'继续拉长视频，观察抽屉何时溢出。'}</div></div>;
};

export const C1Clue:React.FC<WidgetProps>=()=>{const ref=useRef<HTMLCanvasElement>(null);const [s,setS]=useState<'visual'|'query'>('visual');const [done,setDone]=useState(false);useEffect(()=>{const cv=ref.current;if(!cv)return;const ctx=setup(cv,1080,280);for(let i=0;i<16;i++){const clue=i===10;const keep=done&&(s==='query'?clue||i>12:!clue&&i%4===0);card(ctx,70+(i%8)*112,55+Math.floor(i/8)*105,76,72,done?(keep?(clue?C.green:C.blue):C.red):C.line,clue?'10':'');if(done&&!keep){ctx.globalAlpha=.25;ctx.fillStyle=C.red;ctx.fillRect(70+(i%8)*112,55+Math.floor(i/8)*105,76,72);ctx.globalAlpha=1;}}cv.classList.add('is-ready');},[s,done]);return <div><canvas ref={ref} width={1080} height={280}/><div className="chip-row"><button className={`chip ${s==='visual'?'active':''}`} onClick={()=>{setS('visual');setDone(false)}}>凭视觉挑重点</button><button className={`chip ${s==='query'?'active':''}`} onClick={()=>{setS('query');setDone(false)}}>让问题帮忙</button><button className="btn" onClick={()=>setDone(true)}>压缩到 10%</button></div><div className={`feedback ${done?(s==='query'?'good':'bad'):''}`}>{!done?'选择策略，然后执行压缩。':s==='query'?'问题参与筛选：号码 10 被保留。':'只看视觉显著性：号码被删，答案无法确定。'}</div></div>};

export const C2Query:React.FC<WidgetProps>=()=>{const ref=useRef<HTMLCanvasElement>(null);const [q,setQ]=useState(0);const labels=['他在哪里？','他在做什么？','球衣号码？'];useEffect(()=>{const cv=ref.current;if(!cv)return;const ctx=setup(cv,1080,280);const hot=q===0?[36,37,44,45]:q===1?[26,27,34,35]:[19,20];for(let i=0;i<64;i++){const x=55+(i%8)*70,y=28+Math.floor(i/8)*29;ctx.fillStyle=hot.includes(i)?(q===2?C.green:C.blue):'#e8edf3';ctx.fillRect(x,y,58,21);}const vals=q===0?[.9,.75,.3,.2]:q===1?[.85,.72,.4,.25]:[.95,.82,.28,.2];vals.forEach((v,i)=>{ctx.fillStyle=i<2?(q===2?C.green:C.blue):C.env;ctx.fillRect(700,55+i*48,v*300,24)});lens(ctx,160+q*110,130,q===2?C.green:C.blue);cv.classList.add('is-ready');},[q]);return <div><canvas ref={ref} width={1080} height={280}/><div className="chip-row">{labels.map((x,i)=><button key={x} className={`chip ${q===i?'active':''}`} onClick={()=>setQ(i)}>{x}</button>)}</div><div className={`feedback ${q===2?'good':''}`}>{q===0?'地点问题把注意力引向场景边界。':q===1?'动作问题把注意力引向球和姿态。':'号码问题把小块球衣数字提升为关键证据。'}</div></div>};

export const C3Sparse:React.FC<WidgetProps>=()=>{const ref=useRef<HTMLCanvasElement>(null);const [th,setTh]=useState(35);useEffect(()=>{const cv=ref.current;if(!cv)return;const ctx=setup(cv,1080,280);const scores=Array.from({length:64},(_,i)=>((i*37)%97)/100);let kept=0;scores.forEach((s,i)=>{const on=s>=th/100;if(on)kept++;ctx.fillStyle=on?(i===49?C.green:C.blue):'#e6ebef';ctx.fillRect(45+(i%8)*42,35+Math.floor(i/8)*26,34,18)});scores.sort((a,b)=>a-b).forEach((s,i)=>{ctx.fillStyle=s>=th/100?C.blue:C.env;ctx.fillRect(500+i*8,230-s*170,6,s*170)});ctx.fillStyle=C.text;ctx.font='bold 28px Segoe UI';ctx.fillText(`${kept}/64`,875,60);cv.classList.add('is-ready');},[th]);const bad=th>85,good=th>=55&&th<=80;return <div><canvas ref={ref} width={1080} height={280}/><div className="ctrl"><label>保留阈值 <span className="val">{th}%</span></label><input type="range" min="5" max="95" value={th} onChange={e=>setTh(+e.target.value)}/></div><div className={`feedback ${bad?'bad':good?'good':''}`}>{bad?'阈值过高：答案线索也可能被剪掉。':good?'少量高相关 token 承担主要线索。':'多数 token 分数很低，压缩空间出现。'}</div></div>};

export const C3Layer:React.FC<WidgetProps>=()=>{const ref=useRef<HTMLCanvasElement>(null);const layers=[2,4,6,8,10,12];const [layer,setLayer]=useState(2);useEffect(()=>{const cv=ref.current;if(!cv)return;const ctx=setup(cv,1080,280);const sim=.86+layer*.009;for(let i=0;i<16;i++){const a=((i*17)%11)/11,b=clamp(a+(1-sim)*(i%2?1:-1),0,1);ctx.fillStyle=C.blue;ctx.fillRect(90+i*45,80-a*45,28,a*85);ctx.fillStyle=C.green;ctx.fillRect(90+i*45,185-b*45,28,b*85)}ctx.fillStyle=sim>.9?C.green:C.blue;ctx.fillRect(850,230-sim*180,100,sim*180);ctx.fillStyle=C.text;ctx.font='bold 28px Segoe UI';ctx.textAlign='center';ctx.fillText(`${Math.round(sim*100)}%`,900,38);cv.classList.add('is-ready');},[layer]);return <div><canvas ref={ref} width={1080} height={280}/><div className="chip-row">{layers.map(x=><button key={x} className={`chip ${layer===x?'active':''}`} onClick={()=>setLayer(x)}>Layer {x}</button>)}</div><div className={`feedback ${layer>=8?'good':''}`}>{layer>=8?'深层相邻帧更相似，冗余更明显。':'浅层仍保留较多局部差异。'}</div></div>};
