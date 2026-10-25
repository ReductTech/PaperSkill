import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  T,
  betaAt,
  alphaAt,
  abarAt,
  signalCoef,
  noiseCoef,
  posteriorAt,
  fmt,
  clearField,
  sceneLabel,
} from './ddpm-common';

// Module 4.1 — the REAL noise schedule. Every displayed number comes from the exact
// paper schedule (β₁=1e-4 → β_T=0.02 linear, ᾱ_t = ∏(1−β_s)); no approximation is used.

const W = 1080;
const H = 280;

const COL = {
  abar: '#27446e',
  signal: '#228d5c',
  noise: '#7c3aed',
  mark: '#d97706',
  grid: '#dbe4d0',
  axis: '#d7deea',
  ink: '#21324a',
  slate: '#68778f',
};

const PLOT = { x: 84, y: 58, w: 560, h: 178 };
const PANEL_X = 700;

// Precompute curve samples once (t = 1..1000).
const CURVE_N = 240;
const CURVE_T: number[] = [];
const CURVE_ABAR: number[] = [];
const CURVE_SIG: number[] = [];
const CURVE_NOI: number[] = [];
for (let i = 0; i < CURVE_N; i += 1) {
  const t = Math.round(1 + ((T - 1) * i) / (CURVE_N - 1));
  CURVE_T.push(t);
  CURVE_ABAR.push(abarAt(t));
  CURVE_SIG.push(signalCoef(t));
  CURVE_NOI.push(noiseCoef(t));
}

function tx(t: number): number {
  return map(t, 1, T, PLOT.x, PLOT.x + PLOT.w);
}

