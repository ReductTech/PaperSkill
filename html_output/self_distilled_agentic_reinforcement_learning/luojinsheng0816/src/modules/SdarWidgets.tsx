import React, { useEffect, useMemo, useRef, useState } from 'react';

type Props = { chapterId: string; moduleId: string };
type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const C = {
  red: '#c43f52', green: '#228d5c', blue: '#27446e', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#6f7c72', line: '#8a9488',
  bg: '#fbfcf8', pale: '#eef3e9', white: '#ffffff',
};

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 10) {
  const q = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + q, y); ctx.arcTo(x + w, y, x + w, y + h, q);
  ctx.arcTo(x + w, y + h, x, y + h, q); ctx.arcTo(x, y + h, x, y, q);
  ctx.arcTo(x, y, x + w, y, q); ctx.closePath();
}
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = C.white, stroke = '#d9e1d5', r = 10) {
  rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
}
function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = C.ink, size = 14, align: CanvasTextAlign = 'left', weight = 500) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px system-ui, sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
}
function line(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.line, width = 1.5, dash: number[] = []) {
  ctx.beginPath(); ctx.setLineDash(dash); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); ctx.setLineDash([]);
}
function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke = C.white) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
}
function note(ctx: CanvasRenderingContext2D, x: number, y: number, color = C.blue, scale = 1) {
  ctx.save(); ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, 7 * scale, 5 * scale, -0.35, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x + 5 * scale, y - 22 * scale, 2.5 * scale, 22 * scale); ctx.restore();
}
function piano(ctx: CanvasRenderingContext2D, x: number, y: number, count = 8, keyW = 24, keyH = 42) {
  for (let i = 0; i < count; i++) { box(ctx, x + i * keyW, y, keyW, keyH, '#fff', '#b8c3b8', 2); }
  [0, 1, 3, 4, 5].forEach((i) => { if (i < count - 1) { ctx.fillStyle = C.ink; ctx.fillRect(x + (i + .72) * keyW, y, keyW * .55, keyH * .58); } });
}
function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.blue, width = 2) {
  line(ctx, x1, y1, x2, y2, color, width); const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 8 * Math.cos(a - .45), y2 - 8 * Math.sin(a - .45));
  ctx.lineTo(x2 - 8 * Math.cos(a + .45), y2 - 8 * Math.sin(a + .45)); ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

function useCanvas(draw: Draw, deps: React.DependencyList, w = 760, h = 300) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return; const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = '100%'; cv.style.maxWidth = `${w}px`; cv.style.height = 'auto';
    const ctx = cv.getContext('2d'); if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h); draw(ctx, w, h); cv.classList.add('is-ready');
  }, deps); return ref;
}
function Canvas({ draw, deps, w = 760, h = 300, label }: { draw: Draw; deps: React.DependencyList; w?: number; h?: number; label: string }) {
  const ref = useCanvas(draw, deps, w, h); return <canvas className="sdar-canvas" ref={ref} width={w} height={h} role="img" aria-label={label} />;
}
function Feedback({ tone = 'info', children }: { tone?: 'info' | 'good' | 'bad'; children: React.ReactNode }) {
  return <div className={`feedback ${tone === 'good' ? 'good' : tone === 'bad' ? 'bad' : ''}`}>{children}</div>;
}
function Chips<T extends string | number>({ values, value, onChange, label, format = String }: { values: readonly T[]; value: T; onChange: (v: T) => void; label: string; format?: (v: T) => string }) {
  return <div className="sdar-control-group" role="group" aria-label={label}><span className="sdar-control-label">{label}</span><div className="sdar-chips">{values.map(v => <button key={String(v)} className={v === value ? 'is-active' : ''} onClick={() => onChange(v)} aria-pressed={v === value}>{format(v)}</button>)}</div></div>;
}
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function AnimatedScene({ scene }: { scene: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return; const dpr = window.devicePixelRatio || 1; const W = 244, H = 130;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = `${W}px`; cv.style.height = `${H}px`;
    const ctx = cv.getContext('2d'); if (!ctx) return; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0; const t0 = performance.now(); const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = (now: number) => { const p = reduce ? .65 : ((now - t0) % 2600) / 2600; ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); box(ctx, 5, 5, W - 10, H - 10, C.bg, '#d7dfd3', 12);
      if (scene === 1) { piano(ctx, 20, 68, 7, 26, 38); const x = 32 + p * 150; dot(ctx, x, 49 - Math.sin(p * Math.PI * 6) * 7, 7, C.blue); box(ctx, 209, 34, 20, 42, '#eef1ed'); dot(ctx, 219, 54, 6, p > .88 ? C.green : '#bdc7bd'); text(ctx, '终场', 219, 92, C.muted, 11, 'center'); }
      if (scene === 2) { piano(ctx, 57, 70, 5, 25, 38); const y = 52 + Math.sin(p * Math.PI) * 14; dot(ctx, 119, y, 8, C.blue); note(ctx, 119, 38, C.purple, .8); text(ctx, '批注', 119, 20, C.purple, 11, 'center'); }
      if (scene === 3) { box(ctx, 35, 70, 70, 34, '#fff5f5', '#e5b4bd'); box(ctx, 139, 70, 70, 34, '#eff8f2', '#add2bc'); text(ctx, '盲从', 70, 87, C.red, 12, 'center'); text(ctx, '选择', 174, 87, C.green, 12, 'center'); dot(ctx, 70 + (p > .5 ? 104 : 0), 45 + Math.sin(p * Math.PI) * 10, 8, C.blue); }
      if (scene === 4) { line(ctx, 35, 42, 205, 42, C.orange, 3); line(ctx, 35, 86, 205, 86, C.purple, 3); const y = 42 + 44 * (.5 + .5 * Math.sin(p * Math.PI * 2)); note(ctx, 120, y, C.orange, .75); box(ctx, 104, 54, 32, 20, '#fff', '#cbd4ca', 6); text(ctx, 'Δ', 120, 64, C.blue, 13, 'center', 700); }
      if (scene === 5) { const a = -2.3 + p * 4.6; ctx.beginPath(); ctx.arc(78, 66, 25, 0, Math.PI * 2); ctx.fillStyle = '#f2edf9'; ctx.fill(); ctx.strokeStyle = C.purple; ctx.stroke(); line(ctx, 78, 66, 78 + Math.cos(a) * 19, 66 + Math.sin(a) * 19, C.purple, 4); note(ctx, 170, 67, C.green); arrow(ctx, 108, 66, 151, 66, C.green); text(ctx, '信任门', 78, 105, C.purple, 11, 'center'); }
      if (scene === 6) { const pts = [[40,35],[115,24],[199,43],[184,98],[85,102]]; pts.forEach((q,i)=>{dot(ctx,q[0],q[1],11,i===4?C.green:'#dfe6dc','#fff'); text(ctx,String(i+1),q[0],q[1],i===4?'#fff':C.blue,10,'center',700)}); for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length]; line(ctx,a[0],a[1],b[0],b[1],'#aeb9ad',1.5)} const seg=Math.floor(p*5)%5, u=(p*5)%1, a=pts[seg] || pts[0], b=pts[(seg+1)%5] || pts[1]; dot(ctx,a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,6,C.blue); }
      if (scene === 7) { line(ctx, 40, 82, 204, 82, '#b8c2b7', 4); [40,122,204].forEach((x,i)=>dot(ctx,x,82,7,i===1?C.green:'#d5ddd3')); const x=40+p*164; dot(ctx,x,57,10,C.orange); arrow(ctx,x,67,Math.min(204,Math.max(40,x)),76,C.orange); text(ctx,'弱',40,106,C.muted,11,'center'); text(ctx,'平衡',122,106,C.green,11,'center'); text(ctx,'强',204,106,C.muted,11,'center'); }
      if (scene === 8) { const pts=[[50,40],[190,40],[190,94],[50,94]]; pts.forEach(q=>dot(ctx,q[0],q[1],9,'#e4eae1')); for(let i=0;i<4;i++){const a=pts[i],b=pts[(i+1)%4];arrow(ctx,a[0],a[1],b[0],b[1],'#aeb8ad',1.3)} const seg=Math.floor(p*4)%4,u=(p*4)%1,a=pts[seg] || pts[0],b=pts[(seg+1)%4] || pts[1];dot(ctx,a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,6,C.blue); text(ctx,'闭合 Agent Loop',120,66,C.blue,12,'center',700); }
      if (scene === 9) { piano(ctx, 142, 72, 3, 25, 35); const x=35+p*80; box(ctx,x,37,54,37,'#f4effb','#bea8df',7); text(ctx,'提示谱',x+27,55,C.purple,11,'center'); arrow(ctx,x+54,56,151,64,C.green); dot(ctx,189,33,8,C.green); text(ctx,'gate',189,17,C.green,10,'center'); }
      if (scene === 10) { line(ctx,38,105,210,105,'#aeb8ad'); const h=25+p*55; ctx.fillStyle=C.green; ctx.fillRect(100,105-h,45,h); line(ctx,60,38,190,38,C.blue,1.5,[4,4]); text(ctx,'SDAR',122,116,C.green,11,'center'); }
      raf = requestAnimationFrame(frame); };
    cv.classList.add('is-ready');
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, [scene]); return <canvas className="analogy-canvas" ref={ref} width={244} height={130} role="img" aria-label={`第${scene}章钢琴排练类比动画`} />;
}

