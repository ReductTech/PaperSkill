import React, { useEffect, useRef, useState } from 'react';
import { clamp, easeInOutQuad, observeCanvas, setupCanvas } from '../lib/canvasKit';
import { EvidenceMediaDrawer, PaperTable } from './hy-paper-evidence';
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

type TrajectoryName = '常规' | '环绕' | '重建感知' | '漫游' | '航拍';
type PlannerStage = 0 | 1 | 2 | 3 | 4;
type Point = [number, number];

const routeData: Record<TrajectoryName, { n: number; note: string; condition: string; color: string; path: Point[] }> = {
  常规: { n: 9, note: '从中心视点向外补充普通新视角。', condition: '不绑定对象，覆盖通用盲区。', color: C.blue, path: [[62,226],[142,196],[205,151],[310,177],[390,122],[506,88]] },
  环绕: { n: 5, note: '围绕显著物体补足侧面与背面。', condition: '先检测可绑定对象，再生成环绕候选。', color: C.green, path: [[62,226],[140,194],[185,126],[205,68],[305,54],[365,91],[414,122]] },
  重建感知: { n: 10, note: '由欠观察区域反向提出下一批相机。', condition: '依赖重建反馈，可能迭代多轮。', color: C.purple, path: [[62,226],[142,201],[230,218],[315,191],[370,136],[430,77],[505,68]] },
  漫游: { n: 3, note: '沿可导航区域走向街道或走廊远端。', condition: '依赖 NavMesh，不绑定单个物体。', color: C.orange, path: [[62,226],[112,139],[170,85],[260,84],[336,114],[414,84],[506,88]] },
  航拍: { n: 8, note: '抬高相机补充平台、屋顶与俯视观察。', condition: '碰撞风险升高时动态减小俯仰。', color: C.brown, path: [[62,226],[142,184],[224,142],[302,106],[392,75],[486,50]] },
};

const plannerStages: Array<{ title: string; short: string; body: string; evidence: string }> = [
  { title: '场景语义与 NavMesh', short: '把可走区域从画面里分离出来', body: 'VLM/场景解析提供对象和任务语义，点云与 NavMesh 把墙体、障碍和可导航区域变成规划约束。', evidence: '论文描述场景感知轨迹系统；具体工程步骤参考知乎文章的模块解读。' },
  { title: '均匀采样候选', short: '先铺开多种可能路线', body: '在可导航区域上均匀取候选点，形成多个方向与长度不同的折线路径，避免一开始就押注单一路线。', evidence: '均匀采样属于第三方文章对 WorldNav 工程流程的解释。' },
  { title: 'Ray-casting 筛碰撞', short: '让穿墙路线立即出局', body: '从候选相机向下一节点发射检测线，与障碍相交的候选标红并淘汰，只保留可通行路线。', evidence: '这是工程讲解，不代表论文报告了碰撞召回率或全局最优保证。' },
  { title: '双向贪心连接', short: '起点和目标同时向中间靠拢', body: '从起点与目标两端选择当前可连接节点，逐步拼出一条连续路线；它是启发式连接，不是端到端学习规划器。', evidence: '双向贪心来自知乎文章的模块细节说明。' },
  { title: '尾部修剪与相机回放', short: '删除多余折返，再按折线逐段运行', body: '删去目标附近的冗余尾段，得到最终折线。相机按每段真实长度推进，并在拐点切换朝向。', evidence: '五类路线与最大数量来自论文表 1；修剪流程来自第三方工程解读。' },
];

const obstacles = [
  { x: 214, y: 96, w: 76, h: 58 },
  { x: 355, y: 147, w: 82, h: 54 },
];

