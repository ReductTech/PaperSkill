import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, setupCanvas } from '../lib/canvasKit';

const W = 1080;
const H = 300;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', blue: '#27446e', green: '#228d5c',
  red: '#c43f52', orange: '#f07e47', purple: '#7c3aed', text: '#21324a',
  muted: '#68778f', line: '#d7deea', white: '#ffffff',
};
type Draw = (ctx: CanvasRenderingContext2D, time: number) => void;

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 12) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr); ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
}
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, stroke = C.line, lw = 2) {
  rounded(ctx, x, y, w, h); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = C.text, size = 22, align: CanvasTextAlign = 'center') {
  ctx.fillStyle = color; ctx.font = `600 ${size}px "Segoe UI", "Microsoft YaHei", sans-serif`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
}
function clear(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
}
function CanvasPanel({ draw, deps }: { draw: Draw; deps: React.DependencyList }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D; try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const paint = () => { draw(ctx, performance.now() / 1000); canvas.classList.add('is-ready'); };
    const start = () => paint(); const stop = () => undefined;
    const disconnect = observeCanvas(canvas, start, stop); paint();
    return () => disconnect();
  }, deps);
  return <canvas ref={ref} width={W} height={H} />;
}
function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  const w = 120 * scale; const h = 72 * scale;
  box(ctx, x, y, w, h, C.white, color, 3);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + w * 0.58, y + h * 0.54, 23 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.bg; ctx.beginPath(); ctx.arc(x + w * 0.58, y + h * 0.54, 12 * scale, 0, Math.PI * 2); ctx.fill();
}

export function ScaleGap() {
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(false);
  const names = ['Small', 'Base', 'Large', 'XL', 'XXL'];
  useEffect(() => {
    if (!running) return;
    if (stage >= 4) { setRunning(false); return; }
    const timer = window.setTimeout(() => setStage((s) => s + 1), 520);
    return () => window.clearTimeout(timer);
  }, [running, stage]);
  const draw: Draw = (ctx) => {
    clear(ctx);
    const xs = [120, 325, 530, 735, 940];
    const fullY = [92, 78, 70, 63, 58];
    const promptY = [222, 195, 154, 98, 62];
    ctx.strokeStyle = C.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(92, 248); ctx.lineTo(965, 248); ctx.stroke();
    for (let i = 0; i < names.length; i++) label(ctx, names[i], xs[i], 272, C.muted, 18);
    const drawPath = (ys: number[], color: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.beginPath();
      for (let i = 0; i <= stage; i++) i === 0 ? ctx.moveTo(xs[i], ys[i]) : ctx.lineTo(xs[i], ys[i]);
      ctx.stroke();
      for (let i = 0; i <= stage; i++) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(xs[i], ys[i], i === stage ? 11 : 7, 0, Math.PI * 2); ctx.fill(); }
    };
    drawPath(fullY, C.red); drawPath(promptY, C.green);
    drawCamera(ctx, xs[stage] - 46, 130, 0.45 + stage * 0.09, C.blue);
    label(ctx, stage === 4 ? '差距闭合' : '差距仍在', 540, 34, stage === 4 ? C.green : C.orange, 24);
  };
  const start = () => { setStage(0); setRunning(true); };
  return <div>
    <CanvasPanel draw={draw} deps={[stage]} />
    <div className="chip-row"><button className="chip selected" onClick={start} disabled={running}>{running ? '比较中…' : stage === 4 ? '重新比较' : '开始比较'}</button></div>
    <div className={`feedback ${stage === 4 ? 'good' : ''}`}>{stage === 4 ? '在论文的 T5-XXL SuperGLUE 设置中，提示调优达到强多任务调优基线。' : stage < 2 ? '小模型阶段仍有明显差距。' : '规模增长后，软提示逐渐接近全量调优。'}</div>
  </div>;
}

