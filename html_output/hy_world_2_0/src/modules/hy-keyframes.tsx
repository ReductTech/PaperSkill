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

const keyframePoints: Array<[number, number]> = [[48,210],[112,188],[175,151],[235,108],[300,78],[370,68],[444,92],[515,137]];
const keyframeAngles = [-34,-25,-14,-2,12,25,39,55];
const keyframePresets = [
  { id: 'continuous', title: '连续三帧', frames: [0,1,2], note: '重复观察多，首尾跨度小。' },
  { id: 'middle', title: '中段密集', frames: [2,3,4], note: '覆盖转弯中心，但忽略首尾。' },
  { id: 'wide', title: '跨视角', frames: [0,3,7], note: '保留起点、中段与远端视角。' },
] as const;

export const HyKeyframes: React.FC<WidgetProps> = () => {
  const [selectedFrames, setSelectedFrames] = useState<number[]>([0,3,7]);
  const ordered = [...selectedFrames].sort((a,b) => a-b);
  const gaps = ordered.slice(1).map((value,index) => value-ordered[index]);
  const minGap = gaps.length ? Math.min(...gaps) : 0;
  const span = ordered.length > 1 ? ordered[ordered.length-1]-ordered[0] : 0;
  const complete = ordered.length === 3;
  const sparse = complete && minGap >= 2;
  const wide = complete && span >= 6;
  const success = sparse && wide;
  const selectedKey = ordered.join('-');

  const toggleFrame = (index: number) => {
    setSelectedFrames((current) => {
      if (current.includes(index)) return current.filter((item) => item !== index);
      if (current.length >= 3) return current;
      return [...current,index];
    });
  };

  const feedback = !complete
    ? `当前保留 ${ordered.length} 帧，还可加入 ${3-ordered.length} 帧。观察指标会实时显示覆盖结构，但这里没有唯一答案。`
    : !sparse
      ? '当前三帧彼此相邻，重复观察较多。它适合保留局部连续性，但对大视角变化的覆盖有限。'
      : !wide
        ? '当前帧间已经分散，但首尾跨度仍集中在局部区间；转弯两端的观察可能不足。'
        : '当前组合同时满足教学中的稀疏间隔与首尾跨度，适合观察 Keyframe-VAE 为什么强调跨视角关键帧。';

  return (
    <div className="keyframe-lab">
      <section className="keyframe-task-brief">
        <div><span>取景任务</span><strong>用固定 3 帧概括一段快速转弯</strong></div>
        <p><b>目标：</b>减少相邻重复，同时覆盖足够大的视角变化。</p>
        <p><b>观察：</b>帧数、最小间隔和首尾跨度只用于解释采样结构，不是论文训练超参数。</p>
      </section>

      <CanvasView height={280} draw={(ctx) => {
        clearStudio(ctx,560,280);
        label(ctx,'同一条快速转弯轨迹',30,32,C.ink,14);
        route(ctx,keyframePoints,C.line,4);
        keyframePoints.forEach(([x,y],index) => {
          const selected = selectedFrames.includes(index);
          ctx.fillStyle = selected ? C.blue : C.white;
          ctx.strokeStyle = selected ? C.blue : '#aab4c4';
          ctx.lineWidth = selected ? 4 : 2;
          ctx.beginPath(); ctx.arc(x,y,selected?9:6,0,Math.PI*2); ctx.fill(); ctx.stroke();
          label(ctx,`F${index+1}`,x,y+25,selected?C.blue:C.muted,10,'center');
          if (selected) {
            const angle = keyframeAngles[index]*Math.PI/180;
            route(ctx,[[x,y],[x+Math.cos(angle)*42,y-Math.sin(angle)*42]],C.orange,3);
            camera(ctx,x,y,C.blue,.44);
          }
        });
        label(ctx,success?'稀疏且跨视角':'检查帧间重复与首尾跨度',530,32,success?C.green:C.orange,12,'right');
      }} />

      <div className="keyframe-picker-head">
        <div><span>从 8 个候选视角中保留 3 帧</span><strong>{ordered.length} / 3 已选</strong></div>
      </div>

      <div className="keyframe-presets" role="group" aria-label="切换关键帧取景预设">
        {keyframePresets.map((preset) => {
          const active = selectedKey === preset.frames.join('-');
          return <button key={preset.id} type="button" className={active?'selected':''} aria-pressed={active} onClick={() => setSelectedFrames([...preset.frames])}><strong>{preset.title}</strong><small>{preset.note}</small></button>;
        })}
      </div>

      <div className="keyframe-picker" role="group" aria-label="选择三张关键帧">
        {keyframePoints.map((_,index) => {
          const selected = selectedFrames.includes(index);
          const disabled = !selected && selectedFrames.length >= 3;
          return (
            <button key={index} type="button" className={selected?'selected':''} aria-pressed={selected} disabled={disabled} onClick={() => toggleFrame(index)}>
              <span className="keyframe-thumb" style={{'--object-shift': `${8+index*5}%`,'--camera-shift': `${8+index*3}%`} as React.CSSProperties}><i /></span>
              <strong>F{index+1}</strong>
              <small>{keyframeAngles[index] > 0 ? '+' : ''}{keyframeAngles[index]}°</small>
            </button>
          );
        })}
      </div>

      <div className="keyframe-diagnostics">
        <div className={complete?'ready':'waiting'}><span>帧数约束</span><strong>{complete?'3 帧已满':'尚未选满'}</strong></div>
        <div className={sparse?'ready':'waiting'}><span>最小间隔</span><strong>{complete?`${minGap} 个候选位`:'等待选满'}</strong></div>
        <div className={wide?'ready':'waiting'}><span>首尾跨度</span><strong>{complete?`${span} 个候选位`:'等待选满'}</strong></div>
      </div>

      <div className="keyframe-encoding-compare">
        <div className="video-vae"><span>Video-VAE 观察方式</span><strong>连续帧一起做时空压缩</strong><p>相邻画面很多，但快速视角变化中的高频外观和几何容易在时间压缩中受损。</p></div>
        <i aria-hidden="true">→</i>
        <div className="keyframe-vae"><span>Keyframe-VAE 观察方式</span><strong>{success?'稀疏关键帧覆盖整段转弯':'等待更分散的三帧'}</strong><p>去除时间压缩，优先保留跨视角关键帧的外观与相机条件。</p></div>
      </div>

      <div className={`feedback ${success?'good':''}`}>{feedback}</div>

      <section className="keyframe-paper-evidence">
        <header><span>论文证据，不由上方选择器计算</span><strong>选择性冻结 Cross-Attn 与 FFN 后，相机误差下降</strong></header>
        <div className="keyframe-metric-row"><span>RotErr ↓</span><div><i className="baseline" style={{width:'95%'}} /><i className="result" style={{width:'61%'}} /></div><strong>0.762 → 0.492</strong></div>
        <div className="keyframe-metric-row"><span>ATE ↓</span><div><i className="baseline" style={{width:'97%'}} /><i className="result" style={{width:'80%'}} /></div><strong>2.141 → 1.768</strong></div>
        <p>两项指标均为越低越好；全量训练的部分视觉指标更高，但相机控制精度和泛化更差。</p>
      </section>

      <div className="keyframe-glossary-head">
        <strong>镜头术语暗格</strong>
        <span>灰色提示：点击术语展开；以下内容用于补充机制直觉，不改变上方论文指标。</span>
      </div>
      <div className="keyframe-glossary-grid">
        <details><summary>Keyframe-VAE 与 Video-VAE 差在哪？</summary><p>Video-VAE 会同时压缩时间和空间，适合连续视频；WorldStereo 2.0 面对跨视角稀疏关键帧时去掉时间压缩，优先保留单帧外观、几何和相机条件。它不是“只允许三帧”，三帧只是上方教学沙盘的固定对照条件。</p></details>
        <details><summary>Plücker 射线在告诉模型什么？</summary><p>它把相机中心与像素射线方向编码为逐像素几何条件，帮助模型理解“这条光线从哪里出发、朝哪里看”。它提供相机几何，不等于已经知道场景真实深度。</p></details>
        <details><summary>点图条件为什么能补充射线？</summary><p>点图为像素提供三维位置线索，使模型除了知道观察方向，还能获得显式空间位置参考。论文将射线与点图作为互补相机条件；教程不把二者合成一个虚构控制分数。</p></details>
        <details><summary>为什么选择性冻结会有取舍？</summary><p>冻结 Cross-Attn 与 FFN 的部分参数，可以保留预训练生成先验并减少相机控制训练对它们的扰动。论文消融显示相机误差与泛化更好，但部分视觉指标并非最高，因此不能简单理解为“冻结越多越好”。</p></details>
      </div>
    </div>
  );
};

