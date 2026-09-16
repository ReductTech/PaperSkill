import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

// Module 5.1: open-loop vs teacher-forced rollouts. Feeding the model's own prediction
// back in (autoregressive) compounds the error; resetting to the real state each step
// keeps the deviation small. This is the compounding-error problem.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'imperfectly learned models can lead to model exploitation, especially when used for long-horizon planning, resulting in degraded real-world performance.',
    zh: '不完美的模型会导致<b>模型利用</b>，<b>长时域</b>规划时尤其严重——因为错误预测会被当作下一步的输入继续放大。',
    locator: '§I · p.1',
    highlights: ['model exploitation', 'long-horizon planning'],
  },
  {
    en: 'However, accumulated model errors during these rollouts can distort the data distribution, negatively impacting policy learning and hindering long-term planning.',
    zh: '先前工作 [8]：<b>累积的模型误差</b>会扭曲数据分布，损害策略学习、阻碍长时域规划。',
    locator: '先前工作 [8] Abstract',
    highlights: ['accumulated model errors', 'distort the data distribution'],
  },
];

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, color: string) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 15px "Segoe UI", sans-serif';
  ctx.fillText(title, x + 16, y + 26);
}

// deviation when the model's own prediction is fed back (compounds)
const devLoop = (t: number) => Math.min(70, 0.09 * Math.pow(t, 1.35));
// deviation when every step is compared against the real state (stays controlled)
const devReset = (t: number) => 2.2 * Math.sin(t / 9) + Math.min(10, 0.12 * t);

export const Ch3RolloutCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase: 'idle' as 'idle' | 'running' | 'done', t: 0 });
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [feedback, setFeedback] = useState({
    text: '点击开始，对比「预测当输入」与「每步对照真实状态」两种想象 60 步的差别。',
    cls: '',
  });

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

    const drawRollout = (
      x: number,
      y: number,
      w: number,
      h: number,
      dev: (t: number) => number,
      color: string,
      title: string
    ) => {
      panel(ctx, x, y, w, h, title, color);
      const cy = y + h - 42;
      ctx.strokeStyle = C.track;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(x + 24, cy + 6);
      ctx.quadraticCurveTo(x + w / 2, cy - 50, x + w - 24, cy + 6);
      ctx.stroke();
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(x + 24, cy + 6);
      ctx.quadraticCurveTo(x + w / 2, cy - 50, x + w - 24, cy + 6);
      ctx.stroke();
      ctx.setLineDash([]);
      const n = 60;
      const upto = Math.floor(stateRef.current.t);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= upto; i++) {
        const u = i / n;
        const px = x + 24 + (w - 48) * u;
        const d = dev(i);
        const py = cy + 6 - 50 * Math.sin(Math.PI * u) + d * 0.62 * Math.sin(Math.PI * u);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      if (upto > 0 && upto <= n) {
        const u2 = upto / n;
        const px2 = x + 24 + (w - 48) * u2;
        const d0 = dev(upto);
        const py2 = cy + 6 - 50 * Math.sin(Math.PI * u2) + d0 * 0.62 * Math.sin(Math.PI * u2);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px2, py2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      drawRollout(20, 20, 500, 170, devReset, C.blue, '每步对照真实状态');
      drawRollout(560, 20, 500, 170, devLoop, C.red, '预测当输入（自回归）');

      // shared deviation curve at the bottom
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 20, 200, 1040, 64, 8);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(60, 252);
      ctx.lineTo(1020, 252);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('偏离中心线', 62, 216);
      ctx.textAlign = 'right';
      ctx.fillText(Math.min(60, Math.floor(s.t)) + ' / 60', 1016, 216);
      ctx.textAlign = 'left';
      const curve = (dev: (t: number) => number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= Math.floor(s.t); i++) {
          const px = 60 + (960 * i) / 60;
          const py = 252 - dev(i) * 0.9;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      };
      curve(devLoop, C.red);
      curve(devReset, C.blue);
    };

    const tick = () => {
      const s = stateRef.current;
      if (s.phase === 'running') {
        s.t = Math.min(60, s.t + 0.25);
        if (s.t >= 60) {
          s.phase = 'done';
          setPhase('done');
          setFeedback({
            text: '预测当输入：误差随步数累积、越走越偏（红）；每步对照真实状态：误差不累积（蓝）。误差滚雪球就是这样发生的。',
            cls: 'bad',
          });
        }
      }
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const startCompare = () => {
    stateRef.current.phase = 'running';
    stateRef.current.t = 0;
    setPhase('running');
    setFeedback({ text: '两侧从同一初始状态同步想象 60 步……', cls: '' });
  };

  const reset = () => {
    stateRef.current.phase = 'idle';
    stateRef.current.t = 0;
    setPhase('idle');
    setFeedback({
      text: '点击开始，对比「预测当输入」与「每步对照真实状态」两种想象 60 步的差别。',
      cls: '',
    });
  };

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="ctrl">
          <button onClick={startCompare} disabled={phase === 'running'}>
            开始对比
          </button>
          <button onClick={reset} disabled={phase !== 'done'}>
            重置
          </button>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch3RolloutCompare;
