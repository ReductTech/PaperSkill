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
  const repaintRef = useRef<() => void>(() => undefined);
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
    repaintRef.current = () => paint(performance.now());
    const start = () => { if (raf === null) raf = requestAnimationFrame(paint); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); repaintRef.current = () => undefined; };
  }, [width, height, animate]);
  useEffect(() => { if (!animate) repaintRef.current(); }, [draw, animate]);
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

type PanoramaCaseId = 'metadata' | 'latent-seam' | 'pixel-seam';
type PanoramaFixId = 'implicit' | 'circular' | 'blend';

const panoramaCases: Array<{
  id: PanoramaCaseId;
  index: string;
  title: string;
  symptom: string;
  mechanism: PanoramaFixId;
  observation: string;
}> = [
  {
    id: 'metadata',
    index: 'A',
    title: '相机档案缺页',
    symptom: '焦距与视场角缺失或不准，显式几何投影出现拉伸与错位。',
    mechanism: 'implicit',
    observation: '拖动扫描线，观察显式投影错位如何被统一潜空间中的隐式特征对应取代。',
  },
  {
    id: 'latent-seam',
    index: 'B',
    title: '潜空间两端失联',
    symptom: 'ERP 是环形世界，但去噪特征的左端与右端彼此看不见。',
    mechanism: 'circular',
    observation: '扫描线经过统一潜空间时，左右端从断开的特征边界变成周期邻居。',
  },
  {
    id: 'pixel-seam',
    index: 'C',
    title: '解码边缘仍跳色',
    symptom: '潜空间已经闭环，但最终像素的左右边缘仍有亮度或纹理突变。',
    mechanism: 'blend',
    observation: '把扫描线推向右侧，比较解码后 ERP 边缘从突变到线性过渡的变化。',
  },
];

const panoramaFixes: Array<{
  id: PanoramaFixId;
  title: string;
  layer: string;
  summary: string;
}> = [
  { id: 'implicit', title: '隐式自适应映射', layer: '统一潜空间 · MMDiT', summary: '让自注意力学习透视图到 ERP 的特征对应。' },
  { id: 'circular', title: '循环填充', layer: '潜空间 · 去噪阶段', summary: '把左右端作为周期邻居，约束环形边界。' },
  { id: 'blend', title: '线性像素融合', layer: '像素空间 · 解码之后', summary: '沿 ERP 两侧边缘平滑可见过渡。' },
];