function poseOnPath(points: Point[], progress: number) {
  const lengths = points.slice(1).map((point, index) => Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
  const total = lengths.reduce((sum, length) => sum + length, 0);
  let remaining = clamp(progress, 0, 1) * total;
  for (let index = 0; index < lengths.length; index += 1) {
    if (remaining <= lengths[index] || index === lengths.length - 1) {
      const local = lengths[index] === 0 ? 0 : remaining / lengths[index];
      const from = points[index];
      const to = points[index + 1];
      return { x: from[0] + (to[0] - from[0]) * local, y: from[1] + (to[1] - from[1]) * local, angle: Math.atan2(to[1] - from[1], to[0] - from[0]) };
    }
    remaining -= lengths[index];
  }
  return { x: points[0][0], y: points[0][1], angle: 0 };
}

function drawRouteCamera(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(39,68,110,.12)';
  ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(62, -24); ctx.lineTo(62, 24); ctx.closePath(); ctx.fill();
  ctx.fillStyle = color; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-14, -9, 28, 18, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(4, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawIsoBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lift: number) {
  ctx.fillStyle = '#7f8f7a'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y-16); ctx.lineTo(x+w,y+h-lift); ctx.lineTo(x,y+h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#aab7a3'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+22,y-lift); ctx.lineTo(x+w+22,y-lift-16); ctx.lineTo(x+w,y-16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#93a18d'; ctx.beginPath(); ctx.moveTo(x+w,y-16); ctx.lineTo(x+w+22,y-lift-16); ctx.lineTo(x+w+22,y+h-lift-16); ctx.lineTo(x+w,y+h-lift); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#56645a'; ctx.lineWidth = 1.5; ctx.strokeRect(x,y,w,h);
}

function drawPerspectiveScene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0,0,560,300); ctx.fillStyle='#eef3f7';ctx.fillRect(0,0,560,300);
  ctx.fillStyle='#dce8d2';ctx.beginPath();ctx.moveTo(28,258);ctx.lineTo(198,52);ctx.lineTo(532,91);ctx.lineTo(488,268);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#afc0aa';ctx.lineWidth=1;
  for(let i=0;i<7;i+=1){const t=i/6;ctx.beginPath();ctx.moveTo(28+(488-28)*t,258+(268-258)*t);ctx.lineTo(198+(532-198)*t,52+(91-52)*t);ctx.stroke();}
  for(let i=1;i<6;i+=1){const t=i/6;ctx.beginPath();ctx.moveTo(28+(198-28)*t,258+(52-258)*t);ctx.lineTo(488+(532-488)*t,268+(91-268)*t);ctx.stroke();}
  ctx.fillStyle='rgba(34,141,92,.12)';ctx.beginPath();ctx.moveTo(52,236);ctx.lineTo(211,73);ctx.lineTo(506,105);ctx.lineTo(458,248);ctx.closePath();ctx.fill();
  drawIsoBlock(ctx,214,118,72,56,27); drawIsoBlock(ctx,356,163,78,48,22);
}

