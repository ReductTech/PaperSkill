import React, { useCallback, useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';

interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

type Point = { x: number; y: number };
type Draw = (ctx: CanvasRenderingContext2D) => void;

const C = {
  bg: '#f5f8f0', wall: '#b8c9a7', wallDark: '#76906a', rope: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const buttonRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0' };
const buttonStyle: React.CSSProperties = { border: `1px solid ${C.border}`, borderRadius: 999, padding: '7px 12px', background: '#fff', color: C.ink, fontWeight: 700 };
const activeButton: React.CSSProperties = { ...buttonStyle, border: `3px solid ${C.orange}`, padding: '5px 10px', background: '#fff7ed' };
const srTable: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: 14 };

function clearClimbScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
}

function drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = C.wall;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.wallDark;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = C.wallDark;
  for (let px = x + 22; px < x + w; px += 28) {
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px - 12, y + h); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawHold(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = C.wallDark, selected = false) {
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.35, r, -0.25, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = selected ? C.green : '#5f7357';
  ctx.lineWidth = selected ? 4 : 2;
  ctx.stroke();
}

function drawClimber(ctx: CanvasRenderingContext2D, x: number, y: number, reach: Point, color = C.blue) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(x, y - 24, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x, y + 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(reach.x, reach.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x - 18, y - 1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.lineTo(x - 13, y + 31); ctx.moveTo(x, y + 12); ctx.lineTo(x + 15, y + 29); ctx.stroke();
}

function drawTopHold(ctx: CanvasRenderingContext2D, x: number, y: number, label?: string) {
  drawHold(ctx, x, y, 8, '#d9eadb', true);
  if (label) drawSceneLabel(ctx, label, x - 24, y - 18, C.green);
}

function drawRope(ctx: CanvasRenderingContext2D, points: Point[], color = C.rope, dashed = false) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash(dashed ? [6, 5] : []);
  ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke(); ctx.restore();
}

function drawSceneLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.ink) {
  ctx.fillStyle = color; ctx.font = '700 13px system-ui, sans-serif'; ctx.fillText(text, x, y);
}

function drawLegend(ctx: CanvasRenderingContext2D, items: Array<[string, string]>, x: number, y: number) {
  ctx.font = '12px system-ui, sans-serif';
  items.forEach(([label, color], i) => { ctx.fillStyle = color; ctx.fillRect(x + i * 94, y - 9, 12, 4); ctx.fillStyle = C.muted; ctx.fillText(label, x + 17 + i * 94, y); });
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, stroke = C.border, fill = '#fff') {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
}

function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>, w: number, h: number, draw: Draw) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, w, h); } catch { return; }
    canvas.style.width = '100%'; canvas.style.maxWidth = `${w}px`; canvas.style.height = 'auto';
    const render = () => { draw(ctx); canvas.classList.add('is-ready'); };
    const disconnect = observeCanvas(canvas, render, () => undefined);
    return disconnect;
  }, [canvasRef, w, h, draw]);
}

function canvasPoint(e: React.PointerEvent<HTMLCanvasElement>, w: number, h: number): Point {
  const r = e.currentTarget.getBoundingClientRect();
  return { x: (e.clientX - r.left) * w / r.width, y: (e.clientY - r.top) * h / r.height };
}

type SceneKind = 'hero-old' | 'hero-new' | 'analogy-1' | 'analogy-2' | 'analogy-3';