const memoryData:{[k:string]:[number,number,number,string]}={'仅相机控制':[16.13,.474,28.81,'没有跨轨迹记忆，质量和一致性最低。'],'GGM+SSM++':[20.94,.640,30.27,'全局骨架和局部检索带来显著提升。'],'空间拼接完整配置':[21.63,.669,30.76,'空间拼接、增强与更大批次形成最终记忆配置。'],'时间拼接替代':[19.83,.581,29.77,'把空间拼接换成时间拼接会在全部指标上退化。']};
export const HyMemory: React.FC<WidgetProps> = () => {const [mode,setMode]=useState('仅相机控制');const d=memoryData[mode];return <div><CanvasView height={260} draw={(ctx)=>{clearStudio(ctx,560,260);camera(ctx,105,138,C.blue,.8);target(ctx,460,105,true);route(ctx,[[135,138],[420,105]],mode==='仅相机控制'?C.red:C.blue,4,mode==='仅相机控制'?[8,6]:[]);ctx.strokeStyle=C.purple;ctx.lineWidth=3;ctx.beginPath();ctx.arc(285,105,62,0,Math.PI*2);ctx.stroke();label(ctx,'GGM',285,102,C.purple,13,'center');if(mode!=='仅相机控制'){photo(ctx,285,58,C.purple);route(ctx,[[285,76],[370,102]],mode==='时间拼接替代'?C.red:C.green,3,mode==='时间拼接替代'?[5,4]:[]);}metricBars(ctx,['PSNR','SSIM×30','PSNRm'],[d[0],d[1]*30,d[2]],[C.blue,C.orange,C.green],50,220,92);}}/><div className="chip-row">{Object.keys(memoryData).map(x=><button key={x} className={`chip ${mode===x?'selected':''}`} onClick={()=>setMode(x)}>{x}</button>)}</div><div className={`feedback ${mode==='仅相机控制'||mode==='时间拼接替代'?'bad':mode==='空间拼接完整配置'?'good':''}`}>{d[3]} PSNR={d[0]}，SSIM={d[1].toFixed(3)}，PSNRm={d[2]}。</div></div>;};

export default HyAnalogy;