export function LengthInit() {
  const lengths = [1, 5, 20, 100, 150];
  const [lengthIndex, setLengthIndex] = useState(2);
  const [size, setSize] = useState<'small' | 'large' | 'xxl'>('large');
  const [init, setInit] = useState<'random' | 'vocab' | 'class'>('class');
  const p = lengths[lengthIndex];
  const sizeFactor = size === 'small' ? 0 : size === 'large' ? 1 : 2;
  const initBonus = size === 'xxl' ? 0.04 : init === 'class' ? 0.22 : init === 'vocab' ? 0.13 : 0;
  const lengthGain = p === 1 ? (size === 'xxl' ? 0.67 : 0.22) : p === 5 ? 0.48 : p === 20 ? 0.82 : p === 100 ? 0.9 : 0.87;
  const quality = Math.min(0.98, 0.38 + sizeFactor * 0.13 + lengthGain * 0.35 + initBonus);
  const draw: Draw = (ctx) => {
    clear(ctx);
    box(ctx, 65, 58, 590, 92, C.white, C.line);
    const cells = Math.max(1, Math.round(1 + (lengthIndex / 4) * 11));
    const cw = (540 - (cells - 1) * 5) / cells;
    for (let i = 0; i < cells; i++) { ctx.fillStyle = i % 2 ? C.green : C.orange; ctx.globalAlpha = 0.72; ctx.fillRect(90 + i * (cw + 5), 82, cw, 44); }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.line; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(735, 92); ctx.lineTo(1000, 92); ctx.stroke();
    ctx.strokeStyle = quality > 0.78 ? C.green : quality > 0.58 ? C.blue : C.red; ctx.beginPath(); ctx.moveTo(735, 92); ctx.lineTo(735 + 265 * quality, 92); ctx.stroke();
    ctx.strokeStyle = C.line; ctx.beginPath(); ctx.moveTo(735, 194); ctx.lineTo(1000, 194); ctx.stroke();
    ctx.strokeStyle = C.orange; ctx.beginPath(); ctx.moveTo(735, 194); ctx.lineTo(735 + 265 * (p / 150), 194); ctx.stroke();
    label(ctx, `${p} token`, 360, 194, C.orange, 25);
    label(ctx, size === 'xxl' ? '更稳健' : '更敏感', 868, 247, size === 'xxl' ? C.green : C.blue, 22);
  };
  let feedback = '20 token 已获得主要长度收益。';
  let stateClass = '';
  if (p === 1 && size !== 'xxl') { feedback = '较小模型配单 token 提示，论文中通常明显不足。'; stateClass = 'bad'; }
  else if (size === 'xxl') { feedback = 'XXL 对长度与初始化选择更稳健。'; stateClass = 'good'; }
  else if (p > 20) feedback = '继续加长会增加参数，但论文中的平均收益趋于有限。';
  else if (init === 'class') { feedback = '类别标签初始化在较小规模上更有帮助。'; stateClass = 'good'; }
  return <div>
    <CanvasPanel draw={draw} deps={[p, size, init]} />
    <div className="ctrl"><label>提示长度 <span className="val">{p}</span></label><input aria-label="提示长度" type="range" min={0} max={4} step={1} value={lengthIndex} onChange={(e) => setLengthIndex(Number(e.target.value))} /></div>
    <div className="chip-row" role="group" aria-label="模型规模">{(['small', 'large', 'xxl'] as const).map((v) => <button key={v} className={`chip ${size === v ? 'selected' : ''}`} onClick={() => setSize(v)}>{v === 'small' ? 'Small' : v === 'large' ? 'Large' : 'XXL'}</button>)}</div>
    <div className="chip-row" role="group" aria-label="初始化方式">
      <button className={`chip ${init === 'random' ? 'selected' : ''}`} onClick={() => setInit('random')}>随机</button>
      <button className={`chip ${init === 'vocab' ? 'selected' : ''}`} onClick={() => setInit('vocab')}>词表采样</button>
      <button className={`chip ${init === 'class' ? 'selected' : ''}`} onClick={() => setInit('class')}>类别标签</button>
    </div>
    <div className={`feedback ${stateClass}`}>{feedback}</div>
  </div>;
}

