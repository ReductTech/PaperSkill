import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawShorthand,
  drawCheckMark,
  drawVerdict,
  drawSceneLabel,
} from './packKit';
import type { WidgetProps } from './registry';

// Module 5.1 — the FAST five-station pipeline stepper (P2).
// ① 分位归一 → ② DCT → ③ 量化 → ④ 低频优先展开 → ⑤ BPE；全程可逆。
const W = 1080;
const H = 280;
const BOX_W = 184;
const BOX_H = 168;
const GAP = 26;
const X0 = 28;
const BY = 44;
const GFX_W = 74;
const GFX_H = 104;

const NAMES = ['① 分位归一', '② DCT', '③ 量化', '④ 低频优先展开', '⑤ BPE'];

const STEP_FB: { text: string; cls: string }[] = [
  { text: '按「下一步」从①分位归一开工——五站步进，全程可逆。', cls: '' },
  { text: '①分位归一：按 1%-99% 分位把各维拉进 [-1,1]——抗离群、跨本体等音量。', cls: '' },
  { text: '②DCT：每维独立变换，时域动作变成前重后轻的频域条。', cls: '' },
  { text: '③量化：γ·C 再取整（γ=10）——高频小系数大量归零，得到稀疏矩阵。', cls: '' },
  { text: '④低频优先展开：列优先，所有维的低频排前——自回归先猜主旨，rollout 更稳。', cls: '' },
  { text: '⑤BPE：词表 1024，把稀疏整数串无损压成稠密 token。', cls: '' },
  { text: '五步全程可逆：解码即原路返回——从 token 串还原连续动作。', cls: 'good' },
];

function boxX(i: number): number {
  return X0 + i * (BOX_W + GAP);
}

function miniWave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  amp: number,
  color: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= 26; i++) {
    const px = x + (i / 26) * w;
    const v = Math.sin(i * 0.52) * 0.75 + Math.sin(i * 0.19) * 0.35;
    const py = y + h / 2 - v * amp * (h / 2);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function bandLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.55;
  [y + h * 0.28, y + h * 0.72].forEach((ly) => {
    ctx.beginPath();
    ctx.moveTo(x + 2, ly);
    ctx.lineTo(x + w - 2, ly);
    ctx.stroke();
  });
  ctx.restore();
}

function bars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  hs: number[],
  cols: string[]
) {
  const bw = (w - 4) / hs.length;
  hs.forEach((v, k) => {
    const bh = Math.max(2, v * (h - 4));
    ctx.fillStyle = cols[k];
    ctx.fillRect(x + 2 + k * bw + 0.5, y + h - 2 - bh, bw - 1.6, bh);
  });
}

// per-station input mini-graphic
function drawIn(ctx: CanvasRenderingContext2D, i: number, x: number, y: number) {
  if (i === 0) {
    bandLines(ctx, x, y, GFX_W, GFX_H, C.muted);
    miniWave(ctx, x, y, GFX_W, GFX_H, 1.18, C.blue); // raw signal, spills past the band
  } else if (i === 1) {
    miniWave(ctx, x, y, GFX_W, GFX_H, 0.8, C.muted);
  } else if (i === 2) {
    bars(
      ctx,
      x,
      y,
      GFX_W,
      GFX_H,
      [0.82, 0.57, 0.33, 0.19, 0.12, 0.07, 0.05, 0.03],
      Array(8).fill(C.purple)
    );
  } else if (i === 3) {
    // 2-dim × 6-freq bar matrix, low frequencies on the left
    const rows = [
      [0.8, 0.55, 0.35, 0.2, 0.1, 0.05],
      [0.7, 0.5, 0.3, 0.18, 0.09, 0.04],
    ];
    const rcols = [C.blue, C.purple];
    const rh = (GFX_H - 8) / 2;
    rows.forEach((hs, r) => {
      bars(ctx, x, y + 4 + r * (rh + 4), GFX_W, rh, hs, Array(6).fill(rcols[r]));
    });
  } else {
    // sparse integer string: grey zeros, purple non-zeros
    const vals = [0, 12, 0, 0, 3, 0, 15, 0, 1, 0, 0, 5];
    const sq = 11;
    const g = 1.5;
    vals.forEach((v, k) => {
      const col = k % 6;
      const row = Math.floor(k / 6);
      const px = x + (GFX_W - (6 * sq + 5 * g)) / 2 + col * (sq + g);
      const py = y + 14 + row * (sq + g + 6);
      ctx.fillStyle = v === 0 ? '#dfe5ee' : C.purple;
      ctx.beginPath();
      ctx.roundRect(px, py, sq, sq, 2.5);
      ctx.fill();
    });
  }
}

