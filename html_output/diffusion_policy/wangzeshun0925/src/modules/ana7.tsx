import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp, easeInOutQuad } from '../lib/canvasKit';
import { clearScene, drawBoard, drawPlane, drawShavings, drawSceneLabel, AUX, BAD } from './woodKit';
import type { WidgetProps } from './registry';

// 类比动画（第 8 章）：同一块起伏板上，短刨贴着每一处起伏走刀，长刨跨过起伏把板压平，
// 却把一处突变整块漏掉——被漏掉的木料用 #c43f52 竖线标出。
// 560×140，自动循环，2.4–3.6 s 的柔和循环。

const W = 560;
const H = 140;
const BX = 36; // 板左端
const BY = 96; // 板面顶边
const BW = 488;
const BH = 22;
const N = 41;

const PROFILE: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < N; i += 1) {
    out.push(4.6 + 2.8 * Math.sin(i * 0.92) + 1.8 * Math.sin(i * 1.87));
  }
  // 一处突变：长刨的低通路径不会跟着它走
  for (let i = 0; i < N; i += 1) {
    const d = Math.abs(i - 29);
    if (d <= 2) out[i] += (3 - d) * 4.6;
  }
  return out;
})();

const SMOOTH: number[] = (() => {
  const out: number[] = [];
  for (let i = 0; i < N; i += 1) {
    let s = 0;
    let c = 0;
    for (let j = Math.max(0, i - 7); j <= Math.min(N - 1, i + 7); j += 1) {
      s += PROFILE[j];
      c += 1;
    }
    out.push(s / c);
  }
  return out;
})();

const sampleArr = (arr: number[], x: number): number => {
  const fi = clamp(((x - BX) / BW) * (N - 1), 0, N - 1);
  const i0 = Math.floor(fi);
  const i1 = Math.min(N - 1, i0 + 1);
  return lerp(arr[i0], arr[i1], fi - i0);
};

const drawLengthCap = (ctx: CanvasRenderingContext2D, px: number, py: number, len: number): void => {
  ctx.fillStyle = AUX;
  ctx.fillRect(px - len / 2, py - 16, len, 3);
};

export const Ana7: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const lastRef = useRef(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (tl: number) => {
      clearScene(ctx, W, H);
      drawBoard(ctx, BX, BY, BW, BH, PROFILE);

      // 长刨的低通走刀线（紫色 = 结构）
      ctx.strokeStyle = AUX;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < N; i += 1) {
        const sx = BX + (BW * i) / (N - 1);
        const sy = BY - SMOOTH[i];
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      const p = tl % 1;
      const aEnd = 0.46;
      const bEnd = 0.92;

      let shortX: number;
      let longX = -1;
      let shortMoving = false;
      let longMoving = false;
      if (p < aEnd) {
        shortX = lerp(58, 502, easeInOutQuad(p / aEnd));
        shortMoving = true;
      } else {
        shortX = 502;
        if (p < bEnd) {
          longX = lerp(58, 502, easeInOutQuad((p - aEnd) / (bEnd - aEnd)));
          longMoving = true;
        } else {
          longX = 502;
        }
      }

      // 长刨已经走过、却留在板上的木料——就是被漏掉的突变
      if (p >= aEnd) {
        ctx.strokeStyle = BAD;
        ctx.lineWidth = 2;
        for (let i = 0; i < N; i += 1) {
          const sx = BX + (BW * i) / (N - 1);
          if (sx > longX - 4) continue;
          const excess = PROFILE[i] - SMOOTH[i];
          if (excess <= 5.5) continue;
          ctx.beginPath();
          ctx.moveTo(sx, BY - PROFILE[i]);
          ctx.lineTo(sx, BY - SMOOTH[i]);
          ctx.stroke();
        }
      }

      // 短刨：贴着轮廓走
      const shortY = BY - sampleArr(PROFILE, shortX) - 1;
      drawPlane(ctx, shortX, shortY, { length: 54, ghost: !shortMoving });
      if (shortMoving) {
        drawLengthCap(ctx, shortX, shortY, 54);
        drawShavings(ctx, shortX - 30, shortY - 2, tl * 3, 2);
        drawSceneLabel(ctx, '短刨', clamp(shortX - 62, 8, 496), shortY - 22, AUX);
      }

      // 长刨：按低通路径走，跨过起伏
      if (longX >= 0) {
        const longY = BY - sampleArr(SMOOTH, longX) - 1;
        drawPlane(ctx, longX, longY, { length: 108 });
        drawLengthCap(ctx, longX, longY, 108);
        if (longMoving) drawShavings(ctx, longX - 42, longY - 2, tl * 3 + 0.5, 2);
        drawSceneLabel(ctx, '长刨', clamp(longX - 88, 8, 452), longY - 22, AUX);
      }
    };

    const tick = (ts: number) => {
      const last = lastRef.current;
      lastRef.current = ts;
      if (last !== 0) elapsedRef.current += Math.min(64, ts - last) / 1000;
      const tl = elapsedRef.current / 3.2;
      render(tl);
      setPhase(tl % 1 < 0.46 ? 0 : 1);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label={phase === 0 ? '短刨贴着板面起伏走刀' : '长刨跨过起伏，漏掉一处突变'}
      />
    </div>
  );
};

export default Ana7;
