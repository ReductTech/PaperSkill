import React, { useEffect, useMemo, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const BLUE = '#27446e';
const GREEN = '#228d5c';
const RED = '#c43f52';
const ORANGE = '#d97706';
const PURPLE = '#7c3aed';
const LINE = '#d7deea';
const WOOD = '#92400e';

function stage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#edf3e8'; ctx.fillRect(0, h * 0.64, w, h * 0.36);
}
function frame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
}
function curve(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, high: boolean) {
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath();
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const v = high ? 0.78 - 0.28 * (1 - Math.exp(-3 * t)) : 0.15 + 0.6 * (1 - Math.exp(-2.5 * t));
    const px = x + t * w; const py = y + h - v * h;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

const RouteModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [route, setRoute] = useState<'from-scratch' | 'convert'>('from-scratch');
  const feedback = route === 'convert'
    ? <div className="feedback good">论文图 7 的定性趋势：密集改造路线收敛更好，平均表现更高。</div>
    : <div className="feedback bad">论文图 7 的定性趋势：同样训练到约 30B tokens，从零训练仍有更高损失、更低平均表现。</div>;
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const W = 1080, H = 280; const ctx = setupCanvas(canvas, W, H);
    const draw = () => {
      stage(ctx, W, H);
      ctx.fillStyle = '#fff'; ctx.fillRect(38, 38, 410, 194); ctx.strokeStyle = LINE; ctx.strokeRect(38, 38, 410, 194);
      ctx.strokeStyle = WOOD; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(66, 196); ctx.lineTo(420, 196); ctx.stroke();
      for (let i = 0; i < 8; i++) { ctx.fillStyle = '#d7deea'; ctx.fillRect(80 + i * 42, 150, 18, 44); }
      const bx = route === 'convert' ? 160 : 344;
      ctx.strokeStyle = route === 'convert' ? GREEN : RED; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(bx + 34, 76); ctx.lineTo(bx, 142); ctx.stroke();
      ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(bx + 34, 76, 7, 0, Math.PI * 2); ctx.fill();
      const panel = (x: number, y: number, w: number, h: number, title: string, lowerBetter: boolean) => {
        ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = LINE; ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = '#21324a'; ctx.font = '15px "Segoe UI", sans-serif'; ctx.fillText(title, x + 10, y + 20);
        const mk = (offset: number, color: string, fromZero: number, toZero: number) => { ctx.strokeStyle = color; ctx.lineWidth = (color === RED ? route === 'from-scratch' : route === 'convert') ? 4 : 2; ctx.beginPath(); for (let i = 0; i <= 50; i++) { const q = i / 50; const v = fromZero + (toZero - fromZero) * (1 - Math.exp(-3 * q)); const px = x + 18 + q * (w - 34); const py = y + h - 18 - v * (h - 40) + offset; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke(); };
        mk(0, RED, lowerBetter ? 0.82 : 0.18, lowerBetter ? 0.64 : 0.24);
        mk(6, GREEN, lowerBetter ? 0.30 : 0.20, lowerBetter ? 0.20 : 0.82);
      };
      panel(500, 78, 250, 132, '损失', true);
      panel(780, 78, 250, 132, '表现', false);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, [route]);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="chip-row">
    <button className={`chip ${route === 'from-scratch' ? 'selected' : ''}`} onClick={() => setRoute('from-scratch')}>从零训练</button>
    <button className={`chip ${route === 'convert' ? 'selected' : ''}`} onClick={() => setRoute('convert')}>密集改造</button>
  </div>{feedback}</div>;
};

const ProjectionModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [projection, setProjection] = useState<'up' | 'gate' | 'down'>('up');
  const copy = {
    up: 'up 投影把输入从模型维度 d 扩展到中间维度 d_h，后续专家切分就发生在这个维度。',
    gate: 'gate 投影与 up 投影共同形成 SwiGLU：两条支路逐元素相乘，控制每个中间通道的工作强度。',
    down: 'down 投影把中间维度 d_h 收回到模型维度 d，形成这一层 FFN 的输出。'
  } as const;
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const W = 1080, H = 280; const ctx = setupCanvas(canvas, W, H);
    const started = performance.now(); let raf: number | null = null;
    const cell = (x: number, y: number, w: number, h: number, color: string, active: boolean) => {
      ctx.fillStyle = active ? color : '#e6ebee'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = active ? color : LINE; ctx.lineWidth = active ? 3 : 1; ctx.strokeRect(x, y, w, h);
    };
    const matrix = (x: number, y: number, rows: number, cols: number, color: string, active: boolean) => {
      const cw = 10, ch = 8;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cell(x + c * cw, y + r * ch, cw - 1, ch - 1, color, active);
    };
    const arrow = (x1: number, y1: number, x2: number, y2: number, color: string, width: number) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 9, y2 - 5); ctx.lineTo(x2 - 9, y2 + 5); ctx.closePath(); ctx.fill();
    };
    const frameFn = (now: number) => {
      const phase = ((now - started) % 2400) / 2400;
      stage(ctx, W, H);
      const upActive = projection === 'up' || projection === 'gate';
      const gateActive = projection === 'gate';
      const downActive = projection === 'down';
      const inputX = 58, upX = 230, gateX = 350, mulX = 500, downX = 660, outX = 830;
      matrix(inputX, 106, 6, 4, BLUE, projection === 'up');
      matrix(upX, 62, 12, 5, BLUE, upActive);
      matrix(gateX, 62, 12, 5, ORANGE, gateActive);
      matrix(downX, 86, 6, 10, GREEN, downActive);
      matrix(outX, 106, 6, 4, GREEN, projection === 'down');
      arrow(inputX + 42, 130, upX - 8, 130, projection === 'up' ? BLUE : LINE, projection === 'up' ? 6 : 2);
      arrow(upX + 52, 130, mulX - 22, 130, upActive ? BLUE : LINE, upActive ? 5 : 2);
      arrow(gateX + 52, 130, mulX + 22, 130, gateActive ? ORANGE : LINE, gateActive ? 5 : 2);
      ctx.strokeStyle = gateActive || projection === 'up' ? ORANGE : LINE; ctx.lineWidth = gateActive ? 4 : 2;
      ctx.beginPath(); ctx.arc(mulX, 130, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mulX - 8, 122); ctx.lineTo(mulX + 8, 138); ctx.moveTo(mulX + 8, 122); ctx.lineTo(mulX - 8, 138); ctx.stroke();
      arrow(mulX + 22, 130, downX - 8, 130, downActive ? GREEN : LINE, downActive ? 6 : 2);
      arrow(downX + 112, 130, outX - 8, 130, downActive ? GREEN : LINE, downActive ? 6 : 2);
      const points: Record<string, number[][]> = { up: [[inputX + 42,130],[upX - 8,130],[upX + 52,130],[mulX - 22,130]], gate: [[gateX + 52,130],[mulX + 22,130]], down: [[mulX + 22,130],[downX - 8,130],[downX + 112,130],[outX - 8,130]] };
      const path = points[projection]; const seg = Math.min(path.length - 1, Math.floor(phase * (path.length - 1))); const local = phase * (path.length - 1) - seg;
      const dotX = path[seg][0] + (path[Math.min(seg + 1, path.length - 1)][0] - path[seg][0]) * local;
      const dotY = path[seg][1] + (path[Math.min(seg + 1, path.length - 1)][1] - path[seg][1]) * local;
      ctx.fillStyle = projection === 'gate' ? ORANGE : projection === 'down' ? GREEN : BLUE; ctx.beginPath(); ctx.arc(dotX, dotY, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = BLUE; ctx.font = '14px "Segoe UI", sans-serif'; ctx.fillText('d', 156, 92); ctx.textAlign = 'center'; ctx.fillText('d_h', 278, 48); ctx.textAlign = 'start';
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(frameFn);
    };
    const stop = () => { if (raf !== null) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (raf === null) raf = requestAnimationFrame(frameFn); };
    const disconnect = observeCanvas(canvas, start, stop); return () => { stop(); disconnect(); };
  }, [projection]);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="chip-row">
    {(['up','gate','down'] as const).map((x) => <button key={x} className={`chip ${projection === x ? 'selected' : ''}`} onClick={() => setProjection(x)}>{x} 投影</button>)}
  </div><div className="feedback">{copy[projection]}</div></div>;
};