export const HyTrajectory: React.FC<WidgetProps> = () => {
  const [trajectory, setTrajectory] = useState<TrajectoryName>('漫游');
  const [stage, setStage] = useState<PlannerStage>(0);
  const animationStart = useRef(performance.now());
  const routeInfo = routeData[trajectory];
  const activeStage = plannerStages[stage];

  const showStage = (next: PlannerStage) => {
    animationStart.current = performance.now();
    setStage(next);
  };

  const changeTrajectory = (next: TrajectoryName) => {
    animationStart.current = performance.now();
    setTrajectory(next);
    setStage(0);
  };

  return (
    <div className="trajectory-lab trajectory-planner">
      <div className="learning-contract"><div><span>为什么学</span><p>相机轨迹决定 WorldStereo 会生成哪些新观察；五类轨迹分别处理通用覆盖、物体背面、重建盲区、远端和俯视结构。</p></div><div><span>本次操作</span><p>先切换任务，再逐层查看候选、碰撞淘汰、连接和最终回放。</p></div><div><span>应得判断</span><p>五类任务不是同一折线换颜色，而是目标对象、覆盖形态和执行条件都不同。</p></div></div>
      <div className="trajectory-task-switch" role="tablist" aria-label="选择 WorldNav 轨迹任务">
        {(Object.keys(routeData) as TrajectoryName[]).map((name) => (
          <button key={name} type="button" role="tab" aria-selected={trajectory === name} className={trajectory === name ? 'selected' : ''} onClick={() => changeTrajectory(name)}>
            <strong>{name}</strong><span>最多 {routeData[name].n} 条</span>
          </button>
        ))}
      </div>

      <div className="trajectory-stage-tabs" role="group" aria-label="逐步查看 WorldNav 规划过程">
        {plannerStages.map((item, index) => (
          <button key={item.title} type="button" className={`${stage === index ? 'selected' : ''} ${stage > index ? 'complete' : ''}`} onClick={() => showStage(index as PlannerStage)}>
            <i>{index + 1}</i><span><strong>{item.title}</strong><small>{item.short}</small></span>
          </button>
        ))}
      </div>

      <div className="trajectory-planner-stage">
        <CanvasView height={300} animate draw={(ctx, time) => {
          const p = easeInOutQuad(clamp((time - animationStart.current) / (stage === 4 ? 2600 : 950), 0, 1));
          drawPerspectiveScene(ctx);
          ctx.strokeStyle = '#97aa92'; ctx.lineWidth = 1.2;
          [[50,226],[126,184],[182,110],[300,74],[340,126],[470,68],[505,88]].forEach(([x,y], index, nodes) => {
            if (index < nodes.length - 1) { ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(nodes[index + 1][0],nodes[index + 1][1]); ctx.stroke(); }
            ctx.fillStyle = index === 0 ? C.blue : '#8fa58b'; ctx.beginPath(); ctx.ellipse(x,y,5,3,0,0,Math.PI*2); ctx.fill();
          });
          label(ctx,'斜俯三维 NavMesh',34,30,C.green,12);
          label(ctx,'立体障碍',250,118,C.white,10,'center'); label(ctx,'立体障碍',394,161,C.white,10,'center');
          ctx.strokeStyle='rgba(39,68,110,.28)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(505,88);ctx.lineTo(505,43);ctx.stroke();ctx.setLineDash([]);label(ctx,'远端目标高度',516,47,C.blue,9,'right');
          target(ctx,routeInfo.path[routeInfo.path.length - 1][0],routeInfo.path[routeInfo.path.length - 1][1],stage === 4 && p > .9);
          if (trajectory === '常规') {
            [[118,184],[170,224],[280,62],[470,205]].forEach(([x,y])=>{ctx.strokeStyle=C.blue;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(62,226);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=C.blue;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();});
            label(ctx,'从中心向多个方向铺开',286,48,C.blue,11,'center');
          } else if (trajectory === '环绕') {
            ctx.strokeStyle=C.green;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(252,125,94,66,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle=C.orange;ctx.fillRect(230,103,44,44);label(ctx,'绑定对象',252,129,C.white,9,'center');
          } else if (trajectory === '重建感知') {
            ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(470,78,42,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);label(ctx,'覆盖空洞',470,82,C.purple,10,'center');
            for(let i=0;i<4;i+=1){ctx.strokeStyle='rgba(124,58,237,'+(.22+i*.12)+')';ctx.beginPath();ctx.moveTo(350+i*18,150-i*15);ctx.lineTo(470,78);ctx.stroke();}
          } else if (trajectory === '漫游') {
            const vanishing: Point = [506,88];
            ctx.save();
            ctx.strokeStyle='rgba(217,119,6,.46)';ctx.lineWidth=1.5;ctx.setLineDash([5,5]);
            [[84,244],[162,244],[286,244]].forEach(([x,y])=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(vanishing[0],vanishing[1]);ctx.stroke();});
            ctx.setLineDash([]);
            [[342,106,34,48],[406,96,25,34],[454,91,17,24]].forEach(([x,y,w,h])=>{ctx.strokeStyle='rgba(217,119,6,.62)';ctx.strokeRect(x,y,w,h);});
            ctx.fillStyle=C.orange;ctx.beginPath();ctx.arc(vanishing[0],vanishing[1],5,0,Math.PI*2);ctx.fill();
            ctx.restore();
            label(ctx,'沿可走区域望向远端',520,38,C.orange,11,'right');
          } else {
            ctx.strokeStyle=C.brown;ctx.lineWidth=2;for(let i=0;i<4;i+=1){ctx.strokeRect(94+i*96,78+i*18,68,48);}label(ctx,'抬高视点，补屋顶与平台',310,42,C.brown,11,'center');
            ctx.fillStyle='rgba(146,64,14,.12)';ctx.beginPath();ctx.moveTo(488,50);ctx.lineTo(430,168);ctx.lineTo(540,168);ctx.closePath();ctx.fill();
          }

          if (stage >= 1) {
            const candidates: Point[][] = [routeInfo.path, [[62,226],[178,190],[252,126],[382,80],[506,88]], [[62,226],[118,112],[248,116],[372,174],[506,88]]];
            candidates.forEach((candidate, index) => {
              const rejectProgress = stage === 2 && index > 0 ? clamp(p * 1.4 - (index - 1) * .38, 0, 1) : stage > 2 && index > 0 ? 1 : 0;
              ctx.save(); ctx.globalAlpha = index === 0 ? 1 : 1 - rejectProgress * .58;
              route(ctx,candidate,index === 0 ? (stage >= 3 ? routeInfo.color : '#6f86a3') : rejectProgress > 0 ? C.red : '#91a4bd',index === 0 ? 3.5 : 2.5,[8,6]); ctx.restore();
            });
            if (stage === 1) label(ctx,'所有候选先保持虚线，不提前宣布赢家',310,280,C.blue,12,'center');
          }
          if (stage >= 2) {
            const rejects = [{point:[252,126], threshold:.2,label:'穿过障碍'},{point:[372,174],threshold:.58,label:'碰撞边界'}] as const;
            rejects.forEach(({point,threshold,label:reason}) => { const visible=stage>2?1:clamp((p-threshold)/.22,0,1); if(visible<=0)return; const [x,y]=point;ctx.save();ctx.globalAlpha=visible;ctx.strokeStyle=C.red;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-8,y-8);ctx.lineTo(x+8,y+8);ctx.moveTo(x+8,y-8);ctx.lineTo(x-8,y+8);ctx.stroke();label(ctx,reason,x,y+22,C.red,8,'center');ctx.restore(); });
            label(ctx,stage===2?(p<.5?'Ray-casting：先淘汰候选 B':'继续淘汰候选 C'):'两条碰撞路线已移除',348,218,C.red,11);
          }
          if (stage >= 3) {
            const split = Math.max(2, Math.floor(routeInfo.path.length / 2));
            if(stage===3){route(ctx,routeInfo.path.slice(0,split + 1),C.blue,4,[8,6]);route(ctx,routeInfo.path.slice(split),C.green,4,[8,6]);}
            label(ctx,'起点 →',74,251,C.blue,11); label(ctx,'← 目标',488,34,C.green,11,'right');
          }
          if (stage === 4) {
            route(ctx,routeInfo.path,'#d7deea',8);
            route(ctx,routeInfo.path,routeInfo.color,4);
            const pose = poseOnPath(routeInfo.path,p);
            drawRouteCamera(ctx,pose.x,pose.y,pose.angle,routeInfo.color);
            label(ctx,p > .96 ? '抵达目标，折线朝向已完整回放' : '按分段长度移动，拐点同步转向',280,282,p > .96 ? C.green : routeInfo.color,12,'center');
          } else {
            drawRouteCamera(ctx,routeInfo.path[0][0],routeInfo.path[0][1],Math.atan2(routeInfo.path[1][1]-routeInfo.path[0][1],routeInfo.path[1][0]-routeInfo.path[0][0]),routeInfo.color);
          }
        }} />

        <section className="trajectory-stage-detail" aria-live="polite">
          <span>第 {stage + 1} 层 · {trajectory}任务</span>
          <h5>{activeStage.title}</h5>
          <p>{activeStage.body}</p>
          <dl><div><dt>任务用途</dt><dd>{routeInfo.note}</dd></div><div><dt>执行条件</dt><dd>{routeInfo.condition}</dd></div><div><dt>证据边界</dt><dd>{activeStage.evidence}</dd></div></dl>
          <div className="trajectory-stage-actions">
            <button type="button" onClick={() => showStage(Math.max(0, stage - 1) as PlannerStage)} disabled={stage === 0}>上一步</button>
            <button type="button" className="primary" onClick={() => stage === 4 ? showStage(4) : showStage((stage + 1) as PlannerStage)}>{stage === 4 ? '重播最终路线' : '下一层'}</button>
          </div>
        </section>
      </div>

      <div className="feedback good">五类路线及“最大数量”来自论文表 1；均匀采样、Ray-casting、双向贪心与尾部修剪采用知乎文章的工程讲解视角，不被表述为论文证明的全局最优算法。</div>
      <EvidenceMediaDrawer mediaType="官方架构图" src="/images/official-stage-nav.webp" title="WorldNav 五类轨迹在真实三维场景中的分布" caption="官方图把常规、环绕、重建感知、漫游与航拍轨迹叠加在真实场景上。可用它核对上方 NavMesh 教学动画与实际三维轨迹之间的对应关系。" alt="WorldNav 五类相机轨迹官方示意图" sourceUrl="https://github.com/Tencent-Hunyuan/HY-World-2.0" sourceLabel="腾讯混元官方仓库素材 ↗" />
      <PaperTable tableId="table-1" />
    </div>
  );
};

