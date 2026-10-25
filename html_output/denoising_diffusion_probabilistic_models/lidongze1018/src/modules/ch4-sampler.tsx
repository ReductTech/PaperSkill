import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  T,
  abarAt,
  signalCoef,
  noiseCoef,
  fmt,
  mulberry32,
  clearField,
  sceneLabel,
} from './ddpm-common';

// Module 4.2 — closed-form forward sampling q(x_t|x_0) (paper Eq. (4)).
// x_t = √ᾱ_t·x_0 + √(1−ᾱ_t)·ε : ANY timestep is reachable in ONE step, without
// simulating the 1000-step chain. The picture is a teaching pattern; the numbers
// and the noise are driven by the exact schedule from ddpm-common.

const W = 1080;
const H = 280;

const COL = {
  ink: '#21324a',
  slate: '#68778f',
  signal: '#27446e',
  noise: '#7c3aed',
  mark: '#d97706',
  axis: '#d7deea',
};

const N = 32; // grid cells per side
const CELL = 6; // px per cell
const GRID_X = 64;
const GRID_Y = 48;
const SEED0 = 20201126; // arxiv id flavor, arbitrary fixed demo seed

interface Rgb {
  r: number;
  g: number;
  b: number;
}

// Teaching base image (never implied to be a paper sample).
function baseRgb(u: number, v: number): Rgb {
  const skyTop: Rgb = { r: 168, g: 208, b: 232 };
  const skyBot: Rgb = { r: 226, g: 240, b: 248 };
  const mix = clamp(v, 0, 1);
  let out: Rgb = {
    r: Math.round(skyTop.r + (skyBot.r - skyTop.r) * mix),
    g: Math.round(skyTop.g + (skyBot.g - skyTop.g) * mix),
    b: Math.round(skyTop.b + (skyBot.b - skyTop.b) * mix),
  };
  const dxs = u - 0.78;
  const dys = v - 0.24;
  if (Math.sqrt(dxs * dxs + dys * dys) < 0.11) out = { r: 240, g: 150, b: 92 }; // sun
  const hillY = 0.66 + 0.07 * Math.sin(u * 5.2 + 0.8);
  if (v > hillY) out = { r: 108, g: 162, b: 104 }; // hill
  const dt = Math.sqrt((u - 0.26) * (u - 0.26) + (v - 0.42) * (v - 0.42));
  if (dt < 0.1) out = { r: 112, g: 152, b: 100 }; // foliage
  if (u > 0.245 && u < 0.275 && v > 0.5 && v < 0.7) out = { r: 122, g: 92, b: 60 }; // trunk
  return out;
}

const EPS: number[] = []; // 3 channels × N×N deterministic ε ~ N(0,1)-like from uniform sum
function buildNoise(seed: number): number[] {
  const rnd = mulberry32(seed);
  const list: number[] = [];
  for (let i = 0; i < N * N * 3; i += 1) {
    // Irwin–Hall(4) approximation of a standard normal, zero-mean, scaled to ~unit variance
    const u1 = rnd();
    const u2 = rnd();
    const u3 = rnd();
    const u4 = rnd();
    const sum = u1 + u2 + u3 + u4 - 2;
    list.push(sum * Math.sqrt(3)); // Var(IrwinHall4)=4/12=1/3 → scale √3
  }
  return list;
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  sqrtAb: number,
  sqrtNoise: number,
  noise: number[]
): void {
  let k = 0;
  for (let j = 0; j < N; j += 1) {
    for (let i = 0; i < N; i += 1) {
      const u = (i + 0.5) / N;
      const v = (j + 0.5) / N;
      const base = baseRgb(u, v);
      const r = Math.round((sqrtAb * (2 * (base.r / 255) - 1) + sqrtNoise * noise[k]) * 127.5 + 127.5);
      const g = Math.round((sqrtAb * (2 * (base.g / 255) - 1) + sqrtNoise * noise[k + 1]) * 127.5 + 127.5);
      const b = Math.round((sqrtAb * (2 * (base.b / 255) - 1) + sqrtNoise * noise[k + 2]) * 127.5 + 127.5);
      k += 3;
      ctx.fillStyle = `rgb(${clamp(r, 0, 255)},${clamp(g, 0, 255)},${clamp(b, 0, 255)})`;
      ctx.fillRect(GRID_X + i * CELL, GRID_Y + j * CELL, CELL, CELL);
    }
  }
  ctx.strokeStyle = COL.axis;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(GRID_X - 1, GRID_Y - 1, N * CELL + 2, N * CELL + 2);
}

