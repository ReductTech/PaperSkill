import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import { PaperTable } from './hy-paper-evidence';
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

function metricBars(ctx: CanvasRenderingContext2D, labels: string[], values: number[], colors: string[], x: number, y: number, maxW = 180) {
  const max = Math.max(...values);
  const step = labels.length > 2 ? 14 : 20;
  labels.forEach((t, i) => { label(ctx, t, x, y + i * step, C.muted, 12); ctx.fillStyle = C.line; ctx.fillRect(x + 78, y - 12 + i * step, maxW, 14); ctx.fillStyle = colors[i]; ctx.fillRect(x + 78, y - 12 + i * step, maxW * values[i] / max, 14); label(ctx, String(values[i]), x + 84 + maxW, y + i * step, C.ink, 12); });
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

const analogyNames = ['定任务','转全景','选路线','拍关键帧','查记忆','压步数','换尺度','拨输出','对齐','交付'];
export const HyAnalogy: React.FC<WidgetProps> = ({ chapterId }) => {
  const index = clamp(Number(chapterId.split('-')[1] || 1) - 1, 0, 9);
  return <CanvasView width={244} height={130} animate draw={(ctx, time) => {
    clearStudio(ctx, 244, 130); const p = easeInOutQuad((time % 3000) / 3000); const y = 82;
    if (index === 1) { const a = p * Math.PI * 2; ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(122,73,42,0,a); ctx.stroke(); camera(ctx,122+Math.cos(a)*42,73+Math.sin(a)*22,C.blue,.55); }
    else { route(ctx, [[34,y+12],[92,y-5],[154,y+7],[210,y-18]], index===8 ? C.orange : C.blue, 3); camera(ctx,40+p*158,y+8-p*22,C.blue,.58); target(ctx,210,y-18,true); }
    label(ctx, analogyNames[index], 12, 20, C.ink, 13); if (index===4) photo(ctx,164,43,C.purple,.9); if(index===6){ctx.strokeStyle=C.orange;ctx.strokeRect(172,38,42,42);} if(index===9) label(ctx,'完成',214,23,C.green,12,'right');
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

type MemoryCandidate = {
  id: 'entry' | 'corner' | 'reverse';
  name: string;
  angle: number;
  overlap: number;
  cue: string;
};

const memoryCandidates: MemoryCandidate[] = [
  { id: 'entry', name: 'R1 入口远景', angle: -32, overlap: 43, cue: '看得到入口，但与目标转角只共享少量区域。' },
  { id: 'corner', name: 'R2 同向侧拍', angle: 14, overlap: 78, cue: '门框、转角与目标视野重合最多。' },
  { id: 'reverse', name: 'R3 反向回望', angle: 132, overlap: 12, cue: '朝向相反，几乎没有可直接对应的局部细节。' },
];

type StitchMode = 'spatial' | 'temporal';

export const HyMemory: React.FC<WidgetProps> = () => {
  const [ggmEnabled, setGgmEnabled] = useState(false);
  const [candidateId, setCandidateId] = useState<MemoryCandidate['id']>('entry');
  const [stitchMode, setStitchMode] = useState<StitchMode>('temporal');
  const candidate = memoryCandidates.find((item) => item.id === candidateId) ?? memoryCandidates[0];
  const retrievalReady = candidate.id === 'corner';
  const pairingReady = stitchMode === 'spatial';
  const success = ggmEnabled && retrievalReady && pairingReady;
  const reportedRow = ggmEnabled && retrievalReady
    ? stitchMode === 'spatial' ? '配置 A：GGM + SSM++' : '配置 A*：时间拼接替代'
    : null;

  const feedback = !ggmEnabled
    ? '局部照片能补纹理，却没有 360° 全景点云约束跨轨迹的粗结构。先打开 GGM。'
    : !retrievalReady
      ? `${candidate.name} 与目标视野对应不足。SSM++ 会选择最相关关键帧，而不是把所有历史帧都塞进主干。`
      : !pairingReady
        ? '检索帧选对了，但时间拼接把它当成另一个时刻；论文表 8 的 A* 在所有指标上都明显退化。'
        : '调度成立：GGM 守住全局骨架，R2 提供局部对应，空间拼接让检索帧与目标帧共享同一时间索引。';

  return (
    <div className="memory-lab">
      <CanvasView height={310} draw={(ctx) => {
        clearStudio(ctx,560,310);
        label(ctx,'全局几何',44,30,C.ink,13);
        label(ctx,'局部检索与配对',318,30,C.ink,13);

        ctx.strokeStyle = ggmEnabled ? C.purple : C.line;
        ctx.lineWidth = ggmEnabled ? 4 : 2;
        ctx.beginPath(); ctx.arc(145,130,76,0,Math.PI*2); ctx.stroke();
        for (let index=0; index<18; index++) {
          const angle = index/18*Math.PI*2;
          const radius = index%3===0 ? 62 : 72;
          ctx.fillStyle = ggmEnabled ? C.purple : '#b8c1cf';
          ctx.globalAlpha = ggmEnabled ? .82 : .35;
          ctx.beginPath(); ctx.arc(145+Math.cos(angle)*radius,130+Math.sin(angle)*radius*.56,3,0,Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        camera(ctx,145,138,ggmEnabled?C.purple:C.muted,.62);
        label(ctx,ggmEnabled?'Ppan 已加载':'Ppan 未加载',145,232,ggmEnabled?C.purple:C.muted,12,'center');

        const candidateY = 90;
        photo(ctx,342,candidateY,retrievalReady?C.green:C.orange,1);
        label(ctx,candidate.name,342,128,retrievalReady?C.green:C.orange,11,'center');
        photo(ctx,466,candidateY,C.blue,1);
        label(ctx,'目标帧 T',466,128,C.blue,11,'center');

        if (stitchMode === 'spatial') {
          ctx.strokeStyle = pairingReady ? C.green : C.line;
          ctx.lineWidth = 3;
          ctx.strokeRect(310,154,190,60);
          ctx.beginPath(); ctx.moveTo(405,154); ctx.lineTo(405,214); ctx.stroke();
          label(ctx,'R',358,188,retrievalReady?C.green:C.orange,16,'center');
          label(ctx,'T',452,188,C.blue,16,'center');
          label(ctx,'宽度 2W · 同一时间索引 tk',405,237,C.green,11,'center');
        } else {
          ctx.strokeStyle = C.red;
          ctx.lineWidth = 3;
          ctx.setLineDash([7,5]);
          ctx.strokeRect(334,153,142,32);
          ctx.strokeRect(334,198,142,32);
          ctx.setLineDash([]);
          label(ctx,'R · tk',405,175,C.orange,12,'center');
          label(ctx,'T · tk+1',405,220,C.blue,12,'center');
          label(ctx,'时间身份被错开',405,253,C.red,11,'center');
        }

        route(ctx,[[225,130],[286,130],[306,162]],ggmEnabled?C.purple:C.line,3,ggmEnabled?[]:[6,5]);
        label(ctx,success?'全局 + 局部对齐完成':'仍有记忆条件未满足',530,286,success?C.green:C.orange,12,'right');
      }} />

      <div className="memory-control-grid">
        <section className="memory-global-control">
          <header><span>1 / 全局骨架</span><strong>加载全景点云记忆</strong></header>
          <label className="memory-switch">
            <input type="checkbox" checked={ggmEnabled} onChange={(event) => setGgmEnabled(event.target.checked)} />
            <span aria-hidden="true"><i /></span>
            <b>{ggmEnabled?'GGM 已接入':'仅依赖局部照片'}</b>
          </label>
          <p>推理时论文使用来自 HY-Pano 2.0 的 360° 全景点云 Ppan 作为全局几何引导。</p>
        </section>

        <section className="memory-stitch-control">
          <header><span>3 / 配对方式</span><strong>给检索帧安排位置</strong></header>
          <div className="memory-segmented" role="group" aria-label="选择检索帧拼接方式">
            <button type="button" className={stitchMode==='spatial'?'selected':''} aria-pressed={stitchMode==='spatial'} onClick={() => setStitchMode('spatial')}>空间拼接</button>
            <button type="button" className={stitchMode==='temporal'?'selected':''} aria-pressed={stitchMode==='temporal'} onClick={() => setStitchMode('temporal')}>时间拼接</button>
          </div>
          <p>SSM++ 横向拼成 2W，并让检索帧继承其目标帧的时间索引。</p>
        </section>
      </div>

      <section className="memory-retrieval-control">
        <header><span>2 / 局部检索</span><strong>为目标视角选择最相关历史帧</strong><small>重合率仅是教程线索，不是论文阈值或模型输出</small></header>
        <div className="memory-candidates" role="group" aria-label="选择历史检索帧">
          {memoryCandidates.map((item) => {
            const selected = item.id === candidateId;
            return (
              <button key={item.id} type="button" className={`${selected?'selected':''} ${item.id==='corner'?'best-match':''}`} aria-pressed={selected} onClick={() => setCandidateId(item.id)}>
                <span className="memory-view" style={{'--memory-angle': `${item.angle}deg`,'--memory-shift': `${8+item.overlap*.22}px`} as React.CSSProperties}><i /></span>
                <strong>{item.name}</strong>
                <b>视野重合线索 {item.overlap}%</b>
                <small>{item.cue}</small>
              </button>
            );
          })}
        </div>
      </section>

      <div className="memory-diagnostics">
        <div className={ggmEnabled?'ready':'waiting'}><span>全局骨架</span><strong>{ggmEnabled?'已约束':'缺失'}</strong></div>
        <div className={retrievalReady?'ready':'waiting'}><span>局部对应</span><strong>{retrievalReady?'R2 命中':'继续检索'}</strong></div>
        <div className={pairingReady?'ready':'waiting'}><span>时间身份</span><strong>{pairingReady?'tk 对齐':'被错开'}</strong></div>
      </div>

      <div className={`feedback ${success?'good':ggmEnabled&&retrievalReady?'bad':''}`}>{feedback}</div>

      <section className="memory-paper-spotlight">
        <header><span>论文证据区</span><strong>{reportedRow ?? '当前是教程自定义状态，论文表 8 没有对应行'}</strong></header>
        <div className="memory-evidence-cards">
          <div><span>相机控制基线</span><strong>PSNR 16.13</strong><small>SSIM 0.474 · PSNRm 28.81</small></div>
          <div className={reportedRow?.includes('配置 A：')?'active':''}><span>配置 A · GGM + SSM++</span><strong>PSNR 20.94</strong><small>SSIM 0.640 · PSNRm 30.27</small></div>
          <div className={reportedRow?.includes('A*')?'active bad':''}><span>配置 A* · 时间拼接</span><strong>PSNR 19.83</strong><small>SSIM 0.581 · PSNRm 29.77</small></div>
          <div><span>配置 F · 完整中训</span><strong>PSNR 21.63</strong><small>SSIM 0.669 · PSNRm 30.76</small></div>
        </div>
        <p>上方实验不计算指标。配置 F 还包含可训练 FFN、两类增强、相机嵌入和 batch size 64，不能只归因于“选对一张照片”。</p>
      </section>

      <div className="memory-glossary-grid">
        <details><summary>GGM 到底记住什么？</summary><p>它把参考点云与额外视角点云合并为扩展全局点云。推理时以全景点云覆盖 360° 环境，主要负责跨轨迹的粗结构一致性。</p></details>
        <details><summary>SSM++ 比 SSM 多了什么？</summary><p>检索关键帧直接进入主 DiT；只选最相关帧；主干使用更开放的自注意力；显式点图引导被隐式相机嵌入替代。</p></details>
        <details><summary>为何空间拼接更合适？</summary><p>检索帧和目标帧横向组成宽度 2W 的配对，并共享同一时间索引。这样模型把它们理解为同一时刻的两种空间观察，而不是前后两个视频时刻。</p></details>
      </div>

      <PaperTable tableId="table-8" />
    </div>
  );
};

export default HyAnalogy;
