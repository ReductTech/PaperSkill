import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', floor: '#dce8d2', line: '#d7deea', ink: '#21324a', muted: '#68778f',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706', purple: '#7c3aed', brown: '#92400e', white: '#ffffff',
};

function CanvasView({ width = 560, height = 240, animate = false, draw }: { width?: number; height?: number; animate?: boolean; draw: (ctx: CanvasRenderingContext2D, time: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, width, height); } catch { return; }
    let raf: number | null = null;
    const paint = (time: number) => {
      drawRef.current(ctx, time);
      canvas.classList.add('is-ready');
      if (animate) raf = requestAnimationFrame(paint);
    };
    const start = () => { if (raf === null) raf = requestAnimationFrame(paint); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, [width, height, animate, draw]);
  return <canvas ref={ref} width={width} height={height} />;
}

function clearStudio(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C.floor; ctx.fillRect(0, h * 0.68, w, h * 0.32);
  ctx.strokeStyle = '#b8c9a7'; ctx.lineWidth = 1;
  for (let x = 24; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, h * 0.68); ctx.lineTo(x - 22, h); ctx.stroke(); }
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink, size = 14, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color; ctx.font = `700 ${size}px Segoe UI, sans-serif`; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.textAlign = 'left';
}

function camera(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.blue, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = color; ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-24, -14, 48, 28, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(3, 0, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.stroke(); ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(3, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color; ctx.fillRect(-14, -20, 18, 7); ctx.restore();
}

function target(ctx: CanvasRenderingContext2D, x: number, y: number, good = true) {
  ctx.strokeStyle = good ? C.green : C.red; ctx.lineWidth = 4; ctx.strokeRect(x - 30, y - 24, 60, 48);
  ctx.fillStyle = good ? '#dcfce7' : '#fee2e2'; ctx.fillRect(x - 26, y - 20, 52, 40);
}

function photo(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.blue, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = C.white; ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.fillRect(x - 26, y - 18, 52, 36); ctx.strokeRect(x - 26, y - 18, 52, 36);
  ctx.fillStyle = C.floor; ctx.fillRect(x - 21, y + 2, 42, 11); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + 12, y - 7, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function route(ctx: CanvasRenderingContext2D, pts: Array<[number, number]>, color = C.blue, width = 4, dash: number[] = []) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.beginPath();
  pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.setLineDash([]);
}

function pointOnRoute(pts: Array<[number, number]>, progress: number): [number, number] {
  if (pts.length < 2) return pts[0] ?? [0, 0];
  const lengths = pts.slice(1).map(([x, y], i) => Math.hypot(x - pts[i][0], y - pts[i][1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = clamp(progress, 0, 1) * total;
  for (let i = 0; i < lengths.length; i += 1) {
    if (remaining <= lengths[i]) {
      const t = lengths[i] === 0 ? 0 : remaining / lengths[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
    }
    remaining -= lengths[i];
  }
  return pts[pts.length - 1];
}

function metricBars(ctx: CanvasRenderingContext2D, labels: string[], values: number[], colors: string[], x: number, y: number, maxW = 180) {
  const max = Math.max(...values);
  labels.forEach((t, i) => { label(ctx, t, x, y + i * 32, C.muted, 12); ctx.fillStyle = C.line; ctx.fillRect(x + 78, y - 12 + i * 32, maxW, 14); ctx.fillStyle = colors[i]; ctx.fillRect(x + 78, y - 12 + i * 32, maxW * values[i] / max, 14); label(ctx, String(values[i]), x + 84 + maxW, y + i * 32, C.ink, 12); });
}

export const HyHero: React.FC<WidgetProps> = ({ moduleId }) => (
  <CanvasView width={520} height={180} animate draw={(ctx, time) => {
    clearStudio(ctx, 520, 180); const p = (Math.sin(time / 1100) + 1) / 2;
    if (moduleId === 'old') {
      route(ctx, [[50,130],[160,85],[260,120],[390,70]], C.red, 3, [8,6]); camera(ctx, 60 + p * 300, 118 - p * 35, C.red, .85);
      target(ctx, 430, 68, false); label(ctx, '想象会漂移', 36, 32, C.red, 14); label(ctx, '重建会留白', 360, 150, C.red, 14);
    } else {
      route(ctx, [[50,130],[150,90],[245,108],[335,72],[430,58]], C.blue, 5); camera(ctx, 60 + p * 360, 122 - p * 60, C.blue, .85);
      target(ctx, 455, 56, true); label(ctx, '按输入条件切换目标', 36, 32, C.blue, 14); label(ctx, '生成 + 重建', 385, 150, C.green, 14);
    }
  }} />
);

const analogyNames = ['分任务','补盲区','查记忆','排课程','统一尺','压资产','比协议','贴标签'];
export const HyAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const index = clamp(Number(chapterId.split('-')[1] || 1) - 1, 0, 7);
  return <CanvasView width={244} height={130} animate draw={(ctx, time) => {
    clearStudio(ctx, 244, 130);
    const raw = (time % 3200) / 3200;
    const p = easeInOutQuad(raw);
    label(ctx, analogyNames[index], 12, 20, C.ink, 13);

    if (index === 0) {
      const generation = raw < .5;
      const local = easeInOutQuad((raw % .5) * 2);
      const start: [number, number] = [42, 82];
      const branch: Array<[number, number]> = generation ? [start,[108,82],[156,52],[207,46]] : [start,[108,82],[156,103],[207,100]];
      route(ctx,[[108,82],[156,52],[207,46]],generation?C.green:C.line,3);
      route(ctx,[[108,82],[156,103],[207,100]],generation?C.line:C.blue,3);
      const [x,y] = pointOnRoute(branch,local);
      camera(ctx,x,y,generation?C.green:C.blue,.52);
      label(ctx,generation?'稀疏线索':'丰富观察',42,112,generation?C.green:C.blue,9,'center');
      label(ctx,'生成',207,34,C.green,9,'center'); label(ctx,'重建',207,121,C.blue,9,'center');
    } else if (index === 1) {
      const a = p * Math.PI * 2;
      ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(122,73,42,0,a); ctx.stroke();
      ctx.fillStyle='#cbd5c0';ctx.fillRect(105,57,34,32);
      camera(ctx,122+Math.cos(a)*42,73+Math.sin(a)*22,C.blue,.55);
      const path: Array<[number,number]>=[[28,108],[67,89],[79,42],[166,36],[214,77]];
      route(ctx,path,C.orange,2);
      label(ctx,'360° + 路线',122,121,C.green,9,'center');
    } else if (index === 2) {
      [[37,52],[37,82],[37,112]].forEach(([x,y],i)=>photo(ctx,x,y,i===1?C.purple:C.line,.88));
      ctx.strokeStyle=C.green;ctx.strokeRect(171,49,54,45);label(ctx,'目标帧',198,75,C.green,8,'center');
      const x=37+(198-37)*p,y=82+(71-82)*p;photo(ctx,x,y,C.purple,1);
      ctx.strokeStyle=C.orange;ctx.beginPath();ctx.arc(122,72,31,0,Math.PI*2*p);ctx.stroke();
      label(ctx,'骨架 + 局部参考',122,121,C.purple,9,'center');
    } else if (index === 3) {
      const stops=[45,122,199];const step=Math.min(2,Math.floor(raw*3));
      ['控制','记忆','四步'].forEach((name,i)=>{ctx.fillStyle=i<=step?'#dcfce7':C.white;ctx.strokeStyle=i<=step?C.green:C.line;ctx.lineWidth=2;ctx.fillRect(stops[i]-25,51,50,39);ctx.strokeRect(stops[i]-25,51,50,39);label(ctx,name,stops[i],75,i<=step?C.green:C.muted,8,'center');if(i<2)route(ctx,[[stops[i]+25,70],[stops[i+1]-25,70]],i<step?C.green:C.line,3);});
      camera(ctx,stops[step],35,C.blue,.43);label(ctx,'能力按顺序继承',122,118,C.green,9,'center');
    } else if (index === 4) {
      const w=72+p*86,h=42+p*38,x=122-w/2,y=72-h/2;
      ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);
      for(let i=1;i<4;i++){ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(x+w*i/4,y);ctx.lineTo(x+w*i/4,y+h);ctx.stroke();}
      ctx.fillStyle=C.green;ctx.beginPath();ctx.arc(x+w*.68,y+h*.35,6,0,Math.PI*2);ctx.fill();
      label(ctx,'-1',x,119,C.muted,8,'center');label(ctx,'+1',x+w,119,C.muted,8,'center');label(ctx,'不同尺寸 · 同一坐标尺',122,28,C.green,9,'center');
    } else if (index === 5) {
      for(let i=0;i<18;i++){const keep=i%4!==0||i<4;ctx.fillStyle=keep?C.blue:C.line;ctx.globalAlpha=keep?(.35+i*.02):.22;ctx.beginPath();ctx.arc(39+(i%6)*33,48+Math.floor(i/6)*27,5+(i%3),0,Math.PI*2);ctx.fill();}
      ctx.globalAlpha=1;const x=42+p*155;ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,35);ctx.lineTo(x,108);ctx.stroke();
      label(ctx,'对齐后再稀疏化',122,121,C.green,9,'center');
    } else if (index === 6) {
      const values=[.62,.82,.74];['模型 A','模型 B','HY 2.0'].forEach((name,i)=>{const x=39+i*75,h=55*values[i]*(.65+.35*p);ctx.fillStyle=i===2?C.green:[C.blue,C.orange][i];ctx.fillRect(x,102-h,28,h);label(ctx,name,x+14,119,i===2?C.green:C.muted,7,'center');});
      label(ctx,'同协议再比较',122,28,C.blue,9,'center');
    } else {
      ['论文','官方','第三方','未知'].forEach((name,i)=>{const x=25+i*54;ctx.fillStyle=[C.green,C.blue,C.orange,C.line][i];ctx.fillRect(x,48,42,48);label(ctx,name,x+21,75,i===3?C.muted:C.white,7,'center');});
      const marker=25+Math.floor(raw*4)%4*54;ctx.strokeStyle=C.ink;ctx.lineWidth=3;ctx.strokeRect(marker-3,45,48,54);
      label(ctx,'给结论贴来源标签',122,119,C.ink,9,'center');
    }
  }} />;
};

export const HyInputMode: React.FC<WidgetProps> = () => {
  const [mode,setMode]=useState('单图'); const generation=mode==='文本'||mode==='单图';
  return <div><CanvasView draw={(ctx)=>{clearStudio(ctx,560,240); label(ctx,'输入',42,35); label(ctx,'目标',448,35); photo(ctx,88,102,C.orange); camera(ctx,270,112,C.blue,.85); route(ctx,[[122,102],[246,112],[406,generation?78:150]],C.blue,5); target(ctx,452,generation?78:150,true); label(ctx,generation?'世界生成':'世界重建',452,generation?84:156,C.green,14,'center'); label(ctx,generation?'补出未见区域':'恢复点图/深度/法线',390,210,C.ink,13);} }/><div className="chip-row">{['文本','单图','多视图','视频'].map(x=><button key={x} className={`chip ${mode===x?'selected':''}`} onClick={()=>setMode(x)}>{x}</button>)}</div><div className="feedback good">{generation?'当前输入适合世界生成：模型需要利用生成先验补出未见区域。':'当前输入适合世界重建：多视图约束用于恢复几何。'}</div></div>;
};

export const HyBoundaryCompare: React.FC<WidgetProps> = () => {
  const [run,setRun]=useState(0); const start=useRef(0);
  const replay=()=>{start.current=performance.now();setRun(v=>v+1);};
  return <div><CanvasView animate={run>0} draw={(ctx,time)=>{clearStudio(ctx,560,240);const p=run?clamp((time-start.current)/1800,0,1):0;ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(280,20);ctx.lineTo(280,210);ctx.stroke();label(ctx,'传统割裂',140,28,C.red,15,'center');label(ctx,'条件化统一',420,28,C.green,15,'center');route(ctx,[[45,175],[135,95],[235,142]],C.red,3,[7,5]);route(ctx,[[325,175],[405,105],[505,62]],C.blue,5);camera(ctx,55+p*170,170-p*58,C.red,.7);camera(ctx,335+p*160,170-p*105,C.blue,.7);target(ctx,235,142,false);target(ctx,505,62,true);label(ctx,p>.9?'各擅一端':'同起点',140,214,p>.9?C.red:C.muted,12,'center');label(ctx,p>.9?'共享组件，保留条件':'同起点',420,214,p>.9?C.green:C.muted,12,'center');}}/><div className="step-ctrl"><button className="tiny" onClick={replay}>开始比较</button></div><div className={`feedback ${run?'good':''}`}>{run?'HY-World 2.0 用共享组件连接两类任务，但仍保留不同输入条件。':'传统方案各擅长一端，难以同时覆盖生成与重建。'}</div></div>;
};

export const HyPanorama: React.FC<WidgetProps> = () => {
  const modes=['显式投影','隐式映射','接缝修复']; const [mode,setMode]=useState(modes[0]);
  const feedback:{[k:string]:string}={'显式投影':'显式投影依赖焦距与视场角，元数据不准会放大变形。','隐式映射':'MMDiT 在统一潜空间学习对应关系，但生成区域仍来自数据先验。','接缝修复':'循环填充与像素融合专门处理 ERP 左右接缝。'};
  return <div><CanvasView height={250} draw={(ctx)=>{clearStudio(ctx,560,250);photo(ctx,72,105,C.orange);label(ctx,'透视条件',72,55,C.ink,13,'center');ctx.fillStyle=C.white;ctx.strokeStyle=mode==='显式投影'?C.red:C.blue;ctx.lineWidth=3;ctx.fillRect(180,65,270,82);ctx.strokeRect(180,65,270,82);for(let i=0;i<9;i++){ctx.fillStyle=i%3===0?C.floor:'#b8c9a7';ctx.fillRect(186+i*29,72,25,68);}if(mode==='显式投影'){ctx.strokeStyle=C.red;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(315,65);ctx.lineTo(337,147);ctx.stroke();}if(mode==='隐式映射'){route(ctx,[[105,105],[170,105],[315,105]],C.blue,4);label(ctx,'MMDiT token',315,180,C.blue,13,'center');}if(mode==='接缝修复'){ctx.strokeStyle=C.green;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(183,65);ctx.lineTo(183,147);ctx.moveTo(447,65);ctx.lineTo(447,147);ctx.stroke();label(ctx,'左右边界闭合',315,180,C.green,13,'center');}metricBars(ctx,['CLIP-I','Q-Align'],mode==='显式投影'?[.831,3.317]:[.844,4.026],[C.blue,C.green],40,218,95);}}/><div className="chip-row">{modes.map(x=><button key={x} className={`chip ${mode===x?'selected':''}`} onClick={()=>setMode(x)}>{x}</button>)}</div><div className={`feedback ${mode==='显式投影'?'bad':mode==='接缝修复'?'good':''}`}>{feedback[mode]}</div></div>;
};

const routeData:{[k:string]:{n:number;note:string;color:string}}={常规:{n:9,note:'离开固定视点，但物体背面仍可能缺失。',color:C.blue},环绕:{n:5,note:'围绕显著物体补足侧面观察。',color:C.green},重建感知:{n:10,note:'针对欠观察区域迭代补拍。',color:C.purple},漫游:{n:3,note:'走向可达区域远端，适合街道和走廊。',color:C.orange},航拍:{n:8,note:'补充俯视角，俯仰因碰撞动态减小。',color:C.brown}};
export const HyTrajectory: React.FC<WidgetProps> = () => { const [mode,setMode]=useState('常规'); const d=routeData[mode]; return <div><CanvasView height={260} draw={(ctx)=>{clearStudio(ctx,560,260);ctx.fillStyle='#cbd5c0';ctx.fillRect(210,65,80,58);ctx.fillRect(380,125,70,55);label(ctx,'障碍',250,96,C.muted,12,'center');const paths:{[k:string]:Array<[number,number]>}={常规:[[55,205],[160,150],[330,190],[500,80]],环绕:[[55,205],[160,150],[195,65],[315,50],[345,145],[500,80]],重建感知:[[55,205],[150,175],[320,205],[345,145],[500,80]],漫游:[[55,205],[100,70],[180,45],[330,55],[500,80]],航拍:[[55,205],[145,150],[280,95],[410,55],[500,80]]};route(ctx,paths[mode],d.color,5);camera(ctx,85,185,d.color,.75);target(ctx,500,80,true);label(ctx,`最大数量 ${d.n}`,410,225,d.color,14);label(ctx,mode,55,35,d.color,15);}}/><div className="chip-row">{Object.keys(routeData).map(x=><button key={x} className={`chip ${mode===x?'selected':''}`} onClick={()=>setMode(x)}>{x}</button>)}</div><div className={`feedback ${mode==='环绕'||mode==='重建感知'?'good':''}`}>{d.note} 这些数量是表 1 的启发式上限，并依赖检测到的对象。</div></div>; };

export const HyKeyframes: React.FC<WidgetProps> = () => { const [run,setRun]=useState(0);const start=useRef(0);const go=()=>{start.current=performance.now();setRun(v=>v+1)};return <div><CanvasView height={250} animate={run>0} draw={(ctx,time)=>{clearStudio(ctx,560,250);const p=run?clamp((time-start.current)/2000,0,1):0;ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(280,25);ctx.lineTo(280,205);ctx.stroke();label(ctx,'Video-VAE',140,30,C.red,14,'center');label(ctx,'Keyframe-VAE',420,30,C.green,14,'center');route(ctx,[[35,180],[235,85]],C.red,3,[6,5]);route(ctx,[[315,180],[515,85]],C.blue,5);camera(ctx,55+p*160,170-p*70,C.red,.68);camera(ctx,335+p*160,170-p*70,C.blue,.68);for(let i=0;i<6;i++)photo(ctx,60+i*30,210-i*13,C.red,.28+i*.08);for(let i=0;i<3;i++)photo(ctx,345+i*70,205-i*38,C.green,1);metricBars(ctx,['RotErr','ATE'],[.762,.492],[C.red,C.green],150,228,70);}}/><div className="step-ctrl"><button className="tiny" onClick={go}>开始同轨比较</button></div><div className={`feedback ${run?'good':''}`}>{run?'选择性冻结 Cross-Attn 与 FFN 后，RotErr 0.762→0.492，ATE 2.141→1.768。全量训练的部分视觉指标更高，但控制精度和泛化更差。':'两侧使用相同起点和时间基准。'}</div></div>; };

const memoryData:{[k:string]:[number,number,number,string]}={'仅相机控制':[16.13,.474,28.81,'没有跨轨迹记忆，质量和一致性最低。'],'GGM+SSM++':[20.94,.640,30.27,'全局骨架和局部检索带来显著提升。'],'空间拼接完整配置':[21.63,.669,30.76,'空间拼接、增强与更大批次形成最终记忆配置。'],'时间拼接替代':[19.83,.581,29.77,'把空间拼接换成时间拼接会在全部指标上退化。']};
export const HyMemory: React.FC<WidgetProps> = () => {const [mode,setMode]=useState('仅相机控制');const d=memoryData[mode];return <div><CanvasView height={260} draw={(ctx)=>{clearStudio(ctx,560,260);camera(ctx,105,138,C.blue,.8);target(ctx,460,105,true);route(ctx,[[135,138],[420,105]],mode==='仅相机控制'?C.red:C.blue,4,mode==='仅相机控制'?[8,6]:[]);ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.arc(285,105,62,0,Math.PI*2);ctx.stroke();label(ctx,'GGM',285,102,C.purple,13,'center');if(mode!=='仅相机控制'){photo(ctx,285,58,C.purple);route(ctx,[[285,76],[370,102]],mode==='时间拼接替代'?C.red:C.green,3,mode==='时间拼接替代'?[5,4]:[]);}metricBars(ctx,['PSNR','SSIM×30','PSNRm'],[d[0],d[1]*30,d[2]],[C.blue,C.orange,C.green],50,220,92);}}/><div className="chip-row">{Object.keys(memoryData).map(x=><button key={x} className={`chip ${mode===x?'selected':''}`} onClick={()=>setMode(x)}>{x}</button>)}</div><div className={`feedback ${mode==='仅相机控制'||mode==='时间拼接替代'?'bad':mode==='空间拼接完整配置'?'good':''}`}>{d[3]} PSNR={d[0]}，SSIM={d[1].toFixed(3)}，PSNRm={d[2]}。</div></div>;};

export default HyAnalogy;