const PartitionModule: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const count = step === 0 ? 1 : step === 1 ? 8 : 16;
  const feedback = step === 0
    ? { cls: '', text: '当前只有一个密集 FFN：全部中间神经元属于同一组。' }
    : step === 1
    ? { cls: 'good', text: '8 个专家等分 32 个神经元槽位；S₁∪…∪S₈=U，且任意两组交集为空。' }
    : { cls: 'good', text: '16 个专家进一步等分：每个专家 2 个槽位；组数增加，但总神经元集合不变。' };
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const W = 1080, H = 280; const ctx = setupCanvas(canvas, W, H);
    const colors = ['#27446e', '#2f5d86', '#228d5c', '#4f9d7d', '#76906a', '#4d7aa8'];
    const draw = () => {
      stage(ctx, W, H);
      ctx.fillStyle = '#e8eef2'; ctx.fillRect(72, 48, 936, 42);
      for (let i = 0; i < 32; i++) { ctx.fillStyle = '#dfe7ea'; ctx.fillRect(76 + i * 29, 52, 24, 34); ctx.strokeStyle = LINE; ctx.strokeRect(76 + i * 29, 52, 24, 34); }
      const gap = count === 1 ? 0 : count === 8 ? 8 : 4;
      const totalGap = gap * (count - 1);
      const groupW = (936 - totalGap) / count;
      for (let i = 0; i < count; i++) {
        const x = 72 + i * (groupW + gap); const color = count === 1 ? BLUE : colors[i % colors.length];
        ctx.fillStyle = color; ctx.fillRect(x, 126, groupW, 64); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(x, 126, groupW, 64);
        ctx.strokeStyle = '#b7c5cf'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + groupW / 2, 90); ctx.lineTo(x + groupW / 2, 126); ctx.stroke();
      }
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(72, 112); ctx.lineTo(1008, 112); ctx.stroke();
      ctx.fillStyle = '#68778f'; ctx.font = '15px "Segoe UI", sans-serif'; ctx.fillText('d_h', 84, 36); ctx.fillText('m = d_h / n', 866, 232);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, draw, () => {}); draw(); return disconnect;
  }, [count, step]);
  return <div><canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} /><div className="step-ctrl">
    <button className="chip" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>上一步</button>
    <button className="chip" onClick={() => setStep(0)}>重置</button>
    <button className="chip" onClick={() => setStep((s) => Math.min(2, s + 1))} disabled={step === 2}>下一步</button>
  </div><div className={`feedback ${feedback.cls}`}>{feedback.text}</div></div>;
};

export const BasicsLab: React.FC<WidgetProps> = (props) => {
  const module = props.moduleId;
  return useMemo(() => module === '1.1' ? <RouteModule {...props} /> : module === '2.1' ? <ProjectionModule {...props} /> : <PartitionModule {...props} />, [module]);
};
export default BasicsLab;