// per-station output mini-graphic
function drawOut(ctx: CanvasRenderingContext2D, i: number, x: number, y: number) {
  if (i === 0) {
    bandLines(ctx, x, y, GFX_W, GFX_H, C.green);
    miniWave(ctx, x, y, GFX_W, GFX_H, 0.76, C.green); // rescaled inside [-1,1]
  } else if (i === 1) {
    bars(
      ctx,
      x,
      y,
      GFX_W,
      GFX_H,
      [0.9, 0.55, 0.34, 0.2, 0.12, 0.07, 0.04, 0.03],
      Array(8).fill(C.purple)
    );
  } else if (i === 2) {
    // bars snapped to stair steps (γ=10) → many zeros
    const snapped = [0.75, 0.5, 0.25, 0.25, 0, 0, 0, 0];
    ctx.save();
    ctx.strokeStyle = C.orange;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([3, 3]);
    [0.25, 0.5, 0.75].forEach((lv) => {
      const ly = y + GFX_H - 2 - lv * (GFX_H - 4);
      ctx.beginPath();
      ctx.moveTo(x + 2, ly);
      ctx.lineTo(x + GFX_W - 2, ly);
      ctx.stroke();
    });
    ctx.restore();
    bars(
      ctx,
      x,
      y,
      GFX_W,
      GFX_H,
      snapped,
      snapped.map((v) => (v === 0 ? '#dfe5ee' : C.purple))
    );
    ctx.save();
    ctx.fillStyle = C.orange;
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('γ=10', x + GFX_W - 1, y + 1);
    ctx.restore();
  } else if (i === 3) {
    // column-first flatten: low freq of ALL dims first (blue/purple interleaved)
    const r0 = [0.8, 0.55, 0.35, 0.2, 0.1, 0.05];
    const r1 = [0.7, 0.5, 0.3, 0.18, 0.09, 0.04];
    const hs: number[] = [];
    const cols: string[] = [];
    for (let k = 0; k < 6; k++) {
      hs.push(r0[k], r1[k]);
      cols.push(C.blue, C.purple);
    }
    bars(ctx, x, y, GFX_W, GFX_H - 8, hs, cols);
    ctx.save();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const bw = (GFX_W - 4) / hs.length;
    ctx.moveTo(x + 2.5, y + GFX_H - 7);
    ctx.lineTo(x + 2.5 + 4 * bw, y + GFX_H - 7);
    ctx.stroke();
    ctx.restore();
  } else {
    drawShorthand(ctx, x + 5, y + GFX_H / 2 - 8, 4, { color: C.purple, size: 0.8 });
    ctx.save();
    ctx.fillStyle = C.purple;
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('1024', x + GFX_W - 1, y + GFX_H - 1);
    ctx.restore();
  }
}