function drawSmallScene(ctx: CanvasRenderingContext2D, kind: SceneKind, phase: number) {
  clearClimbScene(ctx, 244, 130);
  drawWall(ctx, 8, 8, 228, 114);
  [[38,32],[73,83],[112,43],[155,92],[188,39],[215,75]].forEach(([x,y], i) => drawHold(ctx, x, y, 5 + i % 2, i % 2 ? '#8ba379' : C.wallDark));
  if (kind === 'hero-old') {
    ctx.save(); ctx.globalAlpha = .32; ctx.fillStyle = '#fff'; ctx.fillRect(8,8,228,114); ctx.restore();
    drawRope(ctx, [{x:74,y:105},{x:122 + Math.sin(phase*Math.PI*2)*8,y:63},{x:165,y:49}], C.red, true);
    drawClimber(ctx, 73, 83, {x:132 + Math.sin(phase*Math.PI*2)*6,y:57}, C.red);
    drawSceneLabel(ctx, '路线漂移', 142, 111, C.red);
    return;
  }
  if (kind === 'hero-new') {
    drawRope(ctx, [{x:72,y:105},{x:112,y:67},{x:153,y:52},{x:197,y:31}], C.blue);
    drawClimber(ctx, 72, 83, {x:112,y:48}, C.blue); drawTopHold(ctx, 197, 31, '稳固终点'); return;
  }
  if (kind === 'analogy-1') {
    const hand = {x: 132 - (1-phase)*22, y: 49 + (1-phase)*12};
    drawClimber(ctx, 80, 84, hand, C.blue); drawTopHold(ctx, 132, 49); drawRope(ctx,[{x:88,y:55},{x:132,y:49},{x:hand.x,y:hand.y}],C.blue); drawSceneLabel(ctx,'看清',104,25,C.blue); drawSceneLabel(ctx,'够到',151,54,C.green); return;
  }
  if (kind === 'analogy-2') {
    const tx = 183, ty = 82; ctx.fillStyle = '#f7b955'; ctx.fillRect(28,58,16,18); ctx.beginPath(); ctx.moveTo(44,67); ctx.lineTo(tx,ty-16); ctx.lineTo(tx,ty+16); ctx.closePath(); ctx.fillStyle='rgba(217,119,6,.18)'; ctx.fill(); drawTopHold(ctx,tx,ty); drawSceneLabel(ctx,'微小脚点',150,112,C.green); return;
  }
  drawClimber(ctx, 124, 78, {x:78,y:41}, C.blue); drawHold(ctx,78,41,7,C.blue,true); drawHold(ctx,177,104,7,C.purple,true); drawRope(ctx,[{x:124,y:50},{x:78,y:41}],C.blue); drawRope(ctx,[{x:124,y:90},{x:177,y:104}],C.purple); ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.strokeRect(66,25,124,94); drawSceneLabel(ctx,'视觉支点',23,22,C.blue); drawSceneLabel(ctx,'语言支点',161,22,C.purple);
}

const AnimatedScene: React.FC<{ kind: SceneKind; label: string }> = ({ kind, label }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas,244,130); } catch { return; }
    canvas.style.width='100%';canvas.style.maxWidth='244px';canvas.style.height='auto';
    let raf=0; let start=performance.now(); const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick=(now:number)=>{ const phase=reduced ? 0.72 : ((now-start)%3000)/3000; drawSmallScene(ctx,kind,phase); canvas.classList.add('is-ready'); if(!reduced) raf=requestAnimationFrame(tick); };
    const begin=()=>{ if(reduced){tick(performance.now());return;} if(!raf){start=performance.now();raf=requestAnimationFrame(tick);} };
    const stop=()=>{cancelAnimationFrame(raf);raf=0;}; const disconnect=observeCanvas(canvas,begin,stop);
    return()=>{stop();disconnect();};
  },[kind]);
  return <canvas ref={ref} width={244} height={130} role="img" aria-label={label}/>;
};

export const HeroOld: React.FC<WidgetProps> = () => <AnimatedScene kind="hero-old" label="通用视觉语言模型看见模糊攀岩墙，红色猜测路线偏离目标。"/>;
export const HeroNew: React.FC<WidgetProps> = () => <AnimatedScene kind="hero-new" label="HY-Embodied-0.5 看清岩点，以蓝色路线到达绿色稳固终点。"/>;
export const AnalogyOne: React.FC<WidgetProps> = () => <AnimatedScene kind="analogy-1" label="一个攀岩者先看清，再够到第一个岩点。"/>;
export const AnalogyTwo: React.FC<WidgetProps> = () => <AnimatedScene kind="analogy-2" label="一个头灯聚焦墙上的微小脚点。"/>;
export const AnalogyThree: React.FC<WidgetProps> = () => <AnimatedScene kind="analogy-3" label="同一个攀岩者分别使用手点和脚点保持平衡。"/>;