export const HeroOld: React.FC<Props> = () => <Canvas w={410} h={150} label="传统方法：终场反馈很晚且教师提示被均匀使用" deps={[]} draw={(ctx,w,h)=>{piano(ctx,28,77,7,34,45); for(let i=0;i<7;i++) note(ctx,45+i*34,55,i>2?C.red:C.blue,.65); arrow(ctx,270,66,354,66,C.red); box(ctx,354,42,38,48,'#fff1f3','#e1a8b3',8); text(ctx,'晚',373,66,C.red,18,'center',800);}} />;
export const HeroNew: React.FC<Props> = () => <Canvas w={410} h={150} label="SDAR：每个音符通过 gap gate 获得选择性权重" deps={[]} draw={(ctx)=>{piano(ctx,28,77,7,34,45); const gs=[.94,.12,.82,.25,.77,.91,.2]; gs.forEach((g,i)=>{note(ctx,45+i*34,55,g>.5?C.green:'#aeb9ad',.65); text(ctx,g.toFixed(2),45+i*34,25,g>.5?C.green:C.muted,10,'center')}); arrow(ctx,275,66,350,66,C.green); box(ctx,350,42,43,48,'#eff8f2','#add2bc',8); text(ctx,'门',372,66,C.green,18,'center',800);}} />;
export const Ana1: React.FC<Props> = () => <AnimatedScene scene={1}/>; export const Ana2: React.FC<Props> = () => <AnimatedScene scene={2}/>;
export const Ana3: React.FC<Props> = () => <AnimatedScene scene={3}/>; export const Ana4: React.FC<Props> = () => <AnimatedScene scene={4}/>;
export const Ana5: React.FC<Props> = () => <AnimatedScene scene={5}/>; export const Ana6: React.FC<Props> = () => <AnimatedScene scene={6}/>;
export const Ana7: React.FC<Props> = () => <AnimatedScene scene={7}/>; export const Ana8: React.FC<Props> = () => <AnimatedScene scene={8}/>;
export const Ana9: React.FC<Props> = () => <AnimatedScene scene={9}/>; export const Ana10: React.FC<Props> = () => <AnimatedScene scene={10}/>;