export const HyKeyframes: React.FC<WidgetProps> = () => { const [run,setRun]=useState(0);const start=useRef(0);const go=()=>{start.current=performance.now();setRun(v=>v+1)};return <div><CanvasView height={250} animate={run>0} draw={(ctx,time)=>{clearStudio(ctx,560,250);const p=run?clamp((time-start.current)/2000,0,1):0;ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(280,25);ctx.lineTo(280,205);ctx.stroke();label(ctx,'Video-VAE',140,30,C.red,14,'center');label(ctx,'Keyframe-VAE',420,30,C.green,14,'center');route(ctx,[[35,180],[235,85]],C.red,3,[6,5]);route(ctx,[[315,180],[515,85]],C.blue,5);camera(ctx,55+p*160,170-p*70,C.red,.68);camera(ctx,335+p*160,170-p*70,C.blue,.68);for(let i=0;i<6;i++)photo(ctx,60+i*30,210-i*13,C.red,.28+i*.08);for(let i=0;i<3;i++)photo(ctx,345+i*70,205-i*38,C.green,1);metricBars(ctx,['RotErr','ATE'],[.762,.492],[C.red,C.green],150,228,70);}}/><div className="step-ctrl"><button className="tiny" onClick={go}>开始同轨比较</button></div><div className={`feedback ${run?'good':''}`}>{run?'选择性冻结 Cross-Attn 与 FFN 后，RotErr 0.762→0.492，ATE 2.141→1.768。全量训练的部分视觉指标更高，但控制精度和泛化更差。':'两侧使用相同起点和时间基准。'}</div></div>; };

