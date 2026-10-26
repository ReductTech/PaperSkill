import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0',
  table: '#c9b79a',
  edge: '#92400e',
  blue: '#27446e',
  green: '#228d5c',
  red: '#c43f52',
  orange: '#f07e47',
  axis: '#d7deea',
  grid: '#e7ebf1',
  ink: '#21324a',
};

type Method = 'ft' | 'lwf';
type Phase = 'idle' | 'running' | 'done';

const START = 57.0;
const END: Record<Method, { warm: number; cold: number }> = {
  ft: { warm: 50.9, cold: 42.5 },
  lwf: { warm: 54.7, cold: 53.5 },
};

const DURATION = 2400;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  title: string,
  end: number,
  progress: number,
  color: string
) {
  const w = 466;
  const cardTop = 42;
  const cardBottom = 250;
  const plotTop = 82;
  const plotBottom = 226;
  const x0 = x + 36;
  const x1 = x + w - 36;
  const yFor = (v: number) => plotBottom - ((v - 40) / 20) * (plotBottom - plotTop);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.strokeStyle = C.axis;
  ctx.lineWidth = 1;
  roundRect(ctx, x, cardTop, w, cardBottom - cardTop, 10);
  ctx.fill();
  ctx.stroke();

  // 网格与纵轴
  for (let v = 40; v <= 60; v += 5) {
    ctx.strokeStyle = v === 40 ? C.axis : C.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, yFor(v));
    ctx.lineTo(x1, yFor(v));
    ctx.stroke();
  }
  ctx.strokeStyle = C.axis;
  ctx.beginPath();
  ctx.moveTo(x0, plotTop);
  ctx.lineTo(x0, plotBottom);
  ctx.stroke();

  // 起点 57.0
  ctx.strokeStyle = 'rgba(39, 68, 110, 0.22)';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(x0, yFor(START));
  ctx.lineTo(x1, yFor(START));
  ctx.stroke();
  ctx.setLineDash([]);

  // 曲线：随时间向右延伸，同时下降
  const p = clamp(progress, 0, 1);
  const endX = x0 + p * (x1 - x0);
  if (p > 0.002) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      const t = p * s;
      const value = START + (end - START) * easeOutCubic(t);
      const px = x0 + t * (x1 - x0);
      const py = yFor(value);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  const current = START + (end - START) * easeOutCubic(p);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(endX, yFor(current), 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 栏标题与当前终点值
  ctx.fillStyle = C.ink;
  ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, x + 16, 64);

  ctx.fillStyle = color;
  ctx.font = '700 21px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(current.toFixed(1), x + w - 16, 64);
}

export const M9Warmup: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [method, setMethod] = useState<Method>('ft');
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState({
    text: '同一批初始化，只差一个热身。',
    cls: '',
  });

  const methodRef = useRef<Method>('ft');
  const phaseRef = useRef<Phase>('idle');
  const progressRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let raf: number | null = null;
    const tick = (now: number) => {
      if (phaseRef.current === 'running') {
        const p = clamp((now - startRef.current) / DURATION, 0, 1);
        progressRef.current = p;
        if (p >= 1) {
          phaseRef.current = 'done';
          setPhase('done');
          setFeedback(
            methodRef.current === 'ft'
              ? {
                  text: '微调：有热身 50.9，没热身 42.5 —— 热身救了 8.4 个点。',
                  cls: 'bad',
                }
              : {
                  text: 'LwF：有热身 54.7，没热身 53.5 —— 只差 1.2 个点，热身对它不关键。',
                  cls: 'good',
                }
          );
        }
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = C.table;
      ctx.fillRect(0, 258, W, 22);
      ctx.strokeStyle = C.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 258);
      ctx.lineTo(W, 258);
      ctx.stroke();

      const m = methodRef.current;
      const p = progressRef.current;
      const colorRight = m === 'ft' ? C.red : C.orange;
      drawPanel(ctx, 48, '有热身', END[m].warm, p, C.green);
      drawPanel(ctx, 566, '无热身', END[m].cold, p, colorRight);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const reset = () => {
    progressRef.current = 0;
    phaseRef.current = 'idle';
    setPhase('idle');
    setFeedback({ text: '同一批初始化，只差一个热身。', cls: '' });
  };

  const startCompare = () => {
    if (phaseRef.current === 'running') return;
    if (phaseRef.current === 'done') {
      reset();
      return;
    }
    progressRef.current = 0;
    startRef.current = performance.now();
    phaseRef.current = 'running';
    setPhase('running');
    setFeedback({ text: '两条旧任务曲线同时往下走 —— 看谁先稳住。', cls: '' });
  };

  const pickMethod = (m: Method) => {
    methodRef.current = m;
    setMethod(m);
    progressRef.current = 0;
    phaseRef.current = 'idle';
    setPhase('idle');
    setFeedback({ text: '同一批初始化，只差一个热身。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row" role="group" aria-label="选择方法">
        <button
          type="button"
          className={`chip ${method === 'ft' ? 'selected' : ''}`}
          aria-pressed={method === 'ft'}
          onClick={() => pickMethod('ft')}
        >
          微调
        </button>
        <button
          type="button"
          className={`chip ${method === 'lwf' ? 'selected' : ''}`}
          aria-pressed={method === 'lwf'}
          onClick={() => pickMethod('lwf')}
        >
          LwF
        </button>
      </div>
      <div className="step-ctrl">
        <button
          type="button"
          className="chip"
          onClick={startCompare}
          disabled={phase === 'running'}
        >
          {phase === 'done' ? '重置' : '开始对比'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M9Warmup;
