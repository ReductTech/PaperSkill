import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

const W = 1080;
const H = 300;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', blue: '#27446e', green: '#228d5c', red: '#c43f52',
  orange: '#f07e47', purple: '#7c3aed', text: '#21324a', muted: '#68778f', line: '#d7deea', white: '#ffffff',
};
type Draw = (ctx: CanvasRenderingContext2D, time: number) => void;

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 12) {
  const rr = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
}
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = C.line, lw = 2) {
  rounded(ctx, x, y, w, h); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text, size = 22, align: CanvasTextAlign = 'center') {
  ctx.fillStyle = color; ctx.font = `600 ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
}
function clear(ctx: CanvasRenderingContext2D) { ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); }
function CanvasPanel({ draw, deps }: { draw: Draw; deps: React.DependencyList }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const paint = () => { draw(ctx, performance.now() / 1000); canvas.classList.add('is-ready'); };
    const disconnect = observeCanvas(canvas, paint, () => undefined); paint(); return () => disconnect();
  }, deps);
  return <canvas ref={ref} width={W} height={H} />;
}

export function ArchitectureMap() {
  const methods = ['prompt', 'prefix', 'warp', 'full'] as const;
  const nodes = ['prompt', 'encoder', 'decoder', 'output'] as const;
  type Method = (typeof methods)[number]; type Node = (typeof nodes)[number];
  const [method, setMethod] = useState<Method>('prompt');
  const [active, setActive] = useState<Node>('prompt');
  const methodText: Record<Method, string> = {
    prompt: 'Prompt Tuning 只训练输入提示。',
    prefix: 'Prefix Tuning 在每层使用前缀，训练时还依赖重参数化。',
    warp: 'WARP 调整输入与任务输出层，适用于分类式设置。',
    full: '全量调优让所有模型参数成为任务专属。',
  };
  const draw: Draw = (ctx) => {
    clear(ctx);
    const xs = [120, 390, 660, 930]; const activeIndex = nodes.indexOf(active);
    ctx.strokeStyle = C.line; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(xs[0], 132); ctx.lineTo(xs[3], 132); ctx.stroke();
    ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.moveTo(xs[0], 132); ctx.lineTo(xs[activeIndex], 132); ctx.stroke();
    xs.forEach((x, i) => {
      const node = nodes[i];
      const trainable = method === 'full' || (method === 'prompt' && node === 'prompt') || (method === 'warp' && (node === 'prompt' || node === 'output')) || (method === 'prefix' && (node === 'prompt' || node === 'encoder' || node === 'decoder'));
      const selected = node === active;
      const color = trainable ? C.green : C.blue;
      box(ctx, x - 82, 76, 164, 112, trainable ? '#ecf8f2' : '#eef3fa', selected ? color : C.line, selected ? 5 : 2);
      ctx.fillStyle = color; ctx.globalAlpha = selected ? 1 : 0.65; ctx.beginPath(); ctx.arc(x, 132, selected ? 20 : 13, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      if (method === 'prefix' && (node === 'encoder' || node === 'decoder')) { ctx.strokeStyle = C.purple; ctx.lineWidth = 4; ctx.strokeRect(x - 62, 92, 124, 80); }
    });
    const placement = method === 'prompt' ? '仅输入' : method === 'prefix' ? '逐层前缀' : method === 'warp' ? '输入+输出' : '全部参数';
    label(ctx, placement, 540, 236, method === 'full' ? C.red : C.green, 25);
    label(ctx, active === 'prompt' ? '入口' : active === 'encoder' ? '编码' : active === 'decoder' ? '解码' : '输出', 540, 36, C.blue, 20);
  };
  return <div>
    <CanvasPanel draw={draw} deps={[method, active]} />
    <div className="chip-row" role="group" aria-label="方法选择">
      <button className={`chip ${method === 'prompt' ? 'selected' : ''}`} onClick={() => setMethod('prompt')}>Prompt</button>
      <button className={`chip ${method === 'prefix' ? 'selected' : ''}`} onClick={() => setMethod('prefix')}>Prefix</button>
      <button className={`chip ${method === 'warp' ? 'selected' : ''}`} onClick={() => setMethod('warp')}>WARP</button>
      <button className={`chip ${method === 'full' ? 'selected' : ''}`} onClick={() => setMethod('full')}>全量调优</button>
    </div>
    <div className="chip-row" role="group" aria-label="结构位置">
      <button className={`chip ${active === 'prompt' ? 'selected' : ''}`} onClick={() => setActive('prompt')}>提示</button>
      <button className={`chip ${active === 'encoder' ? 'selected' : ''}`} onClick={() => setActive('encoder')}>编码器</button>
      <button className={`chip ${active === 'decoder' ? 'selected' : ''}`} onClick={() => setActive('decoder')}>解码器</button>
      <button className={`chip ${active === 'output' ? 'selected' : ''}`} onClick={() => setActive('output')}>输出</button>
    </div>
    <div className={`feedback ${method === 'prompt' ? 'good' : method === 'full' ? 'bad' : ''}`}>{methodText[method]}</div>
  </div>;
}

const transferData = {
  TextbookQA: [54.3, 66.8], BioASQ: [77.9, 79.1], RACE: [59.8, 60.7],
  RE: [88.4, 88.8], DuoRC: [68.9, 67.7], DROP: [68.9, 67.1],
} as const;

export function DomainTransfer() {
  type Dataset = keyof typeof transferData;
  const [dataset, setDataset] = useState<Dataset>('TextbookQA');
  const [selectedMethod, setSelectedMethod] = useState<'model' | 'prompt'>('prompt');
  const [modelValue, promptValue] = transferData[dataset];
  const delta = promptValue - modelValue;
  const draw: Draw = (ctx) => {
    clear(ctx);
    const baseY = 238; const maxH = 170;
    const values = [modelValue, promptValue];
    values.forEach((value, i) => {
      const selected = (i === 0 && selectedMethod === 'model') || (i === 1 && selectedMethod === 'prompt');
      const winner = value === Math.max(...values);
      const color = winner ? C.green : C.red;
      const h = value / 100 * maxH;
      box(ctx, 245 + i * 330, baseY - h, 210, h, winner ? '#ecf8f2' : '#fff1f2', selected ? color : C.line, selected ? 5 : 2);
      label(ctx, value.toFixed(1), 350 + i * 330, baseY - h - 24, color, 27);
    });
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(175, baseY); ctx.lineTo(900, baseY); ctx.stroke();
    label(ctx, `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} F1`, 540, 35, delta >= 0 ? C.green : C.red, 26);
  };
  const positive = delta > 0;
  return <div>
    <CanvasPanel draw={draw} deps={[dataset, selectedMethod]} />
    <div className="chip-row" role="group" aria-label="域外数据集">{(Object.keys(transferData) as Dataset[]).map((name) => <button key={name} className={`chip ${dataset === name ? 'selected' : ''}`} onClick={() => setDataset(name)}>{name}</button>)}</div>
    <div className="chip-row" role="group" aria-label="突出方法"><button className={`chip ${selectedMethod === 'model' ? 'selected' : ''}`} onClick={() => setSelectedMethod('model')}>全量调优</button><button className={`chip ${selectedMethod === 'prompt' ? 'selected' : ''}`} onClick={() => setSelectedMethod('prompt')}>提示调优</button></div>
    <div className={`feedback ${positive ? 'good' : 'bad'}`}>{positive ? `在 ${dataset} 域外数据上，提示调优高 ${delta.toFixed(1)} F1。` : `${dataset} 上全量调优高 ${Math.abs(delta).toFixed(1)} F1，域外优势随数据集变化。`}</div>
  </div>;
}

export function PromptEnsemble() {
  const [count, setCount] = useState<1 | 3 | 5>(1);
  const [view, setView] = useState<'average' | 'best' | 'ensemble'>('average');
  const exact = count === 5;
  useEffect(() => { if (!exact && view !== 'average') setView('average'); }, [exact, view]);
  const score = view === 'average' ? 90.5 : view === 'best' ? 91.0 : 91.3;
  const draw: Draw = (ctx) => {
    clear(ctx);
    box(ctx, 60, 58, 430, 190, C.white, C.blue, 3);
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(260, 128, 52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.bg; ctx.beginPath(); ctx.arc(260, 128, 28, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < count; i++) box(ctx, 95 + i * 68, 198, 46, 32, '#ecf8f2', C.green);
    box(ctx, 590, 58, 420, 190, C.white, C.line);
    if (exact) {
      const values = [90.5, 91.0, 91.3]; const colors = [C.blue, C.orange, C.green];
      values.forEach((v, i) => {
        const h = (v - 89.5) / 2 * 130;
        box(ctx, 650 + i * 112, 218 - h, 72, h, colors[i] + '22', colors[i], view === ['average', 'best', 'ensemble'][i] ? 5 : 2);
        label(ctx, v.toFixed(1), 686 + i * 112, 238, colors[i], 20);
      });
    } else {
      ctx.strokeStyle = C.line; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(660, 150); ctx.lineTo(940, 150); ctx.stroke();
      label(ctx, '共享结构', 800, 195, C.muted, 22);
    }
    label(ctx, `${count} 组提示`, 275, 35, C.green, 23);
  };
  const feedback = !exact ? `${count} 个提示共享同一冻结模型，每个提示保留独立的任务参数。` : view === 'ensemble' ? '五提示多数投票达到 91.3，高于 90.5 平均值和 91.0 最佳单提示。' : `五提示的${view === 'average' ? '平均' : '最佳单提示'}成绩为 ${score.toFixed(1)}。`;
  return <div>
    <CanvasPanel draw={draw} deps={[count, view]} />
    <div className="chip-row" role="group" aria-label="提示数量">{([1, 3, 5] as const).map((n) => <button key={n} className={`chip ${count === n ? 'selected' : ''}`} onClick={() => setCount(n)}>{n} 个提示</button>)}</div>
    <div className="chip-row" role="group" aria-label="比较方式">
      <button className={`chip ${view === 'average' ? 'selected' : ''}`} disabled={!exact} onClick={() => setView('average')}>单提示平均</button>
      <button className={`chip ${view === 'best' ? 'selected' : ''}`} disabled={!exact} onClick={() => setView('best')}>最佳单提示</button>
      <button className={`chip ${view === 'ensemble' ? 'selected' : ''}`} disabled={!exact} onClick={() => setView('ensemble')}>多数投票集成</button>
    </div>
    <div className={`feedback ${exact && view === 'ensemble' ? 'good' : ''}`}>{feedback}</div>
  </div>;
}

export function ResultRace() {
  const [mode, setMode] = useState<'scale' | 'params' | 'transfer' | 'ensemble'>('scale');
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (progress >= 1) { setRunning(false); return; }
    const timer = window.setTimeout(() => setProgress((p) => Math.min(1, p + 0.08)), 70);
    return () => window.clearTimeout(timer);
  }, [running, progress]);
  const selectMode = (next: typeof mode) => { setMode(next); setProgress(0); setRunning(false); };
  const start = () => { setProgress(0); setRunning(true); };
  const draw: Draw = (ctx) => {
    clear(ctx);
    box(ctx, 55, 28, 970, 220, C.white, C.line);
    if (mode === 'scale') {
      const xs = [145, 330, 515, 700, 885];
      const full = [78, 68, 60, 53, 48]; const prompt = [210, 186, 145, 90, 52];
      const last = Math.min(4, Math.floor(progress * 5));
      [[full, C.red], [prompt, C.green]].forEach(([ys, color]) => {
        const values = ys as number[]; ctx.strokeStyle = color as string; ctx.lineWidth = 5; ctx.beginPath();
        for (let i = 0; i <= last; i++) i === 0 ? ctx.moveTo(xs[i], values[i]) : ctx.lineTo(xs[i], values[i]); ctx.stroke();
      });
      label(ctx, progress >= 1 ? 'XXL 相当' : '规模增长', 540, 230, progress >= 1 ? C.green : C.blue, 23);
    } else if (mode === 'params') {
      ctx.strokeStyle = C.line; ctx.lineWidth = 28; ctx.beginPath(); ctx.moveTo(170, 140); ctx.lineTo(930, 140); ctx.stroke();
      ctx.strokeStyle = C.green; ctx.beginPath(); ctx.moveTo(170, 140); ctx.lineTo(170 + 760 * Math.max(progress, 0.05), 140); ctx.stroke();
      label(ctx, progress >= 1 ? '0.00368%' : '参数比例', 540, 82, C.green, 28);
    } else if (mode === 'transfer') {
      const vals = [54.3, 66.8]; const colors = [C.red, C.green];
      vals.forEach((v, i) => { const h = 145 * (v / 70) * progress; box(ctx, 290 + i * 300, 215 - h, 200, h, colors[i] + '22', colors[i], 3); if (progress >= 1) label(ctx, v.toFixed(1), 390 + i * 300, 232, colors[i], 22); });
      label(ctx, 'TextbookQA F1', 540, 60, C.blue, 23);
    } else {
      const vals = [90.5, 91.0, 91.3]; const colors = [C.blue, C.orange, C.green];
      vals.forEach((v, i) => { const h = 140 * ((v - 89.5) / 2) * progress; box(ctx, 245 + i * 220, 216 - h, 130, h, colors[i] + '22', colors[i], 3); if (progress >= 1) label(ctx, v.toFixed(1), 310 + i * 220, 236, colors[i], 21); });
      label(ctx, 'SuperGLUE dev', 540, 60, C.blue, 23);
    }
  };
  const feedback = mode === 'scale' ? 'XXL 中差距闭合，但小模型仍有明显差距。' : mode === 'params' ? '长度 100 的 T5-XXL 提示含 409,600 个参数，占总参数约 0.00368%。' : mode === 'transfer' ? 'TextbookQA 上提示调优提高 12.5 F1，但其他数据集存在反例。' : '五提示多数投票为 91.3，高于平均值 90.5 与最佳单提示 91.0。';
  return <div>
    <CanvasPanel draw={draw} deps={[mode, progress]} />
    <div className="chip-row" role="group" aria-label="证据类型">
      <button className={`chip ${mode === 'scale' ? 'selected' : ''}`} onClick={() => selectMode('scale')}>规模趋势</button>
      <button className={`chip ${mode === 'params' ? 'selected' : ''}`} onClick={() => selectMode('params')}>参数比例</button>
      <button className={`chip ${mode === 'transfer' ? 'selected' : ''}`} onClick={() => selectMode('transfer')}>域迁移</button>
      <button className={`chip ${mode === 'ensemble' ? 'selected' : ''}`} onClick={() => selectMode('ensemble')}>提示集成</button>
      <button className="chip selected" onClick={start} disabled={running}>{running ? '比较中…' : progress >= 1 ? '重新比较' : '开始比较'}</button>
    </div>
    <div className={`feedback ${progress >= 1 ? 'good' : ''}`}>{progress >= 1 ? feedback : '选择一类证据并启动比较。'}</div>
  </div>;
}