function ty(v: number): number {
  return map(clamp(v, 0, 1), 0, 1, PLOT.y + PLOT.h, PLOT.y);
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  values: number[],
  color: string,
  width = 3
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = tx(CURVE_T[i]);
    const y = ty(v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawDot(ctx: CanvasRenderingContext2D, t: number, v: number, color: string): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(tx(t), ty(v), 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function feedbackFor(t: number): string {
  if (t === 1) {
    return `t=1：β₁ = ${fmt(betaAt(1))}（最小噪声）；ᾱ₁ = 1 − β₁ = ${fmt(abarAt(1))}（噪声方差占比 1−ᾱ₁ = ${fmt(betaAt(1))}）。`;
  }
  if (t === T) {
    return `t=1000：β₁₀₀₀ = ${fmt(betaAt(T))}；ᾱ₁₀₀₀ = ${fmt(abarAt(T))} ≈ 4×10⁻⁵ —— 噪声方差占比 1−ᾱₜ ≈ 99.996%，信号几乎被完全破坏（论文：L_T 在此量级 ≈10⁻⁵ bits/dim）。`;
  }
  if (t >= 700) {
    return `t=${t}：噪声已占绝对主导 —— 方差权重 1−ᾱₜ = ${fmt(1 - abarAt(t))}（信号仅剩 ᾱₜ = ${fmt(abarAt(t))}）；幅度系数 √ᾱₜ = ${fmt(signalCoef(t))}。这一区段的去噪最难，也是 L_simple 相对加权的区段。`;
  }
  if (t >= 300) {
    return `t=${t}：噪声项占主导、原始信号贡献已明显减弱 —— 方差权重 1−ᾱₜ = ${fmt(1 - abarAt(t))}（约 ${(Math.round((1 - abarAt(t)) * 1000) / 10).toFixed(1)}%），信号幅度系数 √ᾱₜ = ${fmt(signalCoef(t))}。`;
  }
  if (t >= 30) {
    return `t=${t}：噪声已不可忽略，但信号仍清晰可辨 —— 信号方差权重 ᾱₜ = ${fmt(abarAt(t))}（约 ${(Math.round(abarAt(t) * 1000) / 10).toFixed(1)}%）。`;
  }
  return `t=${t}：噪声仍然很小（√(1−ᾱₜ)=${fmt(noiseCoef(t))}），后验修正也只需要很小的幅度。`;
}

export const Ch4Beta: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ t: 500 });
  const rafRef = useRef<number | null>(null);
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

      // axes
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PLOT.x, PLOT.y);
      ctx.lineTo(PLOT.x, PLOT.y + PLOT.h);
      ctx.lineTo(PLOT.x + PLOT.w, PLOT.y + PLOT.h);
      ctx.stroke();

      // horizontal gridlines at 0 / 0.5 / 1
      [0, 0.5, 1].forEach((v) => {
        ctx.strokeStyle = COL.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PLOT.x, ty(v));
        ctx.lineTo(PLOT.x + PLOT.w, ty(v));
        ctx.stroke();
        ctx.fillStyle = COL.slate;
        ctx.font = '500 13px "Segoe UI","PingFang SC",sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(v.toFixed(1), PLOT.x - 8, ty(v) + 4);
      });

      // curves: ᾱ_t (blue), √ᾱ_t (green), √(1−ᾱ_t) (purple)
      drawCurve(ctx, CURVE_ABAR, COL.abar);
      drawCurve(ctx, CURVE_SIG, COL.signal);
      drawCurve(ctx, CURVE_NOI, COL.noise);

      // marker
      ctx.strokeStyle = COL.mark;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(tx(tt), PLOT.y - 8);
      ctx.lineTo(tx(tt), PLOT.y + PLOT.h);
      ctx.stroke();
      ctx.setLineDash([]);
      drawDot(ctx, tt, abarAt(tt), COL.abar);
      drawDot(ctx, tt, signalCoef(tt), COL.signal);
      drawDot(ctx, tt, noiseCoef(tt), COL.noise);

      sceneLabel(ctx, 't（前向时间步）→', PLOT.x + PLOT.w - 150, PLOT.y + PLOT.h + 30, {
        size: 15,
        color: COL.slate,
      });

      // legend
      const legend: Array<[string, string]> = [
        [COL.abar, 'ᾱₜ（累计信号）'],
        [COL.signal, '√ᾱₜ（信号幅度系数）'],
        [COL.noise, '√(1−ᾱₜ)（噪声幅度系数）'],
      ];
      let lx = PLOT.x;
      ctx.font = '700 14px "Segoe UI","PingFang SC",sans-serif';
      legend.forEach(([c, label]) => {
        ctx.fillStyle = c;
        ctx.fillRect(lx, H - 26, 13, 13);
        ctx.fillStyle = COL.ink;
        ctx.textAlign = 'left';
        ctx.fillText(label, lx + 18, H - 15);
        lx += 18 + ctx.measureText(label).width + 22;
      });

      // how to read the coefficients (review round 2, P0-3)
      ctx.fillStyle = '#8b97ab';
      ctx.font = '600 13px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillText('读法：√ᾱₜ、√(1−ᾱₜ) 是幅度系数；其平方 ᾱₜ、1−ᾱₜ 才是方差权重 —— 与“图像内容百分比”无关。', 36, 28);

      // right panel: exact numbers
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(PANEL_X - 12, 34, 392, 214);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(PANEL_X - 12, 34, 392, 214);

      const rows: Array<[string, string]> = [
        ['t', String(tt)],
        ['βₜ = 1−αₜ', fmt(betaAt(tt))],
        ['αₜ = 1−βₜ', fmt(alphaAt(tt))],
        ['ᾱₜ = ∏(1−βs)', fmt(abarAt(tt))],
        ['√ᾱₜ（信号系数）', fmt(signalCoef(tt))],
        ['√(1−ᾱₜ)（噪声系数）', fmt(noiseCoef(tt))],
        ['β̃ₜ（后验方差，Eq.7）', tt >= 2 ? fmt(posteriorAt(tt)!.variance) : '—（t=1 特判，见 §4.3）'],
      ];
      let ry = 62;
      rows.forEach(([label, value]) => {
        ctx.font = '600 15px "Segoe UI","PingFang SC",sans-serif';
        ctx.fillStyle = COL.slate;
        ctx.textAlign = 'left';
        ctx.fillText(label, PANEL_X, ry);
        ctx.font = '700 17px "Cascadia Code","Consolas",monospace';
        ctx.fillStyle = COL.ink;
        ctx.textAlign = 'right';
        ctx.fillText(value, PANEL_X + 368, ry);
        ry += 27;
      });
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
          时间步 t <span className="val">{t}</span>
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
        {[1, 100, 500, 1000].map((v) => (
          <button
            key={v}
            type="button"
            className={`chip ${t === v ? 'selected' : ''}`}
            onClick={() => apply(v)}
          >
            t = {v}
          </button>
        ))}
      </div>
      <div className="feedback">{feedback}</div>
    </div>
  );
};

export default Ch4Beta;