export const Ch5Pipeline: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ step: 0, stepTs: 0 });
  const [step, setStep] = useState(0);

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

    const render = (ms: number) => {
      const { step: st, stepTs } = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });

      for (let i = 0; i < 5; i++) {
        const bx = boxX(i);
        const active = st === i + 1;
        const done = st >= i + 2;
        ctx.save();
        if (active) {
          const s = 1 + 0.05 * (1 - easeOutCubic(Math.min(1, (ms - stepTs) / 420)));
          ctx.translate(bx + BOX_W / 2, BY + BOX_H / 2);
          ctx.scale(s, s);
          ctx.translate(-(bx + BOX_W / 2), -(BY + BOX_H / 2));
          ctx.shadowColor = C.green;
          ctx.shadowBlur = 12;
        }
        ctx.fillStyle = C.white;
        ctx.strokeStyle = active || done ? C.green : C.border;
        ctx.globalAlpha = done ? 0.85 : 1;
        ctx.lineWidth = active ? 2.4 : done ? 1.6 : 1.5;
        ctx.beginPath();
        ctx.roundRect(bx, BY, BOX_W, BOX_H, 8);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = active ? C.green : done ? C.green : C.muted;
        ctx.font = `${active ? 'bold ' : ''}12.5px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(NAMES[i], bx + BOX_W / 2, BY + 18);

        if (!active && !done) ctx.globalAlpha = 0.42;
        const gxIn = bx + 10;
        const gxOut = bx + BOX_W - 10 - GFX_W;
        const gy = BY + 36;
        drawIn(ctx, i, gxIn, gy);
        // small in→out arrow
        ctx.strokeStyle = active ? C.green : C.border;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const ax = bx + BOX_W / 2;
        const ay = gy + GFX_H / 2;
        ctx.beginPath();
        ctx.moveTo(ax - 4, ay - 4);
        ctx.lineTo(ax + 2, ay);
        ctx.lineTo(ax - 4, ay + 4);
        ctx.stroke();
        drawOut(ctx, i, gxOut, gy);
        ctx.restore();
        if (done) drawCheckMark(ctx, bx + BOX_W - 14, BY + 14, 8);
        // flow chevron to the next station
        if (i < 4) {
          const cx = bx + BOX_W + GAP / 2;
          const cy = BY + BOX_H / 2;
          ctx.save();
          ctx.strokeStyle = st >= i + 2 ? C.green : C.border;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cx - 2.5, cy - 5);
          ctx.lineTo(cx + 2.5, cy);
          ctx.lineTo(cx - 2.5, cy + 5);
          ctx.stroke();
          ctx.restore();
        }
      }

      // progress rail
      for (let i = 0; i < 5; i++) {
        const dx = W / 2 - 44 + i * 22;
        ctx.save();
        ctx.beginPath();
        ctx.arc(dx, 266, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = st > i ? C.green : C.white;
        ctx.fill();
        ctx.strokeStyle = st > i ? C.green : C.border;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // done: decoding runs the pipeline backwards
      if (st === 6) {
        const cxLast = boxX(4) + BOX_W / 2;
        const cxFirst = boxX(0) + BOX_W / 2;
        ctx.save();
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(cxLast, BY + BOX_H + 8);
        ctx.lineTo(cxLast, 244);
        ctx.lineTo(cxFirst, 244);
        ctx.lineTo(cxFirst, BY + BOX_H + 10);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.moveTo(cxFirst, BY + BOX_H + 6);
        ctx.lineTo(cxFirst - 5, BY + BOX_H + 14);
        ctx.lineTo(cxFirst + 5, BY + BOX_H + 14);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        drawVerdict(ctx, 1032, 236, true, { r: 14, pulse: ms / 500 });
      }

      drawSceneLabel(ctx, 'FAST 五站流水线', 14, 22, { color: C.text });
      if (st === 6) {
        drawSceneLabel(ctx, '全程可逆 · 原路返回', W - 14, 22, { color: C.green, align: 'right' });
      } else if (st >= 1) {
        drawSceneLabel(ctx, `当前：${NAMES[st - 1]}`, W - 14, 22, { color: C.green, align: 'right' });
      } else {
        drawSceneLabel(ctx, '五站步进 · 全程可逆', W - 14, 22, { color: C.muted, align: 'right' });
      }
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

  const next = () => {
    const s = Math.min(6, stateRef.current.step + 1);
    stateRef.current = { step: s, stepTs: performance.now() };
    setStep(s);
  };
  const reset = () => {
    stateRef.current = { step: 0, stepTs: performance.now() };
    setStep(0);
  };

  const fb = STEP_FB[step];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="tiny" onClick={next} disabled={step >= 6}>
          下一步
        </button>
        <button className="tiny ghost" onClick={reset}>
          复位
        </button>
        <span className="val">{Math.max(0, Math.min(step, 5))}/5 站</span>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch5Pipeline;