export const SparseRewardLab: React.FC<Props> = () => {
  const [turns,setTurns]=useState(5); const [drift,setDrift]=useState(3); const safe=Math.min(drift,turns); const gap=turns-safe;
  const draw=useMemo<Draw>(()=>(ctx,w)=>{text(ctx,'轨迹音符',28,30,C.blue,14,'left',700); const x0=52,y=118,dx=(w-140)/Math.max(1,turns-1); for(let i=1;i<=turns;i++){const x=x0+(i-1)*dx; line(ctx,x,y+18,x,y+45,'#c9d2c7'); note(ctx,x,y,i>=safe?C.red:C.blue,.8); text(ctx,String(i),x,y+54,C.muted,11,'center');} line(ctx,x0,y+72,w-85,y+72,C.line,2); dot(ctx,x0+(safe-1)*dx,y+72,7,C.red); box(ctx,w-68,89,44,65,gap>0?'#fff1f3':'#eff8f2',gap>0?'#e0a7b2':'#add2bc',8); text(ctx,'终场',w-46,107,C.muted,11,'center'); text(ctx,gap>0?'失败':'成功',w-46,135,gap>0?C.red:C.green,13,'center',800); arrow(ctx,x0+(safe-1)*dx,y+72,w-82,y+72,gap>0?C.red:C.green); text(ctx,`反馈延迟 ${gap} 步`,(x0+w-82)/2,y+92,gap>0?C.red:C.green,13,'center',700);},[turns,safe,gap]);
  return <div><Canvas draw={draw} deps={[draw]} label="多轮轨迹中首次偏离与终场奖励的间隔"/><div className="sdar-controls"><label>总轮数 <b>{turns}</b><input type="range" min="2" max="8" value={turns} onChange={e=>{const v=+e.target.value;setTurns(v);if(drift>v)setDrift(v)}}/></label><label>首次偏离 <b>第 {safe} 步</b><input type="range" min="1" max={turns} value={safe} onChange={e=>setDrift(+e.target.value)}/></label></div><Feedback tone={gap>=3?'bad':'info'}>第 {safe} 拍开始偏离，但直到第 {turns} 拍才收到终场信号，相隔 <b>{gap}</b> 步。</Feedback></div>;
};

export const DriftCompare: React.FC<Props> = () => {
  const [mode,setMode]=useState<'单轮'|'四轮'>('四轮'); const [injected,setInjected]=useState(false); const n=mode==='四轮'?8:4;
  const draw=useMemo<Draw>(()=>(ctx,w)=>{text(ctx,'均匀蒸馏',w*.25,28,C.red,14,'center',800);text(ctx,'SDAR 选择性信任',w*.75,28,C.green,14,'center',800);line(ctx,w/2,46,w/2,260,'#d4ddd2');for(let side=0;side<2;side++){const x0=50+side*w/2,y=110,dx=(w/2-95)/(n-1);for(let i=0;i<n;i++){const bad=injected&&i>=2;const col=side===0?(bad?C.red:C.blue):(bad&&i===2?C.orange:i>2?C.green:C.blue);note(ctx,x0+i*dx,y+(side===0&&bad?(i-1)*7:0),col,.72);if(side===1&&bad){text(ctx,i===2?'g↓':'恢复',x0+i*dx,y+42,i===2?C.orange:C.green,10,'center')}} if(injected)arrow(ctx,x0+dx*1,y-35,x0+dx*2,y-12,C.red)}text(ctx,'同一次偏差',w/2,278,C.muted,12,'center');},[mode,injected,n]);
  return <div><Canvas draw={draw} deps={[draw]} label="均匀蒸馏与 SDAR 在多轮偏离后的机制对照"/><div className="sdar-controls"><Chips values={['单轮','四轮'] as const} value={mode} onChange={setMode} label="观察范围"/><button className="sdar-action" onClick={()=>setInjected(v=>!v)}>{injected?'清除偏差':'注入一次偏差'}</button></div><Feedback tone={injected?'good':'info'}>{injected?'左侧继续追随已偏离的支持轨迹；右侧把低可信 token 的辅助权重压低。':'点击“注入一次偏差”开始同步对照。'} <span className="sdar-note">机制示意，不是论文曲线复刻。</span></Feedback></div>;
};

const demoTokens=['搜索','打开','检查','提交']; const ps=[.42,.61,.35,.72], pt=[.68,.48,.59,.76];
export const ContextSwitcher: React.FC<Props> = () => {
  const [idx,setIdx]=useState(0); const [view,setView]=useState<'学生上下文'|'教师上下文'|'并排比较'>('并排比较');
  const draw=useMemo<Draw>(()=>(ctx,w)=>{const panels=view==='并排比较'?2:1;for(let k=0;k<panels;k++){const teacher=view==='教师上下文'||(view==='并排比较'&&k===1);const x=panels===2?24+k*(w/2):w/4;const pw=panels===2?w/2-36:w/2;box(ctx,x,38,pw,190,teacher?'#f8f3ff':'#f3f6fb',teacher?'#bea8df':'#b5c1d2',12);text(ctx,teacher?'教师谱 sₜ⁺':'学生谱 sₜ',x+18,66,teacher?C.purple:C.blue,15,'left',800);text(ctx,teacher?'x + c⁺ + y<ₜ':'x + y<ₜ',x+18,98,teacher?C.purple:C.blue,13);if(teacher){box(ctx,x+18,116,pw-36,28,'#efe7fa','#ccb9e8',7);text(ctx,'训练期特权批注 c⁺',x+pw/2,130,C.purple,12,'center')}const prob=teacher?pt[idx]:ps[idx];text(ctx,`P(${demoTokens[idx]}) = ${prob.toFixed(2)}`,x+18,170,C.ink,14);ctx.fillStyle='#dbe3d8';ctx.fillRect(x+18,190,pw-36,14);ctx.fillStyle=teacher?C.purple:C.orange;ctx.fillRect(x+18,190,(pw-36)*prob,14)}box(ctx,w/2-92,244,184,34,'#fff','#bfc9bd',8);text(ctx,`锁定同一 token：${demoTokens[idx]}`,w/2,261,C.green,13,'center',800);},[idx,view]);
  return <div><Canvas draw={draw} deps={[draw]} label="学生上下文与带特权信息的教师上下文比较"/><div className="sdar-controls"><Chips values={demoTokens} value={demoTokens[idx]} onChange={v=>setIdx(demoTokens.indexOf(v))} label="学生采样 token"/><Chips values={['学生上下文','教师上下文','并排比较'] as const} value={view} onChange={setView} label="查看方式"/></div><Feedback tone="good">比较对象始终是同一个“{demoTokens[idx]}”；变化只来自教师额外看到的 <b>c⁺</b>。</Feedback></div>;
};

