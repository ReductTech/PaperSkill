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

const systemClaims = [
  {
    id: 'sparse-generation',
    number: '01',
    claim: '文本或单图输入需要生成未见区域',
    correct: true,
    evidence: '论文把稀疏输入路由到四阶段世界生成：全景、规划、扩展、合成。',
    boundary: '生成区域利用数据先验，不是对真实未见空间的测量。',
    locator: 'Abstract；Introduction；Figure 2',
  },
  {
    id: 'rich-reconstruction',
    number: '02',
    claim: '多视图或视频输入进入世界重建',
    correct: true,
    evidence: '较丰富的视觉观测由 WorldMirror 2.0 恢复几何一致的三维结构。',
    boundary: '这条路径仍受输入覆盖、先验质量和评测协议约束。',
    locator: 'Abstract；Introduction；Section 6',
  },
  {
    id: 'reconstruction-foundation',
    number: '03',
    claim: '重建能力也支撑生成管线的最终合成',
    correct: true,
    evidence: '论文明确写道，重建不是孤立模块，而是世界生成的基础组件；生成视图会送入 WorldMirror 2.0。',
    boundary: '“支撑生成”不表示生成与重建共享所有权重或完全相同的数据流。',
    locator: 'Introduction；Figure 2；Section 2',
  },
  {
    id: 'monolith',
    number: '04',
    claim: '所谓统一，表示所有任务由一个单体网络完成',
    correct: false,
    evidence: 'Figure 2 展示的是 HY-Pano、WorldNav、WorldStereo、WorldMirror 与 3DGS 组成的多阶段系统。',
    boundary: '论文的“统一”是任务和组件被组织进同一系统，不是单模型端到端包办一切。',
    locator: 'Figure 2；Section 2',
  },
  {
    id: 'realtime-generation',
    number: '05',
    claim: 'WorldLens 可实时漫游，所以完整世界生成也是实时的',
    correct: false,
    evidence: 'WorldLens 是生成后资产的运行时渲染与交互平台；论文完整生成管线仍是离线流程。',
    boundary: '运行时交互速度不能替代端到端世界生成耗时。',
    locator: 'Abstract；Introduction；Table 10；Figure 22',
  },
] as const;

type SystemClaimId = typeof systemClaims[number]['id'];