export function PretrainFit() {
  const [objective, setObjective] = useState<'span' | 'sentinel' | 'lm'>('span');
  const [size, setSize] = useState<'large' | 'xxl'>('large');
  const mismatchBase = objective === 'lm' ? 0.08 : objective === 'sentinel' ? 0.58 : 0.72;
  const mismatch = size === 'xxl' ? mismatchBase * 0.38 : mismatchBase;
  const draw: Draw = (ctx) => {
    clear(ctx);
    box(ctx, 80, 48, 420, 204, C.white, C.line);
    ctx.save(); ctx.translate(290, 150); ctx.rotate(mismatch * 0.9); box(ctx, -92, -42, 184, 84, objective === 'lm' ? '#ecf8f2' : '#fff5f5', objective === 'lm' ? C.green : C.red, 4); ctx.restore();
    ctx.strokeStyle = C.green; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(405, 82); ctx.lineTo(405, 218); ctx.stroke();
    box(ctx, 610, 48, 390, 204, C.white, C.line);
    const score = 1 - mismatch;
    ctx.strokeStyle = C.line; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(670, 148); ctx.lineTo(942, 148); ctx.stroke();
    ctx.strokeStyle = score > 0.8 ? C.green : score > 0.55 ? C.orange : C.red; ctx.beginPath(); ctx.moveTo(670, 148); ctx.lineTo(670 + 272 * score, 148); ctx.stroke();
    label(ctx, objective === 'lm' ? '目标匹配' : '目标错位', 805, 90, objective === 'lm' ? C.green : C.red, 24);
    label(ctx, size === 'xxl' ? 'XXL' : 'Large', 805, 213, C.blue, 22);
  };
  const feedback = objective === 'lm'
    ? 'LM 适配让预训练形式更贴近自然文本生成。'
    : size === 'xxl'
      ? 'XXL 对不理想设置更宽容，但匹配的预训练目标仍更可靠。'
      : objective === 'sentinel'
        ? '加入 sentinel 并未在论文中解决主要问题。'
        : '中等规模在纯 span corruption 设置下可能无法稳定输出合法标签。';
  const good = objective === 'lm';
  return <div>
    <CanvasPanel draw={draw} deps={[objective, size]} />
    <div className="chip-row" role="group" aria-label="预训练设置">
      <button className={`chip ${objective === 'span' ? 'selected' : ''}`} onClick={() => setObjective('span')}>Span Corruption</button>
      <button className={`chip ${objective === 'sentinel' ? 'selected' : ''}`} onClick={() => setObjective('sentinel')}>加 Sentinel</button>
      <button className={`chip ${objective === 'lm' ? 'selected' : ''}`} onClick={() => setObjective('lm')}>LM 适配</button>
    </div>
    <div className="chip-row" role="group" aria-label="模型规模"><button className={`chip ${size === 'large' ? 'selected' : ''}`} onClick={() => setSize('large')}>Large</button><button className={`chip ${size === 'xxl' ? 'selected' : ''}`} onClick={() => setSize('xxl')}>XXL</button></div>
    <div className={`feedback ${good ? 'good' : size === 'large' && objective === 'span' ? 'bad' : ''}`}>{feedback}</div>
  </div>;
}

export function TrainingLoop() {
  const [step, setStep] = useState(0);
  const labels = ['拼接输入', '计算概率', '反向传播', '更新提示'];
  const feedback = [
    '把提示与输入拼接。',
    '冻结模型计算目标序列概率。',
    '误差反向传播得到提示梯度。',
    '优化器只更新 θP，θ 保持不变。',
  ];
  const draw: Draw = (ctx) => {
    clear(ctx);
    const xs = [120, 390, 660, 930];
    ctx.strokeStyle = C.line; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(xs[0], 142); ctx.lineTo(xs[3], 142); ctx.stroke();
    ctx.strokeStyle = step === 2 ? C.orange : C.blue; ctx.beginPath(); ctx.moveTo(xs[0], 142); ctx.lineTo(xs[step], 142); ctx.stroke();
    xs.forEach((x, i) => {
      const selected = i === step;
      const activeColor = i === 3 ? C.green : i === 2 ? C.orange : C.blue;
      box(ctx, x - 78, 92, 156, 100, selected ? '#eef3fa' : C.white, selected ? activeColor : C.line, selected ? 5 : 2);
      ctx.fillStyle = selected ? activeColor : C.light; ctx.beginPath(); ctx.arc(x, 142, selected ? 18 : 12, 0, Math.PI * 2); ctx.fill();
    });
    label(ctx, labels[step], 540, 242, step === 3 ? C.green : step === 2 ? C.orange : C.blue, 25);
    label(ctx, 'θ 已锁定', 540, 40, C.muted, 20);
  };
  return <div>
    <CanvasPanel draw={draw} deps={[step]} />
    <div className="chip-row">
      <button className="chip" onClick={() => setStep(0)} disabled={step === 0}>重置</button>
      <button className="chip" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>上一步</button>
      <button className="chip selected" onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={step === 3}>{step === 3 ? '已完成' : '下一步'}</button>
    </div>
    <div className={`feedback ${step === 3 ? 'good' : ''}`} aria-live="polite">{feedback[step]}</div>
  </div>;
}