const scenarios={好提示:[.8,.5,.4,.7,.3,.6],坏提示:[.7,-.9,-.5,.2,-.8,.1],漂移后提示:[.4,.1,-.4,-.7,-1,-.6]} as const;
export const TrustComparison: React.FC<Props> = () => {
  const [scenario,setScenario]=useState<keyof typeof scenarios>('坏提示');const [mode,setMode]=useState<'均匀蒸馏'|'SDAR 选择性信任'>('均匀蒸馏');const vals=scenarios[scenario];const gates=vals.map(d=>mode==='均匀蒸馏'?.5:sigmoid(5*d));
  const draw=useMemo<Draw>(()=>(ctx,w)=>{text(ctx,scenario,28,28,C.blue,14,'left',800);const dx=(w-110)/5;vals.forEach((d,i)=>{const x=55+i*dx;note(ctx,x,92,d>=0?C.green:C.red,.78);text(ctx,`Δ ${d>0?'+':''}${d.toFixed(1)}`,x,126,d>=0?C.green:C.red,11,'center');ctx.fillStyle='#dfe5dc';ctx.fillRect(x-10,160,20,82);const gh=82*gates[i];ctx.fillStyle=gates[i]>.65?C.green:gates[i]>.35?C.blue:'#aeb8ad';ctx.fillRect(x-10,242-gh,20,gh);text(ctx,gates[i].toFixed(2),x,260,gates[i]>.65?C.green:C.muted,11,'center');});text(ctx,'token gate',28,208,C.muted,12);},[scenario,mode,gates,vals]);
  const risky=mode==='均匀蒸馏'&&vals.some(v=>v<0);return <div><Canvas draw={draw} deps={[draw]} label="不同提示场景下均匀蒸馏与 token 选择性信任对照"/><div className="sdar-controls"><Chips values={Object.keys(scenarios) as (keyof typeof scenarios)[]} value={scenario} onChange={setScenario} label="提示场景"/><Chips values={['均匀蒸馏','SDAR 选择性信任'] as const} value={mode} onChange={setMode} label="信任方式"/></div><Feedback tone={risky?'bad':'good'}>{risky?'负 gap token 仍被赋予同样权重，坏提示可能继续放大。':'低可信提示被软衰减，高可信提示仍保留。'} 负 gap 不是“必错”标签。</Feedback></div>;
};

export const GapRuler: React.FC<Props> = () => {
  const [s,setS]=useState(.35),[t,setT]=useState(.70);const d=Math.log(t)-Math.log(s),g=sigmoid(5*d);
  const draw=useMemo<Draw>(()=>(ctx,w)=>{const x0=80,x1=w-55,len=x1-x0;const axis=(y:number,p:number,col:string,label:string)=>{line(ctx,x0,y,x1,y,'#aeb8ad',3);[0,.25,.5,.75,1].forEach(v=>{line(ctx,x0+v*len,y-5,x0+v*len,y+5,'#aeb8ad');text(ctx,v.toFixed(2),x0+v*len,y+22,C.muted,10,'center')});dot(ctx,x0+p*len,y,10,col);text(ctx,`${label} p=${p.toFixed(2)}  ln p=${Math.log(p).toFixed(2)}`,x0,y-28,col,13,'left',700)};axis(83,s,C.orange,'学生');axis(166,t,C.purple,'教师');line(ctx,x0,245,x1,245,'#aeb8ad',3);const pos=Math.max(0,Math.min(1,(d+3)/6));dot(ctx,x0+pos*len,245,11,d>.05?C.green:d<-.05?C.red:C.blue);text(ctx,`Δ = ${d.toFixed(2)}`,w/2,220,d>.05?C.green:d<-.05?C.red:C.blue,18,'center',800);text(ctx,`β=5 时 gate ≈ ${g.toFixed(2)}`,w/2,280,C.green,13,'center',700);},[s,t,d,g]);
  const tone=d>.05?'good':d<-.05?'bad':'info';return <div><Canvas draw={draw} deps={[draw]} label="学生与教师概率点及其 log probability gap 标尺"/><div className="sdar-controls"><label>学生概率 <b>{s.toFixed(2)}</b><input type="range" min="5" max="95" value={Math.round(s*100)} onChange={e=>setS(+e.target.value/100)}/></label><label>教师概率 <b>{t.toFixed(2)}</b><input type="range" min="5" max="95" value={Math.round(t*100)} onChange={e=>setT(+e.target.value/100)}/></label></div><Feedback tone={tone}>{d>.05?'教师更支持当前 token。':d<-.05?'教师支持更低，辅助蒸馏应更谨慎。':'两侧支持接近持平。'} 概率限制在 0.05–0.95，避免 log 取到无穷。</Feedback></div>;
};

const gateTokens = [
  { token: '搜索', ps: 0.30, pt: 0.72, note: 'Teacher 明显更支持正确的信息收集动作' },
  { token: '杯子', ps: 0.68, pt: 0.78, note: '两侧都较支持，Gate 保留温和增益' },
  { token: '清洗', ps: 0.52, pt: 0.26, note: 'Teacher 支持更低，应谨慎使用辅助指导' },
  { token: '放入', ps: 0.42, pt: 0.66, note: 'Teacher 对这一步给出更强 endorsement' },
  { token: '冰箱', ps: 0.71, pt: 0.46, note: '负 Gap 只表示 Teacher 更不支持，并非判定 token 错误' },
  { token: '完成', ps: 0.60, pt: 0.82, note: '任务收尾动作获得较高蒸馏权重' },
] as const;