export const HyBoundaryCompare: React.FC<WidgetProps> = () => {
  const [activeClaimId, setActiveClaimId] = useState<SystemClaimId>('sparse-generation');
  const activeClaim = systemClaims.find(item => item.id === activeClaimId) ?? systemClaims[0];
  const activeIndex = systemClaims.findIndex(item => item.id === activeClaim.id);
  const showSparse = activeClaim.id === 'sparse-generation' || activeClaim.id === 'reconstruction-foundation' || activeClaim.id === 'monolith';
  const showRich = activeClaim.id === 'rich-reconstruction' || activeClaim.id === 'reconstruction-foundation' || activeClaim.id === 'monolith';
  const showFoundation = activeClaim.id === 'reconstruction-foundation' || activeClaim.id === 'monolith' || activeClaim.id === 'realtime-generation';
  const nextClaim = () => setActiveClaimId(systemClaims[(activeIndex + 1) % systemClaims.length].id);

  return <div className="contract-lab">
    <div className="contract-head">
      <div><span>系统边界透视台</span><strong>逐条浏览“统一生成与重建”真正包含的范围</strong></div>
      <div><b>{activeClaim.number}/05</b><small>当前切片</small></div>
      <button type="button" onClick={nextClaim}>下一条边界</button>
    </div>

    <div className="contract-workbench">
      <CanvasView height={310} draw={(ctx) => {
        clearStudio(ctx, 560, 310);

        label(ctx, '稀疏条件', 36, 32, C.orange, 12);
        label(ctx, '丰富观测', 36, 250, C.blue, 12);
        photo(ctx, 75, 77, showSparse ? C.orange : C.muted, showSparse ? .95 : .35);
        photo(ctx, 75, 225, showRich ? C.blue : C.muted, showRich ? .95 : .35);
        label(ctx, '文本 / 单图', 75, 111, showSparse ? C.orange : C.muted, 11, 'center');
        label(ctx, '多视图 / 视频', 75, 261, showRich ? C.blue : C.muted, 11, 'center');

        const stageXs = [175, 265, 355];
        const stageNames = ['全景 + 规划', '世界扩展', 'WorldMirror'];
        stageXs.forEach((x, index) => {
          const active = index < 2 ? showSparse : showFoundation || showRich;
          ctx.fillStyle = C.white; ctx.strokeStyle = active ? (index === 2 ? C.green : C.blue) : C.line; ctx.lineWidth = active ? 3 : 1;
          ctx.beginPath(); ctx.roundRect(x - 38, index === 2 ? 126 : 60, 76, 58, 5); ctx.fill(); ctx.stroke();
          label(ctx, stageNames[index], x, index === 2 ? 157 : 91, active ? C.ink : C.muted, 11, 'center');
        });
        if (showSparse) {
          route(ctx, [[106,77],[137,77]], C.orange, 4);
          route(ctx, [[213,77],[227,77]], C.blue, 4);
          route(ctx, [[303,77],[355,126]], showFoundation ? C.green : C.blue, 4, showFoundation ? [] : [6,5]);
        }
        if (showRich) route(ctx, [[106,225],[317,175]], showFoundation ? C.green : C.blue, 4);

        ctx.fillStyle = C.white; ctx.strokeStyle = showFoundation ? C.green : C.line; ctx.lineWidth = showFoundation ? 3 : 1;
        ctx.beginPath(); ctx.roundRect(434, 126, 92, 58, 5); ctx.fill(); ctx.stroke();
        label(ctx, '3DGS / 几何', 480, 157, showFoundation ? C.green : C.muted, 11, 'center');
        if (showFoundation) route(ctx, [[393,155],[434,155]], C.green, 4);

        if (activeClaim.id === 'monolith') {
          label(ctx, '多个专用组件被组织成统一系统', 280, 218, C.green, 12, 'center');
          label(ctx, '≠ 一个万能网络', 280, 238, C.red, 11, 'center');
        }

        if (activeClaim.id === 'realtime-generation') {
          label(ctx, '712 秒离线生成', 480, 62, C.red, 11, 'center');
          label(ctx, '离线生成 → 实时漫游', 480, 92, C.green, 11, 'center');
        }

        ctx.fillStyle = C.white; ctx.strokeStyle = activeClaim.correct ? C.green : C.red; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.roundRect(136, 269, 290, 27, 4); ctx.fill(); ctx.stroke();
        label(ctx, activeClaim.correct ? '论文明确支持这一系统关系' : '这是需要纠正的常见误读', 281, 287, activeClaim.correct ? C.green : C.red, 11, 'center');
      }} />

      <section className={`contract-evidence ${activeClaim.correct ? 'correct' : 'incorrect'}`}>
        <span>{activeClaim.correct ? '论文支持' : '常见误读'} · 切片 {activeClaim.number}</span>
        <strong>{activeClaim.claim}</strong>
        <p>{activeClaim.evidence}</p>
        <small>{activeClaim.boundary}</small>
        <em>{activeClaim.locator}</em>
      </section>
    </div>

    <div className="contract-claims">
      {systemClaims.map(item => {
        return <button key={item.id} type="button" className={`contract-reading-card ${item.correct ? 'supported' : 'misread'} ${activeClaimId === item.id ? 'active' : ''}`} aria-pressed={activeClaimId === item.id} onClick={() => setActiveClaimId(item.id)}>
          <div className="contract-claim-copy">
            <i>{item.number}</i>
            <strong>{item.claim}</strong>
            <small>{item.correct ? '论文明确支持' : '点击查看为何需要纠正'}</small>
          </div>
          <span className="contract-reading-action">展开证据</span>
        </button>;
      })}
    </div>

    <div className="feedback good">
      这不是答题环节。依次浏览五个切片，可以看到三条论文明确支持的系统关系，以及“单体万能网络”“完整生成实时化”两种常见误读。
    </div>

    {activeClaim.id === 'realtime-generation' ? <PaperTable tableId="table-10" /> : null}

    <div className="contract-glossary-grid">
      <details><summary>统一系统 ≠ 单一网络</summary><p>HY-World 2.0 由 HY-Pano 2.0、WorldNav、WorldStereo 2.0、WorldMirror 2.0、3DGS 优化和 WorldLens 等组件构成。统一发生在任务分流、数据衔接和输出资产层面。</p></details>
      <details><summary>重建为何是生成的基础组件？</summary><p>生成管线先补出多视图观察，再由 WorldMirror 2.0 恢复三维结构，随后优化为 3DGS。没有这一步，生成结果仍只是图像序列而非持久三维资产。</p></details>
      <details><summary>离线生成与实时漫游如何共存？</summary><p>世界资产可以在 WorldLens 中实时渲染、碰撞和角色漫游，但资产生成本身仍是离线、多阶段过程。两者位于生命周期的不同阶段。</p></details>
      <details><summary>“第一”结论的范围是什么？</summary><p>论文自称首个开源、系统化统一生成与重建的多模态世界模型。教程保留“开源、系统化、离线三维范式”这些限定，不扩写成所有世界模型中的绝对首创。</p></details>
    </div>
  </div>;
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
