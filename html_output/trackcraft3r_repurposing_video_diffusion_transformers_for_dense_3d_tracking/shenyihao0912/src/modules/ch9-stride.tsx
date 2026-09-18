import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, drawSceneBg, drawLegend, drawSceneLabel, drawValueChip } from './dogKit';
import type { WidgetProps } from './registry';

// Module 9.1 步长采样与复杂度 — a 100-frame strip. TrackCraft3R anchors frame 1
// and takes blocks of 12 sampled frames according to the stride s (green blocks;
// the orange anchor cell is shared by every pass); DELTAv2 must sweep the same
// strip window by window, in order, with 6-step iterative refinement per window.
// Below: the compute recipe comparison (Table 6: single forward + 1/16 latent
// attention vs 6-step iteration + 4D correlation; 3.91 s / 7.63 GB vs 5.00 s /
// 35.46 GB at 12 frames, A6000, 448×448).
const W = 1080;
const H = 280;
const FRAMES = 100;
const PER_PASS = 12; // 12-frame clips (1 anchor + 11), per the paper
const X0 = 96;
const CELL = 9.2;
const GAP = 0.6;

const STRIDES = [1, 3, 6, 12] as const;
type Stride = (typeof STRIDES)[number];

const sampledCount = (s: Stride) => Math.floor((FRAMES - 1) / s) + 1;
const passCount = (s: Stride) => Math.max(1, Math.ceil((sampledCount(s) - 1) / (PER_PASS - 1)));
const windowCount = () => Math.ceil(FRAMES / PER_PASS);

const GREENS = ['#228d5c', '#6db38d'];
const REDS = ['#c43f52', '#d98793'];

const FB: Record<Stride, string> = {
  1: 's=1：逐帧采样，100 帧 → 9 次前向，每次都带着第 1 帧锚点（橙）。',
  3: 's=3：每 3 帧取 1，共 34 帧 → 3 次前向；块更少、帧间运动更大。',
  6: 's=6：共 17 帧 → 2 次前向；大步长下 TrackCraft3R 仍稳健（图 5：s=1→12）。',
  12: 's=12：共 9 帧 → 1 次前向覆盖整段；训练含多种步长，推理直接泛化。',
};
const COMPLEXITY_NOTE =
  '计算对比（12 帧、A6000、448×448）：3R 单步前向 + 1/16 潜空间注意力 3.91 s / 7.63 GB；DELTAv2 每窗 6 步迭代 + 4D 相关 5.00 s / 35.46 GB。';

const cellX = (i: number) => X0 + i * (CELL + GAP);