function feedbackFor(t: number): string {
  const sa = signalCoef(t);
  const sn = noiseCoef(t);
  if (t === 1) {
    return `t=1：√ᾱ₁=${fmt(sa)}，√(1−ᾱ₁)=${fmt(sn)}——只加了一点点噪声，图像几乎不变。`;
  }
  if (t === T) {
    return `t=1000：√ᾱₜ=${fmt(sa)}，√(1−ᾱₜ)=${fmt(sn)}——信号几乎消失，与标准正态噪声无法区分。`;
  }
  return `t=${t}：√ᾱₜ=${fmt(sa)}、√(1−ᾱₜ)=${fmt(sn)} 由真实 β 表累计得到；xₜ 由这一步公式一次性生成（Eq. (4)），无需逐步模拟。`;
}

export const Ch4Sampler: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ t: 300, noise: EPS.length ? EPS : buildNoise(SEED0) });
  const [t, setT] = useState(300);
  const [reseed, setReseed] = useState(0);
  const [feedback, setFeedback] = useState(feedbackFor(300));

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
      const s = stateRef.current;
      clearField(ctx, W, H);

      drawGrid(ctx, signalCoef(s.t), noiseCoef(s.t), s.noise);

      sceneLabel(ctx, 'x₀（教学图案）', GRID_X, GRID_Y + N * CELL + 24, {
        size: 15,
        color: COL.slate,
      });
      sceneLabel(ctx, `xₜ（t=${s.t}，闭式采样结果）`, GRID_X + 200, GRID_Y + N * CELL + 24, {
        size: 15,
        color: COL.slate,
      });

      // right side
      const RX = 420;
      sceneLabel(ctx, 'Eq. (4)：q(xₜ|x₀) = N(√ᾱₜ·x₀, (1−ᾱₜ)·I)', RX, 66, { size: 16 });
      ctx.font = '700 26px "Cascadia Code","Consolas",monospace';
      ctx.fillStyle = COL.ink;
      ctx.textAlign = 'left';
      ctx.fillText('xₜ = √ᾱₜ · x₀ + √(1−ᾱₜ) · ε', RX, 106);
      ctx.font = '700 20px "Cascadia Code","Consolas",monospace';
      ctx.fillStyle = COL.signal;
      ctx.fillText(`√ᾱₜ = ${fmt(signalCoef(s.t))}`, RX, 146);
      ctx.fillStyle = COL.noise;
      ctx.fillText(`√(1−ᾱₜ) = ${fmt(noiseCoef(s.t))}`, RX + 260, 146);

      // signal vs noise fraction bar (exact ᾱ_t split)
      const barY = 176;
      const barW = 560;
      const ab = abarAt(s.t);
      ctx.fillStyle = '#eef1f6';
      ctx.fillRect(RX, barY, barW, 22);
      ctx.fillStyle = COL.signal;
      ctx.fillRect(RX, barY, barW * clamp(ab, 0, 1), 22);
      ctx.fillStyle = COL.noise;
      ctx.fillRect(RX + barW * clamp(ab, 0, 1), barY, barW * clamp(1 - ab, 0, 1), 22);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(RX, barY, barW, 22);
      ctx.font = '600 14px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillStyle = COL.slate;
      ctx.textAlign = 'left';
      ctx.fillText(`信号方差占比 ᾱₜ = ${fmt(ab)}`, RX, barY + 44);
      ctx.fillText(`噪声方差占比 1−ᾱₜ = ${fmt(1 - ab)}`, RX + 260, barY + 44);

      ctx.font = '500 15px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillStyle = COL.slate;
      ctx.fillText('训练时随机抽取 t，一步构造 xₜ —— 这是「不用逐步加噪」的关键。', RX, 252);
      ctx.fillText('ε 为固定的伪随机噪声（每次点击「换一组 ε」会重新采样，仅用于教学）。', RX + 6, 272);
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

  const newNoise = (): void => {
    stateRef.current.noise = buildNoise(SEED0 + (reseed + 1) * 7919);
    setReseed(reseed + 1);
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
        <button type="button" className="chip ghost" onClick={newNoise}>
          换一组 ε
        </button>
      </div>
      <div className="feedback">{feedback}</div>
    </div>
  );
};

export default Ch4Sampler;
