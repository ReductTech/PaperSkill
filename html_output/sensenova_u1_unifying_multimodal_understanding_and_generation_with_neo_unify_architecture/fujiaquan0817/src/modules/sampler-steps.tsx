import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C } from './studio-kit';

const W = 960;
const H = 450;
type Method = 'teacher' | 'distilled';
type SamplerState = { method: Method; step: number };

const shared = C as unknown as Record<string, string>;
const ink = (key: string, fallback: string) => shared[key] || fallback;
const P = {
  field: ink('field', '#f5f8f0'), desk: ink('desk', '#b8c9a7'), contour: ink('contour', '#76906a'),
  blue: ink('blue', '#27446e'), green: ink('green', '#228d5c'), red: ink('red', '#c43f52'),
  orange: ink('orange', '#d97706'), purple: ink('purple', '#7c3aed'), text: ink('text', '#21324a'),
  muted: ink('muted', '#68778f'), border: ink('border', '#d7deea'), white: '#ffffff',
};

const maxFor = (method: Method) => method === 'teacher' ? 100 : 8;
const normalizeStep = (step: number, method: Method) => Math.round(clamp(Number.isFinite(step) ? step : 0, 0, maxFor(method)));

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = P.text, size = 14) {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.fillText(text, x, y);
}

function drawTrack(ctx: CanvasRenderingContext2D, y: number, count: number, title: string, active: boolean, progress: number) {
  const x0 = 52;
  const x1 = 908;
  label(ctx, title, x0, y - 20, active ? P.blue : P.muted, 14);
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
  for (let i = 0; i <= count; i += 1) {
    const x = x0 + ((x1 - x0) * i) / count;
    const major = count === 8 || i % 10 === 0;
    ctx.strokeStyle = active ? P.contour : P.border;
    ctx.lineWidth = major ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(x, y - (major ? 9 : 4)); ctx.lineTo(x, y + (major ? 9 : 4)); ctx.stroke();
  }
  if (active) {
    ctx.strokeStyle = progress >= 1 ? P.green : P.blue;
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + (x1 - x0) * progress, y); ctx.stroke();
    ctx.fillStyle = progress >= 1 ? P.green : P.orange;
    ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * progress, y, 9, 0, Math.PI * 2); ctx.fill();
  }
  label(ctx, '0', x0 - 4, y + 28, P.muted, 11);
  label(ctx, String(count), x1 - 12, y + 28, P.muted, 11);
}

