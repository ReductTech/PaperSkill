import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic, easeInOutQuad, lerpColor } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawWheel,
  drawClay,
  drawVerdict,
  drawSceneLabel,
  drawLegend,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch4 module: step through the flow-matching training objective in four steps.
// ① 采成品 A — a vase flies from the demo shelf onto the wheel.
// ② 采噪声 ε — a grey noise blob grows beside it.
// ③ 糅合 Aτ = τA + (1−τ)ε — the two ghosts merge into the blended clay.
// ④ 学方向 — the purple vθ arrow rotates to align with the orange u = A −ε
//   arrow; a green check appears once aligned. The full formula lives in the
//   DOM formula card; only short stage labels appear on the canvas.
const W = 1080;
const H = 280;
const STEPS = 4;

const STAGE_LABELS = ['①采成品', '②采噪声', '③糅合', '④学方向'];

const FB_STEPS = [
  { text: '① 采成品：从演示数据里取一段真实动作块 A——师傅的传世手法。', cls: '' },
  { text: '② 采噪声：抓一团各向同性的随机噪声泥 ε∼N(0,I)。', cls: '' },
  { text: '③ 糅合：Aτ=τA+(1−τ)ε——此刻 τ=0.5，五分真迹五分噪声。', cls: '' },
  { text: '四步就是全部：没有词表、没有档位——直接在连续空间里学『推的方向』。', cls: 'good' },
];

const BLEND_COL = lerpColor('#9aa3ad', C.green, 0.5);

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(a - 0.42), y2 - 10 * Math.sin(a - 0.42));
  ctx.lineTo(x2 - 10 * Math.cos(a + 0.42), y2 - 10 * Math.sin(a + 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const Ch4Loss: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ step: number; t0: number }>({ step: 1, t0: 0 });
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState(FB_STEPS[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (ms: number) => {
      const s = stateRef.current;
      if (s.t0 === 0) s.t0 = ms;
      const stepT = (ms - s.t0) / 1000;
      const step = s.step;

      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H);

      // ---- Top row: stage boxes lighting up per step ----
      for (let i = 0; i < STEPS; i++) {
        const x0 = 65 + i * 255;
        const state = i < step - 1 ? 'done' : i === step - 1 ? 'active' : 'pending';
        ctx.save();
        if (state === 'active') {
          ctx.fillStyle = C.blue;
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 2.5;
        } else if (state === 'done') {
          ctx.fillStyle = '#e7f3ec';
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = C.white;
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.75;
        }
        ctx.beginPath();
        ctx.roundRect(x0, 18, 220, 30, 6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        drawSceneLabel(ctx, STAGE_LABELS[i], x0 + 110, 33, {
          color: state === 'active' ? C.white : state === 'done' ? C.green : C.muted,
          align: 'center',
        });
      }

      // ---- Main scene: the wheel ----
      drawWheel(ctx, 540, 191, 58, { spin: ms / 900 });

      if (step === 1) {
        // Demo shelf on the left; one vase flies onto the wheel.
        ctx.save();
        ctx.strokeStyle = C.support;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(80, 140);
        ctx.lineTo(300, 140);
        ctx.stroke();
        ctx.restore();
        drawClay(ctx, 120, 134, 1, { color: C.green, size: 0.5 });
        drawClay(ctx, 272, 134, 1, { color: C.green, size: 0.5 });
        const m = easeOutCubic(clamp((stepT - 0.25) / 0.9, 0, 1));
        if (m < 1) {
          drawClay(ctx, 196 + (540 - 196) * m, 134 + (176 - 134) * m, 1, {
            color: C.green,
            size: 0.5 + 0.5 * m,
          });
        } else {
          drawClay(ctx, 540, 172, 1, { color: C.green, size: 1 });
        }
      } else {
        // Steps 2+: the sampled vase A stays on the wheel.
        drawClay(ctx, 540, 172, 1, { color: step >= 3 ? '#b9dcc9' : C.green, size: 1 });
      }

      if (step === 2) {
        // The noise blob ε grows beside the wheel.
        const g = easeOutCubic(clamp((stepT - 0.2) / 0.7, 0, 1));
        ctx.save();
        ctx.strokeStyle = C.muted;
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(770, 148, 30 + 6 * g, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        drawClay(ctx, 770, 148, 0, { color: C.muted, size: 0.25 + g * 0.95, t: ms / 500 });
      } else if (step === 3) {
        // Ghosts converge and the blended clay emerges.
        const m3 = easeInOutQuad(clamp((stepT - 0.2) / 1.0, 0, 1));
        drawClay(ctx, 540 + (486 - 540) * m3, 172, 1, { color: '#b9dcc9', size: 0.9 });
        drawClay(ctx, 770 + (594 - 770) * m3, 168, 0, {
          color: '#c9ced6',
          size: 0.9,
          t: ms / 500,
        });
        drawClay(ctx, 540, 172, 0.5, {
          color: BLEND_COL,
          size: 0.35 + 0.95 * m3,
          t: ms / 520,
        });
      } else {
        // Step 4: vθ rotates to align with u; green check when aligned.
        drawClay(ctx, 540, 172, 0.5, { color: BLEND_COL, size: 1.05, t: ms / 600 });
        drawClay(ctx, 740, 150, 1, { color: '#cde8da', size: 0.75 });
        const ox = 566;
        const oy = 150;
        drawArrow(ctx, ox, oy, 708, 144, C.orange, 3.5);
        const thetaU = Math.atan2(144 - oy, 708 - ox);
        const align = easeInOutQuad(clamp((stepT - 0.55) / 1.15, 0, 1));
        const theta = thetaU + (1 - align) * 1.15;
        const len = 92;
        drawArrow(ctx, ox, oy, ox + len * Math.cos(theta), oy + len * Math.sin(theta), C.purple, 3.5);
        if (align >= 1 && stepT > 1.7) {
          drawVerdict(ctx, 660, 98, true, { r: 14, pulse: (stepT - 1.7) * 2 });
        }
      }

      drawLegend(
        ctx,
        [['真动作 A', C.green], ['噪声 ε', C.muted], ['vθ 对齐 u', C.purple]],
        70,
        270
      );
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const tick = (ms: number) => {
      render(ms);
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
    };
  }, []);

  const go = (n: number) => {
    const next = clamp(n, 1, STEPS);
    stateRef.current.step = next;
    stateRef.current.t0 = performance.now();
    setStep(next);
    setFeedback(FB_STEPS[next - 1]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => go(step - 1)} disabled={step === 1}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{step}</b> / {STEPS} 步
        </span>
        <button className="tiny" onClick={() => go(step + 1)} disabled={step === STEPS}>
          下一步
        </button>
        <button className="tiny ghost" onClick={() => go(1)}>
          复位
        </button>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default Ch4Loss;