type StressPoint = { clarity: number; planning: number };
export const GapStress: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [stressPoint,setStressPoint]=useState<StressPoint>({clarity:35,planning:30});
  const ref=useRef<HTMLCanvasElement>(null); const dragging=useRef(false);
  const perception=stressPoint.clarity>=70, action=stressPoint.planning>=70;
  const status=!perception&&!action?'both':!perception?'perception':!action?'action':'closed';
  const feedback=status==='both'?'两道缺口同时存在：目标看偏了，动作也没有落到岩点。':status==='perception'?'计划走完了，但目标看偏：完整动作仍会落空。':status==='action'?'目标看清了，但行动链断开：知道位置仍不等于做到。':'两道条件都满足：感知结果已经接入完整行动链。';
  const draw=useCallback<Draw>((ctx)=>{
    clearClimbScene(ctx,720,300); panel(ctx,24,34,300,220); panel(ctx,354,24,342,238);
    ctx.strokeStyle=C.border;ctx.lineWidth=1;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(24+i*75,34);ctx.lineTo(24+i*75,254);ctx.stroke();ctx.beginPath();ctx.moveTo(24,34+i*55);ctx.lineTo(324,34+i*55);ctx.stroke();}
    const tx=24+300*.7,ty=254-220*.7;ctx.save();ctx.setLineDash([6,5]);ctx.strokeStyle=C.orange;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tx,34);ctx.lineTo(tx,254);ctx.moveTo(24,ty);ctx.lineTo(324,ty);ctx.stroke();ctx.restore();
    drawSceneLabel(ctx,'细节清晰度 →',205,278,C.muted);ctx.save();ctx.translate(17,183);ctx.rotate(-Math.PI/2);drawSceneLabel(ctx,'计划完整度 →',0,0,C.muted);ctx.restore();
    const px=24+stressPoint.clarity*3,py=254-stressPoint.planning*2.2;ctx.beginPath();ctx.arc(px,py,10,0,Math.PI*2);ctx.fillStyle=C.orange;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();
    drawWall(ctx,372,42,306,202); [[405,72],[454,141],[528,72],[618,110],[652,55]].forEach(([x,y])=>drawHold(ctx,x,y,7));
    const real={x:618,y:110}; const estimate={x:real.x-(100-stressPoint.clarity)*.65,y:real.y+(100-stressPoint.clarity)*.35}; drawTopHold(ctx,real.x,real.y,'目标');
    ctx.beginPath();ctx.arc(estimate.x,estimate.y,Math.max(5,(100-stressPoint.clarity)*.18),0,Math.PI*2);ctx.fillStyle='rgba(196,63,82,.18)';ctx.fill();ctx.strokeStyle=perception?C.green:C.red;ctx.lineWidth=3;ctx.stroke();
    const start={x:420,y:215}, end=action?estimate:{x:start.x+(estimate.x-start.x)*stressPoint.planning/100,y:start.y+(estimate.y-start.y)*stressPoint.planning/100};drawRope(ctx,[start,end],action?C.blue:C.red,!action);drawClimber(ctx,start.x,start.y-5,end,perception&&action?C.green:C.blue);
    ctx.fillStyle=status==='closed'?'#ecfdf5':status==='both'?'#fff1f2':'#fff7ed';ctx.fillRect(24,266,672,24);drawSceneLabel(ctx,status==='closed'?'闭环':'仍有缺口',620,283,status==='closed'?C.green:status==='both'?C.red:C.orange);
  },[stressPoint,status,perception,action]);
  useCanvas(ref,720,300,draw);
  const updateFromPointer=(e:React.PointerEvent<HTMLCanvasElement>)=>{const p=canvasPoint(e,720,300);const clarity=Math.round(clamp((p.x-24)/300*100,0,100)/5)*5;const planning=Math.round(clamp((254-p.y)/220*100,0,100)/5)*5;setStressPoint({clarity,planning});};
  return <div>
    <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={720} height={300} aria-label={`压力测试：清晰度 ${stressPoint.clarity}，计划完整度 ${stressPoint.planning}。${feedback}`} onPointerDown={e=>{dragging.current=true;e.currentTarget.setPointerCapture(e.pointerId);updateFromPointer(e);}} onPointerMove={e=>{if(dragging.current)updateFromPointer(e);}} onPointerUp={()=>{dragging.current=false;}}/>
    <div className="ctrl"><label>细节清晰度 <span className="val">{stressPoint.clarity}</span><input aria-valuetext={`细节清晰度 ${stressPoint.clarity}`} type="range" min={0} max={100} step={5} value={stressPoint.clarity} onChange={e=>setStressPoint(s=>({...s,clarity:+e.target.value}))}/></label></div>
    <div className="ctrl"><label>计划完整度 <span className="val">{stressPoint.planning}</span><input aria-valuetext={`计划完整度 ${stressPoint.planning}`} type="range" min={0} max={100} step={5} value={stressPoint.planning} onChange={e=>setStressPoint(s=>({...s,planning:+e.target.value}))}/></label></div>
    <div className={`feedback ${status==='closed'?'good':status==='both'?'bad':''}`} style={{color:status==='closed'?C.green:status==='both'?C.red:C.orange}} aria-live="polite">{feedback}</div>
  </div>;
};

