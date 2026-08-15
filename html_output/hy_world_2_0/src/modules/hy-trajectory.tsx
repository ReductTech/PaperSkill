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
type BlindSpotId = 'object-back' | 'corridor' | 'overhead';

const routeData: Record<TrajectoryName, {
  n: number;
  note: string;
  condition: string;
  color: string;
  covers: BlindSpotId[];
  path: Array<[number, number]>;
}> = {
  常规: { n: 9, note: '离开固定视点，补充普通新视角。', condition: '不绑定对象，可直接执行。', color: C.blue, covers: ['corridor'], path: [[55,215],[155,165],[330,198],[500,92]] },
  环绕: { n: 5, note: '围绕显著物体补足侧面和背面。', condition: '需要检测到可绑定对象。', color: C.green, covers: ['object-back'], path: [[55,215],[150,165],[190,78],[305,58],[350,145]] },
  重建感知: { n: 10, note: '针对当前重建中欠观察的区域迭代补拍。', condition: '依赖重建反馈，并迭代执行。', color: C.purple, covers: ['object-back','overhead'], path: [[55,215],[145,185],[315,210],[350,145],[435,72]] },
  漫游: { n: 3, note: '沿可导航区域走向街道或走廊远端。', condition: '不绑定对象，依赖 NavMesh。', color: C.orange, covers: ['corridor'], path: [[55,215],[105,82],[190,48],[345,58],[500,92]] },
  航拍: { n: 8, note: '抬高相机补充俯视观察。', condition: '碰撞风险升高时会动态减小俯仰。', color: C.brown, covers: ['overhead'], path: [[55,215],[145,160],[275,105],[420,58]] },
};

const blindSpots: Array<{
  id: BlindSpotId;
  title: string;
  prompt: string;
  recommended: TrajectoryName[];
  point: [number, number];
}> = [
  { id: 'object-back', title: '物体背面', prompt: '中心全景看到了物体正面，但背后仍缺少观察。', recommended: ['环绕','重建感知'], point: [350,145] },
  { id: 'corridor', title: '走廊远端', prompt: '固定视点无法确认远端拐角后的空间。', recommended: ['漫游','常规'], point: [500,92] },
  { id: 'overhead', title: '俯视盲区', prompt: '地面视角缺少屋顶、平台或高处结构。', recommended: ['航拍','重建感知'], point: [420,58] },
];

export const HyTrajectory: React.FC<WidgetProps> = () => {
  const [blindSpotId, setBlindSpotId] = useState<BlindSpotId>('object-back');
  const [selectedRoutes, setSelectedRoutes] = useState<TrajectoryName[]>(['环绕']);
  const blindSpot = blindSpots.find((item) => item.id === blindSpotId) ?? blindSpots[0];
  const covered = selectedRoutes.some((name) => routeData[name].covers.includes(blindSpot.id));
  const complete = blindSpot.recommended.every((name) => selectedRoutes.includes(name));

  const toggleRoute = (name: TrajectoryName) => {
    setSelectedRoutes((current) => {
      if (current.includes(name)) return current.filter((item) => item !== name);
      if (current.length >= 2) return current;
      return [...current, name];
    });
  };

  const selectBlindSpot = (id: BlindSpotId) => {
    setBlindSpotId(id);
    const next = blindSpots.find((item) => item.id === id) ?? blindSpots[0];
    setSelectedRoutes([next.recommended[0]]);
  };

  return (
    <div className="trajectory-lab">
      <div className="trajectory-targets" role="tablist" aria-label="选择需要补看的盲区">
        {blindSpots.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={blindSpot.id === item.id} className={blindSpot.id === item.id ? 'selected' : ''} onClick={() => selectBlindSpot(item.id)}>
            <strong>{item.title}</strong>
            <span>{item.prompt}</span>
          </button>
        ))}
      </div>

      <div className="trajectory-workbench">
        <CanvasView height={280} draw={(ctx) => {
          clearStudio(ctx,560,280);
          ctx.fillStyle='#cbd5c0'; ctx.fillRect(205,72,88,64); ctx.fillRect(374,132,78,58);
          label(ctx,'障碍',249,108,C.muted,12,'center');
          label(ctx,'起点',55,246,C.muted,11,'center');
          (Object.keys(routeData) as TrajectoryName[]).forEach((name) => {
            const item = routeData[name];
            route(ctx,item.path,selectedRoutes.includes(name) ? item.color : '#d5dbe4',selectedRoutes.includes(name) ? 5 : 2,selectedRoutes.includes(name) ? [] : [5,6]);
          });
          selectedRoutes.forEach((name, index) => {
            const item = routeData[name];
            const end = item.path[item.path.length - 1];
            camera(ctx,end[0],end[1],item.color,.52 + index * .05);
          });
          target(ctx,blindSpot.point[0],blindSpot.point[1],covered);
          label(ctx,blindSpot.title,blindSpot.point[0],blindSpot.point[1]-32,covered?C.green:C.red,13,'center');
          label(ctx,selectedRoutes.length ? `已组合 ${selectedRoutes.length} / 2 类策略` : '尚未选择策略',35,35,selectedRoutes.length?C.blue:C.red,13);
        }} />

        <section className={`trajectory-mission ${complete ? 'complete' : covered ? 'covered' : 'missing'}`} aria-live="polite">
          <span>当前勘景任务</span>
          <h5>补看：{blindSpot.title}</h5>
          <p>{blindSpot.prompt}</p>
          <div>
            <small>教学推荐组合</small>
            <strong>{blindSpot.recommended.join(' + ')}</strong>
          </div>
          <p className="trajectory-mission-result">
            {complete
              ? '两类策略形成互补：一类直接触达盲区，另一类根据对象、重建反馈或普通新视角补充证据。'
              : covered
                ? '当前路线能够触达目标，但还缺少推荐的互补策略；这不代表路线无效，只表示观察类型仍单一。'
                : '当前组合没有针对这个盲区。请撤下一条路线，再选择能够覆盖目标的策略。'}
          </p>
        </section>
      </div>

      <div className="trajectory-strategies" role="group" aria-label="组合最多两类 WorldNav 路线">
        {(Object.keys(routeData) as TrajectoryName[]).map((name) => {
          const item = routeData[name];
          const selected = selectedRoutes.includes(name);
          const disabled = !selected && selectedRoutes.length >= 2;
          return (
            <button key={name} type="button" className={selected ? 'selected' : ''} aria-pressed={selected} disabled={disabled} onClick={() => toggleRoute(name)}>
              <span><strong>{name}</strong><b>最大数量 {item.n}</b></span>
              <small>{item.note}</small>
              <em>{item.condition}</em>
            </button>
          );
        })}
      </div>

      <div className={`feedback ${complete ? 'good' : covered ? '' : 'bad'}`}>
        最多组合两类路线用于教学比较；“最大数量”来自论文表 1 的启发式上限，不是本实验的预算成本，也不代表路线质量分数。
      </div>
      <PaperTable tableId="table-1" />
    </div>
  );
};