export const SigmoidGate: React.FC<Props> = () => {
  const [beta, setBeta] = useState<0 | 1 | 5 | 10>(5);
  const [idx, setIdx] = useState(2);
  const [playing, setPlaying] = useState(false);
  const current = gateTokens[idx];
  const d = Math.log(current.pt) - Math.log(current.ps);
  const g = sigmoid(beta * d);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setIdx((value) => (value + 1) % gateTokens.length), 1000);
    return () => clearInterval(id);
  }, [playing]);

  const draw = useMemo<Draw>(() => (ctx, w, h) => {
    const x0 = 72, x1 = w - 42, y0 = h - 48, y1 = 48;
    line(ctx, x0, y0, x1, y0, C.line);
    line(ctx, x0, y0, x0, y1, C.line);
    ctx.beginPath();
    for (let i = 0; i <= 220; i++) {
      const xv = -1.4 + 2.8 * i / 220;
      const gv = sigmoid(beta * xv);
      const x = x0 + (xv + 1.4) / 2.8 * (x1 - x0);
      const y = y0 - gv * (y0 - y1);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.stroke();
    [-1, -.5, 0, .5, 1].forEach((value) => text(ctx, String(value), x0 + (value + 1.4) / 2.8 * (x1 - x0), y0 + 20, C.muted, 10, 'center'));
    [0, .5, 1].forEach((value) => text(ctx, value.toFixed(1), x0 - 20, y0 - value * (y0 - y1), C.muted, 10, 'center'));
    const boundedD = Math.max(-1.4, Math.min(1.4, d));
    const x = x0 + (boundedD + 1.4) / 2.8 * (x1 - x0);
    const y = y0 - g * (y0 - y1);
    line(ctx, x, y, x, y0, C.orange, 1.5, [4, 4]);
    line(ctx, x0, y, x, y, C.green, 1.5, [4, 4]);
    dot(ctx, x, y, 11, d >= 0 ? C.green : C.red);
    text(ctx, `“${current.token}”  Δₜ=${d >= 0 ? '+' : ''}${d.toFixed(2)}  →  gₜ=${g.toFixed(2)}`, w / 2, 22, d > .05 ? C.green : d < -.05 ? C.red : C.blue, 16, 'center', 800);
    text(ctx, 'Teacher 更不支持', x0 + 70, h - 18, C.red, 11, 'center');
    text(ctx, 'Teacher 更支持', x1 - 70, h - 18, C.green, 11, 'center');
  }, [beta, d, g, current.token]);

  const tone = d > .05 ? 'good' : d < -.05 ? 'bad' : 'info';
  return <div>
    <div className="sdar-demo-label">王牌交互 · Token 级信任控制台</div>
    <Canvas draw={draw} deps={[draw]} label="逐 token 查看 Teacher Student gap 与 sigmoid gate" />
    <div className="sdar-token-strip" role="group" aria-label="选择轨迹 token">
      {gateTokens.map((item, tokenIndex) => {
        const tokenD = Math.log(item.pt) - Math.log(item.ps);
        const tokenG = sigmoid(beta * tokenD);
        return <button key={item.token} className={tokenIndex === idx ? 'is-active' : ''} onClick={() => { setIdx(tokenIndex); setPlaying(false); }}>
          <b>{item.token}</b><span style={{ height: `${Math.max(8, tokenG * 46)}px` }} /><small>g {tokenG.toFixed(2)}</small>
        </button>;
      })}
    </div>
    <div className="sdar-controls">
      <Chips values={[0, 1, 5, 10] as const} value={beta} onChange={setBeta} label="β：Gate 锐度" />
      <button className="sdar-action" onClick={() => setPlaying((value) => !value)}>{playing ? '暂停逐 token 演示' : '播放整条轨迹'}</button>
    </div>
    <div className="sdar-gate-readout">
      <div><span>Student probability</span><b>{current.ps.toFixed(2)}</b><i style={{ width: `${current.ps * 100}%` }} /></div>
      <div><span>Teacher probability</span><b>{current.pt.toFixed(2)}</b><i style={{ width: `${current.pt * 100}%` }} /></div>
      <div className={d >= 0 ? 'positive' : 'negative'}><span>Δₜ = log pT − log pS</span><b>{d >= 0 ? '+' : ''}{d.toFixed(3)}</b></div>
      <div className="gate"><span>gₜ = σ(βΔₜ)</span><b>{g.toFixed(3)}</b></div>
    </div>
    <div className="sdar-distill-compare">
      <div><b>Naive OPSD</b><span>每个 token 都按同一强度接受辅助监督</span><strong>统一权重</strong></div>
      <div className="is-sdar"><b>SDAR</b><span>{current.note}</span><strong>当前权重 × {g.toFixed(2)}</strong></div>
    </div>
    <Feedback tone={tone}>{d > .05 ? '正 Gap：Teacher 更支持，辅助蒸馏增强。' : d < -.05 ? '负 Gap：Teacher 支持更低，SDAR 衰减该指导；不代表 token 一定错误。' : 'Gap 接近 0：保留中等权重。'} <span className="sdar-note">教学示意数值，并非论文实验结果。论文默认 β=5。</span></Feedback>
  </div>;
};

const loopSteps=[
  ['学生 rollout','学生策略与环境交互，采样一条完整轨迹。'],
  ['轨迹奖励','环境 / verifier 对整条轨迹给 reward，并形成 GRPO advantage。'],
  ['教师评分','对同一个学生 token，在额外 Skill 上下文下计算 log πT。'],
  ['Gap 与 Gate','计算 Δₜ = log πT − log πθ，再得到 stop-gradient gₜ。'],
  ['联合更新','用 LGRPO + λLSDAR 更新学生策略。'],
];

function routedArrow(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
  width = 2,
) {
  for (let i = 0; i < points.length - 2; i++) {
    line(ctx, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], color, width);
  }
  const from = points[points.length - 2];
  const to = points[points.length - 1];
  arrow(ctx, from[0], from[1], to[0], to[1], color, width);
}