export const HyPanorama: React.FC<WidgetProps> = () => {
  const [activeId, setActiveId] = useState<PanoramaCaseId>('metadata');
  const [reveal, setReveal] = useState(52);
  const activeCase = panoramaCases.find(item => item.id === activeId) ?? panoramaCases[0];
  const activeFix = panoramaFixes.find(item => item.id === activeCase.mechanism) ?? panoramaFixes[0];

  const selectCase = (id: PanoramaCaseId) => {
    setActiveId(id);
    setReveal(52);
  };

  return <div className="panorama-lab">
    <div className="panorama-case-head">
      <div>
        <span>三层修复扫描仪</span>
        <strong>先选故障层，再拖动扫描线比较修复前后</strong>
      </div>
      <small>{activeCase.index}/C 当前层级</small>
    </div>

    <div className="panorama-case-grid">
      {panoramaCases.map(item => {
        return <button
          key={item.id}
          type="button"
          className={activeId === item.id ? 'selected' : ''}
          onClick={() => selectCase(item.id)}
          aria-pressed={activeId === item.id}
        >
          <i>{item.index}</i>
          <span>
            <strong>{item.title}</strong>
            <small>{item.symptom}</small>
          </span>
        </button>;
      })}
    </div>

    <div className="panorama-workbench">
      <div className="panorama-canvas-shell">
        <CanvasView height={286} draw={(ctx) => {
          const drawState = (fixed: boolean) => {
            clearStudio(ctx, 560, 286);
            label(ctx, fixed ? '修复后' : '修复前', fixed ? 28 : 532, 28, fixed ? C.green : C.red, 12, fixed ? 'left' : 'right');
            const nodes = [
              { x: 82, title: '透视输入', layer: '条件' },
              { x: 280, title: '统一潜空间', layer: '去噪' },
              { x: 478, title: 'ERP 输出', layer: '像素' },
            ];
            nodes.forEach((node, index) => {
              const activeNode = activeId === 'metadata' ? index <= 1 : activeId === 'latent-seam' ? index === 1 : index === 2;
              ctx.fillStyle = C.white;
              ctx.strokeStyle = activeNode ? (fixed ? C.green : C.red) : C.line;
              ctx.lineWidth = activeNode ? 3 : 1;
              ctx.beginPath(); ctx.roundRect(node.x - 60, 62, 120, 94, 6); ctx.fill(); ctx.stroke();
              label(ctx, node.title, node.x, 87, activeNode ? C.ink : C.muted, 13, 'center');
              label(ctx, node.layer, node.x, 142, activeNode ? C.blue : C.muted, 11, 'center');
            });
            route(ctx, [[142,109],[220,109]], fixed ? C.green : C.blue, 4, fixed ? [] : [6,5]);
            route(ctx, [[340,109],[418,109]], fixed ? C.green : C.blue, 4, fixed ? [] : [6,5]);
            photo(ctx, 82, 112, activeId === 'metadata' && !fixed ? C.red : C.orange, .82);

            if (activeId === 'metadata') {
              label(ctx, fixed ? '无需精确 K / FoV' : 'K ?   FoV ?', 82, 184, fixed ? C.green : C.red, 12, 'center');
              if (fixed) {
                label(ctx, '条件图像 + 全景噪声', 190, 184, C.blue, 10, 'center');
                label(ctx, '自注意力学习对应', 190, 201, C.green, 10, 'center');
              } else {
                ctx.strokeStyle = C.red; ctx.lineWidth = 5;
                ctx.beginPath(); ctx.moveTo(247, 98); ctx.lineTo(315, 125); ctx.stroke();
                label(ctx, '显式投影错位', 392, 184, C.red, 12, 'center');
              }
            }

            const stripX = activeId === 'latent-seam' ? 235 : 433;
            const stripY = 99;
            ctx.save();
            ctx.beginPath(); ctx.roundRect(stripX, stripY, 90, 27, 3); ctx.clip();
            for (let i = 0; i < 9; i += 1) {
              const palette = fixed ? ['#93c5fd','#86efac','#fcd34d'] : ['#fb7185','#93c5fd','#86efac'];
              ctx.fillStyle = palette[i % palette.length];
              ctx.fillRect(stripX + i * 10, stripY, 10, 27);
            }
            ctx.restore();
            ctx.strokeStyle = fixed ? C.green : C.red; ctx.lineWidth = 3; ctx.strokeRect(stripX, stripY, 90, 27);

            if (activeId === 'latent-seam') {
              ctx.strokeStyle = fixed ? C.green : C.red; ctx.lineWidth = 4;
              ctx.beginPath(); ctx.arc(280, 91, 42, Math.PI, Math.PI * 2); ctx.stroke();
              label(ctx, fixed ? '左右成为周期邻居' : '左右特征断开', fixed ? 160 : 405, 184, fixed ? C.green : C.red, 12, 'center');
            }
            if (activeId === 'pixel-seam') {
              ctx.fillStyle = fixed ? 'rgba(34,141,92,.28)' : 'rgba(196,63,82,.28)';
              ctx.fillRect(433, 94, 13, 37); ctx.fillRect(510, 94, 13, 37);
              label(ctx, fixed ? '像素边缘线性融合' : '解码后仍跳变', fixed ? 365 : 482, 184, fixed ? C.green : C.red, 12, 'center');
            }

            ctx.fillStyle = C.white; ctx.strokeStyle = C.line; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.roundRect(28, 214, 504, 46, 5); ctx.fill(); ctx.stroke();
            label(ctx, fixed ? activeFix.title : activeCase.title, 44, 236, fixed ? C.green : C.red, 13);
            label(ctx, fixed ? activeFix.layer : `故障尚未修复 · ${activeFix.layer}`, 44, 252, C.muted, 10);
          };

          drawState(false);
          const revealX = 28 + (reveal / 100) * 504;
          ctx.save();
          ctx.beginPath(); ctx.rect(0, 0, revealX, 286); ctx.clip();
          drawState(true);
          ctx.restore();
          ctx.strokeStyle = C.orange; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(revealX, 20); ctx.lineTo(revealX, 266); ctx.stroke();
          ctx.fillStyle = C.orange; ctx.beginPath(); ctx.arc(revealX, 202, 7, 0, Math.PI * 2); ctx.fill();
        }} />
      </div>

      <section className="panorama-dossier">
        <span>当前观察层</span>
        <strong>{activeCase.title}</strong>
        <p>{activeCase.symptom}</p>
        <small>{activeCase.observation}</small>
      </section>
    </div>

    <div className="panorama-reveal-control">
      <label htmlFor="panorama-reveal">修复前后扫描线 <span>{reveal}%</span></label>
      <input id="panorama-reveal" type="range" min={8} max={92} value={reveal} onChange={event => setReveal(Number(event.target.value))} />
      <small>左侧显示修复后，右侧保留修复前；扫描线只用于教学对照。</small>
    </div>

    <div className="panorama-mechanism-map">
      {panoramaFixes.map(item => <article key={item.id} className={item.id === activeCase.mechanism ? 'active' : ''}>
        <span>{item.layer}</span><strong>{item.title}</strong><small>{item.summary}</small>
      </article>)}
    </div>

    <div className="feedback good">当前层级对应 <strong>{activeFix.title}</strong>。三种机制不是互相替代：隐式映射处理输入到潜空间的对应，循环填充修复去噪边界，线性融合处理解码后的可见接缝。</div>

    <section className="panorama-evidence-boundary">
      <header><span>论文证据</span><strong>完整系统结果，不由上方按钮计算</strong></header>
      <div>
        <p>论文第 3.2 节明确给出隐式映射、潜空间循环填充与像素线性融合；表 4 报告的是完整 HY-Pano 2.0 在 I2P 协议下的结果。</p>
        <strong>CLIP-I 0.831 → 0.844</strong>
        <small>HY-World 1.0 → HY-Pano 2.0；越高越好</small>
      </div>
    </section>

    <div className="panorama-glossary-grid">
      <details><summary>ERP 为什么有“接缝”？</summary><p>ERP 把球面展开为矩形。矩形最左与最右在球面上其实相邻，如果网络按普通图片处理，两端就可能产生不连续。</p></details>
      <details><summary>MMDiT 在这里做什么？</summary><p>条件图像潜变量与全景噪声潜变量被拼成统一 token 序列，MMDiT 用自注意力在特征空间学习透视图到全景的对应。</p></details>
      <details><summary>循环填充和融合为何都要？</summary><p>循环填充在去噪的潜空间建立周期边界；线性融合在解码后的像素空间平滑可见边缘，二者处于不同层级。</p></details>
      <details><summary>“补全”是否等于真实观测？</summary><p>不是。隐式映射可以根据数据先验生成输入视角外的环境，但未见区域仍是生成结果，不能当作真实测量或确定几何。</p></details>
    </div>

    <EvidenceMediaDrawer mediaType="官方架构图" src="/images/official-stage-pano.webp" title="HY-Pano 2.0：从透视条件到 ERP 与双层接缝修复" caption="官方图同时展示透视条件、ERP 结果、潜空间 Circle Padding 与像素空间 Pixel Blending。可用它核对上方扫描线实验中的三层机制位置。" alt="HY-Pano 2.0 官方全景生成与接缝修复架构图" sourceUrl="https://github.com/Tencent-Hunyuan/HY-World-2.0" sourceLabel="腾讯混元官方仓库素材 ↗" />
    <PaperTable tableId="table-4" />
  </div>;
};