type RobotTask='packing'|'stacking'|'mugHanging';
const rates:Record<RobotTask,{label:string;hy:number;pi0:number;pi05:number}>={packing:{label:'收纳',hy:85,pi0:80,pi05:85},stacking:{label:'堆叠',hy:80,pi0:60,pi05:85},mugHanging:{label:'挂杯',hy:75,pi0:45,pi05:50}};
export const GapRepair: React.FC<WidgetProps> = ({chapterId,moduleId})=>{
  const [repairStep,setRepairStep]=useState<0|1|2|3>(0); const [robotTask,setRobotTask]=useState<RobotTask>('packing'); const ref=useRef<HTMLCanvasElement>(null); const r=rates[robotTask];
  const stepFeedback=['先接通感知，再把判断送进行动链。','已看清细节；下一步要把感知变成预测、交互与规划。','行动计划已形成；最后让计划落到物理动作。','闭环已经接通，但真实任务仍需逐项验证，不能理解为保证成功。'][repairStep];
  const resultFeedback=robotTask==='packing'?'收纳：HY 85%，pi0 80%，pi0.5 85%。每个模型 20 次。':robotTask==='stacking'?'堆叠：HY 80%，pi0 60%，pi0.5 85%；此任务 HY 低于 pi0.5。':'挂杯：HY 75%，pi0 45%，pi0.5 50%。每个模型 20 次。';
  const draw=useCallback<Draw>((ctx)=>{clearClimbScene(ctx,720,310);panel(ctx,28,28,664,122);const nodes=[{x:118,label:'感知'},{x:360,label:'预测·交互·规划'},{x:602,label:'动作'}];
    nodes.slice(0,2).forEach((n,i)=>drawRope(ctx,[{x:n.x+58,y:89},{x:nodes[i+1].x-70,y:89}],repairStep>i+1?C.blue:C.border,repairStep<=i+1));
    nodes.forEach((n,i)=>{const done=repairStep>i,current=repairStep===i;panel(ctx,n.x-70,60,140,58,current?C.orange:done?C.green:C.border,done?'#ecfdf5':current?'#fff7ed':'#fff');drawSceneLabel(ctx,done?'✓ '+n.label:n.label,n.x-50,94,done?C.green:current?C.orange:C.muted);});
    panel(ctx,28,168,292,112);drawWall(ctx,42,181,264,86);drawClimber(ctx,85,235,{x:186,y:201},C.blue);drawTopHold(ctx,186,201);if(repairStep===3)drawRope(ctx,[{x:92,y:208},{x:186,y:201}],C.blue);
    panel(ctx,344,168,348,112);const vals=[['HY',r.hy,C.green],['pi0',r.pi0,C.muted],['pi0.5',r.pi05,C.purple]] as const;vals.forEach(([label,v,color],i)=>{const x=370+i*100;ctx.fillStyle=color;ctx.fillRect(x,258-v*.65,42,v*.65);drawSceneLabel(ctx,`${v}%`,x+6,250-v*.65,C.ink);drawSceneLabel(ctx,label,x+3,274,color);});drawSceneLabel(ctx,r.label,624,190,C.ink);
  },[repairStep,r]);useCanvas(ref,720,310,draw);
  const advance=(i:number)=>{if(repairStep===i)setRepairStep((i+1) as 1|2|3);};
  const activateCanvasNode=(e:React.PointerEvent<HTMLCanvasElement>)=>{const p=canvasPoint(e,720,310);if(p.y<60||p.y>118)return;const centers=[118,360,602];const i=centers.findIndex(x=>Math.abs(p.x-x)<=70);if(i>=0)advance(i);};
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={720} height={310} onPointerDown={activateCanvasNode} aria-label={`${stepFeedback}${repairStep===3?resultFeedback:''}`}/>
    <div style={buttonRow} aria-label="按顺序连接闭环">{['细粒度感知','预测·交互·规划','动作'].map((x,i)=><button type="button" key={x} style={repairStep===i?activeButton:buttonStyle} disabled={repairStep<i} title={repairStep<i?'请先完成上一步，闭环必须按感知→规划→动作连接。':''} onClick={()=>advance(i)}>{repairStep>i?'✓ ':''}{x}</button>)}</div>
    <div className={`feedback ${repairStep===3?'good':''}`} aria-live="polite">{stepFeedback}</div>
    <div style={buttonRow} role="group" aria-label="真实机器人任务">{(Object.keys(rates) as RobotTask[]).map(t=><button type="button" key={t} style={robotTask===t?activeButton:buttonStyle} disabled={repairStep<3} title={repairStep<3?'完成闭环后查看论文报告结果。':''} aria-pressed={robotTask===t} onClick={()=>setRobotTask(t)}>{rates[t].label}</button>)}<button type="button" style={buttonStyle} onClick={()=>setRepairStep(0)}>重置闭环</button></div>
    {repairStep===3&&<><div className="feedback" aria-live="polite">{resultFeedback}</div><table style={srTable}><caption>论文报告的真实机器人成功率</caption><thead><tr><th>任务</th><th>HY</th><th>pi0</th><th>pi0.5</th></tr></thead><tbody><tr><th>{r.label}</th><td>{r.hy}%</td><td>{r.pi0}%</td><td>{r.pi05}%</td></tr></tbody></table><p><small>三项任务；每模型每任务 20 次；初始物体位姿随机。</small></p></>}
  </div>;
};

