import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  T,
  abarAt,
  signalCoef,
  noiseCoef,
  betaAt,
  fmt,
  clearField,
  sceneLabel,
} from './ddpm-common';

// Module 6.1 — Algorithm 2 walkthrough with an exact state model:
//   t = 1000..1 : the current sample is x_t, completed updates k = T − t (0..999)
//   t = 0       : sampling finished — the output x_0, completed updates k = 1000
// The last update (t = 1) sets z = 0 and outputs μθ(x₁,1); the discrete decoder
// (Eq. (13)) is only used for the likelihood term L₀, never as a sampling step.
// The canvas is an explicit TEACHING SIMULATION (per-cell noise → structure → detail).

const W = 1080;
const H = 280;

const COL = {
  field: '#f5f8f0',
  glass: '#eaf1fb',
  frame: '#92400e',
  green: '#228d5c',
  blue: '#27446e',
  purple: '#7c3aed',
  ink: '#21324a',
  slate: '#68778f',
  axis: '#d7deea',
};

const WIN_X = 56;
const WIN_Y = 44;
const WIN_W = 470;
const WIN_H = 160;

const NX = 94;
const NY = 32;
const SIM_SEED = 20201126;

function hash01(i: number, j: number, salt: number): number {
  let x = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(salt, 2246822519)) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function coarseScene(u: number, v: number): Rgb {
  const t = clamp(v, 0, 1);
  let out: Rgb = {
    r: Math.round(168 + (226 - 168) * t),
    g: Math.round(208 + (240 - 208) * t),
    b: Math.round(232 + (248 - 232) * t),
  };
  const dx = u - 0.78;
  const dy = v - 0.24;
  if (Math.sqrt(dx * dx + dy * dy) < 0.13) out = { r: 240, g: 150, b: 92 };
  const hillY = 0.62 + 0.08 * Math.sin(u * 5.0 + 0.7);
  if (v > hillY) out = { r: 108, g: 162, b: 104 };
  return out;
}

function fineScene(u: number, v: number, coarse: Rgb): Rgb {
  let out: Rgb = coarse;
  const dt = Math.sqrt((u - 0.24) * (u - 0.24) + (v - 0.4) * (v - 0.4));
  if (dt < 0.1) out = { r: 96, g: 138, b: 92 };
  if (u > 0.225 && u < 0.255 && v > 0.47 && v < 0.66) out = { r: 122, g: 92, b: 60 };
  if (v > 0.9) out = { r: 84, g: 120, b: 86 };
  return out;
}

function feedbackFor(t: number): { text: string; cls: string } {
  if (t === T) {
    return {
      text: '初始状态：x_T ~ N(0, I) 是纯噪声；k = 0 / 1000，尚未执行任何反向更新。',
      cls: '',
    };
  }
  if (t === 0) {
    return {
      text: '采样完成：已执行 k = 1000 / 1000 次更新，输出 x₀（Algorithm 2 的返回结果）。最后一步 t=1 时 z = 0、不添加噪声；离散解码器（Eq. (13)）仅用于似然 L₀，不是采样步骤。',
      cls: 'good',
    };
  }
  if (t === 1) {
    return {
      text: '当前为 x₁（已完成 k = 999 / 1000 次更新），尚未输出 x₀。按 Algorithm 2 还需执行最后一步 t=1：z = 0、不添加噪声，输出 x₀ = μθ(x₁,1) —— 点击「最后一步（输出 x₀）」。',
      cls: '',
    };
  }
  const k = T - t;
  const sa = signalCoef(t);
  const sn = noiseCoef(t);
  if (t <= 100) {
    return {
      text: `xₜ（t=${t}，已完成 k=${k} 次更新）：前向参考系数 √ᾱₜ=${fmt(sa)} —— 采样后期信号占优，剩余步主要补细节（论文 §4.3：细节最后出现）。`,
      cls: 'good',
    };
  }
  return {
    text: `xₜ（t=${t}，已完成 k=${k} 次更新）：面板给出前向边缘分布 q(xₜ|x₀) 的参考系数（√(1−ᾱₜ)=${fmt(sn)}、√ᾱₜ=${fmt(sa)}），用于标注该时间步的噪声水平；它们不代表逆向样本中可分离的真实信号/噪声。`,
    cls: '',
  };
}