function drawSampler(ctx: CanvasRenderingContext2D, state: SamplerState) {
  const max = maxFor(state.method);
  const progress = state.step / max;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = P.field;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = P.desk;
  ctx.fillRect(0, 345, W, 105);

  drawTrack(ctx, 72, 100, '教师刻度 · 100 NFE', state.method === 'teacher', progress);
  drawTrack(ctx, 378, 8, 'DMD2 蒸馏刻度 · 8 NFE', state.method === 'distilled', progress);

  ctx.fillStyle = P.white;
  ctx.strokeStyle = P.contour;
  ctx.lineWidth = 4;
  ctx.fillRect(250, 118, 460, 210);
  ctx.strokeRect(250, 118, 460, 210);
  ctx.strokeStyle = P.green;
  ctx.globalAlpha = 0.18 + progress * 0.82;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(480, 194, 48, Math.PI, Math.PI * 2);
  ctx.moveTo(402, 293);
  ctx.quadraticCurveTo(480, 208, 558, 293);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const dots = Math.round(92 * (1 - progress));
  ctx.fillStyle = P.muted;
  for (let i = 0; i < dots; i += 1) {
    const x = 262 + ((i * 67) % 436);
    const y = 130 + ((i * 41) % 186);
    ctx.globalAlpha = 0.18 + (i % 5) * 0.08;
    ctx.fillRect(x, y, 4, 4);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = P.white;
  ctx.strokeStyle = P.border;
  ctx.lineWidth = 2;
  ctx.fillRect(736, 132, 190, 118);
  ctx.strokeRect(736, 132, 190, 118);
  label(ctx, '当前函数评估', 758, 164, P.muted, 13);
  label(ctx, `${state.step} / ${max}`, 768, 210, progress >= 1 ? P.green : P.blue, 30);
  label(ctx, 'NFE', 850, 210, P.text, 15);
  label(ctx, '进度示意，非实测质量曲线', 344, 316, P.orange, 13);

  ctx.fillStyle = P.white;
  ctx.strokeStyle = P.border;
  ctx.fillRect(28, 410, 904, 30);
  ctx.strokeRect(28, 410, 904, 30);
  label(ctx, state.method === 'teacher' ? '当前：教师 100 NFE' : '当前：蒸馏 8 NFE', 48, 431, P.blue, 13);
  label(ctx, '两条轨道共享 0–100% 进度轴', 650, 431, P.muted, 13);
}

export const SamplerSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const visibleRef = useRef(true);
  const timerRef = useRef<number | null>(null);
  const [state, setState] = useState<SamplerState>({ method: 'distilled', step: 0 });
  const stateRef = useRef(state);
  stateRef.current = state;

  const stopPlaying = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try { ctxRef.current = setupCanvas(canvas, W, H); } catch { return; }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    const render = () => {
      if (!ctxRef.current) return;
      drawSampler(ctxRef.current, stateRef.current);
      canvas.classList.add('is-ready');
    };
    const disconnect = observeCanvas(canvas, () => { visibleRef.current = true; render(); }, () => { visibleRef.current = false; stopPlaying(); });
    render();
    return () => { stopPlaying(); disconnect(); };
  }, []);

  useEffect(() => {
    if (visibleRef.current && ctxRef.current) drawSampler(ctxRef.current, state);
  }, [state]);

  const setMethod = (method: Method) => {
    stopPlaying();
    const oldMax = maxFor(state.method);
    const next = Math.round((state.step / oldMax) * maxFor(method));
    setState({ method, step: normalizeStep(next, method) });
  };
  const setStep = (step: number) => {
    stopPlaying();
    setState((current) => ({ ...current, step: normalizeStep(step, current.method) }));
  };
  const play = () => {
    stopPlaying();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      const next = { ...stateRef.current, step: maxFor(stateRef.current.method) };
      stateRef.current = next;
      setState(next);
      return;
    }
    const reset = { ...stateRef.current, step: 0 };
    stateRef.current = reset;
    setState(reset);
    timerRef.current = window.setInterval(() => {
      const current = stateRef.current;
      const max = maxFor(current.method);
      if (current.step >= max) { stopPlaying(); return; }
      setState({ ...current, step: current.step + 1 });
    }, 500);
  };

  const onCanvasPointer = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    if (y < 120) {
      const method: Method = 'teacher';
      stopPlaying();
      setState({ method, step: normalizeStep(((x - 52) / 856) * 100, method) });
    } else if (y > 338) {
      const method: Method = 'distilled';
      stopPlaying();
      setState({ method, step: normalizeStep(((x - 52) / 856) * 8, method) });
    }
  };
  const onCanvasKey = (event: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === 'ArrowLeft') setStep(state.step - 1);
    else if (event.key === 'ArrowRight') setStep(state.step + 1);
    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') setMethod(state.method === 'teacher' ? 'distilled' : 'teacher');
    else if (event.key === 'Home') setStep(0);
    else if (event.key === 'End') setStep(maxFor(state.method));
    else return;
    event.preventDefault();
  };

  const max = maxFor(state.method);
  const complete = state.step === max;
  const feedback = state.step === 0
    ? '准备开始：选择一条刻度并逐次查看函数评估次数。'
    : complete && state.method === 'distilled'
      ? '8 步完成：论文报告 DMD2 将采样从 100 压缩到 8 NFE。'
      : complete
        ? '教师刻度完成：100/100 NFE；切换到蒸馏刻度比较次数。'
        : `正在精炼：当前 ${state.step}/${max} NFE；照片变化仅表示进度。`;

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        tabIndex={0}
        aria-label={`采样步进器，当前${state.method === 'teacher' ? '教师' : '蒸馏'} ${state.step}/${max} NFE`}
        onPointerDown={onCanvasPointer}
        onKeyDown={onCanvasKey}
      />
      <div className="ctrl" role="group" aria-label="采样方法与步数">
        <button type="button" aria-pressed={state.method === 'teacher'} onClick={() => setMethod('teacher')}>教师 100 NFE</button>
        <button type="button" aria-pressed={state.method === 'distilled'} onClick={() => setMethod('distilled')}>蒸馏 8 NFE</button>
        <button type="button" onClick={() => setStep(state.step - 1)} disabled={state.step === 0}>上一步</button>
        <button type="button" onClick={() => setStep(state.step + 1)} disabled={complete}>下一步</button>
        <label>
          当前步 <span className="val">{state.step}/{max}</span>
          <input type="range" min={0} max={max} step={1} value={state.step} onChange={(event) => setStep(Number(event.target.value))} />
        </label>
        <button type="button" onClick={play}>从头播放</button>
        <button type="button" onClick={() => setStep(0)}>重置</button>
      </div>
      <div className={`feedback ${complete ? 'good' : ''}`} aria-live="polite">{feedback}</div>
      <div className="feedback" style={ { borderLeftColor: P.orange, color: P.orange } }>
        蒸馏涉及生成器 G、fake-flow 模型 F 与教师 T，三者均从教师初始化，训练时只优化生成分支。效率结论属于论文报告设置；图中清晰度不是质量测量。有效组合：教师 0–100 整数步，蒸馏 0–8 整数步。
      </div>
      <details>
        <summary>蒸馏中的三个模型</summary>
        <p>G 是待蒸馏生成器，F 估计生成分布分数，T 是教师；三者从教师初始化，只优化生成分支。训练节奏为 F 更新五次后 G 更新一次，这不是 8 步轨道的子步骤。</p>
      </details>
    </div>
  );
};

export default SamplerSteps;