type Preset='portrait'|'square'|'wide';type Inspect='compare'|'fixed'|'native';
const sizes:Record<Preset,{w:number;h:number;label:string}>={portrait:{w:448,h:896,label:'竖幅 448×896'},square:{w:672,h:672,label:'方形 672×672'},wide:{w:896,h:448,label:'横幅 896×448'}};
export const NativeResolution:React.FC<WidgetProps>=({chapterId,moduleId})=>{const [inputPreset,setInputPreset]=useState<Preset>('wide');const[holdDiameter,setHoldDiameter]=useState(12);const[inspectionMode,setInspectionMode]=useState<Inspect>('compare');const ref=useRef<HTMLCanvasElement>(null);const s=sizes[inputPreset];const fw=holdDiameter*224/s.w,fh=holdDiameter*224/s.h;
  const feedback=inspectionMode==='compare'?'同一输入同时通过两条示意管线；比较的是几何处理，不是论文实测准确率。':inspectionMode==='fixed'?'固定 224×224 示意会改变当前输入的几何；小脚点可能只剩很少采样像素。':'原生分辨率路径保留当前输入的宽高关系；这表示输入支持，不等于识别必然正确。';
  const draw=useCallback<Draw>((ctx)=>{clearClimbScene(ctx,760,340);const ps=[{x:20,label:'源图'},{x:270,label:'固定 224×224'},{x:520,label:'原生分辨率'}];ps.forEach((p,i)=>panel(ctx,p.x,42,220,240,i===1&&inspectionMode==='fixed'?C.red:i===2&&inspectionMode==='native'?C.green:C.border));
    drawSceneLabel(ctx,`源尺寸 ${s.w}×${s.h}`,35,66,C.ink);drawWall(ctx,40,78,180,180);drawTopHold(ctx,178,204);ctx.fillStyle='rgba(217,119,6,.16)';ctx.beginPath();ctx.moveTo(50,110);ctx.lineTo(178,190);ctx.lineTo(178,218);ctx.closePath();ctx.fill();
    drawWall(ctx,290,78,180,180);ctx.save();ctx.translate(382,176);ctx.scale(Math.max(.35,fw/6),Math.max(.35,fh/6));drawHold(ctx,0,0,7,C.red,false);ctx.restore();drawSceneLabel(ctx,`${fw.toFixed(1)}×${fh.toFixed(1)} px`,318,274,C.red);
    const ratio=s.w/s.h;const rw=ratio>=1?180:180*ratio,rh=ratio>=1?180/ratio:180;const rx=540+(180-rw)/2,ry=78+(180-rh)/2;drawWall(ctx,rx,ry,rw,rh);drawTopHold(ctx,rx+rw*.76,ry+rh*.7);drawSceneLabel(ctx,'保留宽高关系',566,274,C.green);drawLegend(ctx,[['固定形变风险',C.red],['原生几何',C.green]],270,315);
  },[s,fw,fh,inspectionMode]);useCanvas(ref,760,340,draw);
  const pointer=(e:React.PointerEvent<HTMLCanvasElement>)=>{const p=canvasPoint(e,760,340);if(p.y>=42&&p.y<=282){if(p.x>=270&&p.x<=490)setInspectionMode('fixed');if(p.x>=520&&p.x<=740)setInspectionMode('native');}};
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={760} height={340} onPointerDown={pointer} aria-label={`${feedback} 源图 ${s.w}×${s.h}，脚点 ${holdDiameter} 像素；固定缩放示意约 ${fw.toFixed(1)}×${fh.toFixed(1)} 像素。`}/>
    <p><strong>HY-ViT 2.0 · 400M · 蒸馏自更强内部 ViT</strong></p>
    <div style={buttonRow} role="group" aria-label="输入尺寸预设">{(Object.keys(sizes) as Preset[]).map(p=><button type="button" key={p} style={inputPreset===p?activeButton:buttonStyle} aria-pressed={inputPreset===p} onClick={()=>setInputPreset(p)}>{sizes[p].label}</button>)}</div>
    <div className="ctrl"><label>微小脚点大小 <span className="val">{holdDiameter} 源像素</span><input type="range" min={4} max={32} step={2} value={holdDiameter} aria-valuetext={`脚点直径 ${holdDiameter} 源像素`} onChange={e=>setHoldDiameter(+e.target.value)}/></label></div>
    <div style={buttonRow} role="group" aria-label="检查模式">{([['compare','同步比较'],['fixed','聚焦固定缩放'],['native','聚焦原生分辨率']] as [Inspect,string][]).map(([m,l])=><button type="button" key={m} style={inspectionMode===m?activeButton:buttonStyle} aria-pressed={inspectionMode===m} onClick={()=>setInspectionMode(m)}>{l}</button>)}</div>
    <div className={`feedback ${inspectionMode==='native'?'good':inspectionMode==='fixed'?'bad':''}`} aria-live="polite">{feedback}{holdDiameter<=8?' 当前脚点极小：任何视觉编码器都仍可能受噪声、遮挡与成像质量影响。':''}</div>
  </div>;
};