export const Ch6Sampler: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ t: T });
  const [t, setT] = useState(T);
  const [playing, setPlaying] = useState(false);
  const [feedback, setFeedback] = useState(feedbackFor(T));

  const apply = (next: number): void => {
    const v = clamp(Math.round(next), 0, T);
    stateRef.current.t = v;
    setT(v);
    setFeedback(feedbackFor(v));
    if (v === 0) setPlaying(false);
  };

  // Continuous playback: advance one update every 70 ms until x_0.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const cur = stateRef.current.t;
      if (cur <= 0) {
        setPlaying(false);
        return;
      }
      apply(cur - 1);
    }, 70);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const off = document.createElement('canvas');
    off.width = NX;
    off.height = NY;
    const offCtx = off.getContext('2d');
    let lastT = -1;

    const paintTeachingRaster = (tv: number): void => {
      if (!offCtx || lastT === tv) return;
      lastT = tv;
      const p = clamp((T - tv) / T, 0, 1); // completed-update fraction k / T
      const amt = Math.pow(p, 1.6);
      const fw = Math.pow(p, 3.0);
      const img = offCtx.createImageData(NX, NY);
      const data = img.data;
      for (let j = 0; j < NY; j += 1) {
        for (let i = 0; i < NX; i += 1) {
          const u = (i + 0.5) / NX;
          const v = (j + 0.5) / NY;
          const coarse = coarseScene(u, v);
          const fine = fineScene(u, v, coarse);
          const sr = coarse.r * (1 - fw) + fine.r * fw;
          const sg = coarse.g * (1 - fw) + fine.g * fw;
          const sb = coarse.b * (1 - fw) + fine.b * fw;
          const nr = hash01(i, j, SIM_SEED) * 255;
          const ng = hash01(i, j, SIM_SEED + 17) * 255;
          const nb = hash01(i, j, SIM_SEED + 31) * 255;
          const o = (j * NX + i) * 4;
          data[o] = Math.round(sr * amt + nr * (1 - amt));
          data[o + 1] = Math.round(sg * amt + ng * (1 - amt));
          data[o + 2] = Math.round(sb * amt + nb * (1 - amt));
          data[o + 3] = 255;
        }
      }
      offCtx.putImageData(img, 0, 0);
    };

    const render = (): void => {
      const s = stateRef.current;
      const k = T - s.t;
      clearField(ctx, W, H);

      // window frame + teaching raster
      ctx.fillStyle = COL.frame;
      ctx.fillRect(WIN_X - 6, WIN_Y - 6, WIN_W + 12, WIN_H + 12);
      ctx.fillStyle = COL.glass;
      ctx.fillRect(WIN_X, WIN_Y, WIN_W, WIN_H);
      paintTeachingRaster(s.t);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, WIN_X, WIN_Y, WIN_W, WIN_H);
      ctx.imageSmoothingEnabled = true;
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(WIN_X, WIN_Y, WIN_W, WIN_H);
      sceneLabel(ctx, s.t === 0 ? 't = 0（输出 x₀）' : `t = ${s.t}`, WIN_X + 2, WIN_Y - 14, { size: 17 });

      sceneLabel(ctx, '非真实模型输出：随机噪声 → 结构 → 细节', WIN_X, WIN_Y + WIN_H + 24, {
        size: 13,
        color: COL.slate,
      });

      // update-progress strip (k = 0..1000)
      const pX = WIN_X;
      const pY = WIN_Y + WIN_H + 36;
      ctx.fillStyle = '#eef1f6';
      ctx.fillRect(pX, pY, WIN_W, 8);
      ctx.fillStyle = COL.green;
      ctx.fillRect(pX, pY, WIN_W * clamp(k / T, 0, 1), 8);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1;
      ctx.strokeRect(pX, pY, WIN_W, 8);
      ctx.fillStyle = COL.slate;
      ctx.font = '600 13px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`反向更新进度 k = ${k} / ${T}（k = T − t）`, pX, pY + 22);

      // right panel: reference coefficients + formulas
      const RX = 600;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(RX - 16, 30, 448, 222);
      ctx.strokeStyle = COL.axis;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(RX - 16, 30, 448, 222);

      sceneLabel(ctx, '前向过程系数（边缘分布，精确值）', RX, 56, { size: 15 });
      const done = s.t === 0;
      const rows: Array<[string, string, string]> = done
        ? [
            ['信号幅度 √ᾱₜ（前向）', '—', COL.blue],
            ['噪声幅度 √(1−ᾱₜ)（前向）', '—', COL.purple],
            ['ᾱₜ（累计）', '—', COL.ink],
            ['βₜ（单步方差）', '—', COL.ink],
          ]
        : [
            ['信号幅度 √ᾱₜ（前向）', fmt(signalCoef(s.t)), COL.blue],
            ['噪声幅度 √(1−ᾱₜ)（前向）', fmt(noiseCoef(s.t)), COL.purple],
            ['ᾱₜ（累计）', fmt(abarAt(s.t)), COL.ink],
            ['βₜ（单步方差）', fmt(betaAt(s.t)), COL.ink],
          ];
      let ry = 82;
      rows.forEach(([label, value, color]) => {
        ctx.font = '600 14px "Segoe UI","PingFang SC",sans-serif';
        ctx.fillStyle = COL.slate;
        ctx.fillText(label, RX, ry);
        ctx.font = '700 16px "Cascadia Code","Consolas",monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'right';
        ctx.fillText(value, RX + 412, ry);
        ctx.textAlign = 'left';
        ry += 24;
      });

      ctx.font = '700 13px "Cascadia Code","Consolas",monospace';
      ctx.fillStyle = COL.ink;
      ctx.fillText('xₜ₋₁ = (1/√αₜ)(xₜ − βₜ/√(1−ᾱₜ)·εθ(xₜ,t)) + σₜ·z', RX - 4, 180);
      ctx.font = '500 12px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillStyle = COL.slate;
      ctx.fillText('σₜ 为标准差：σₜ² = βₜ 或 σₜ² = β̃ₜ（论文 Eq. (11)–(12) 后）', RX - 4, 200);
      ctx.fillText('√ᾱₜ 是前向过程中 x₀ 项的幅度系数，不代表逆向图像的真实清晰度；', RX - 4, 220);
      ctx.fillText('系数仅作该时间步噪声水平的参考刻度。', RX - 4, 238);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          当前样本时间 t <span className="val">{t === 0 ? '0（输出 x₀）' : t}</span>
        </label>
        <input type="range" min={0} max={T} value={t} onChange={(e) => { setPlaying(false); apply(Number(e.target.value)); }} />
      </div>
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" onClick={() => { setPlaying(false); apply(t + 1); }} disabled={t === T}>
          上一步（t+1）
        </button>
        <button type="button" className="tiny" onClick={() => { setPlaying(false); apply(t - 1); }} disabled={t === 0}>
          {t === 1 ? '最后一步（输出 x₀）' : '下一步（t−1）'}
        </button>
        <button type="button" className="tiny ghost" onClick={() => setPlaying((p) => !p)} disabled={t === 0}>
          {playing ? '暂停' : '连续播放'}
        </button>
        <button type="button" className="tiny ghost" onClick={() => { setPlaying(false); apply(T); }}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch6Sampler;
