import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawLabel, drawLegendDot, roundRect } from './ana-scene';

const W = 560, H = 280;
const GX = 48, GY = 46, GW = 464, GH = 158; // plot area
const SIGMA = 0.13;

function bump(u: number, c: number, s: number): number {
  return Math.exp(-((u - c) ** 2) / (2 * s * s));
}
/** Target density: bimodal in x space, single-peaked after the transporter warp. */
function target(u: number, w: number): number {
  const bimodal = 0.9 * bump(u, 0.3, 0.09) + 0.7 * bump(u, 0.72, 0.07);
  const unimodal = 1.0 * bump(u, 0.5, 0.13);
  return lerp(bimodal, unimodal, w);
}
function gauss(u: number, mu: number): number {
  return bump(u, mu, SIGMA);
}
/** Schematic NLL: cross-entropy of the normalized target under the Gaussian. */
function nll(mu: number, w: number): number {
  const N = 120;
  let zt = 0, zq = 0;
  for (let i = 0; i <= N; i++) { zt += target(i / N, w); zq += gauss(i / N, mu); }
  let s = 0;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const p = target(u, w) / zt;
    const q = Math.max(1e-6, gauss(u, mu) / zq);
    s += -p * Math.log(q);
  }
  return s;
}
/** Best achievable NLL at this warp level (scan over mu). */
function bestNll(w: number): number {
  let best = Infinity;
  for (let m = 0.1; m <= 0.9; m += 0.02) best = Math.min(best, nll(m, w));
  return best;
}
const BEST_FLAT = bestNll(0);
const BEST_WARP = bestNll(1);

export const M4Gauss: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ mu: 0.5, warpOn: false, w: 0, dragging: false });
  const rafRef = useRef<number | null>(null);
  const [warpOn, setWarpOn] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '拖动蓝色高斯，看看 NLL 最低能压到多少。',
    cls: '',
  });
  const feedbackKeyRef = useRef('');

  const updateFeedback = () => {
    const s = stateRef.current;
    const v = nll(s.mu, s.warpOn ? 1 : 0);
    let key = '', text = '', cls = '';
    if (!s.warpOn) {
      if (v < BEST_FLAT + 0.06) {
        key = 'flat-best';
        text = '这已经是单高斯能做到的极限了——两个峰只能取其中间，账还是对不上。这不是调参问题，是分布形状的极限。';
        cls = 'bad';
      } else {
        key = 'flat-off';
        text = '还没到单高斯的最优位置，继续拖。NLL 越低越好。';
        cls = '';
      }
    } else {
      if (v < BEST_WARP + 0.05) {
        key = 'warp-best';
        text = '换元之后目标变成单峰，一个高斯精确覆盖——这笔账终于对平了。这就是搬运器 f_T 的作用。';
        cls = 'good';
      } else {
        key = 'warp-off';
        text = '换元已开启：目标被\u201c掰\u201d成了单峰，把高斯拖到中间看看。';
        cls = '';
      }
    }
    if (key !== feedbackKeyRef.current) {
      feedbackKeyRef.current = key;
      setFeedback({ text, cls });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const s = stateRef.current;
      s.w += ((s.warpOn ? 1 : 0) - s.w) * 0.08; // smooth axis morph
      const w = clamp(s.w, 0, 1);

      ctx.fillStyle = K.bg;
      ctx.fillRect(0, 0, W, H);
      drawLabel(ctx, s.warpOn ? 'u 空间（搬运器换元后）' : 'x 空间（原始坐标）', GX, 28,
        s.warpOn ? K.blue : K.text, 13);

      // plot frame + warped tick marks to visualize the change of variables
      ctx.strokeStyle = K.border;
      ctx.strokeRect(GX, GY, GW, GH);
      ctx.strokeStyle = 'rgba(39,68,110,0.18)';
      for (let i = 1; i < 10; i++) {
        const base = i / 10;
        // ticks squeeze toward the sides as the warp turns on
        const warped = lerp(base, 0.5 + Math.tanh((base - 0.5) * 2.6) / 2.6, w);
        const tx = GX + warped * GW;
        ctx.beginPath();
        ctx.moveTo(tx, GY + GH - 8);
        ctx.lineTo(tx, GY + GH);
        ctx.stroke();
      }

      // target density (gray)
      ctx.fillStyle = 'rgba(104,119,143,0.25)';
      ctx.beginPath();
      ctx.moveTo(GX, GY + GH);
      for (let i = 0; i <= 100; i++) {
        const u = i / 100;
        ctx.lineTo(GX + u * GW, GY + GH - target(u, w) * GH * 0.88);
      }
      ctx.lineTo(GX + GW, GY + GH);
      ctx.closePath();
      ctx.fill();

      // draggable Gaussian (blue)
      ctx.strokeStyle = K.blue;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) {
        const u = i / 100;
        const py = GY + GH - gauss(u, s.mu) * GH * 0.88;
        if (i === 0) ctx.moveTo(GX + u * GW, py);
        else ctx.lineTo(GX + u * GW, py);
      }
      ctx.stroke();
      // drag handle
      const hx = GX + s.mu * GW;
      ctx.fillStyle = K.blue;
      ctx.beginPath();
      ctx.arc(hx, GY + GH - GH * 0.88 - 2, 7, 0, Math.PI * 2);
      ctx.fill();
      drawLabel(ctx, '⟺ 拖我', hx + 12, GY + GH - GH * 0.88 - 2, K.blue, 11);

      // NLL readout (schematic)
      const v = nll(s.mu, w);
      const lo = BEST_WARP, hi = 4.2;
      const frac = clamp((v - lo) / (hi - lo), 0, 1);
      roundRect(ctx, GX + GW - 158, GY - 34, 158, 24, 4);
      ctx.fillStyle = K.card;
      ctx.fill();
      ctx.strokeStyle = K.border;
      ctx.stroke();
      const good = s.warpOn && v < BEST_WARP + 0.05;
      const stuck = !s.warpOn && v < BEST_FLAT + 0.06;
      ctx.fillStyle = good ? K.green : stuck ? K.red : K.blue;
      ctx.fillRect(GX + GW - 154, GY - 30, 150 * (1 - frac), 16);
      drawLabel(ctx, `NLL ≈ ${v.toFixed(2)}（示意，越低越好）`, GX + GW - 158, GY - 44, K.muted, 10);

      drawLegendDot(ctx, GX, GY + GH + 20, '#68778f', '目标分布');
      drawLegendDot(ctx, GX + 110, GY + GH + 20, K.blue, `你的高斯 μ = ${s.mu.toFixed(2)}`);
      updateFeedback();
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);

    // horizontal drag anywhere on the canvas moves mu
    const toMu = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      return clamp((x - GX) / GW, 0.05, 0.95);
    };
    const down = (e: PointerEvent) => {
      stateRef.current.dragging = true;
      stateRef.current.mu = toMu(e);
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (stateRef.current.dragging) stateRef.current.mu = toMu(e);
    };
    const up = () => { stateRef.current.dragging = false; };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleWarp = (on: boolean) => {
    stateRef.current.warpOn = on;
    setWarpOn(on);
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ touchAction: 'none', cursor: 'ew-resize' }}
      />
      <div className="chip-row">
        <button className={`chip ${!warpOn ? 'selected' : ''}`} onClick={() => toggleWarp(false)}>
          无换元（纯高斯反向）
        </button>
        <button className={`chip ${warpOn ? 'selected' : ''}`} onClick={() => toggleWarp(true)}>
          换元 p_x = p_u(f_T)·|det J|
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