export const Ch9Stride: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ s: Stride }>({ s: 3 });
  const [s, setS] = useState<Stride>(3);
  const [feedback, setFeedback] = useState({ text: `${FB[3]} ${COMPLEXITY_NOTE}`, cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const drawCells = (y: number, colorOf: (i: number) => string | null) => {
      for (let i = 0; i < FRAMES; i++) {
        const col = colorOf(i);
        if (col === null) {
          ctx.fillStyle = '#eef2ea';
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 0.75;
        } else {
          ctx.fillStyle = col;
          ctx.strokeStyle = col;
          ctx.lineWidth = 0.75;
        }
        ctx.beginPath();
        ctx.rect(cellX(i), y, CELL, 12);
        ctx.fill();
        ctx.stroke();
      }
    };

    const render = () => {
      const st = stateRef.current;
      const sc = st.s;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      // ---- row 0: the 100-frame strip (neutral) ----
      const y0 = 48;
      drawCells(y0, () => null);
      ctx.fillStyle = C.muted;
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      [0, 49, 99].forEach((i) => ctx.fillText(String(i + 1), cellX(i) + CELL / 2, y0 - 6));

      // ---- row 1: TrackCraft3R — anchor + strided blocks ----
      const y1 = 82;
      drawSceneLabel(ctx, '3R', 34, y1 + 6, { color: C.green });
      // sampled indices 1+s, 1+2s, ...; pass p takes PER_PASS of them; anchor shared
      const passes = passCount(sc);
      drawCells(y1, (i) => {
        if (i === 0) return C.orange; // anchor frame 1, shared by every pass
        if ((i - 1) % sc !== 0) return null;
        const k = (i - 1) / sc; // k-th sampled frame (k ≥ 1)
        const p = Math.floor((k - 1) / (PER_PASS - 1));
        return GREENS[p % 2];
      });
      drawSceneLabel(ctx, `${passes} 次前向 · 锚点恒在`, 34 + 540, y1 - 8, { color: C.green, align: 'left' });

      // ---- row 2: DELTAv2 — sequential windows, 6-step iteration each ----
      const y2 = 116;
      drawSceneLabel(ctx, 'v2', 34, y2 + 6, { color: C.red });
      const win = windowCount();
      drawCells(y2, (i) => REDS[Math.floor(i / PER_PASS) % 2]);
      // window brackets with the per-window iteration note
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1;
      for (let wIdx = 0; wIdx < win; wIdx++) {
        const a = cellX(wIdx * PER_PASS);
        const b = cellX(Math.min((wIdx + 1) * PER_PASS, FRAMES) - 1) + CELL;
        ctx.beginPath();
        ctx.moveTo(a, y2 + 16);
        ctx.lineTo(b, y2 + 16);
        ctx.stroke();
      }
      drawSceneLabel(ctx, `${win} 个窗口依序处理 · 每窗 6 步迭代`, 34 + 540, y2 + 28, { color: C.red, align: 'left' });

      // ---- bottom: compute recipe comparison ----
      const barY1 = 206;
      const barY2 = 248;
      const unit = 118;
      drawSceneLabel(ctx, 'TC3R', 30, barY1, { color: C.green });
      drawSceneLabel(ctx, '1 次前向 · 1/16 潜空间', 90, barY1 - 20, { color: C.muted });
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(90, barY1);
      ctx.lineTo(90 + unit, barY1);
      ctx.stroke();
      drawValueChip(ctx, X0 + 830, barY1, '3.91 s', C.green);
      drawValueChip(ctx, X0 + 888, barY1, '7.63', C.green);
      drawSceneLabel(ctx, 'DELTAv2', 30, barY2, { color: C.red });
      drawSceneLabel(ctx, '6 步迭代 + 4D 相关', 90, barY2 - 20, { color: C.muted });
      ctx.strokeStyle = C.red;
      ctx.beginPath();
      ctx.moveTo(90, barY2);
      ctx.lineTo(90 + unit * 6, barY2);
      ctx.stroke();
      for (let k = 1; k < 6; k++) {
        const x = 90 + unit * k;
        ctx.strokeStyle = C.bg;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, barY2 - 5);
        ctx.lineTo(x, barY2 + 5);
        ctx.stroke();
      }
      drawValueChip(ctx, X0 + 830, barY2, '5.00 s', C.red);
      drawValueChip(ctx, X0 + 888, barY2, '35.46', C.red);

      drawLegend(
        ctx,
        [
          ['锚点帧', C.orange],
          ['3R 采样块', GREENS[0]],
          ['v2 窗口', REDS[0]],
        ],
        34,
        H - 8
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const choose = (v: Stride) => {
    stateRef.current.s = v;
    setS(v);
    setFeedback({ text: `${FB[v]} v2 则需 ${windowCount()} 个窗口依序处理。${COMPLEXITY_NOTE}`, cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>步长 s</label>
        {STRIDES.map((v) => (
          <button
            key={v}
            type="button"
            className={`chip ${s === v ? 'selected' : ''}`}
            onClick={() => choose(v)}
          >
            s={v}
          </button>
        ))}
        <label>
          采样帧数 <span className="val">{sampledCount(s)}</span>
        </label>
        <label>
          3R 前向次数 <span className="val">{passCount(s)}</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Stride;
