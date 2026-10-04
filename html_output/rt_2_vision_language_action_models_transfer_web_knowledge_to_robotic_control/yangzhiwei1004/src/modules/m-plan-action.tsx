import React, { useEffect, useRef, useState } from 'react';
import { observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// ============================================================================
// Presentation mode: hybrid linked views (left pan scene; right Plan-then-action step strip).
// m-plan-action — chapter 5 active module (P2 step-through + P4 chips).
// Learner steps Plan(0) -> Action(1) and toggles 有 Plan / 无 Plan.
// Canvas: a pan with food; with Plan a blue bubble appears first, then the hand
// flips the food onto the target side (green). Without Plan the hand acts at
// once and lands slightly off the target (orange). One dominant step operation.
// Evidence: page 10 §4.4 / page 11 Fig 7 (chain-of-thought, qualitative);
// page 6 §3.2 Output Constraint.
// ============================================================================

const W = 720;
const H = 300;
const C = {
  bg: '#f5f8f0', counter: '#e7e3d8', counterEdge: '#cfc8b6', envLight: '#b8c9a7',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  ink: '#21324a', muted: '#68778f', axis: '#d7deea',
};

function label(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.muted) {
  ctx.fillStyle = color;
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  ctx.fillText(text, x, y);
}

export const MPlanAction: React.FC<WidgetProps> = ({ chapterId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const withPlan = useRef(true);
  const step = useRef(0);
  const [withPlanUi, setWithPlanUi] = useState(true);
  const [stepUi, setStepUi] = useState(0);
  const [fb, setFb] = useState({ text: '按「下一步」，先看它出 Plan，再动手。', cls: '' });

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = 720;
    const h = 300;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.envLight;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(0, 0, w, 30);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.counter;
    ctx.fillRect(0, 210, w, h - 210);
    ctx.strokeStyle = C.counterEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 210);
    ctx.lineTo(w, 210);
    ctx.stroke();

    // pan
    ctx.fillStyle = '#5a5f66';
    ctx.beginPath();
    ctx.ellipse(320, 214, 110, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3f444b';
    ctx.lineWidth = 2;
    ctx.stroke();
    // target-side marker
    const targetX = 400;
    ctx.strokeStyle = C.axis;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(targetX, 190);
    ctx.lineTo(targetX, 240);
    ctx.stroke();
    ctx.setLineDash([]);
    label(ctx, targetX - 16, 186, '目标侧', C.muted);

    // Plan bubble at step 0 with plan
    if (withPlan.current && step.current === 0) {
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(250, 40, 150, 28, 9);
      ctx.stroke();
      label(ctx, 262, 58, '打算：把菜翻到目标侧', C.blue);
    }

    // food + hand
    const t = withPlan.current ? clamp((step.current - 0.2) / 0.8, 0, 1) : clamp(step.current, 0, 1);
    const foodX = lerp(300, withPlan.current ? 402 : 372, t);
    ctx.fillStyle = '#b9772f';
    ctx.beginPath();
    ctx.ellipse(foodX, 206, 17, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // hand position
    const hx = lerp(300, withPlan.current ? 402 : 372, t);
    const hy = lerp(140, 178, t);
    ctx.strokeStyle = '#e8c39a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + 26, hy - 10);
    ctx.stroke();
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath();
    ctx.ellipse(hx, hy + 6, 15, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a075';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    canvas.classList.add('is-ready');
    const loop = () => {
      render();
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFeedback = () => {
    if (withPlan.current) {
      setFb(
        step.current >= 1
          ? { text: '先说出 Plan，动作落到目标一侧。', cls: 'good' }
          : { text: '它先写出了「打算」，这时还没动手。', cls: '' }
      );
    } else {
      setFb(
        step.current >= 1
          ? { text: '少了 Plan，动作虽然快，却容易偏。', cls: 'bad' }
          : { text: '没有 Plan，它只会立刻出手。', cls: '' }
      );
    }
  };

  const next = () => {
    step.current = Math.min(1, step.current + 1);
    setStepUi(step.current);
    setFeedback();
  };
  const prev = () => {
    step.current = Math.max(0, step.current - 1);
    setStepUi(step.current);
    setFeedback();
  };
  const reset = () => {
    step.current = 0;
    setStepUi(0);
    setFeedback();
  };
  const choose = (p: boolean) => {
    withPlan.current = p;
    setWithPlanUi(p);
    step.current = 0;
    setStepUi(0);
    setFeedback();
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-m-plan-action`} ref={canvasRef} width={W} height={H} aria-label="先出 Plan 再执行动作" />
      <div className="chip-row">
        <button type="button" className={`chip ${withPlanUi ? 'selected' : ''}`} onClick={() => choose(true)}>
          有 Plan
        </button>
        <button type="button" className={`chip ${!withPlanUi ? 'selected' : ''}`} onClick={() => choose(false)}>
          无 Plan
        </button>
      </div>
      <div className="step-ctrl">
        <button type="button" className="chip" onClick={prev} disabled={stepUi === 0}>
          上一步
        </button>
        <span className="val">
          第 {stepUi + 1} / 2 步
        </span>
        <button type="button" className="chip" onClick={next} disabled={stepUi >= 1}>
          {stepUi >= 1 ? '已完成' : '下一步'}
        </button>
        <button type="button" className="chip" onClick={reset}>
          重置
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default MPlanAction;