const routeData:{[k:string]:{n:number;note:string;color:string}}={常规:{n:9,note:'离开固定视点，但物体背面仍可能缺失。',color:C.blue},环绕:{n:5,note:'围绕显著物体补足侧面观察。',color:C.green},重建感知:{n:10,note:'针对欠观察区域迭代补拍。',color:C.purple},漫游:{n:3,note:'走向可达区域远端，适合街道和走廊。',color:C.orange},航拍:{n:8,note:'补充俯视角，俯仰因碰撞动态减小。',color:C.brown}};
export const HyTrajectory: React.FC<WidgetProps> = () => { const [mode,setMode]=useState('常规'); const d=routeData[mode]; return <div><CanvasView height={260} draw={(ctx)=>{clearStudio(ctx,560,260);ctx.fillStyle='#cbd5c0';ctx.fillRect(210,65,80,58);ctx.fillRect(380,125,70,55);label(ctx,'障碍',250,96,C.muted,12,'center');const paths:{[k:string]:Array<[number,number]>}={常规:[[55,205],[160,150],[330,190],[500,80]],环绕:[[55,205],[160,150],[195,65],[315,50],[345,145],[500,80]],重建感知:[[55,205],[150,175],[320,205],[345,145],[500,80]],漫游:[[55,205],[100,70],[180,45],[330,55],[500,80]],航拍:[[55,205],[145,150],[280,95],[410,55],[500,80]]};route(ctx,paths[mode],d.color,5);camera(ctx,85,185,d.color,.75);target(ctx,500,80,true);label(ctx,`最大数量 ${d.n}`,410,225,d.color,14);label(ctx,mode,55,35,d.color,15);}}/><div className="chip-row">{Object.keys(routeData).map(x=><button key={x} className={`chip ${mode===x?'selected':''}`} onClick={()=>setMode(x)}>{x}</button>)}</div><div className={`feedback ${mode==='环绕'||mode==='重建感知'?'good':''}`}>{d.note} 这些数量是表 1 的启发式上限，并依赖检测到的对象。</div></div>; };