export const TrainingLoop: React.FC<Props> = () => {
  const [step,setStep]=useState(0),[auto,setAuto]=useState(false);
  useEffect(()=>{
    if(!auto)return;
    const id=setInterval(()=>setStep(v=>(v+1)%5),1100);
    return()=>clearInterval(id);
  },[auto]);

  const draw=useMemo<Draw>(()=>(ctx)=>{
    const nodes = [
      { x: 38,  y: 120, w: 148, h: 64, title: '学生 rollout', sub: '采样完整轨迹', color: C.blue },
      { x: 250, y: 48,  w: 160, h: 64, title: '轨迹奖励', sub: 'reward → GRPO', color: C.blue },
      { x: 230, y: 220, w: 180, h: 64, title: '教师评分', sub: '同一 yₜ + Skill', color: C.purple },
      { x: 470, y: 220, w: 150, h: 64, title: 'Gap Gate', sub: 'Δₜ → gₜ', color: C.orange },
      { x: 565, y: 115, w: 160, h: 76, title: '联合更新', sub: 'LGRPO + λLSDAR', color: C.green },
    ];
    const linkColor=(ready:number,color:string)=>step>=ready?color:'#c2cbc1';

    text(ctx,'RL 主路 · 轨迹级信号',330,27,C.blue,12,'center',800);
    text(ctx,'SDAR 侧路 · token 级信号',425,207,C.purple,12,'center',800);

    routedArrow(ctx,[[186,140],[218,140],[218,80],[250,80]],linkColor(1,C.blue),2.2);
    routedArrow(ctx,[[112,184],[112,252],[230,252]],linkColor(2,C.purple),2.2);
    routedArrow(ctx,[[410,80],[505,80],[505,139],[565,139]],linkColor(4,C.blue),2.2);
    routedArrow(ctx,[[410,252],[470,252]],linkColor(3,C.purple),2.2);
    routedArrow(ctx,[[545,220],[545,168],[565,168]],linkColor(4,C.orange),2.2);

    dot(ctx,218,140,5,step>=2?C.purple:'#c2cbc1');
    dot(ctx,545,168,5,step>=4?C.green:'#c2cbc1');

    nodes.forEach((node,i)=>{
      const active=i===step;
      const done=i<step;
      const fill=active?'#edf3f9':done?'#eff8f2':'#ffffff';
      const stroke=active?node.color:done?C.green:'#cdd6ca';
      const labelColor=active?node.color:done?C.green:C.muted;
      box(ctx,node.x,node.y,node.w,node.h,fill,stroke,11);
      text(ctx,String(i+1)+'. '+node.title,node.x+node.w/2,node.y+23,labelColor,13,'center',800);
      text(ctx,node.sub,node.x+node.w/2,node.y+45,active?C.ink:C.muted,11,'center',600);
    });

    text(ctx,'两条信号只在更新处汇合',645,207,C.green,11,'center',700);
  },[step]);

  return <div>
    <Canvas draw={draw} deps={[draw]} h={320} label="学生 rollout 分成 GRPO 主路与 SDAR token 侧路，并在联合更新处汇合"/>
    <div className="sdar-controls sdar-step-controls">
      <button onClick={()=>setStep(v=>Math.max(0,v-1))} disabled={step===0}>上一步</button>
      <span>第 {step+1}/5 步</span>
      <button onClick={()=>setStep(v=>Math.min(4,v+1))} disabled={step===4}>下一步</button>
      <button className="sdar-action" onClick={()=>setAuto(v=>!v)}>{auto?'暂停':'自动播放'}</button>
      <button onClick={()=>{setStep(0);setAuto(false)}}>重置</button>
    </div>
    <Feedback tone={step===4?'good':'info'}>
      <b>{loopSteps[step][0]}：</b>{loopSteps[step][1]}
      {step===4?' 轨迹奖励负责方向，Token Gate 负责分辨率。':''}
    </Feedback>
  </div>;
};