type Arch='shared'|'mot';type Token='v1'|'v2'|'v3'|'t1'|'t2'|'t3';const tokens:Token[]=['v1','v2','v3','t1','t2','t3'];
export const MotSplit:React.FC<WidgetProps>=({chapterId,moduleId})=>{const[architectureMode,setArchitectureMode]=useState<Arch>('mot');const[focusedToken,setFocusedToken]=useState<Token>('v2');const[showAttention,setShowAttention]=useState(true);const ref=useRef<HTMLCanvasElement>(null);const visual=focusedToken.startsWith('v');
  const feedback=architectureMode==='shared'?'对照示意：两种模态挤在同一套参数里；论文的 MoT-2B 用分支参数避免每次更新都完全共享。':visual?'视觉标记进入复制的视觉 QKV 与 FFN，并可查看整个视觉上下文。':'文本标记进入原有语言 QKV 与 FFN；生成仍遵守因果注意力。';
  const draw=useCallback<Draw>((ctx)=>{clearClimbScene(ctx,780,390);panel(ctx,24,28,732,62);tokens.forEach((t,i)=>{const x=54+i*112;panel(ctx,x,44,62,32,t===focusedToken?C.orange:t.startsWith('v')?C.blue:C.purple,t.startsWith('v')?'#eff6ff':'#f5f3ff');drawSceneLabel(ctx,t,x+22,65,t.startsWith('v')?C.blue:C.purple);});
    if(architectureMode==='mot'){panel(ctx,38,116,300,164,visual?C.orange:C.blue,'#eff6ff');panel(ctx,442,116,300,164,!visual?C.orange:C.purple,'#f5f3ff');drawSceneLabel(ctx,'视觉专用分支',56,140,C.blue);drawSceneLabel(ctx,'语言原有分支',460,140,C.purple);[['视觉 QKV',70,165],['视觉全注意力',156,165],['视觉 FFN',256,165]].forEach(([l,x,y])=>{panel(ctx,+x,+y,72,50,C.blue);drawSceneLabel(ctx,String(l),+x+5,+y+28,C.blue);});[['语言 QKV',474,165],['语言因果注意力',560,165],['语言 FFN',660,165]].forEach(([l,x,y])=>{panel(ctx,+x,+y,72,50,C.purple);drawSceneLabel(ctx,String(l),+x+4,+y+28,C.purple);});drawRope(ctx,[{x:54+(tokens.indexOf(focusedToken))*112+31,y:76},{x:visual?188:592,y:116}],visual?C.blue:C.purple);drawSceneLabel(ctx,'预训练：视觉下一代码预测',92,252,C.blue);drawSceneLabel(ctx,'2B 激活 / 4B 总参数',516,252,C.ink);
    }else{panel(ctx,210,116,360,164,C.red,'#fff1f2');drawSceneLabel(ctx,'共享 QKV → 共享计算 → 共享 FFN（对照示意）',242,194,C.red);tokens.forEach((t,i)=>drawRope(ctx,[{x:85+i*112,y:76},{x:390,y:116}],C.red,true));}
    panel(ctx,38,300,704,62);if(showAttention&&architectureMode==='mot'){const start=visual?58:450;for(let i=0;i<6;i++)for(let j=0;j<6;j++){const allowed=visual||j<=i;ctx.fillStyle=allowed?C.green:C.border;ctx.fillRect(start+j*14,318+i*6,10,4);}drawSceneLabel(ctx,visual?'视觉：全注意力':'语言：因果注意力',visual?162:552,342,visual?C.blue:C.purple);}else drawSceneLabel(ctx,architectureMode==='shared'?'共享参数仅作结构对照':'注意力细节已收起',286,337,C.muted);
  },[architectureMode,focusedToken,showAttention,visual]);useCanvas(ref,780,390,draw);
  const pointer=(e:React.PointerEvent<HTMLCanvasElement>)=>{const p=canvasPoint(e,780,390);if(p.y>=44&&p.y<=76){const i=Math.floor((p.x-54)/112);if(i>=0&&i<tokens.length)setFocusedToken(tokens[i]);}};
  const onKeys=(e:React.KeyboardEvent<HTMLDivElement>)=>{if(e.key.toLowerCase()==='a'&&!(e.target instanceof HTMLInputElement)&&architectureMode==='mot'){e.preventDefault();setShowAttention(x=>!x);}};
  return <div onKeyDown={onKeys}><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={780} height={390} onPointerDown={pointer} aria-label={`${feedback}${!showAttention?' 注意力细节已收起；标记路由不变。':''}`}/>
    <div style={buttonRow} role="group" aria-label="架构模式">{([['shared','共享参数示意'],['mot','MoT-2B']] as [Arch,string][]).map(([m,l])=><button type="button" key={m} style={architectureMode===m?activeButton:buttonStyle} aria-pressed={architectureMode===m} onClick={()=>setArchitectureMode(m)}>{l}</button>)}</div>
    <div style={buttonRow} role="group" aria-label="选择标记">{tokens.map(t=><button type="button" key={t} style={focusedToken===t?activeButton:buttonStyle} aria-pressed={focusedToken===t} onClick={()=>setFocusedToken(t)}>{t.startsWith('v')?'视觉':'文字'} {t.slice(1)}</button>)}</div>
    <button type="button" style={buttonStyle} disabled={architectureMode==='shared'} title={architectureMode==='shared'?'共享参数仅作结构对照；切回 MoT-2B 查看论文中的模态注意力规则。':''} aria-pressed={showAttention} onClick={()=>setShowAttention(x=>!x)}>{showAttention?'收起':'展开'}注意力细节（快捷键 A）</button>
    <div className={`feedback ${architectureMode==='mot'?'good':'bad'}`} aria-live="polite">{feedback}{!showAttention&&architectureMode==='mot'?' 注意力细节已收起；标记路由不变。':''}</div>
    <p><small>规则只适用于 MoT-2B：<strong>2B 激活参数 / 4B 总参数</strong>。视觉全注意力，语言因果注意力；实际输入是交错多模态序列。</small></p>
  </div>;
};