const memoryData:{[k:string]:[number,number,number,string]}={'仅相机控制':[16.13,.474,28.81,'没有跨轨迹记忆，质量和一致性最低。'],'GGM+SSM++':[20.94,.640,30.27,'全局骨架和局部检索带来显著提升。'],'空间拼接完整配置':[21.63,.669,30.76,'空间拼接、增强与更大批次形成最终记忆配置。'],'时间拼接替代':[19.83,.581,29.77,'把空间拼接换成时间拼接会在全部指标上退化。']};
export const HyMemory: React.FC<WidgetProps> = () => {const [mode,setMode]=useState('仅相机控制');const d=memoryData[mode];return <div><CanvasView height={260} draw={(ctx)=>{clearStudio(ctx,560,260);camera(ctx,105,138,C.blue,.8);target(ctx,460,105,true);route(ctx,[[135,138],[420,105]],mode==='仅相机控制'?C.red:C.blue,4,mode==='仅相机控制'?[8,6]:[]);ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.arc(285,105,62,0,Math.PI*2);ctx.stroke();label(ctx,'GGM',285,102,C.purple,13,'center');if(mode!=='仅相机控制'){photo(ctx,285,58,C.purple);route(ctx,[[285,76],[370,102]],mode==='时间拼接替代'?C.red:C.green,3,mode==='时间拼接替代'?[5,4]:[]);}metricBars(ctx,['PSNR','SSIM×30','PSNRm'],[d[0],d[1]*30,d[2]],[C.blue,C.orange,C.green],50,220,92);}}/><div className="chip-row">{Object.keys(memoryData).map(x=><button key={x} className={`chip ${mode===x?'selected':''}`} onClick={()=>setMode(x)}>{x}</button>)}</div><div className={`feedback ${mode==='仅相机控制'||mode==='时间拼接替代'?'bad':mode==='空间拼接完整配置'?'good':''}`}>{d[3]} PSNR={d[0]}，SSIM={d[1].toFixed(3)}，PSNRm={d[2]}。</div></div>;};

export default HyAnalogy;