export const HyKeyframes: React.FC<WidgetProps> = () => { const [run,setRun]=useState(0);const start=useRef(0);const go=()=>{start.current=performance.now();setRun(v=>v+1)};return <div><CanvasView height={250} animate={run>0} draw={(ctx,time)=>{clearStudio(ctx,560,250);const p=run?clamp((time-start.current)/2000,0,1):0;ctx.strokeStyle=C.line;ctx.beginPath();ctx.moveTo(280,25);ctx.lineTo(280,205);ctx.stroke();label(ctx,'Video-VAE',140,30,C.red,14,'center');label(ctx,'Keyframe-VAE',420,30,C.green,14,'center');route(ctx,[[35,180],[235,85]],C.red,3,[6,5]);route(ctx,[[315,180],[515,85]],C.blue,5);camera(ctx,55+p*160,170-p*70,C.red,.68);camera(ctx,335+p*160,170-p*70,C.blue,.68);for(let i=0;i<6;i++)photo(ctx,60+i*30,210-i*13,C.red,.28+i*.08);for(let i=0;i<3;i++)photo(ctx,345+i*70,205-i*38,C.green,1);metricBars(ctx,['RotErr','ATE'],[.762,.492],[C.red,C.green],150,228,70);}}/><div className="step-ctrl"><button className="tiny" onClick={go}>开始同轨比较</button></div><div className={`feedback ${run?'good':''}`}>{run?'选择性冻结 Cross-Attn 与 FFN 后，RotErr 0.762→0.492，ATE 2.141→1.768。全量训练的部分视觉指标更高，但控制精度和泛化更差。':'两侧使用相同起点和时间基准。'}</div></div>; };

const memoryData:{[k:string]:[number,number,number,string]}={'仅相机控制':[16.13,.474,28.81,'没有跨轨迹记忆，质量和一致性最低。'],'GGM+SSM++':[20.94,.640,30.27,'全局骨架和局部检索带来显著提升。'],'空间拼接完整配置':[21.63,.669,30.76,'空间拼接、增强与更大批次形成最终记忆配置。'],'时间拼接替代':[19.83,.581,29.77,'把空间拼接换成时间拼接会在全部指标上退化。']};
export const HyMemory: React.FC<WidgetProps> = () => {const [mode,setMode]=useState('仅相机控制');const d=memoryData[mode];return <div><CanvasView height={260} draw={(ctx)=>{clearStudio(ctx,560,260);camera(ctx,105,138,C.blue,.8);target(ctx,460,105,true);route(ctx,[[135,138],[420,105]],mode==='仅相机控制'?C.red:C.blue,4,mode==='仅相机控制'?[8,6]:[]);ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.arc(285,105,62,0,Math.PI*2);ctx.stroke();label(ctx,'GGM',285,102,C.purple,13,'center');if(mode!=='仅相机控制'){photo(ctx,285,58,C.purple);route(ctx,[[285,76],[370,102]],mode==='时间拼接替代'?C.red:C.green,3,mode==='时间拼接替代'?[5,4]:[]);}metricBars(ctx,['PSNR','SSIM×30','PSNRm'],[d[0],d[1]*30,d[2]],[C.blue,C.orange,C.green],50,220,92);}}/><div className="chip-row">{Object.keys(memoryData).map(x=><button key={x} className={`chip ${mode===x?'selected':''}`} onClick={()=>setMode(x)}>{x}</button>)}</div><div className={`feedback ${mode==='仅相机控制'||mode==='时间拼接替代'?'bad':mode==='空间拼接完整配置'?'good':''}`}>{d[3]} PSNR={d[0]}，SSIM={d[1].toFixed(3)}，PSNRm={d[2]}。</div></div>;};

export default HyAnalogy;
