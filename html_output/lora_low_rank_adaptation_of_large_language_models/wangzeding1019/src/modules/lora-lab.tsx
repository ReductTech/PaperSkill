import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 300;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', blue: '#27446e',
  green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed',
  text: '#21324a', muted: '#68778f', line: '#d7deea', white: '#ffffff',
};

type Draw = (ctx: CanvasRenderingContext2D, t: number) => void;

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 12) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = C.line) {
  rounded(ctx, x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text, size = 22, align: CanvasTextAlign = 'left') {
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = ctx.canvas.width / dpr;
  const mobileBoost = window.innerWidth <= 720 ? (logicalWidth >= 900 ? 2.2 : 1.3) : 1;
  ctx.fillStyle = color;
  ctx.font = `600 ${Math.round(size * mobileBoost)}px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.blue) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 12 * Math.cos(a - Math.PI / 6), y2 - 12 * Math.sin(a - Math.PI / 6));
  ctx.lineTo(x2 - 12 * Math.cos(a + Math.PI / 6), y2 - 12 * Math.sin(a + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function bars(ctx: CanvasRenderingContext2D, values: number[], x: number, y: number, w: number, h: number, colors: string[]) {
  const max = Math.max(...values, 1);
  const gap = 28;
  const bw = (w - gap * (values.length - 1)) / values.length;
  values.forEach((v, i) => {
    const bh = (v / max) * h;
    box(ctx, x + i * (bw + gap), y + h - bh, bw, bh, colors[i] || C.blue, colors[i] || C.blue);
    label(ctx, String(v), x + i * (bw + gap) + bw / 2, y + h - bh - 18, C.text, 18, 'center');
  });
}

function CanvasPanel({ draw, deps, width = W, height = H, animate = false, onPointerDown, onPointerMove }:
  { draw: Draw; deps: React.DependencyList; width?: number; height?: number; animate?: boolean;
    onPointerDown?: React.PointerEventHandler<HTMLCanvasElement>; onPointerMove?: React.PointerEventHandler<HTMLCanvasElement> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, width, height); } catch { return; }
    let raf: number | null = null;
    const startAt = performance.now();
    const paint = () => {
      draw(ctx, (performance.now() - startAt) / 1000);
      canvas.classList.add('is-ready');
      if (animate) raf = requestAnimationFrame(paint);
    };
    const start = () => { if (raf === null) raf = requestAnimationFrame(paint); };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    if (!animate) paint();
    const disconnect = animate ? observeCanvas(canvas, start, stop) : () => undefined;
    return () => { stop(); disconnect(); };
  }, deps);
  return <canvas ref={ref} width={width} height={height} onPointerDown={onPointerDown} onPointerMove={onPointerMove} />;
}

function Scene({ chapterId, moduleId }: WidgetProps) {
  const draw: Draw = (ctx, t) => {
    const sceneW = 560;
    ctx.clearRect(0, 0, sceneW, 140);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, sceneW, 140);
    if (chapterId === 'hero') {
      const title = moduleId === 'old' ? '完整副本' : '共享 + 小更新';
      const titleColor = moduleId === 'old' ? C.red : C.green;
      const titleW = moduleId === 'old' ? 132 : 190;
      box(ctx, (sceneW - titleW) / 2, 8, titleW, 32, C.white, titleColor);
      label(ctx, title, sceneW / 2, 24, titleColor, 18, 'center');

      if (moduleId === 'old') {
        [0, 1, 2].forEach((i) => box(ctx, 68 + i * 154, 54, 116, 68, '#fff5f5', C.red));
      } else {
        box(ctx, 52, 54, 232, 68, '#eef3fa', C.blue);
        [0, 1, 2].forEach((i) => box(ctx, 340 + i * 64, 64, 42, 48, '#ecf8f2', C.green));
      }
      return;
    }

    const chapter = Number(chapterId.replace('chap-', '')) || 1;
    const progress = (Math.sin(t * 1.6) + 1) / 2;
    const railStart = 154;
    const railEnd = 518;
    const x = railStart + progress * (railEnd - railStart);

    box(ctx, 22, 10, 98, 34, C.white, C.muted);
    label(ctx, `第${chapter}章`, 71, 27, C.muted, 18, 'center');

    ctx.strokeStyle = '#cbd5c5';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(railStart, 27);
    ctx.lineTo(railEnd, 27);
    ctx.stroke();
    ctx.lineCap = 'butt';

    for (let y = 64; y <= 124; y += 20) {
      ctx.strokeStyle = '#dbe4d5'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(22, y); ctx.lineTo(sceneW - 22, y); ctx.stroke();
    }
    if (chapter === 1) {
      for (let i = 0; i < 4; i++) box(ctx, 170 + i * 72, 74 - i * 4, 58, 50, '#fff5f5', C.red);
    } else if (chapter === 4 || chapter === 7) {
      [170, 240, 310, 380].forEach((nx, i) => box(ctx, nx, 72, 54, 46, i % 2 ? '#ecf8f2' : '#eef3fa', i % 2 ? C.green : C.blue));
    } else {
      box(ctx, 145, 64, 270, 64, '#eef3fa', C.blue);
      box(ctx, 230, 78, 100, 36, '#ecf8f2', C.green);
    }
    ctx.fillStyle = C.orange;
    ctx.beginPath(); ctx.arc(x, 24, 10, 0, Math.PI * 2); ctx.fill();
  };
  return <CanvasPanel draw={draw} deps={[chapterId, moduleId]} width={560} height={140} animate />;
}

function CostScaling() {
  const [tasks, setTasks] = useState(4);
  const draw: Draw = (ctx) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    box(ctx, 54, 72, 210, 156, '#eef3fa', C.blue);
    label(ctx, '共享模型', 159, 150, C.blue, 25, 'center');
    const visible = Math.min(tasks, 20);
    const gap = 12; const bw = Math.max(10, Math.min(28, (710 - gap * (visible - 1)) / visible));
    const total = visible * bw + (visible - 1) * gap;
    for (let i = 0; i < visible; i++) {
      const height = 72 + (i % 4) * 22;
      box(ctx, 318 + i * (bw + gap), 230 - height, bw, height, '#fff1f2', C.red);
    }
    label(ctx, `${tasks} 个任务`, 680, 44, C.text, 25, 'center');
    label(ctx, `${(tasks * 175).toLocaleString()}B`, 680, 266, C.red, 23, 'center');
    ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(318, 236); ctx.lineTo(318 + total, 236); ctx.stroke();
  };
  return <div>
    <CanvasPanel draw={draw} deps={[tasks]} />
    <div className="ctrl"><label>任务数量 <span className="val">{tasks}</span></label><input aria-label="任务数量" type="range" min={1} max={20} step={1} value={tasks} onChange={(e) => setTasks(Number(e.target.value))} /></div>
    <div className={`feedback ${tasks >= 10 ? 'bad' : ''}`}>{tasks >= 10 ? `仅任务副本就相当于 ${tasks} 套完整更新，存储压力迅速变大。` : `当前需要保存 ${tasks} 套与基础模型同维度的任务更新。`}</div>
  </div>;
}

function MethodChoice() {
  const [mode, setMode] = useState<'full' | 'lora'>('full');
  const tasks = 12;
  const perTask = mode === 'full' ? 175000 : 4.7;
  const draw: Draw = (ctx) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const max = 175000 * tasks;
    const value = perTask * tasks;
    box(ctx, 95, 72, 260, 155, '#eef3fa', C.blue);
    label(ctx, '基础模型', 225, 150, C.blue, 26, 'center');
    const width = Math.max(18, 560 * Math.sqrt(value / max));
    box(ctx, 430, 112, width, 78, mode === 'full' ? '#fff1f2' : '#ecf8f2', mode === 'full' ? C.red : C.green);
    label(ctx, mode === 'full' ? '完整更新' : '低秩更新', 710, 74, mode === 'full' ? C.red : C.green, 25, 'center');
    label(ctx, mode === 'full' ? '2,100,000M' : '56.4M', 710, 232, C.text, 22, 'center');
  };
  return <div>
    <CanvasPanel draw={draw} deps={[mode]} />
    <div className="chip-row" role="group" aria-label="适配方式">
      <button className={`chip ${mode === 'full' ? 'selected' : ''}`} onClick={() => setMode('full')}>完整微调</button>
      <button className={`chip ${mode === 'lora' ? 'selected' : ''}`} onClick={() => setMode('lora')}>LoRA 更新</button>
    </div>
    <div className={`feedback ${mode === 'lora' ? 'good' : 'bad'}`}>{mode === 'lora' ? '同一基础模型可被 12 个任务共享，每个任务只保存小型因子。' : '12 个任务各自保存完整更新，任务增量成为主要成本。'}</div>
  </div>;
}

function LowRankBuilder() {
  const [rank, setRank] = useState(2);
  const target = [0.9, 0.66, 0.43, 0.26, 0.14, 0.08];
  const kept = target.slice(0, rank).reduce((a, b) => a + b, 0) / target.reduce((a, b) => a + b, 0);
  const draw: Draw = (ctx) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const x0 = 150, y0 = 50, cell = 32;
    for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) {
      const active = col < rank;
      ctx.fillStyle = active ? `rgba(34,141,92,${0.22 + 0.1 * ((row + col) % 4)})` : '#e8ede5';
      ctx.fillRect(x0 + col * cell, y0 + row * cell, cell - 3, cell - 3);
    }
    arrow(ctx, 390, 146, 550, 146, C.orange);
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = i < rank ? C.green : C.line; ctx.lineWidth = i < rank ? 6 : 2;
      ctx.beginPath(); ctx.moveTo(610, 235 - i * 26); ctx.lineTo(910, 235 - i * 26 - target[i] * 75); ctx.stroke();
    }
    label(ctx, `${rank} 个方向`, 246, 264, C.orange, 23, 'center');
    label(ctx, `${Math.round(kept * 100)}%`, 760, 264, C.green, 23, 'center');
  };
  return <div>
    <CanvasPanel draw={draw} deps={[rank]} />
    <div className="chip-row" role="group" aria-label="保留方向数">{[1,2,3,4,5,6].map((r) => <button key={r} className={`chip ${rank === r ? 'selected' : ''}`} onClick={() => setRank(r)}>{r}</button>)}</div>
    <div className={`feedback ${rank >= 3 ? 'good' : ''}`}>保留前 {rank} 个方向，覆盖约 {Math.round(kept * 100)}% 的目标更新结构。</div>
  </div>;
}

function FactorRoute() {
  const [step, setStep] = useState(0);
  const nodes = [
    { x: 70, w: 130, name: 'x', dim: 'k' },
    { x: 255, w: 140, name: 'A', dim: 'r×k' },
    { x: 450, w: 130, name: 'r维', dim: 'r' },
    { x: 635, w: 140, name: 'B', dim: 'd×r' },
    { x: 830, w: 170, name: 'Δh', dim: 'd' },
  ];
  const draw: Draw = (ctx) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    nodes.forEach((n, i) => {
      const active = i <= step;
      box(ctx, n.x, 92, n.w, 105, active ? '#ecf8f2' : '#ffffff', active ? C.green : C.line);
      label(ctx, n.name, n.x + n.w / 2, 130, active ? C.green : C.muted, 26, 'center');
      label(ctx, n.dim, n.x + n.w / 2, 170, C.muted, 18, 'center');
      if (i < nodes.length - 1) arrow(ctx, n.x + n.w + 10, 145, nodes[i + 1].x - 12, 145, i < step ? C.green : C.line);
    });
    label(ctx, '冻结主路 W₀x 同时保留', 540, 250, C.blue, 22, 'center');
  };
  return <div>
    <CanvasPanel draw={draw} deps={[step]} />
    <div className="ctrl"><button className="tiny ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>上一步</button><label>传播步骤 <span className="val">{step + 1}/5</span></label><button className="tiny" disabled={step === 4} onClick={() => setStep((s) => Math.min(4, s + 1))}>下一步</button></div>
    <div className="feedback good">{['输入 x 同时进入冻结主路与低秩旁路。','A 把 k 维输入压到 r 维。','r 维瓶颈限制更新的独立方向。','B 把低维表示展开回 d 维。','低秩增量与 W₀x 逐坐标相加。'][step]}</div>
  </div>;
}

const table5 = [
  { id: 'Wq', r: 8, wiki: 70.4, mnli: 91.0 }, { id: 'Wk', r: 8, wiki: 70.0, mnli: 90.8 },
  { id: 'Wv', r: 8, wiki: 73.0, mnli: 91.0 }, { id: 'Wo', r: 8, wiki: 73.2, mnli: 91.3 },
  { id: 'Wq+Wk', r: 4, wiki: 71.4, mnli: 91.3 }, { id: 'Wq+Wv', r: 4, wiki: 73.7, mnli: 91.3 },
  { id: '四投影', r: 2, wiki: 73.7, mnli: 91.7 },
];

function ArchitectureMap() {
  const [selected, setSelected] = useState<string[]>(['Wq', 'Wv']);
  const [note, setNote] = useState('论文多数实验选择 Wq 与 Wv。');
  const toggle = (id: string) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
    setNote(`${id} 是自注意力中的稠密投影，可应用 LoRA。`);
  };
  const draw: Draw = (ctx) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    box(ctx, 75, 98, 160, 104, '#eef3fa', C.blue); label(ctx, '输入', 155, 150, C.blue, 25, 'center');
    ['Wq','Wk','Wv','Wo'].forEach((id, i) => {
      const x = 330 + i * 155; const active = selected.includes(id);
      box(ctx, x, 100, 105, 100, active ? '#ecf8f2' : '#ffffff', active ? C.green : C.line);
      label(ctx, id, x + 52, 150, active ? C.green : C.muted, 24, 'center');
    });
    arrow(ctx, 245, 150, 310, 150, C.blue); arrow(ctx, 950, 150, 1020, 150, C.blue);
    label(ctx, `${selected.length} 处`, 540, 250, C.orange, 24, 'center');
  };
  return <div>
    <CanvasPanel draw={draw} deps={[selected.join('|')]} />
    <div className="chip-row">{['Wq','Wk','Wv','Wo'].map((id) => <button key={id} className={`chip ${selected.includes(id) ? 'selected' : ''}`} onClick={() => toggle(id)}>{id}</button>)}<button className="chip" onClick={() => setNote('LoRA 可以适配 MLP；论文主实验选择冻结 MLP，并聚焦注意力投影。')}>MLP</button></div>
    <div className={`feedback ${selected.length ? 'good' : 'bad'}`}>{selected.length ? note : '至少选择一个投影，才能形成任务更新路径。'}</div>
  </div>;
}

function FixedBudget() {
  const [idx, setIdx] = useState(5); const row = table5[idx];
  const draw: Draw = (ctx) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    box(ctx, 70, 72, 250, 155, '#fff8ef', C.orange); label(ctx, '18M', 195, 130, C.orange, 38, 'center'); label(ctx, `r = ${row.r}`, 195, 184, C.text, 23, 'center');
    bars(ctx, [row.wiki, row.mnli], 470, 65, 430, 170, [C.green, C.blue]);
    label(ctx, 'WikiSQL', 575, 264, C.muted, 18, 'center'); label(ctx, 'MultiNLI', 795, 264, C.muted, 18, 'center');
  };
  return <div>
    <CanvasPanel draw={draw} deps={[idx]} />
    <div className="chip-row">{table5.map((r, i) => <button key={r.id} className={`chip ${i === idx ? 'selected' : ''}`} onClick={() => setIdx(i)}>{r.id}</button>)}</div>
    <div className="feedback good">{row.id}：r={row.r}，WikiSQL {row.wiki}%，MultiNLI {row.mnli}%。固定预算下，位置与秩必须一起读。</div>
  </div>;
}

function DeploymentModes() {
  const [mode, setMode] = useState<'train'|'merge'|'dynamic'>('train');
  const draw: Draw = (ctx) => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    box(ctx, 110, 80, 250, 140, '#eef3fa', C.blue); label(ctx, 'W₀', 235, 150, C.blue, 36, 'center');
    if (mode === 'merge') {
      box(ctx, 600, 80, 300, 140, '#ecf8f2', C.green); label(ctx, 'W₀ + BA', 750, 150, C.green, 31, 'center'); arrow(ctx, 390,150,570,150,C.green);
    } else {
      box(ctx, 610, 58, 125, 90, '#ecf8f2', C.green); label(ctx, 'A', 672, 103, C.green, 28, 'center');
      box(ctx, 775, 152, 125, 90, '#ecf8f2', C.green); label(ctx, 'B', 837, 197, C.green, 28, 'center');
      arrow(ctx, 390,150,580,150,mode === 'train' ? C.orange : C.purple);
    }
    label(ctx, mode === 'train' ? '只训练 A、B' : mode === 'merge' ? '原结构推理' : '随时换任务', 540, 266, mode === 'train' ? C.orange : C.green, 23, 'center');
  };
  const copy = mode === 'train' ? 'W₀ 冻结，只为 A、B 保存梯度与优化器状态。' : mode === 'merge' ? '先计算 W=W₀+BA，推理时不增加额外层。' : '保持因子分离便于动态切换，但混合任务批处理与零延迟不能同时轻松获得。';
  return <div><CanvasPanel draw={draw} deps={[mode]} /><div className="chip-row">{[['train','训练'],['merge','合并推理'],['dynamic','动态切换']].map(([id,t]) => <button key={id} className={`chip ${mode===id?'selected':''}`} onClick={() => setMode(id as typeof mode)}>{t}</button>)}</div><div className={`feedback ${mode==='dynamic'?'':'good'}`}>{copy}</div></div>;
}

const benchmarks = [
  { id: 'DeBERTa XXL', metric: 'GLUE 平均', loraP: 4.7, ftP: 1500, lora: 91.3, ft: 91.1, note: '表2；这里展示各 GLUE 子任务得分的平均值。' },
  { id: 'GPT-2 M', metric: 'E2E BLEU', loraP: 0.35, ftP: 354.92, lora: 70.4, ft: 68.2, note: '表3；完整微调数值来自既有工作，指标越高越好。' },
  { id: 'GPT-3', metric: 'MNLI-m', loraP: 4.7, ftP: 175255.8, lora: 91.7, ft: 89.5, note: '表4；验证准确率，典型随机波动约 ±0.1%。' },
];

function BenchmarkEvidence() {
  const [idx, setIdx] = useState(0); const b = benchmarks[idx];
  const draw: Draw = (ctx) => {
    ctx.clearRect(0,0,W,H); ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H);
    const ratio = Math.log10(b.ftP / b.loraP + 1);
    box(ctx,70,55,400,190,'#fff5f5',C.red); label(ctx,'完整微调',270,92,C.red,23,'center'); label(ctx,b.ftP.toLocaleString()+'M',270,155,C.text,30,'center'); label(ctx,String(b.ft),270,212,C.red,24,'center');
    box(ctx,610,55,400,190,'#ecf8f2',C.green); label(ctx,'LoRA',810,92,C.green,23,'center'); label(ctx,b.loraP+'M',810,155,C.text,30,'center'); label(ctx,String(b.lora),810,212,C.green,24,'center');
    ctx.fillStyle=C.orange; ctx.fillRect(520,235,Math.min(55,ratio*14),8);
  };
  return <div><CanvasPanel draw={draw} deps={[idx]} /><div className="chip-row">{benchmarks.map((x,i)=><button key={x.id} className={`chip ${i===idx?'selected':''}`} onClick={()=>setIdx(i)}>{x.id}</button>)}</div><div className="feedback good">{b.metric}：LoRA {b.lora}，完整微调 {b.ft}。{b.note}</div></div>;
}

function ProjectionBudget() {
  const [idx,setIdx]=useState(5); const row=table5[idx];
  const draw: Draw=(ctx)=>{
    ctx.clearRect(0,0,W,H);ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
    const nodes=['Wq','Wk','Wv','Wo']; nodes.forEach((n,i)=>{const active=row.id==='四投影'||row.id.split('+').includes(n);box(ctx,90+i*205,68,155,90,active?'#ecf8f2':'#fff',active?C.green:C.line);label(ctx,n,167+i*205,113,active?C.green:C.muted,25,'center');});
    label(ctx,`r = ${row.r}`,540,205,C.orange,28,'center');
    const wikiW=(row.wiki-68)*70,mnliW=(row.mnli-89)*125;ctx.fillStyle=C.green;ctx.fillRect(250,242,wikiW,18);ctx.fillStyle=C.blue;ctx.fillRect(250,272,mnliW,18);label(ctx,row.wiki.toFixed(1),210,251,C.green,19,'right');label(ctx,row.mnli.toFixed(1),210,281,C.blue,19,'right');
  };
  return <div><CanvasPanel draw={draw} deps={[idx]} /><div className="chip-row">{table5.map((x,i)=><button key={x.id} className={`chip ${i===idx?'selected':''}`} onClick={()=>setIdx(i)}>{x.id}</button>)}</div><div className={`feedback ${idx===5||idx===6?'good':''}`}>18M 参数：{row.id} 使用 r={row.r}；WikiSQL {row.wiki}%，MultiNLI {row.mnli}%。</div></div>;
}

const ranks=[1,2,4,8,64];
const rankData: Record<string, {wiki:number[];mnli:number[]}> = {
  'Wq': { wiki:[68.8,69.6,70.5,70.4,70.0], mnli:[90.7,90.9,91.1,90.7,90.7] },
  'Wq+Wv': { wiki:[73.4,73.3,73.7,73.8,73.5], mnli:[91.3,91.4,91.3,91.6,91.4] },
  '四投影': { wiki:[74.1,73.7,74.0,74.0,73.9], mnli:[91.2,91.7,91.7,91.5,91.4] },
};

function RankCurve() {
  const [setName,setSetName]=useState('Wq+Wv'); const [dataset,setDataset]=useState<'wiki'|'mnli'>('wiki'); const [ri,setRi]=useState(0);
  const vals=rankData[setName][dataset]; const min=Math.min(...vals)-0.3,max=Math.max(...vals)+0.3;
  const px=(i:number)=>130+i*205; const py=(v:number)=>238-(v-min)/(max-min)*155;
  const draw:Draw=(ctx)=>{
    ctx.clearRect(0,0,W,H);ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
    ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(100,245);ctx.lineTo(980,245);ctx.stroke();
    ctx.strokeStyle=C.green;ctx.lineWidth=5;ctx.beginPath();vals.forEach((v,i)=>{const x=px(i),y=py(v);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
    vals.forEach((v,i)=>{ctx.fillStyle=i===ri?C.orange:C.green;ctx.beginPath();ctx.arc(px(i),py(v),i===ri?11:6,0,Math.PI*2);ctx.fill();label(ctx,String(ranks[i]),px(i),270,C.muted,17,'center');});
    label(ctx,vals[ri].toFixed(1),px(ri),py(vals[ri])-25,C.orange,23,'center');label(ctx,dataset==='wiki'?'WikiSQL':'MultiNLI',90,32,C.blue,20,'left');
  };
  return <div><CanvasPanel draw={draw} deps={[setName,dataset,ri]} /><div className="chip-row">{Object.keys(rankData).map(n=><button key={n} className={`chip ${setName===n?'selected':''}`} onClick={()=>setSetName(n)}>{n}</button>)}<button className={`chip ${dataset==='wiki'?'selected':''}`} onClick={()=>setDataset('wiki')}>WikiSQL</button><button className={`chip ${dataset==='mnli'?'selected':''}`} onClick={()=>setDataset('mnli')}>MultiNLI</button></div><div className="ctrl"><label>实验秩 <span className="val">r={ranks[ri]}</span></label><input aria-label="实验秩" type="range" min={0} max={4} step={1} value={ri} onChange={e=>setRi(Number(e.target.value))}/></div><div className="feedback good">r={ranks[ri]} 时验证准确率为 {vals[ri].toFixed(1)}%，更大的 r 没有带来单调提升。</div></div>;
}

function SubspaceOverlap() {
  const [ij,setIj]=useState({i:1,j:1}); const x0=330,y0=34,cellX=72,cellY=28;
  const sim=(i:number,j:number)=>clamp(0.92-Math.abs(i-j)*0.09-(Math.max(i,j)-1)*0.035,0.08,0.92);
  const pick=(e:React.PointerEvent<HTMLCanvasElement>)=>{const rect=e.currentTarget.getBoundingClientRect();const x=(e.clientX-rect.left)*W/rect.width;const y=(e.clientY-rect.top)*H/rect.height;const j=Math.floor((x-x0)/cellX)+1;const i=Math.floor((y-y0)/cellY)+1;if(i>=1&&i<=8&&j>=1&&j<=8)setIj({i,j});};
  const draw:Draw=(ctx)=>{
    ctx.clearRect(0,0,W,H);ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
    for(let i=1;i<=8;i++)for(let j=1;j<=8;j++){const v=sim(i,j);ctx.fillStyle=`rgba(39,68,110,${v})`;ctx.fillRect(x0+(j-1)*cellX,y0+(i-1)*cellY,cellX-3,cellY-2);if(i===ij.i&&j===ij.j){ctx.strokeStyle=C.orange;ctx.lineWidth=5;ctx.strokeRect(x0+(j-1)*cellX-2,y0+(i-1)*cellY-2,cellX+1,cellY+2);}}
    label(ctx,`i=${ij.i}, j=${ij.j}`,180,110,C.orange,25,'center');label(ctx,sim(ij.i,ij.j).toFixed(2),180,180,C.green,38,'center');label(ctx,'拖动热图',618,278,C.muted,18,'center');
  };
  return <div><CanvasPanel draw={draw} deps={[ij.i,ij.j]} onPointerDown={(e)=>{e.currentTarget.setPointerCapture(e.pointerId);pick(e);}} onPointerMove={(e)=>{if(e.buttons===1)pick(e);}}/><div className={`feedback ${sim(ij.i,ij.j)>0.5?'good':''}`}>当前归一化相似度 φ≈{sim(ij.i,ij.j).toFixed(2)}。靠近首要方向时重合更强，呈现出少数稳定方向。</div></div>;
}

const ampData={
  4:{delta:0.32,base:21.67,random:0.02,total:6.91},
  64:{delta:1.90,base:37.71,random:0.33,total:3.57},
};

function Amplification() {
  const [rank,setRank]=useState<4|64>(4); const [basis,setBasis]=useState<'delta'|'base'|'random'>('delta'); const d=ampData[rank]; const v=basis==='delta'?d.delta:basis==='base'?d.base:d.random;
  const draw:Draw=(ctx)=>{ctx.clearRect(0,0,W,H);ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);bars(ctx,[d.delta,d.base,d.random],190,65,700,170,[C.green,C.blue,C.muted]);label(ctx,'ΔW',290,265,C.green,19,'center');label(ctx,'W',540,265,C.blue,19,'center');label(ctx,'随机',790,265,C.muted,19,'center');ctx.strokeStyle=C.orange;ctx.lineWidth=5;const centers={delta:290,base:540,random:790};ctx.beginPath();ctx.moveTo(centers[basis]-45,45);ctx.lineTo(centers[basis]+45,45);ctx.stroke();};
  const factor=basis==='delta'&&v>0?(d.total/v).toFixed(1):null;
  return <div><CanvasPanel draw={draw} deps={[rank,basis]}/><div className="chip-row"><button className={`chip ${rank===4?'selected':''}`} onClick={()=>setRank(4)}>r=4</button><button className={`chip ${rank===64?'selected':''}`} onClick={()=>setRank(64)}>r=64</button>{(['delta','base','random'] as const).map(x=><button key={x} className={`chip ${basis===x?'selected':''}`} onClick={()=>setBasis(x)}>{x==='delta'?'ΔW 子空间':x==='base'?'W 顶层':'随机方向'}</button>)}</div><div className="feedback good">所选投影范数为 {v.toFixed(2)}。{factor?`相对 ΔW 自身范数的放大比例约 ${factor} 倍；论文据此解释任务方向被显著增强。`:'与 ΔW 子空间对照，说明更新并非简单重复 W 的最强方向。'}</div></div>;
}

function DecisionRoute() {
  const [scenario,setScenario]=useState<'latency'|'mixed'|'shift'>('latency');
  const result=scenario==='latency'?{title:'合并 LoRA',color:C.green,copy:'任务固定且延迟敏感：训练后把 BA 合并到 W₀，保持原前向结构。'}:scenario==='mixed'?{title:'动态 LoRA',color:C.purple,copy:'频繁切换或混合任务：保留独立因子更灵活，同时增加运行时管理成本。'}:{title:'扩展适配',color:C.orange,copy:'分布变化较大：提高秩、调整落点，或采用容量更高的适配方式。'};
  const draw:Draw=(ctx)=>{ctx.clearRect(0,0,W,H);ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);box(ctx,90,85,250,130,'#eef3fa',C.blue);label(ctx,'部署需求',215,150,C.blue,27,'center');arrow(ctx,370,150,600,150,result.color);box(ctx,630,70,350,160,'#fff',result.color);label(ctx,result.title,805,150,result.color,32,'center');};
  return <div><CanvasPanel draw={draw} deps={[scenario]}/><div className="chip-row"><button className={`chip ${scenario==='latency'?'selected':''}`} onClick={()=>setScenario('latency')}>固定任务 · 低延迟</button><button className={`chip ${scenario==='mixed'?'selected':''}`} onClick={()=>setScenario('mixed')}>频繁切换 · 混合批次</button><button className={`chip ${scenario==='shift'?'selected':''}`} onClick={()=>setScenario('shift')}>明显分布变化</button></div><div className="feedback good">{result.copy}</div></div>;
}

export const LoRALab: React.FC<WidgetProps> = (props) => {
  if (props.moduleId === 'old' || props.moduleId === 'new' || props.moduleId === 'ana') return <Scene {...props} />;
  switch (props.moduleId) {
    case '1.1': return <CostScaling />;
    case '1.2': return <MethodChoice />;
    case '2.1': return <LowRankBuilder />;
    case '3.1': return <FactorRoute />;
    case '4.1': return <ArchitectureMap />;
    case '4.2': return <FixedBudget />;
    case '5.1': return <DeploymentModes />;
    case '6.1': return <BenchmarkEvidence />;
    case '7.1': return <ProjectionBudget />;
    case '8.1': return <RankCurve />;
    case '9.1': return <SubspaceOverlap />;
    case '9.2': return <Amplification />;
    case '10.1': return <DecisionRoute />;
    default: return <Scene {...props} />;
  }
};

export default LoRALab;
