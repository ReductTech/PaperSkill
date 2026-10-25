import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  T,
  posteriorAt,
  abarAt,
  fmt,
  clearField,
  sceneLabel,
  roundRect,
} from './ddpm-common';

// Module 4.3 — the tractable posterior q(x_{t−1}|x_t, x_0) (paper Eq. (6)–(7)).
// Displays the EXACT coefficients (no step-100 shortcuts): μ̃_t = c₀·x₀ + c_t·x_t and
// β̃_t = (1−ᾱ_{t−1})/(1−ᾱ_t)·β_t. At t = 1 the posterior is degenerate and the paper
// switches to the discrete decoder p_θ(x_0|x_1) (Eq. (13), the L_0 term) — shown below.

const W = 1080;
const H = 280;

const COL = {
  ink: '#21324a',
  slate: '#68778f',
  purple: '#7c3aed',
  blue: '#27446e',
  mark: '#d97706',
  grid: '#dbe4d0',
  axis: '#d7deea',
  red: '#c43f52',
};

const PLOT = { x: 80, y: 58, w: 470, h: 178 };
const VAR_MAX = 0.02;

const CURVE_T: number[] = [];
const CURVE_V: number[] = [];
for (let i = 0; i < 240; i += 1) {
  const t = Math.round(2 + ((T - 2) * i) / 239);
  CURVE_T.push(t);
  CURVE_V.push(posteriorAt(t)!.variance);
}

function tx(t: number): number {
  return map(t, 2, T, PLOT.x, PLOT.x + PLOT.w);
}

function vy(v: number): number {
  return map(clamp(v, 0, VAR_MAX), 0, VAR_MAX, PLOT.y + PLOT.h, PLOT.y);
}

function feedbackFor(t: number): string {
  if (t === 1) {
    return 't=1：后验 q(x₀|x₁,x₀) 退化为点质量（β̃₁=0），没有可采样的高斯。采样（Algorithm 2）最后一步 z=0、不添加噪声，直接输出 μθ(x₁,1)；似然计算才用到离散解码器（Eq. (13)，L₀）—— 两者不是同一操作。';
  }
  const p = posteriorAt(t)!;
  if (t <= 30) {
    return `t=${t}：xₜ 还很干净，后验几乎只依赖 xₜ（cₜ=${fmt(p.ctx)}），μ̃ₜ 与 xₜ 相距极小；β̃ₜ=${fmt(p.variance)}，这是「只做细微修正」的数学原因。`;
  }
  if (t >= 700) {
    return `t=${t}：接近纯噪声区段，cₜ=${fmt(p.ctx)}、c₀=${fmt(p.c0)}，β̃ₜ=${fmt(p.variance)}。训练时这条后验是 pθ 的比较对象（Eq. (5) 的 Lₜ₋₁ 项）。`;
  }
  return `t=${t}：μ̃ₜ = c₀·x₀ + cₜ·xₜ，其中 c₀=${fmt(p.c0)}、cₜ=${fmt(p.ctx)}；后验方差 β̃ₜ=${fmt(p.variance)}（Eq. (7) 精确值）。`;
}

