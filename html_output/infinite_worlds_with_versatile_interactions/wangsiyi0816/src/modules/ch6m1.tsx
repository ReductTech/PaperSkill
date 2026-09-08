import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas } from '../lib/canvasKit';
import {
  PAL,
  clearPanel,
  drawInset,
  drawLegend,
  drawSceneLabel,
  wrapText,
  setupCrispCanvas,
  useAutoplay,
} from './knitKit';
import type { WidgetProps } from './registry';

const W = 720;
const H = 300;
const POINTS = 6;

const STEP_TEXT: string[] = [
  '取点 1：靠近纯噪声。学生在这里直接给出一个输出。',
  '取点 2：教师沿 PF-ODE 前进了一小段。',
  '取点 3：轨迹中段。',
  '取点 4：噪声已经明显减少。',
  '取点 5：接近干净帧。',
  '取点 6：轨迹末端——把六个输出并排看，它们应当彼此一致。',
];

// teacher PF-ODE trajectory inside the traj region
function trajPoint(u: number): [number, number] {
  const x = 60 + u * (470 - 60);
  const y = 66 + (176 - 66) * (1 - Math.pow(1 - u, 1.7));
  return [x, y];
}

/** One small knit swatch: the student's output frame. */
function drawSwatch(ctx: CanvasRenderingContext2D, x: number, y: number, filled: boolean): void {
  ctx.fillStyle = PAL.paper;
  ctx.strokeStyle = filled ? PAL.green : PAL.axis;
  ctx.lineWidth = filled ? 1.8 : 1;
  ctx.beginPath();
  ctx.rect(x, y, 62, 46);
  ctx.fill();
  ctx.stroke();
  if (filled) {
    ctx.strokeStyle = PAL.green;
    ctx.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) {
      const cx = x + 11 + k * 13.5;
      ctx.beginPath();
      ctx.moveTo(cx, y + 9);
      ctx.lineTo(cx, y + 37);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = PAL.muted;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 23, y + 23);
    ctx.lineTo(x + 39, y + 23);
    ctx.stroke();
  }
}

export const Ch6M1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ step: number }>({ step: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({ text: STEP_TEXT[0], cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    let detachCrisp: () => void;
    try {
      const crisp = setupCrispCanvas(canvas, W, H);
      ctx = crisp.ctx;
      detachCrisp = crisp.detach;
    } catch {
      return;
    }

    const render = (s: { step: number }) => {
      clearPanel(ctx, W, H);

      // teacher trajectory
      ctx.strokeStyle = PAL.blue;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const [x, y] = trajPoint(i / 60);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = PAL.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('教师 PF-ODE 轨迹', 60, 54);
      ctx.fillText('噪声端', 42, 196);
      ctx.fillText('干净端', 448, 196);

      // the six sample points
      for (let k = 0; k < POINTS; k++) {
        const [x, y] = trajPoint(k / (POINTS - 1));
        const sel = k === s.step;
        ctx.fillStyle = PAL.blue;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        if (sel) {
          ctx.strokeStyle = PAL.orange;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // dropline from the selected point to its output cell
      const [sx, sy] = trajPoint(s.step / (POINTS - 1));
      const cellX = 60 + s.step * 70;
      // This line is the whole point of the module — it ties the selected
      // trajectory point to the output it produces — so it must read clearly
      // rather than sit at axis-grey. Orange matches the selected-point ring.
      ctx.strokeStyle = PAL.orange;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, sy + 10);
      ctx.lineTo(cellX + 31, 210);
      ctx.stroke();
      ctx.setLineDash([]);
      // small arrow head at the output end so the direction is explicit
      ctx.beginPath();
      ctx.moveTo(cellX + 31, 212);
      ctx.lineTo(cellX + 26, 203);
      ctx.moveTo(cellX + 31, 212);
      ctx.lineTo(cellX + 36, 203);
      ctx.stroke();

      // six output cells: all filled ones are drawn identically
      for (let k = 0; k < POINTS; k++) {
        drawSwatch(ctx, 60 + k * 70, 214, k <= s.step);
      }
      ctx.fillStyle = PAL.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('学生在各取点的输出', 60, 278);

      // consistency inset
      drawInset(ctx, 508, 56, 190, 200, '一致性检查');
      let ty = 96;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillStyle = s.step >= 1 ? PAL.green : PAL.muted;
      ctx.fillText(`G(取点 ${s.step + 1}) ≈ 教师最终输出`, 522, ty);
      ty += 28;
      ctx.fillStyle = PAL.ink;
      ty = wrapText(ctx, 'EMA 副本 G⁻ 提供一致性目标，本身不直接被梯度更新。', 522, ty, 164, 19);
      ty += 10;
      ctx.fillStyle = PAL.blue;
      wrapText(ctx, '压缩的同时保留预训练获得的动作条件动力学。', 522, ty, 164, 19);

      drawSceneLabel(ctx, 34, 32, `第 ${s.step + 1} / ${POINTS} 个取点`);
      drawLegend(ctx, 60, 294, [
        { color: PAL.blue, label: '教师轨迹' },
        { color: PAL.green, label: '学生输出一致' },
        { color: PAL.orange, label: '当前取点' },
      ]);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      detachCrisp();
    };
  }, []);

  const goto = (n: number) => {
    const v = Math.max(0, Math.min(POINTS - 1, n));
    stateRef.current.step = v;
    setStep(v);
    setFeedback(
      v === POINTS - 1
        ? {
            text: '六个取点的输出并排看下来彼此一致——这正是一致性蒸馏要的「轨迹不变」：同一条教师轨迹上的任意点，学生都给出同一个结果，于是多步轨迹被压进少步生成。',
            cls: 'good',
          }
        : { text: STEP_TEXT[v], cls: '' }
    );
  };

  // Autoplay fills the six output cells one at a time and stops on the last one,
  // where the payoff line lands: every cell came out the same.
  const demo = useAutoplay({ steps: [0, 1, 2, 3, 4, 5], intervalMs: 1500 }, (n: number) => goto(n));

  const manual = (n: number) => {
    demo.stop();
    goto(n);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => manual(step - 1)} disabled={step === 0}>
          上一点
        </button>
        <span className="step-label">
          第 <b>{step + 1}</b> / {POINTS} 个取点
        </span>
        <button
          className="tiny"
          onClick={() => manual(step + 1)}
          disabled={step === POINTS - 1}
        >
          {step === POINTS - 1 ? '已到终点' : '下一点'}
        </button>
        <button className="tiny ghost" onClick={() => manual(0)}>
          重置
        </button>
        <button className={demo.btnClass} onClick={demo.toggle}>
          {demo.label}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6M1;