export const HyperparameterBalance: React.FC<Props> = () => {
  const [lambda,setLambda]=useState<'0.001'|'0.01'|'0.1'>('0.01');const [beta,setBeta]=useState<0|1|5|10>(5);const good=lambda==='0.01'&&beta===5;
  const draw=useMemo<Draw>(()=>(ctx,w,h)=>{text(ctx,'整体声道强度 λ',160,32,C.orange,14,'center',800);ctx.fillStyle='#dfe5dc';ctx.fillRect(95,65,130,170);const lh=lambda==='0.001'?30:lambda==='0.01'?90:155;ctx.fillStyle=lambda==='0.1'?C.red:C.orange;ctx.fillRect(95,235-lh,130,lh);text(ctx,lambda==='0.001'?'偏弱':lambda==='0.01'?'适中':'可能压过 RL',160,260,lambda==='0.1'?C.red:C.orange,13,'center',700);text(ctx,'token 选择锐度 β',515,32,C.purple,14,'center',800);const x0=365,x1=690,y0=230,y1=70;line(ctx,x0,y0,x1,y0,C.line);line(ctx,(x0+x1)/2,y0,(x0+x1)/2,y1,'#d1d9cf',1,[4,4]);ctx.beginPath();for(let i=0;i<=120;i++){const d=-1+2*i/120,g=beta===0?.5:sigmoid(beta*d),x=x0+i/120*(x1-x0),y=y0-g*(y0-y1);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle=beta===10?C.red:C.green;ctx.lineWidth=3;ctx.stroke();text(ctx,beta===0?'近似均匀':beta===5?'平滑选择':beta===10?'近似硬门':'较柔',515,260,beta===10?C.red:C.green,13,'center',700);},[lambda,beta]);
  const msg=lambda==='0.001'?'辅助信号偏弱。':lambda==='0.1'?'辅助项可能压过 RL。':beta===0?'所有 token 约为 0.5，几乎不选择。':beta===10?'门接近硬二值，边界 token 的部分信用减少。':good?'论文测试中的最佳组合：λ=0.01、β=5。':'这是论文测试档位中的探索状态。';
  return <div><Canvas draw={draw} deps={[draw]} label="lambda 总强度与 beta token 门锐度的离散消融解释"/><div className="sdar-controls"><Chips values={['0.001','0.01','0.1'] as const} value={lambda} onChange={setLambda} label="λSDAR"/><Chips values={[0,1,5,10] as const} value={beta} onChange={setBeta} label="β"/></div><Feedback tone={good?'good':lambda==='0.1'||beta===10?'bad':'info'}>{msg} <span className="sdar-note">图形解释机制，不伪造组合成绩。</span></Feedback><div className="sdar-evidence-row"><span>gap gate 优于 entropy / soft-OR</span><span>reverse KL 优于 forward KL / JSD</span></div></div>;
};

const nodeInfo={
  '学生策略':['输入 sₜ','输出 yₜ 与 log πθ','反传：是'], '环境 / Verifier':['输入完整轨迹','输出 reward','反传：否'],
  'GRPO':['输入 reward / group rollout','输出 LGRPO','反传：更新学生'], '特权上下文':['输入检索技能 c⁺','输出 sₜ⁺','反传：否'],
  '教师评分':['输入 sₜ⁺ 与同一 yₜ','输出 log πT','反传：stop-gradient'], 'Gap':['输入两侧 logp','输出 Δ','反传：计算后 detach'],
  'Gate':['输入 Δ 与 β','输出 g','反传：否'], '联合损失':['输入 LGRPO、LSDAR、λ','输出学生更新','反传：仅到学生项'],
} as const;
export const ArchitectureExplorer: React.FC<Props> = () => {
  const names=Object.keys(nodeInfo) as (keyof typeof nodeInfo)[];const [active,setActive]=useState<typeof names[number]>('学生策略');
  const draw=useMemo<Draw>(()=>(ctx,w)=>{const pos:Record<string,[number,number]>={'学生策略':[105,80],'环境 / Verifier':[310,55],'GRPO':[520,82],'特权上下文':[310,225],'教师评分':[505,220],'Gap':[650,170],'Gate':[650,85],'联合损失':[350,145]};const edges=[['学生策略','环境 / Verifier'],['环境 / Verifier','GRPO'],['GRPO','联合损失'],['特权上下文','教师评分'],['学生策略','教师评分'],['教师评分','Gap'],['学生策略','Gap'],['Gap','Gate'],['Gate','联合损失'],['联合损失','学生策略']];edges.forEach(([a,b])=>{const p=pos[a],q=pos[b];arrow(ctx,p[0],p[1],q[0],q[1],a===active||b===active?C.blue:'#c0c9be',a===active||b===active?2.5:1.2)});names.forEach(n=>{const p=pos[n];box(ctx,p[0]-62,p[1]-20,124,40,n===active?'#edf3f9':n==='教师评分'||n==='特权上下文'?'#f7f2fc':'#fff',n===active?C.blue:n==='教师评分'||n==='特权上下文'?C.purple:'#cbd4c9',9);text(ctx,n,p[0],p[1],n===active?C.blue:n==='教师评分'||n==='特权上下文'?C.purple:C.ink,12,'center',700)});},[active,names]);
  return <div><Canvas draw={draw} deps={[draw]} label="可点击探索的 SDAR Agent Loop 结构图"/><div className="sdar-node-grid">{names.map(n=><button key={n} className={active===n?'is-active':''} onClick={()=>setActive(n)} aria-pressed={active===n}>{n}</button>)}</div><div className="sdar-detail"><h5>{active}</h5>{nodeInfo[active].map(x=><span key={x}>{x}</span>)}</div><Feedback tone={active==='教师评分'?'good':'info'}>{active==='教师评分'?'教师只评分同一个学生 token，不生成另一条 rollout。':'点击其他组件，路径与反传说明会同步更新。'}</Feedback></div>;
};

const retrieval={UCB:[86.8,87.5,81.2],KM:[85.9,89.4,82.8],Full:[83.2,87.2,78.1],Random:[83.1,82.5,73.6],'w/o OPSD':[81.2,80.9,72.6]} as const;
const rMetrics=['ALFWorld','WebShop Score','WebShop Acc'] as const;
export const RetrievalRobustness: React.FC<Props> = () => {
  const methods=Object.keys(retrieval) as (keyof typeof retrieval)[];const [method,setMethod]=useState<typeof methods[number]>('KM');const [metric,setMetric]=useState<typeof rMetrics[number]>('WebShop Score');const mi=rMetrics.indexOf(metric);
  const draw=useMemo<Draw>(()=>(ctx,w)=>{const x0=150,len=w-205;base:for(let i=0;i<methods.length;i++){const m=methods[i],v=retrieval[m][mi],y=52+i*45;text(ctx,m,x0-18,y,m===method?C.orange:C.ink,12,'right',m===method?800:500);ctx.fillStyle='#e0e6de';ctx.fillRect(x0,y-10,len,20);ctx.fillStyle=m==='w/o OPSD'?'#98a398':C.green;ctx.fillRect(x0,y-10,len*v/100,20);if(m===method){ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.strokeRect(x0-2,y-12,len*v/100+4,24)}text(ctx,v.toFixed(1),x0+len*v/100+8,y,C.ink,11)}text(ctx,`${metric} · 越高越好`,w/2,282,C.blue,13,'center',800);},[method,metric,mi,methods]);
  return <div><Canvas draw={draw} deps={[draw]} label="不同检索方式在 ALFWorld 与 WebShop 指标上的鲁棒性结果"/><div className="sdar-controls"><Chips values={methods} value={method} onChange={setMethod} label="检索方式"/><Chips values={rMetrics} value={metric} onChange={setMetric} label="指标"/></div><Feedback tone={method==='Random'?'good':'info'}>{method==='Random'?'Random 相对 w/o OPSD：ALFWorld +1.9、WebShop Score +1.6、Acc +1.0。':`${method}：${retrieval[method].map(v=>v.toFixed(1)).join(' / ')}。`} 结论仅限本表设置。</Feedback><div className="sdar-table-wrap"><table><thead><tr><th>方法</th><th>ALFWorld</th><th>WebShop Score</th><th>WebShop Acc</th></tr></thead><tbody>{methods.map(m=><tr key={m} className={m===method?'is-current':''}><td>{m}</td>{retrieval[m].map(v=><td key={v}>{v.toFixed(1)}</td>)}</tr>)}</tbody></table></div></div>;
};

export const StopGradient: React.FC<Props> = () => {
  const [detach,setDetach]=useState(true);const draw=useMemo<Draw>(()=>(ctx,w)=>{box(ctx,55,105,145,70,'#fff','#cbd4c9');text(ctx,'学生 log πθ',127,140,C.orange,15,'center',800);box(ctx,305,55,145,70,'#f7f1fc','#bea8df');text(ctx,'Δ → gate g',377,90,C.purple,15,'center',800);box(ctx,555,105,145,70,'#eff8f2','#add2bc');text(ctx,'加权 likelihood',627,140,C.green,14,'center',800);arrow(ctx,200,140,305,95,C.blue);arrow(ctx,450,95,555,140,detach?C.green:C.red,3);arrow(ctx,555,160,200,160,C.green,3);if(detach){box(ctx,460,48,58,32,'#fff','#add2bc',7);text(ctx,'🔒',489,64,C.green,16,'center')}else{ctx.beginPath();ctx.arc(375,160,165,.15,2.9);ctx.strokeStyle=C.red;ctx.lineWidth=3;ctx.stroke();text(ctx,'额外自指耦合',377,260,C.red,14,'center',800)}},[detach]);
  return <div><Canvas draw={draw} deps={[draw]} label="detach gate 与不 detach 时的梯度路径对照"/><div className="sdar-controls"><Chips values={['detach gate','让 gate 参与反传'] as const} value={detach?'detach gate':'让 gate 参与反传'} onChange={v=>setDetach(v==='detach gate')} label="梯度模式"/></div><Feedback tone={detach?'good':'bad'}>{detach?'门值作为当前步固定权重，优化等价于 token 加权学生 log-likelihood（Prop.1）。':'学生 logp 同时改变 gap 与 gate，出现额外自指耦合；Prop.5 指出这可能不稳定。'}</Feedback></div>;
};

const results = {
  'Qwen2.5-3B': {
    GRPO: [75.0, 36.4, 79.8, 63.3],
    'GRPO+OPSD': [81.2, 44.6, 77.8, 66.4],
    SDAR: [84.4, 43.4, 85.0, 68.0],
  },
  'Qwen2.5-7B': {
    GRPO: [81.2, 42.0, 80.9, 72.6],
    'GRPO+OPSD': [80.4, 47.0, 86.8, 76.5],
    SDAR: [85.9, 49.0, 89.4, 82.8],
  },
  'Qwen3-1.7B': {
    GRPO: [46.1, 40.8, 67.3, 38.3],
    'GRPO+OPSD': [32.0, 42.2, 70.7, 38.3],
    SDAR: [53.9, 41.9, 76.8, 58.6],
  },
} as const;
const metrics = ['ALFWorld', 'Search-QA', 'WebShop Score', 'WebShop Acc'] as const;

export const ResultsRace: React.FC<Props> = () => {
  const models = Object.keys(results) as (keyof typeof results)[];
  const methods = ['GRPO', 'GRPO+OPSD', 'SDAR'] as const;
  const [model, setModel] = useState<typeof models[number]>('Qwen3-1.7B');
  const [metric, setMetric] = useState<typeof metrics[number]>('ALFWorld');
  const [play, setPlay] = useState(false);
  const idx = metrics.indexOf(metric);
  const row = results[model];
  const base = row.GRPO[idx];
  const opsd = row['GRPO+OPSD'][idx];
  const sdar = row.SDAR[idx];
  const sdarGain = sdar - base;
  const opsdDelta = opsd - base;

  useEffect(() => {
    if (!play) return;
    const id = setInterval(() => setMetric((value) => metrics[(metrics.indexOf(value) + 1) % metrics.length]), 1200);
    return () => clearInterval(id);
  }, [play]);

  const draw = useMemo<Draw>(() => (ctx, w) => {
    const x0 = 165, len = w - 235;
    const bars: [string, number, string][] = [
      ['GRPO', base, C.blue],
      ['GRPO + OPSD', opsd, C.red],
      ['SDAR', sdar, C.green],
    ];
    bars.forEach(([name, value, color], index) => {
      const y = 88 + index * 66;
      text(ctx, name, x0 - 18, y, color, 14, 'right', 800);
      ctx.fillStyle = '#e0e6de'; ctx.fillRect(x0, y - 15, len, 30);
      ctx.fillStyle = color; ctx.fillRect(x0, y - 15, len * value / 100, 30);
      text(ctx, value.toFixed(1), Math.min(w - 28, x0 + len * value / 100 + 10), y, color, 14, 'left', 800);
    });
    text(ctx, `${model} · ${metric}`, w / 2, 30, C.ink, 16, 'center', 800);
    const story = opsdDelta < 0 ? `盲目 OPSD ${opsdDelta.toFixed(1)}，Gate 后 +${sdarGain.toFixed(1)}` : `SDAR 相对 GRPO +${sdarGain.toFixed(1)}`;
    box(ctx, w / 2 - 145, 258, 290, 34, '#eff8f2', '#add2bc', 9);
    text(ctx, story, w / 2, 275, C.green, 14, 'center', 800);
  }, [model, metric, base, opsd, sdar, sdarGain, opsdDelta]);

  const cautionaryCase = model === 'Qwen3-1.7B' && metric === 'ALFWorld';
  return <div>
    <div className="sdar-demo-label">论文 Table 1 精确数据 · 越高越好</div>
    <Canvas draw={draw} deps={[draw]} label="GRPO、直接 OPSD 与 SDAR 的论文实验结果对比" />
    <div className="sdar-controls">
      <Chips values={models} value={model} onChange={setModel} label="模型" />
      <Chips values={metrics} value={metric} onChange={setMetric} label="指标" />
      <button className="sdar-action" onClick={() => setPlay((value) => !value)}>{play ? '暂停' : '播放四项指标'}</button>
    </div>
    <Feedback tone={cautionaryCase ? 'bad' : 'good'}>
      {cautionaryCase
        ? <>最关键反例：直接加入 OPSD 后 <b>46.1 → 32.0</b>，说明 Teacher 指导不能盲信；加入 token Gate 的 SDAR 达到 <b>53.9</b>。</>
        : <>当前设置下，SDAR 相对 GRPO 为 <b>{sdarGain >= 0 ? '+' : ''}{sdarGain.toFixed(1)}</b>，直接 OPSD 相对 GRPO 为 <b>{opsdDelta >= 0 ? '+' : ''}{opsdDelta.toFixed(1)}</b>。</>}
    </Feedback>
    <div className="sdar-table-wrap"><table><thead><tr><th>模型 / 方法</th>{metrics.map((name) => <th key={name}>{name}</th>)}</tr></thead><tbody>
      {models.flatMap((modelName) => methods.map((method) => <tr key={`${modelName}-${method}`} className={modelName === model && method === 'SDAR' ? 'is-current' : ''}><td>{modelName} · {method}</td>{results[modelName][method].map((value, valueIndex) => <td key={`${method}-${valueIndex}`}>{value.toFixed(1)}</td>)}</tr>))}
    </tbody></table></div>
    <div className="sdar-limit-grid">
      <div><b>证据支持</b><span>默认 β=5、λSDAR=0.01；消融实验支持 gap gate 与 reverse KL 的选择。</span></div>
      <div><b>不要过度外推</b><span>结论覆盖论文中的三类模型、三个 Agent 基准与有限检索/超参设置，不代表任意坏 Skill 都安全。</span></div>
    </div>
  </div>;
};