function drawGaussian(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  sigma: number,
  color: string
): void {
  const sig = Math.max(4, sigma);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = cx - 120; x <= cx + 120; x += 2) {
    const d = x - cx;
    const y = baseY - Math.exp(-(d * d) / (2 * sig * sig)) * 56;
    if (x === cx - 120) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

export const Ch4Posterior: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ t: 500 });
  const [t, setT] = useState(500);
  const [feedback, setFeedback] = useState(feedbackFor(500));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (): void => {
      const tt = stateRef.current.t;
      clearField(ctx, W, H);

      // ---- left: β̃_t curve over t ----
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PLOT.x, PLOT.y);
      ctx.lineTo(PLOT.x, PLOT.y + PLOT.h);
      ctx.lineTo(PLOT.x + PLOT.w, PLOT.y + PLOT.h);
      ctx.stroke();

      [0, 0.01, 0.02].forEach((v) => {
        ctx.strokeStyle = COL.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PLOT.x, vy(v));
        ctx.lineTo(PLOT.x + PLOT.w, vy(v));
        ctx.stroke();
        ctx.fillStyle = COL.slate;
        ctx.font = '500 13px "Segoe UI","PingFang SC",sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(v.toFixed(2), PLOT.x - 8, vy(v) + 4);
      });

      ctx.strokeStyle = COL.purple;
      ctx.lineWidth = 3;
      ctx.beginPath();
      CURVE_T.forEach((ct, i) => {
        const x = tx(ct);
        const y = vy(CURVE_V[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      if (tt >= 2) {
        ctx.strokeStyle = COL.mark;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(tx(tt), PLOT.y - 8);
        ctx.lineTo(tx(tt), PLOT.y + PLOT.h);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = COL.purple;
        ctx.beginPath();
        ctx.arc(tx(tt), vy(posteriorAt(tt)!.variance), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      sceneLabel(ctx, 'β̃ₜ（单步后验方差，Eq. (7)）', PLOT.x, PLOT.y - 22, { size: 16 });
      sceneLabel(ctx, 't →', PLOT.x + PLOT.w - 30, PLOT.y + PLOT.h + 30, {
        size: 14,
        color: COL.slate,
      });

      // ---- right: formula + live numbers + gaussian shape ----
      const RX = 620;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(RX - 16, 34, 428, 214);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(RX - 16, 34, 428, 214);

      sceneLabel(ctx, 'q(xₜ₋₁|xₜ, x₀) = N(μ̃ₜ, β̃ₜ·I)', RX, 62, { size: 16 });

      if (tt >= 2) {
        const p = posteriorAt(tt)!;
        ctx.font = '700 19px "Cascadia Code","Consolas",monospace';
        ctx.fillStyle = COL.ink;
        ctx.textAlign = 'left';
        ctx.fillText('μ̃ₜ = c₀·x₀ + cₜ·xₜ', RX, 92);
        ctx.font = '600 16px "Cascadia Code","Consolas",monospace';
        ctx.fillStyle = COL.blue;
        ctx.fillText(`c₀ = ${fmt(p.c0)}`, RX, 118);
        ctx.fillStyle = COL.blue;
        ctx.fillText(`cₜ = ${fmt(p.ctx)}`, RX + 210, 118);
        ctx.fillStyle = COL.purple;
        ctx.fillText(`β̃ₜ = ${fmt(p.variance)}`, RX, 142);

        drawGaussian(ctx, RX + 210, 226, clamp(map(Math.sqrt(p.variance), 0.005, 0.145, 8, 58), 8, 58), COL.purple);
        sceneLabel(ctx, '后验分布形状（宽度 ∝ √β̃ₜ）', RX - 4, 194, {
          size: 13,
          color: COL.slate,
        });
      } else {
        // t = 1 special case
        ctx.fillStyle = COL.red;
        ctx.font = '700 18px "Segoe UI","PingFang SC",sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('t = 1：没有可用的高斯后验', RX, 98);
        ctx.fillStyle = COL.ink;
        ctx.font = '500 15px "Segoe UI","PingFang SC",sans-serif';
        const lines = [
          'β̃₁ = 0，q(x₀|x₁,x₀) 是点质量（没有可采样的高斯）；',
          '采样（Algorithm 2）最后一步：z = 0，不添加噪声，',
          '直接显示 μθ(x₁,1)（论文 §3.3）；',
          '似然计算则用离散解码器 pθ(x₀|x₁)（Eq. (13)，对应 L₀）——',
          '与采样输出不是同一操作。',
        ];
        lines.forEach((line, i) => {
          ctx.fillText(line, RX, 126 + i * 24);
        });
      }
    };

    const tick = (): void => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const apply = (next: number): void => {
    const v = Math.max(1, Math.min(T, Math.round(next)));
    stateRef.current.t = v;
    setT(v);
    setFeedback(feedbackFor(v));
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          时间步 t <span className="val">{t === 1 ? '1（特例）' : t}</span>
        </label>
        <input
          type="range"
          min={1}
          max={T}
          value={t}
          onChange={(e) => apply(Number(e.target.value))}
        />
      </div>
      <div className="chip-row">
        {[1000, 500, 100, 2, 1].map((v) => (
          <button
            key={v}
            type="button"
            className={`chip ${t === v ? 'selected' : ''}`}
            onClick={() => apply(v)}
          >
            {v === 1 ? 't = 1（特例）' : `t = ${v}`}
          </button>
        ))}
      </div>
      <div className="feedback">{feedback}</div>
    </div>
  );
};

export default Ch4Posterior;