export const HyKeyframes: React.FC<WidgetProps> = () => { const [run,setRun]=useState(0);const start=useRef(0);const go=()=>{start.current=performance.now();setRun(v=>v+1)};return <div><CanvasView height={250} animate={run>0} draw={(ctx,time)=>{clearStudio(ctx,560,250);const p=run?clamp((time-start.current)/2000,0,1):0;ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(280,25);ctx.lineTo(280,205);ctx.stroke();label(ctx,'Video-VAE',140,30,C.red,14,'center');label(ctx,'Keyframe-VAE',420,30,C.green,14,'center');route(ctx,[[35,180],[235,85]],C.red,3,[6,5]);route(ctx,[[315,180],[515,85]],C.blue,5);camera(ctx,55+p*160,170-p*70,C.red,.68);camera(ctx,335+p*160,170-p*70,C.blue,.68);for(let i=0;i<6;i++)photo(ctx,60+i*30,210-i*13,C.red,.28+i*.08);for(let i=0;i<3;i++)photo(ctx,345+i*70,205-i*38,C.green,1);metricBars(ctx,['RotErr','ATE'],[.762,.492],[C.red,C.green],150,228,70);}}/><div className="step-ctrl"><button className="tiny" onClick={go}>开始同轨比较</button></div><div className={`feedback ${run?'good':''}`}>{run?'选择性冻结 Cross-Attn 与 FFN 后，RotErr 0.762→0.492，ATE 2.141→1.768。全量训练的部分视觉指标更高，但控制精度和泛化更差。':'两侧使用相同起点和时间基准。'}</div></div>; };

const memoryData:{[k:string]:[number,number,number,string]}={'仅相机控制':[16.13,.474,28.81,'没有跨轨迹记忆，质量和一致性最低。'],'GGM+SSM++':[20.94,.640,30.27,'全局骨架和局部检索带来显著提升。'],'空间拼接完整配置':[21.63,.669,30.76,'空间拼接、增强与更大批次形成最终记忆配置。'],'时间拼接替代':[19.83,.581,29.77,'把空间拼接换成时间拼接会在全部指标上退化。']};
export const HyMemory: React.FC<WidgetProps> = () => {const [mode,setMode]=useState('仅相机控制');const d=memoryData[mode];return <div><CanvasView height={260} draw={(ctx)=>{clearStudio(ctx,560,260);camera(ctx,105,138,C.blue,.8);target(ctx,460,105,true);route(ctx,[[135,138],[420,105]],mode==='仅相机控制'?C.red:C.blue,4,mode==='仅相机控制'?[8,6]:[]);ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.arc(285,105,62,0,Math.PI*2);ctx.stroke();label(ctx,'GGM',285,102,C.purple,13,'center');if(mode!=='仅相机控制'){photo(ctx,285,58,C.purple);route(ctx,[[285,76],[370,102]],mode==='时间拼接替代'?C.red:C.green,3,mode==='时间拼接替代'?[5,4]:[]);}metricBars(ctx,['PSNR','SSIM×30','PSNRm'],[d[0],d[1]*30,d[2]],[C.blue,C.orange,C.green],50,220,92);}}/><div className="chip-row">{Object.keys(memoryData).map(x=><button key={x} className={`chip ${mode===x?'selected':''}`} onClick={()=>setMode(x)}>{x}</button>)}</div><div className={`feedback ${mode==='仅相机控制'||mode==='时间拼接替代'?'bad':mode==='空间拼接完整配置'?'good':''}`}>{d[3]} PSNR={d[0]}，SSIM={d[1].toFixed(3)}，PSNRm={d[2]}。</div></div>;};

export default HyAnalogy;
